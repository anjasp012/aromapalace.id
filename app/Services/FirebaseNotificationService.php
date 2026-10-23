<?php

namespace App\Services;

use App\Events\AdminNotificationCreated;
use App\Events\OrderPaid;
use App\Models\DeviceToken;
use App\Models\Notification;
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
                        'android' => [
                            'notification' => [
                                'sound' => env('FCM_ANDROID_SOUND', 'notif'),
                                'channel_id' => 'aroma_palace_channel',
                                'default_sound' => false,
                            ],
                        ],
                        'apns' => [
                            'payload' => [
                                'aps' => [
                                    'sound' => env('FCM_IOS_SOUND', 'notif.wav'),
                                ],
                            ],
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
        $tokens = DeviceToken::where('user_id', $userId)->pluck('token')->unique()->all();

        // Fallback: If no tokens linked to user_id, search active customer tokens from the last 2 hours
        if (empty($tokens)) {
            $tokens = DeviceToken::where(function ($q) {
                $q->whereNull('role')->orWhere('role', 'customer');
            })
                ->where('last_used_at', '>=', now()->subHours(2))
                ->latest('last_used_at')
                ->pluck('token')
                ->unique()
                ->all();
        }

        Log::info('Firebase FCM sendToUser', [
            'user_id' => $userId,
            'token_count' => count($tokens),
            'title' => $title,
        ]);

        try {
            Notification::create([
                'user_id' => $userId,
                'for_admin' => false,
                'type' => $data['type'] ?? 'user',
                'title' => $title,
                'body' => $body,
                'url' => $url,
                'data' => $data,
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to persist user notification: '.$e->getMessage());
        }

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
        try {
            $notification = Notification::create([
                'for_admin' => true,
                'type' => $data['type'] ?? 'admin',
                'title' => $title,
                'body' => $body,
                'url' => $url,
                'data' => $data,
                'is_read' => false,
            ]);

            // Broadcast via WebSocket (Reverb) so admin topbar updates instantly
            event(new AdminNotificationCreated($notification));
        } catch (\Throwable $e) {
            Log::warning('Failed to persist admin notification: '.$e->getMessage());
        }

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
        try {
            Notification::create([
                'user_id' => null,
                'for_admin' => false,
                'type' => $data['type'] ?? 'broadcast',
                'title' => $title,
                'body' => $body,
                'url' => $url,
                'data' => $data,
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to persist broadcast notification: '.$e->getMessage());
        }

        // Broadcast to all registered devices (customers, guests, and testing admins)
        $tokens = DeviceToken::pluck('token')->unique()->all();

        Log::info('Firebase FCM sendBroadcast dispatched', [
            'total_tokens' => count($tokens),
            'title' => $title,
        ]);

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
        $cacheKey = "fcm_new_order_sent_{$order->id}";
        if (Cache::has($cacheKey)) {
            Log::info("Suppressing duplicate notifyNewOrder for order #{$order->order_number}");

            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(10));

        $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');

        // Notifikasi ke Admin
        $this->sendToAdmins(
            title: 'Pesanan Baru Masuk! #'.$order->order_number,
            body: "Pesanan baru dari {$order->recipient_name} senilai {$formattedTotal}.",
            url: '/manajemen-pesanan/'.$order->id,
            data: ['order_id' => (string) $order->id, 'type' => 'new_order']
        );

        // Notifikasi ke Customer
        if ($order->user_id) {
            $this->sendToUser(
                user: $order->user_id,
                title: 'Pesanan Berhasil Dibuat!',
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
        $cacheKey = "fcm_payment_success_sent_{$order->id}";
        if (Cache::has($cacheKey)) {
            Log::info("Suppressing duplicate notifyPaymentSuccess for order #{$order->order_number}");

            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(10));

        // Real-time WebSocket: Broadcast to the user viewing the payment page
        try {
            event(new OrderPaid($order));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast OrderPaid event in notifyPaymentSuccess: '.$e->getMessage());
        }

        $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');

        // Ke Customer
        if ($order->user_id) {
            $this->sendToUser(
                user: $order->user_id,
                title: 'Pembayaran Berhasil! #'.$order->order_number,
                body: "Pembayaran {$formattedTotal} telah lunas. Pesanan Anda sedang disiapkan dan dikemas.",
                url: url('/account/orders'),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'type' => 'payment_success',
                ]
            );
        }

        // Ke Admin
        $this->sendToAdmins(
            title: 'Pembayaran Diterima! #'.$order->order_number,
            body: "Pembayaran {$formattedTotal} dari {$order->recipient_name} telah lunas.",
            url: '/manajemen-pesanan/'.$order->id,
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'type' => 'admin_payment_received',
            ]
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
        $trackingText = $order->tracking_number ? " (No. Resi: {$order->tracking_number})" : '';

        $this->sendToUser(
            user: $order->user_id,
            title: 'Pesanan Anda Sedang Dikirim!',
            body: "Pesanan #{$order->order_number} telah diserahkan kepada {$courierName}{$trackingText}. Nantikan aroma mewah Anda segera tiba.",
            url: url('/account/orders'),
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'tracking_number' => (string) ($order->tracking_number ?? ''),
                'type' => 'order_shipped',
            ]
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
            title: 'Pesanan Siap Diambil di Butik!',
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
            title: $title,
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
            title: 'Voucher Spesial Baru: '.$voucher->code,
            body: "Gunakan kode {$voucher->code} untuk {$discountInfo} di Aroma Palace. Jangan lewatkan!",
            url: url('/products'),
            data: ['voucher_code' => $voucher->code, 'type' => 'voucher_reward']
        );
    }

    /**
     * 7. Notifikasi Pembatalan Pesanan (Auto Cancel 24 Jam):
     * - Ke Customer: "Pesanan Dibatalkan"
     * - Ke Admin: "Pesanan Dibatalkan Otomatis"
     */
    public function notifyOrderCanceled(Order $order, string $reason = 'Batas waktu pembayaran 24 jam telah berakhir.'): void
    {
        $cacheKey = "fcm_order_canceled_sent_{$order->id}";
        if (Cache::has($cacheKey)) {
            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(10));

        if ($order->user_id) {
            $this->sendToUser(
                user: $order->user_id,
                title: 'Pesanan Dibatalkan #'.$order->order_number,
                body: "Pesanan wewangian Anda telah dibatalkan otomatis karena {$reason}",
                url: url('/account/orders'),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'type' => 'order_canceled',
                ]
            );
        }

        $this->sendToAdmins(
            title: 'Pesanan Dibatalkan (Waktu Habis) #'.$order->order_number,
            body: "Pesanan dari {$order->recipient_name} dibatalkan otomatis karena waktu pembayaran habis.",
            url: '/manajemen-pesanan/'.$order->id,
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'type' => 'admin_order_canceled',
            ]
        );
    }
}
