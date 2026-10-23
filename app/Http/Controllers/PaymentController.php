<?php

namespace App\Http\Controllers;

use App\Events\OrderPaid;
use App\Services\FirebaseNotificationService;
use App\Services\MembershipService;
use App\Services\OrderService;
use App\Services\PakasirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        protected PakasirService $pakasirService
    ) {}

    /**
     * Display the payment page with countdown and instructions.
     */
    public function show(Request $request, int|string $order): Response|RedirectResponse
    {
        $user = $request->user();

        if (is_numeric($order)) {
            $orderModel = $user->orders()->with(['items.product'])->find($order);
            if ($orderModel) {
                return redirect()->route('payment.show', ['order' => $orderModel->order_number]);
            }
        } else {
            $orderModel = $user->orders()->with(['items.product'])->where('order_number', $order)->first();
        }

        if (! $orderModel) {
            return redirect()->route('home')->with('error', 'Pesanan tidak ditemukan.');
        }

        // Auto-cancel if pending and older than 24 hours
        if ($orderModel->payment_status === 'pending' && $orderModel->created_at && $orderModel->created_at->copy()->addHours(24)->isPast()) {
            app(OrderService::class)->cancelOrder($orderModel, 'Batas waktu pembayaran 24 jam telah berakhir.');
            $orderModel->refresh();
        }

        return Inertia::render('payment', [
            'order' => [
                'id' => $orderModel->id,
                'order_number' => $orderModel->order_number,
                'recipient_name' => $orderModel->recipient_name,
                'created_at' => $orderModel->created_at?->toIso8601String(),
                'payment_method' => $orderModel->payment_method,
                'payment_channel' => $orderModel->payment_channel,
                'payment_code' => $orderModel->payment_code,
                'payment_status' => $orderModel->payment_status,
                'status' => $orderModel->status,
                'total_amount' => $orderModel->total_amount,
                'total_amount_formatted' => 'Rp '.number_format($orderModel->total_amount, 0, ',', '.'),
            ],
        ]);
    }

    /**
     * Check transaction status with Pakasir on demand.
     */
    public function checkStatus(Request $request, string $order): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $orderModel = $user->orders()->where('order_number', $order)->first();

        if (! $orderModel) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan',
                ], 404);
            }

            return redirect()->route('home')->with('error', 'Pesanan tidak ditemukan.');
        }

        if ($orderModel->payment_status === 'pending') {
            // Auto-cancel if pending and older than 24 hours
            if ($orderModel->created_at && $orderModel->created_at->copy()->addHours(24)->isPast()) {
                app(OrderService::class)->cancelOrder($orderModel, 'Batas waktu pembayaran 24 jam telah berakhir.');
                $orderModel->refresh();
            } else {
                $txnRes = $this->pakasirService->createTransaction($orderModel->order_number, $orderModel->total_amount, $orderModel->payment_method);
                if ($txnRes['success'] && ! empty($txnRes['data']['txn_id'])) {
                    $statusRes = $this->pakasirService->checkTransactionStatus($txnRes['data']['txn_id']);
                    if ($statusRes['success']) {
                        $status = strtolower((string) ($statusRes['data']['status'] ?? ''));
                        if ($status === 'completed') {
                            DB::transaction(function () use ($orderModel) {
                                $locked = Order::where('id', $orderModel->id)->lockForUpdate()->first();
                                if ($locked && $locked->payment_status === 'pending') {
                                    $locked->update([
                                        'payment_status' => 'paid',
                                        'status' => 'diproses',
                                    ]);
                                    event(new OrderPaid($locked));
                                    app(FirebaseNotificationService::class)->notifyPaymentSuccess($locked);
                                    app(MembershipService::class)->awardOrderPoints($locked);
                                }
                            });
                            $orderModel->refresh();
                        } elseif ($status === 'canceled') {
                            app(OrderService::class)->cancelOrder($orderModel, 'Dibatalkan oleh gateway Pakasir.');
                            $orderModel->refresh();
                        }
                    }
                }
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'payment_status' => $orderModel->payment_status,
                'status' => $orderModel->status,
            ]);
        }

        return redirect()->route('payment.show', ['order' => $orderModel->order_number])
            ->with('info', $orderModel->payment_status === 'paid' ? 'Pembayaran berhasil dikonfirmasi!' : 'Status pembayaran: '.ucfirst($orderModel->payment_status));
    }
}
