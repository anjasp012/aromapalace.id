<?php

namespace App\Http\Controllers;

use App\Events\OrderPaid;
use App\Models\Order;
use App\Services\FirebaseNotificationService;
use App\Services\MembershipService;
use App\Services\PakasirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PakasirWebhookController extends Controller
{
    public function __construct(
        protected PakasirService $pakasirService
    ) {}

    /**
     * Handle incoming payment notifications from Pakasir.
     *
     * Endpoint: POST /webhook/pakasir
     */
    public function handle(Request $request): JsonResponse
    {
        $secret = $request->header('X-Secret');

        if (! $this->pakasirService->verifyWebhookSecret($secret)) {
            Log::warning('Pakasir webhook received with invalid secret', [
                'ip' => $request->ip(),
                'header_secret' => $secret ? substr($secret, 0, 6).'...' : null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid webhook secret',
            ], 401);
        }

        $orderNumber = (string) $request->input('order_id');
        $status = strtolower((string) $request->input('status'));

        Log::info('Pakasir webhook received', [
            'order_id' => $orderNumber,
            'status' => $status,
        ]);

        return DB::transaction(function () use ($orderNumber, $status) {
            $order = Order::where('order_number', $orderNumber)->lockForUpdate()->first();

            if (! $order) {
                Log::warning('Pakasir webhook: Order not found', [
                    'order_id' => $orderNumber,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Order not found',
                ], 404);
            }

            if ($status === 'completed') {
                if ($order->payment_status === 'paid') {
                    return response()->json([
                        'success' => true,
                        'message' => 'Order is already marked as paid',
                        'order_number' => $order->order_number,
                        'payment_status' => $order->payment_status,
                    ]);
                }

                if ($order->payment_status === 'canceled') {
                    Log::error("Pakasir Webhook: Payment completed for already canceled order #{$order->order_number}");

                    return response()->json([
                        'success' => false,
                        'message' => 'Order was already canceled due to expiry. Admin intervention required.',
                        'order_number' => $order->order_number,
                        'payment_status' => $order->payment_status,
                    ], 409);
                }

                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'diproses',
                ]);

                event(new OrderPaid($order));
                app(FirebaseNotificationService::class)->notifyPaymentSuccess($order);
                app(MembershipService::class)->awardOrderPoints($order);
            } elseif ($status === 'canceled') {
                if ($order->payment_status !== 'canceled') {
                    app(OrderService::class)->cancelOrder($order, 'Dibatalkan oleh gateway Pakasir.');
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Webhook processed successfully',
                'order_number' => $order->order_number,
                'payment_status' => $order->fresh()->payment_status,
            ]);
        });
    }
}
