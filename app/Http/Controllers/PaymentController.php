<?php

namespace App\Http\Controllers;

use App\Events\OrderPaid;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Services\FirebaseNotificationService;
use App\Services\OrderService;
use App\Services\PakasirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
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

        // Auto-cancel if unpaid (and NOT awaiting admin confirmation) after 24 hours
        if (
            $orderModel->payment_status !== 'paid'
            && $orderModel->status !== 'menunggu_konfirmasi'
            && $orderModel->created_at
            && $orderModel->created_at->copy()->addHours(24)->isPast()
        ) {
            app(OrderService::class)->cancelOrder($orderModel, 'Batas waktu pembayaran 24 jam telah berakhir.');
            $orderModel->refresh();
        }

        $pm = PaymentMethod::where('code', $orderModel->payment_method)->first();
        if (! $pm && $orderModel->payment_channel) {
            $pm = PaymentMethod::where('name', $orderModel->payment_channel)->first();
        }
        $isManual = $orderModel->is_manual || ($pm && $pm->is_manual);

        $bankName = $pm?->name ?: ($orderModel->payment_channel ?: 'Transfer Bank Manual');
        $accountNumber = $pm?->account_number ?: $orderModel->payment_code;
        $accountName = $pm?->account_name ?: 'PT Aroma Palace Indonesia';

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
                'is_manual' => $isManual,
                'payment_proof' => $orderModel->payment_proof ? asset('storage/'.$orderModel->payment_proof) : null,
                'payment_proof_uploaded_at' => $orderModel->payment_proof_uploaded_at?->toIso8601String(),
                'payment_proof_uploaded_at_formatted' => $orderModel->payment_proof_uploaded_at?->format('d M Y, H:i').' WIB',
                'payment_sender_name' => $orderModel->payment_sender_name,
                'payment_notes' => $orderModel->payment_notes,
                'bank_details' => $isManual ? [
                    'bank_name' => $bankName,
                    'account_number' => $accountNumber,
                    'account_name' => $accountName,
                ] : null,
                'total_amount' => $orderModel->total_amount,
                'total_amount_formatted' => 'Rp '.number_format($orderModel->total_amount, 0, ',', '.'),
            ],
        ]);
    }

    /**
     * Check transaction status on demand.
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

        // For manual confirmation orders, auto-cancel if 24h passed and proof NOT yet uploaded
        if ($orderModel->is_manual) {
            if (
                $orderModel->payment_status !== 'paid'
                && $orderModel->status !== 'menunggu_konfirmasi'
                && $orderModel->created_at
                && $orderModel->created_at->copy()->addHours(24)->isPast()
            ) {
                app(OrderService::class)->cancelOrder($orderModel, 'Batas waktu pembayaran 24 jam telah berakhir.');
                $orderModel->refresh();
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'payment_status' => $orderModel->payment_status,
                    'status' => $orderModel->status,
                    'message' => $orderModel->payment_status === 'paid'
                        ? 'Pembayaran telah diverifikasi lunas.'
                        : ($orderModel->status === 'dibatalkan'
                            ? 'Pesanan dibatalkan karena melewati batas waktu 24 jam.'
                            : ($orderModel->payment_proof ? 'Bukti transfer sedang diverifikasi oleh admin.' : 'Silakan unggah bukti transfer pembayaran.')),
                ]);
            }

            return redirect()->route('payment.show', ['order' => $orderModel->order_number])
                ->with('info', $orderModel->payment_status === 'paid'
                    ? 'Pembayaran berhasil dikonfirmasi lunas!'
                    : ($orderModel->status === 'dibatalkan'
                        ? 'Pesanan dibatalkan karena melewati batas waktu 24 jam.'
                        : ($orderModel->payment_proof ? 'Bukti transfer sedang diverifikasi oleh admin.' : 'Silakan unggah bukti transfer pembayaran.')));
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
                                    try {
                                        event(new OrderPaid($locked));
                                    } catch (\Throwable $e) {
                                        Log::warning('Broadcast OrderPaid failed: '.$e->getMessage());
                                    }
                                    app(FirebaseNotificationService::class)->notifyPaymentSuccess($locked);
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

    /**
     * Upload proof of transfer for manual confirmation payment.
     */
    public function confirmManual(Request $request, string $order): RedirectResponse
    {
        $user = $request->user();
        $orderModel = $user->orders()->where('order_number', $order)->firstOrFail();

        $validated = $request->validate([
            'payment_proof' => [$orderModel->payment_proof ? 'nullable' : 'required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'payment_sender_name' => ['required', 'string', 'max:255'],
            'payment_notes' => ['nullable', 'string', 'max:500'],
        ], [
            'payment_proof.required' => 'Foto atau berkas bukti transfer wajib diunggah.',
            'payment_proof.mimes' => 'Bukti transfer harus berformat JPG, JPEG, PNG, WEBP, atau PDF.',
            'payment_proof.max' => 'Ukuran file bukti transfer maksimal 5MB.',
            'payment_sender_name.required' => 'Nama pemilik rekening pengirim wajib diisi.',
        ]);

        $updateData = [
            'payment_sender_name' => $validated['payment_sender_name'],
            'payment_notes' => $validated['payment_notes'] ?? null,
            'status' => 'menunggu_konfirmasi',
        ];

        if ($request->hasFile('payment_proof')) {
            // Delete old proof file if exists
            if ($orderModel->payment_proof && Storage::disk('public')->exists($orderModel->payment_proof)) {
                Storage::disk('public')->delete($orderModel->payment_proof);
            }

            $file = $request->file('payment_proof');
            $path = $file->store('payment-proofs', 'public');
            $updateData['payment_proof'] = $path;
            $updateData['payment_proof_uploaded_at'] = now();
        }

        $orderModel->update($updateData);

        Log::info("Manual payment proof uploaded for order #{$orderModel->order_number} by user #{$user->id}");

        // Notify admins that a manual payment proof has been uploaded
        try {
            app(FirebaseNotificationService::class)->notifyManualPaymentProofUploaded($orderModel);
        } catch (\Throwable $e) {
            Log::warning("Failed to send manual payment proof notification for order #{$orderModel->order_number}: ".$e->getMessage());
        }

        return redirect()->route('payment.show', ['order' => $orderModel->order_number])
            ->with('success', 'Bukti transfer berhasil diunggah! Tim Aroma Palace akan memverifikasi pesanan Anda segera.');
    }
}
