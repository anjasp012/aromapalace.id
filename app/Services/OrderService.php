<?php

namespace App\Services;

use App\Events\ShippingUpdated;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderService
{
    public function __construct(
        protected FirebaseNotificationService $notificationService
    ) {}

    /**
     * Cancel an order if it is still pending, restore stock, and notify user via FCM.
     * Uses pessimistic row locking (lockForUpdate) to eliminate race conditions with webhooks.
     */
    public function cancelOrder(Order $order, string $reason = 'Batas waktu pembayaran 24 jam telah berakhir.'): bool
    {
        return DB::transaction(function () use ($order, $reason) {
            // Lock order record from database to prevent concurrent webhook/cancellation races
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();

            if (! $lockedOrder || $lockedOrder->payment_status !== 'pending') {
                // Already paid or canceled by a concurrent process
                return false;
            }

            // 1. Update order status to canceled
            $lockedOrder->update([
                'payment_status' => 'canceled',
                'status' => 'dibatalkan',
            ]);

            // 2. Restore inventory stock for each product variant atomically
            $items = $lockedOrder->items()->get();
            foreach ($items as $item) {
                if ($item->variant_id) {
                    ProductVariant::where('id', $item->variant_id)
                        ->lockForUpdate()
                        ->increment('stock', $item->quantity);
                }
            }

            // 3. Restore voucher quota if voucher was used
            if ($lockedOrder->voucher_id) {
                Voucher::where('id', $lockedOrder->voucher_id)
                    ->where('used_count', '>', 0)
                    ->decrement('used_count');
            }

            // 3. Send FCM Push Notification to Customer and Admin
            try {
                $this->notificationService->notifyOrderCanceled($lockedOrder, $reason);
            } catch (\Throwable $e) {
                Log::warning("Failed to send order cancellation notification for #{$lockedOrder->order_number}: ".$e->getMessage());
            }

            Log::info("Order #{$lockedOrder->order_number} has been canceled. Reason: {$reason}");

            return true;
        });
    }

    /**
     * Cancel all expired orders older than 24 hours.
     */
    public function cancelExpiredOrders(): int
    {
        $cutoff = now()->subHours(24);

        $expiredOrders = Order::where(function ($q) {
            $q->where('payment_status', 'pending')
                ->orWhere('status', 'menunggu_pembayaran');
        })
            ->whereNotIn('status', ['diproses', 'dikirim', 'selesai', 'dibatalkan'])
            ->where('created_at', '<=', $cutoff)
            ->get();

        $canceledCount = 0;
        foreach ($expiredOrders as $order) {
            if ($this->cancelOrder($order, 'Batas waktu pembayaran 24 jam telah berakhir.')) {
                $canceledCount++;
            }
        }

        return $canceledCount;
    }

    /**
     * Mark an order as completed, award membership loyalty points, and notify user via FCM.
     */
    public function completeOrder(Order $order, string $reason = 'Pesanan telah selesai.'): bool
    {
        return DB::transaction(function () use ($order, $reason) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();

            if (! $lockedOrder || $lockedOrder->status === 'selesai' || $lockedOrder->status === 'dibatalkan') {
                return false;
            }

            $lockedOrder->update([
                'status' => 'selesai',
            ]);

            // Award loyalty points for completed order
            try {
                app(MembershipService::class)->awardOrderPoints($lockedOrder);
            } catch (\Throwable $e) {
                Log::warning("Failed to award membership points for #{$lockedOrder->order_number}: ".$e->getMessage());
            }

            // Send FCM Push Notification to Customer
            try {
                $this->notificationService->notifyOrderCompleted($lockedOrder);
            } catch (\Throwable $e) {
                Log::warning("Failed to send order completed notification for #{$lockedOrder->order_number}: ".$e->getMessage());
            }

            // Broadcast real-time update via WebSockets
            try {
                broadcast(new ShippingUpdated($lockedOrder->fresh(['shipping'])));
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast ShippingUpdated on completeOrder: '.$e->getMessage());
            }

            Log::info("Order #{$lockedOrder->order_number} has been completed. Reason: {$reason}");

            return true;
        });
    }

    /**
     * Auto-complete delivered orders whose 3-day grace period (auto_completes_at) has passed.
     */
    public function autoCompleteDeliveredOrders(): int
    {
        $orders = Order::where('status', '!=', 'selesai')
            ->where('status', '!=', 'dibatalkan')
            ->whereHas('shipping', function ($q) {
                $q->whereNotNull('auto_completes_at')
                    ->where('auto_completes_at', '<=', now());
            })
            ->get();

        $completedCount = 0;
        foreach ($orders as $order) {
            if ($this->completeOrder($order, 'Pesanan diselesaikan otomatis oleh sistem setelah 3 hari barang sampai di tujuan.')) {
                $completedCount++;
            }
        }

        return $completedCount;
    }
}
