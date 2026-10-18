<?php

namespace App\Services;

use App\Models\DeviceToken;
use App\Models\Order;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseNotificationService
{
    /**
     * Send a push notification to a specific FCM token.
     *
     * @param  array<string, mixed>  $data
     */
    public function sendToToken(string $token, string $title, string $body, ?string $url = null, array $data = []): bool
    {
        $projectId = config('services.firebase.project_id', env('FIREBASE_PROJECT_ID'));
        $serverKey = config('services.firebase.server_key', env('FIREBASE_SERVER_KEY'));

        $payload = [
            'title' => $title,
            'body' => $body,
            'url' => $url ?: url('/'),
            'icon' => url('/images/logo.png'),
            ...$data,
        ];

        // If credentials are not configured yet in .env, log safely without failing
        if (! $serverKey && ! $projectId) {
            Log::info('Firebase Push Notification (Simulated/Dev Mode):', [
                'token' => substr($token, 0, 15).'...',
                'title' => $title,
                'body' => $body,
                'url' => $url,
            ]);

            return true;
        }

        try {
            // Support legacy server key or Firebase FCM HTTP API
            $response = Http::withHeaders([
                'Authorization' => 'key='.$serverKey,
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'to' => $token,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'icon' => url('/images/logo.png'),
                    'click_action' => $url ?: url('/'),
                ],
                'data' => $payload,
            ]);

            if ($response->successful()) {
                DeviceToken::where('token', $token)->update(['last_used_at' => now()]);

                return true;
            }

            Log::warning('Firebase FCM notification failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('Firebase FCM exception: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send a notification to all device tokens of a specific user.
     *
     * @param  array<string, mixed>  $data
     */
    public function sendToUser(User|int $user, string $title, string $body, ?string $url = null, array $data = []): int
    {
        $userId = $user instanceof User ? $user->id : $user;
        $tokens = DeviceToken::where('user_id', $userId)->pluck('token')->all();

        $sentCount = 0;
        foreach ($tokens as $token) {
            if ($this->sendToToken($token, $title, $body, $url, $data)) {
                $sentCount++;
            }
        }

        return $sentCount;
    }

    /**
     * Send a notification to all registered Admin devices.
     *
     * @param  array<string, mixed>  $data
     */
    public function sendToAdmins(string $title, string $body, ?string $url = null, array $data = []): int
    {
        $adminTokens = DeviceToken::where(function ($q) {
            $q->where('role', 'admin')
                ->orWhereHas('user', fn ($uq) => $uq->where('role', 'admin'));
        })->pluck('token')->unique()->all();

        $sentCount = 0;
        foreach ($adminTokens as $token) {
            if ($this->sendToToken($token, $title, $body, $url, $data)) {
                $sentCount++;
            }
        }

        return $sentCount;
    }

    /**
     * Broadcast a notification to all customer devices (for Promos and Vouchers).
     *
     * @param  array<string, mixed>  $data
     */
    public function sendBroadcast(string $title, string $body, ?string $url = null, array $data = []): int
    {
        $tokens = DeviceToken::where('role', '!=', 'admin')->pluck('token')->unique()->all();

        $sentCount = 0;
        foreach ($tokens as $token) {
            if ($this->sendToToken($token, $title, $body, $url, $data)) {
                $sentCount++;
            }
        }

        return $sentCount;
    }

    /**
     * 1. Notifikasi Order Baru:
     * - Ke Admin: "Pesanan Baru Masuk! #[Order Number]"
     * - Ke Customer: "Pesanan Berhasil Dibuat!"
     */
    public function notifyNewOrder(Order $order): void
    {
        $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');

        // Notifikasi ke Admin
        $this->sendToAdmins(
            title: '🛍️ Pesanan Baru Masuk! #'.$order->order_number,
            body: "Pesanan baru dari {$order->recipient_name} senilai {$formattedTotal}.",
            url: url('/admin/orders/'.$order->id),
            data: ['order_id' => (string) $order->id, 'type' => 'new_order']
        );

        // Notifikasi ke Customer
        if ($order->user_id) {
            $this->sendToUser(
                user: $order->user_id,
                title: '✨ Pesanan Berhasil Dibuat!',
                body: "Pesanan #{$order->order_number} sedang menunggu pembayaran {$formattedTotal}.",
                url: url('/payment/'.$order->order_number),
                data: ['order_id' => (string) $order->id, 'type' => 'order_created']
            );
        }
    }

    /**
     * 2. Notifikasi Pembayaran:
     * - Ke Customer: "Pembayaran Dikonfirmasi!"
     * - Ke Admin: "Pembayaran Lunas!"
     */
    public function notifyPaymentSuccess(Order $order): void
    {
        $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');

        // Ke Customer
        if ($order->user_id) {
            $this->sendToUser(
                user: $order->user_id,
                title: '💳 Pembayaran Berhasil Dikonfirmasi!',
                body: "Pembayaran untuk pesanan #{$order->order_number} telah lunas. Pesanan segera kami siapkan.",
                url: url('/account/orders'),
                data: ['order_id' => (string) $order->id, 'type' => 'payment_success']
            );
        }

        // Ke Admin
        $this->sendToAdmins(
            title: '💰 Pembayaran Diterima! #'.$order->order_number,
            body: "Pembayaran {$formattedTotal} dari {$order->recipient_name} telah lunas.",
            url: url('/admin/orders/'.$order->id),
            data: ['order_id' => (string) $order->id, 'type' => 'admin_payment_received']
        );
    }

    /**
     * 3. Notifikasi Pengiriman (Kurir Delivery):
     * - Ke Customer: "Pesanan Sedang Dikirim!"
     */
    public function notifyOrderShipped(Order $order): void
    {
        if (! $order->user_id) {
            return;
        }

        $courierName = $order->courier ?: 'Kurir Rekanan';

        $this->sendToUser(
            user: $order->user_id,
            title: '🚚 Pesanan Anda Sedang Dikirim!',
            body: "Pesanan #{$order->order_number} telah diserahkan kepada {$courierName}. Nantikan aroma mewah Anda segera tiba.",
            url: url('/account/orders'),
            data: ['order_id' => (string) $order->id, 'type' => 'order_shipped']
        );
    }

    /**
     * 4. Notifikasi Store Pickup (Ambil di Butik):
     * - Ke Customer: "Pesanan Siap Diambil di Butik!"
     */
    public function notifyStorePickupReady(Order $order): void
    {
        if (! $order->user_id) {
            return;
        }

        $storeName = $order->store ? $order->store->name : 'Butik Resmi Aroma Palace';

        $this->sendToUser(
            user: $order->user_id,
            title: '🏬 Pesanan Siap Diambil di Butik!',
            body: "Wewangian mewah pesanan Anda #{$order->order_number} sudah siap diambil di {$storeName}.",
            url: url('/account/orders'),
            data: ['order_id' => (string) $order->id, 'type' => 'store_pickup_ready']
        );
    }

    /**
     * 5. Notifikasi Promo & Broadcast:
     */
    public function notifyPromo(string $title, string $body, ?string $url = null): int
    {
        return $this->sendBroadcast(
            title: '🔥 '.$title,
            body: $body,
            url: $url ?: url('/products?discount=1'),
            data: ['type' => 'promo']
        );
    }

    /**
     * 6. Notifikasi Voucher / Reward Baru:
     */
    public function notifyNewVoucher(Voucher $voucher): int
    {
        $discountInfo = $voucher->type === 'percentage' ? "Diskon {$voucher->value}%" : 'Potongan Rp '.number_format($voucher->value, 0, ',', '.');

        return $this->sendBroadcast(
            title: '🎁 Voucher Spesial Baru: '.$voucher->code,
            body: "Gunakan kode {$voucher->code} untuk {$discountInfo} di Aroma Palace. Jangan lewatkan!",
            url: url('/products'),
            data: ['voucher_code' => $voucher->code, 'type' => 'voucher_reward']
        );
    }
}
