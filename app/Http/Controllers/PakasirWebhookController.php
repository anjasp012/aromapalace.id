<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\FirebaseNotificationService;
use App\Services\PakasirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $order = Order::where('order_number', $orderNumber)->first();

        if (! $order) {
            Log::warning('Pakasir webhook: Order not found', [
                'order_id' => $orderNumber,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        $updateData = [];

        if ($status === 'completed') {
            if ($order->payment_status !== 'paid') {
                $updateData['payment_status'] = 'paid';
                $updateData['status'] = 'diproses';
            }
        } elseif ($status === 'canceled') {
            if ($order->payment_status !== 'canceled') {
                $updateData['payment_status'] = 'canceled';
                $updateData['status'] = 'dibatalkan';
            }
        }

        if (! empty($updateData)) {
            $order->update($updateData);

            if ($status === 'completed') {
                app(FirebaseNotificationService::class)->notifyPaymentSuccess($order);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Webhook processed successfully',
            'order_number' => $order->order_number,
            'payment_status' => $order->payment_status,
        ]);
    }
}
