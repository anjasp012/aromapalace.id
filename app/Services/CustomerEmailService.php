<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CustomerEmailService
{
    /**
     * Send password reset email to customer.
     */
    public function sendPasswordResetEmail(User $user, string $token): bool
    {
        if (empty($user->email)) {
            return false;
        }

        $resetUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $user->email,
        ], false));

        try {
            Mail::send('emails.password-reset', [
                'user' => $user,
                'resetUrl' => $resetUrl,
                'subject' => 'Atur Ulang Kata Sandi Akun - Aroma Palace',
            ], function ($message) use ($user) {
                $message->to($user->email, $user->name)
                    ->subject('Atur Ulang Kata Sandi Akun - Aroma Palace');
            });

            Log::info("Password reset email sent to {$user->email}");

            return true;
        } catch (\Throwable $e) {
            Log::warning("Failed to send password reset email to {$user->email}: ".$e->getMessage());

            return false;
        }
    }

    /**
     * Send order placed confirmation email to customer.
     */
    public function sendOrderPlacedEmail(Order $order): bool
    {
        $order->loadMissing(['items', 'user']);
        $recipientEmail = $order->user?->email;

        if (empty($recipientEmail)) {
            return false;
        }

        try {
            Mail::send('emails.order-placed', [
                'order' => $order,
                'subject' => "Pesanan #{$order->order_number} Berhasil Dibuat - Aroma Palace",
            ], function ($message) use ($recipientEmail, $order) {
                $message->to($recipientEmail, $order->recipient_name)
                    ->subject("Pesanan #{$order->order_number} Berhasil Dibuat - Aroma Palace");
            });

            Log::info("Order placed email sent to {$recipientEmail} for order #{$order->order_number}");

            return true;
        } catch (\Throwable $e) {
            Log::warning("Failed to send order placed email for #{$order->order_number}: ".$e->getMessage());

            return false;
        }
    }

    /**
     * Send order paid confirmation email to customer with official invoice PDF attached.
     */
    public function sendOrderPaidEmail(Order $order): bool
    {
        $order->loadMissing(['items', 'user']);
        $recipientEmail = $order->user?->email;

        if (empty($recipientEmail)) {
            return false;
        }

        $pdfContent = $this->generateInvoicePdf($order);
        $invoiceUrl = url('/orders/'.$order->order_number.'/invoice');
        $invoiceDownloadUrl = url('/orders/'.$order->order_number.'/invoice/download');

        try {
            Mail::send('emails.order-paid', [
                'order' => $order,
                'invoiceUrl' => $invoiceUrl,
                'invoiceDownloadUrl' => $invoiceDownloadUrl,
                'hasPdfAttachment' => ! empty($pdfContent),
                'subject' => "Pembayaran Berhasil untuk Pesanan #{$order->order_number} - Aroma Palace",
            ], function ($message) use ($recipientEmail, $order, $pdfContent) {
                $message->to($recipientEmail, $order->recipient_name)
                    ->subject("Pembayaran Berhasil untuk Pesanan #{$order->order_number} - Aroma Palace");

                if (! empty($pdfContent)) {
                    $message->attachData($pdfContent, 'Invoice-'.$order->order_number.'.pdf', [
                        'mime' => 'application/pdf',
                    ]);
                }
            });

            Log::info("Order paid email sent to {$recipientEmail} for order #{$order->order_number}".(! empty($pdfContent) ? ' with PDF invoice attached' : ''));

            return true;
        } catch (\Throwable $e) {
            Log::warning("Failed to send order paid email for #{$order->order_number}: ".$e->getMessage());

            return false;
        }
    }

    /**
     * Generate PDF invoice binary content for an order.
     */
    public function generateInvoicePdf(Order $order): ?string
    {
        try {
            $order->loadMissing(['items', 'voucher', 'store', 'shipping', 'user']);

            $items = $order->items->map(function (OrderItem $item) {
                return [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'volume' => $item->volume,
                    'price' => (int) $item->price,
                    'price_formatted' => 'Rp '.number_format($item->price, 0, ',', '.'),
                    'quantity' => (int) $item->quantity,
                    'total_price' => (int) $item->total_price,
                    'total_price_formatted' => 'Rp '.number_format($item->total_price, 0, ',', '.'),
                ];
            });

            $dateFormatted = $order->created_at ? $order->created_at->format('d F Y, H:i').' WIB' : now()->format('d F Y, H:i').' WIB';
            $invDateCode = $order->created_at ? $order->created_at->format('Ymd') : date('Ymd');
            $invoiceNumber = 'INV/'.$invDateCode.'/ARPL/'.str_pad((string) $order->id, 8, '0', STR_PAD_LEFT);

            $orderStatus = $order->status ?: match ($order->payment_status) {
                'paid' => 'diproses',
                'cancelled' => 'dibatalkan',
                default => 'menunggu_pembayaran',
            };

            $isPaid = $order->payment_status === 'paid'
                || in_array($orderStatus, ['diproses', 'dikirim', 'selesai']);

            $pdfData = [
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'invoice_number' => $invoiceNumber,
                    'created_at' => $dateFormatted,
                    'delivery_type' => $order->delivery_type,
                    'recipient_name' => $order->recipient_name,
                    'recipient_phone' => $order->recipient_phone,
                    'address' => $order->address,
                    'province_id' => $order->province_id,
                    'province_name' => $order->province_name,
                    'city_id' => $order->city_id,
                    'city_name' => $order->city_name,
                    'district_id' => $order->district_id,
                    'district_name' => $order->district_name,
                    'subdistrict_id' => $order->subdistrict_id,
                    'subdistrict_name' => $order->subdistrict_name,
                    'city' => $order->city_name,
                    'postal_code' => $order->postal_code,
                    'courier_service' => $order->courier_service,
                    'courier_service_type' => $order->courier_service_type,
                    'courier' => $order->courier,
                    'tracking_number' => $order->shipping?->awb ?: $order->tracking_number,
                    'awb' => $order->shipping?->awb ?: $order->tracking_number,
                    'shipping_cost' => (int) $order->shipping_cost,
                    'shipping_cost_formatted' => $order->shipping_cost > 0 ? 'Rp '.number_format($order->shipping_cost, 0, ',', '.') : 'Rp 0',
                    'payment_method' => $order->payment_method,
                    'payment_channel' => $order->payment_channel,
                    'payment_status' => $order->payment_status,
                    'order_status' => $orderStatus,
                    'is_paid' => $isPaid,
                    'subtotal' => (int) $order->subtotal,
                    'subtotal_formatted' => 'Rp '.number_format($order->subtotal, 0, ',', '.'),
                    'discount_amount' => (int) $order->discount_amount,
                    'discount_amount_formatted' => 'Rp '.number_format($order->discount_amount, 0, ',', '.'),
                    'unique_code' => $order->unique_code ? (int) $order->unique_code : null,
                    'unique_code_formatted' => $order->unique_code ? 'Rp '.number_format($order->unique_code, 0, ',', '.') : null,
                    'voucher_code' => $order->voucher_code,
                    'total_amount' => (int) $order->total_amount,
                    'total_amount_formatted' => 'Rp '.number_format($order->total_amount, 0, ',', '.'),
                    'items_count' => $items->sum('quantity'),
                    'items' => $items,
                ],
                'seller' => [
                    'name' => 'Aroma Palace Official',
                    'store_name' => $order->store ? $order->store->name : 'Aroma Palace Boutique',
                ],
                'buyer' => [
                    'name' => $order->recipient_name ?: ($order->user?->name ?? 'Pelanggan'),
                    'email' => $order->user?->email ?? '',
                ],
            ];

            return Pdf::loadView('invoices.pdf', $pdfData)
                ->setPaper('a4', 'portrait')
                ->setOption([
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                    'defaultFont' => 'sans-serif',
                ])
                ->output();
        } catch (\Throwable $e) {
            Log::warning("Failed to generate PDF invoice for order #{$order->order_number}: ".$e->getMessage());

            return null;
        }
    }

    /**
     * Send order shipped notification email to customer.
     */
    public function sendOrderShippedEmail(Order $order): bool
    {
        $order->loadMissing(['items', 'user', 'shipping']);
        $recipientEmail = $order->user?->email;

        if (empty($recipientEmail)) {
            return false;
        }

        try {
            Mail::send('emails.order-shipped', [
                'order' => $order,
                'subject' => "Pesanan #{$order->order_number} Sedang Dikirim - Aroma Palace",
            ], function ($message) use ($recipientEmail, $order) {
                $message->to($recipientEmail, $order->recipient_name)
                    ->subject("Pesanan #{$order->order_number} Sedang Dikirim - Aroma Palace");
            });

            Log::info("Order shipped email sent to {$recipientEmail} for order #{$order->order_number}");

            return true;
        } catch (\Throwable $e) {
            Log::warning("Failed to send order shipped email for #{$order->order_number}: ".$e->getMessage());

            return false;
        }
    }
}
