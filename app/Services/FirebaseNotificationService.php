<?php

namespace App\Services;

use App\Models\DeviceToken;
use App\Models\Order;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseNotificationService
{
    /**
     * Send a push notification to a specific FCM token via Firebase HTTP v1 API.
     *
     * @param  array<string, mixed>  $data
     */
    public function sendToToken(string $token, string $title, string $body, ?string $url = null, array $data = []): bool
    {
        $credentialsPath = env('FIREBASE_CREDENTIALS', storage_path('app/firebase-credentials.json'));
        $credentials = null;

        if (file_exists($credentialsPath)) {
            $credentials = json_decode((string) file_get_contents($credentialsPath), true);
        } elseif (env('FIREBASE_CREDENTIALS_JSON')) {
            $credentials = json_decode(env('FIREBASE_CREDENTIALS_JSON'), true);
        }

        // If service account is not yet configured, log safely without throwing exceptions
        if (! $credentials) {
            Log::info('Firebase Push Notification (Simulated/Local Mode - Service Account not found):', [
                'token' => substr($token, 0, 15).'...',
                'title' => $title,
                'body' => $body,
                'url' => $url,
            ]);

            return true;
        }

        $accessToken = $this->getGoogleAccessToken($credentials);
        if (! $accessToken) {
            return false;
        }

        $projectId = $credentials['project_id'] ?? env('FIREBASE_PROJECT_ID', 'aromapalace-89175');

        // FCM v1 requires all data values to be strings
        $stringData = [];
        foreach ($data as $k => $v) {
            $stringData[(string) $k] = is_scalar($v) ? (string) $v : (string) json_encode($v);
        }
        $stringData['url'] = $url ?: url('/');

        $targetUrl = $url ?: url('/');

        try {
            $response = Http::withToken($accessToken)
                ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                        'webpush' => [
                            'notification' => [
                                'title' => $title,
                                'body' => $body,
                                'icon' => url('/images/logo.png'),
                                'badge' => url('/images/logo.png'),
                            ],
                            'fcm_options' => [
                                'link' => $targetUrl,
                            ],
                        ],
                        'data' => $stringData,
                    ],
                ]);

            if ($response->successful()) {
                DeviceToken::where('token', $token)->update(['last_used_at' => now()]);

                return true;
            }

            Log::warning('Firebase FCM HTTP v1 notification failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('Firebase FCM HTTP v1 exception: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Generate or retrieve cached OAuth2 Google Access Token using Service Account JSON.
     *
     * @param  array<string, mixed>  $credentials
     */
    protected function getGoogleAccessToken(array $credentials): ?string
    {
        return Cache::remember('firebase_fcm_access_token', 3000, function () use ($credentials) {
            $clientEmail = $credentials['client_email'] ?? null;
            $privateKey = $credentials['private_key'] ?? null;

            if (! $clientEmail || ! $privateKey) {
                Log::error('Firebase FCM: Invalid credentials JSON, client_email or private_key missing.');

                return null;
            }

            $now = time();
            $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
            $payload = rtrim(strtr(base64_encode(json_encode([
                'iss' => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ])), '+/', '-_'), '=');

            $signature = '';
            if (! openssl_sign("$header.$payload", $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
                Log::error('Firebase FCM: Failed to sign JWT with private key.');

                return null;
            }

            $signedJwt = "$header.$payload.".rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $signedJwt,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error('Firebase FCM OAuth2 Token error:', ['body' => $response->body()]);

            return null;
        });
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
