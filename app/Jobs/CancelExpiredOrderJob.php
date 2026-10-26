<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CancelExpiredOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $orderId
    ) {}

    /**
     * Execute the job after 24 hours.
     */
    public function handle(OrderService $orderService): void
    {
        $order = Order::find($this->orderId);

        if (! $order) {
            return;
        }

        // Cancel order if still pending and expired (older than 23+ hours)
        if ($order->payment_status === 'pending') {
            if ($order->created_at && $order->created_at->gt(now()->subHours(23))) {
                return;
            }

            Log::info("Delayed Job: Auto-canceling expired order #{$order->order_number} after 24 hours.");
            $orderService->cancelOrder($order, 'Batas waktu pembayaran 24 jam telah berakhir.');
        }
    }
}
