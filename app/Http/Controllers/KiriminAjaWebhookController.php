<?php

namespace App\Http\Controllers;

use App\Events\ShippingUpdated;
use App\Models\Order;
use App\Models\Setting;
use App\Models\Shipping;
use App\Services\FirebaseNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KiriminAjaWebhookController extends Controller
{
    /**
     * Handle KiriminAja express shipment event webhook to update shipping table.
     *
     * Reference: https://developer.kiriminaja.com/docs#webhook/POST/expressshipmentevent
     */
    public function handle(Request $request): JsonResponse
    {
        Log::info('KiriminAja Webhook received', $request->all());

        // Optional authorization check: verify Bearer token matches configured API key if provided
        $apiKey = (string) Setting::get('kiriminaja_api_key', '');
        $token = $request->bearerToken();
        if ($apiKey && $token && ! hash_equals($apiKey, $token)) {
            Log::warning('KiriminAja Webhook unauthorized token attempt', ['provided' => $token]);

            return response()->json([
                'status' => false,
                'message' => 'Unauthorized token.',
            ], 401);
        }

        $method = (string) $request->input('method', '');
        $rawItems = $request->input('data');
        $rawPackages = (array) $request->input('packages', []);
        $paymentId = $request->input('payment.payment_id');

        // Check if payload is in the official KiriminAja ExpressWebhookPayload format
        $isExpressEvent = ! empty($method) && is_array($rawItems);

        // Normalize items array
        $items = $isExpressEvent ? $rawItems : [$request->all()];
        $processedCount = 0;

        foreach ($items as $item) {
            $orderNumber = $item['order_id'] ?? ($item['order_number'] ?? ($request->input('order_id') ?? $request->input('order_number')));
            $awb = $item['awb'] ?? ($request->input('awb') ?? null);

            $order = null;
            if (! empty($orderNumber)) {
                $order = Order::where('order_number', $orderNumber)->first();
            }
            if (! $order && ! empty($awb)) {
                $shipping = Shipping::where('awb', $awb)->first();
                $order = $shipping?->order;
            }
            if (! $order && ! empty($paymentId)) {
                $shipping = Shipping::where('shipping_payment_code', $paymentId)->first();
                $order = $shipping?->order;
            }

            if (! $order) {
                Log::warning('KiriminAja Webhook order not found', [
                    'order_number' => $orderNumber,
                    'awb' => $awb,
                    'payment_id' => $paymentId,
                ]);

                continue;
            }

            // Find matching package details if available
            $matchingPackage = collect($rawPackages)->first(function ($pkg) use ($orderNumber, $awb) {
                return (! empty($orderNumber) && ($pkg['order_id'] ?? null) === $orderNumber)
                    || (! empty($awb) && ($pkg['awb'] ?? null) === $awb);
            });

            // Determine status text
            if ($isExpressEvent) {
                $statusText = match ($method) {
                    'processed_packages' => 'Paket sedang diproses / Nomor resi diterbitkan',
                    'shipped_packages' => 'Paket sedang dikirim oleh kurir',
                    'finished_packages' => 'Paket telah diterima di tujuan / Selesai',
                    'canceled_packages' => 'Pengiriman dibatalkan'.(! empty($item['reason']) ? ': '.$item['reason'] : ''),
                    'returned_packages', 'return_finished_packages' => 'Paket diretur'.(! empty($item['reason']) ? ': '.$item['reason'] : ''),
                    'problem_packages' => 'Kendala pengiriman: '.($item['reason'] ?? 'Menunggu proses lanjutan'),
                    default => $item['reason'] ?? 'Status pengiriman diperbarui',
                };
            } else {
                $statusText = $item['text'] ?? ($request->input('text') ?? ($order->shipping?->text ?? 'Status pengiriman diperbarui'));
            }

            // Determine histories array
            $existingHistories = (array) ($order->shipping?->histories ?? []);
            if (! empty($request->input('histories')) && is_array($request->input('histories'))) {
                // If explicit histories array is sent, merge or use it
                $existingHistories = $request->input('histories');
            } elseif ($isExpressEvent) {
                $eventTime = $item['finished_at']
                    ?? ($item['shipped_at']
                    ?? ($item['returned_at']
                    ?? ($item['rejected_at']
                    ?? ($item['date'] ?? now()->toIso8601String()))));

                $alreadyLogged = collect($existingHistories)->contains(function ($h) use ($method, $eventTime) {
                    return ($h['status'] ?? null) === $method && ($h['time'] ?? ($h['date'] ?? null)) === $eventTime;
                });

                if (! $alreadyLogged) {
                    $entry = [
                        'time' => $eventTime,
                        'status' => $method,
                        'note' => $statusText,
                    ];
                    if (! empty($item['sorting_code'])) {
                        $entry['sorting_code'] = $item['sorting_code'];
                    }
                    $existingHistories[] = $entry;
                }
            }

            // Prepare shipping attributes to update
            $shippingData = [
                'text' => $statusText,
                'histories' => $existingHistories,
            ];

            // Update AWB if provided and valid
            if (! empty($awb) && $awb !== 'Menunggu...') {
                $shippingData['awb'] = $awb;
            }

            // Update payment code if provided
            if (! empty($paymentId)) {
                $shippingData['shipping_payment_code'] = $paymentId;
            }

            // Update origin & destination if available
            $origin = $matchingPackage['origin'] ?? ($item['origin'] ?? ($request->input('origin') ?? null));
            if (! empty($origin)) {
                $shippingData['origin'] = $origin;
            }

            $destination = $matchingPackage['destination'] ?? ($item['destination'] ?? ($request->input('destination') ?? null));
            if (! empty($destination)) {
                $shippingData['destination'] = $destination;
            }

            // Update images if available
            $image = $matchingPackage['driver']['image'] ?? ($item['image'] ?? ($request->input('image') ?? null));
            if (! empty($image)) {
                $shippingData['image'] = is_array($image) ? $image : [$image];
            }

            // If shipping has finished (delivered), set delivered_at and 3-day grace period auto_completes_at on shipping table
            if ($method === 'finished_packages') {
                $now = now();
                $existingShipping = $order->shipping;
                $shippingData['delivered_at'] = $existingShipping?->delivered_at ?: $now;
                $shippingData['auto_completes_at'] = $existingShipping?->auto_completes_at ?: $now->copy()->addDays(3);
            }

            $shipping = $order->shipping()->updateOrCreate(
                ['order_id' => $order->id],
                $shippingData
            );

            // Update Order status when shipment progress changes
            if ($method === 'shipped_packages') {
                if ($order->status !== 'dikirim' && $order->status !== 'selesai') {
                    $order->update(['status' => 'dikirim']);
                }
            } elseif ($method === 'finished_packages') {
                if ($order->status !== 'selesai') {
                    // Do not immediately finish order; keep status as-is and notify customer of the 3-day window
                    app(FirebaseNotificationService::class)->notifyOrderDelivered($order, $shipping);
                }
            } elseif ($method === 'canceled_packages') {
                if ($order->status !== 'dibatalkan') {
                    $order->update(['status' => 'dibatalkan']);
                }
            }

            // Broadcast real-time update via WebSockets to admin & user order details
            try {
                broadcast(new ShippingUpdated($order->fresh(['shipping']), $shipping));
            } catch (\Throwable $e) {
                Log::warning("Failed to broadcast ShippingUpdated for order #{$order->order_number}: ".$e->getMessage());
            }

            $processedCount++;
        }

        if ($processedCount === 0 && ! $isExpressEvent) {
            return response()->json([
                'status' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'message' => "Shipping callback berhasil diproses ({$processedCount} paket).",
        ]);
    }
}
