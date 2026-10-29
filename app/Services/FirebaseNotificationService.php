<?php

namespace App\Services;

use App\Events\AdminNotificationCreated;
use App\Events\OrderPaid;
use App\Models\DeviceToken;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Shipping;
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

        if (str_starts_with($token, 'fcm_web_')) {
            DeviceToken::where('token', $token)->delete();

            return false;
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
                            'priority' => 'HIGH',
                            'notification' => [
                                'sound' => env('FCM_ANDROID_SOUND', 'default'),
                                'channel_id' => 'aroma_palace_channel',
                                'default_sound' => true,
                                'notification_priority' => 'PRIORITY_MAX',
                            ],
                        ],
                        'apns' => [
                            'headers' => [
                                'apns-priority' => '10',
                            ],
                            'payload' => [
                                'aps' => [
                                    'alert' => [
                                        'title' => $title,
                                        'body' => $body,
                                    ],
                                    // Custom sound bundled in the iOS app (ios/App/App/notif.wav). 'default' = system sound.
                                    'sound' => env('FCM_IOS_SOUND', 'notif.wav'),
                                    'badge' => 1,
                                ],
                            ],
                        ],
                        'webpush' => [
                            'headers' => [
                                'Urgency' => 'high',
                            ],
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

            // Remove unregistered or invalid tokens so they don't fail subsequent dispatches
            if ($response->status() === 404 || ($response->status() === 400 && str_contains($response->body(), 'INVALID_ARGUMENT'))) {
                DeviceToken::where('token', $token)->delete();
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

        // Filter out dummy/empty tokens
        $tokens = array_values(array_filter($tokens, fn ($t) => ! empty($t) && ! str_starts_with($t, 'fcm_web_')));

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

        $adminTokens = array_values(array_filter($adminTokens, fn ($t) => ! empty($t) && ! str_starts_with($t, 'fcm_web_')));

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
        $tokens = array_values(array_filter($tokens, fn ($t) => ! empty($t) && ! str_starts_with($t, 'fcm_web_')));

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
            $isEn = app()->getLocale() === 'en';
            $titleId = 'Pesanan Berhasil Dibuat!';
            $bodyId = "Pesanan #{$order->order_number} sedang menunggu pembayaran {$formattedTotal}.";
            $titleEn = "Order Created Successfully! #{$order->order_number}";
            $bodyEn = "Order #{$order->order_number} is awaiting payment of {$formattedTotal}.";

            $this->sendToUser(
                user: $order->user_id,
                title: $isEn ? $titleEn : $titleId,
                body: $isEn ? $bodyEn : $bodyId,
                url: url('/payment/'.$order->order_number),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'type' => 'order_created',
                    'title_en' => $titleEn,
                    'body_en' => $bodyEn,
                    'title_id' => $titleId,
                    'body_id' => $bodyId,
                ]
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
            $isEn = app()->getLocale() === 'en';
            $titleId = 'Pembayaran Berhasil! #'.$order->order_number;
            $bodyId = "Pembayaran {$formattedTotal} telah lunas. Pesanan Anda sedang disiapkan dan dikemas.";
            $titleEn = 'Payment Confirmed! #'.$order->order_number;
            $bodyEn = "Payment of {$formattedTotal} is confirmed. Your luxury order is being prepared and packed.";

            $this->sendToUser(
                user: $order->user_id,
                title: $isEn ? $titleEn : $titleId,
                body: $isEn ? $bodyEn : $bodyId,
                url: url('/account/orders'),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'type' => 'payment_success',
                    'title_en' => $titleEn,
                    'body_en' => $bodyEn,
                    'title_id' => $titleId,
                    'body_id' => $bodyId,
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

        $isEn = app()->getLocale() === 'en';
        $courierName = $order->courier ?: ($isEn ? 'Partner Courier' : 'Kurir Rekanan');
        $trackingTextId = $order->tracking_number ? " (No. Resi: {$order->tracking_number})" : '';
        $trackingTextEn = $order->tracking_number ? " (Tracking No: {$order->tracking_number})" : '';

        $titleId = 'Pesanan Anda Sedang Dikirim!';
        $bodyId = "Pesanan #{$order->order_number} telah diserahkan kepada {$courierName}{$trackingTextId}. Nantikan aroma mewah Anda segera tiba.";
        $titleEn = 'Your Order is On the Way!';
        $bodyEn = "Order #{$order->order_number} has been handed over to {$courierName}{$trackingTextEn}. Look forward to your luxury fragrance soon.";

        $this->sendToUser(
            user: $order->user_id,
            title: $isEn ? $titleEn : $titleId,
            body: $isEn ? $bodyEn : $bodyId,
            url: url('/account/orders'),
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'tracking_number' => (string) ($order->tracking_number ?? ''),
                'type' => 'order_shipped',
                'title_en' => $titleEn,
                'body_en' => $bodyEn,
                'title_id' => $titleId,
                'body_id' => $bodyId,
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

        $isEn = app()->getLocale() === 'en';
        $storeName = $order->store ? $order->store->name : ($isEn ? 'Aroma Palace Official Boutique' : 'Butik Resmi Aroma Palace');

        $titleId = 'Pesanan Siap Diambil di Butik!';
        $bodyId = "Wewangian mewah pesanan Anda #{$order->order_number} sudah siap diambil di {$storeName}.";
        $titleEn = 'Your Order is Ready for Boutique Pickup!';
        $bodyEn = "Your luxury fragrance order #{$order->order_number} is ready for pickup at {$storeName}.";

        $this->sendToUser(
            user: $order->user_id,
            title: $isEn ? $titleEn : $titleId,
            body: $isEn ? $bodyEn : $bodyId,
            url: url('/account/orders'),
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'type' => 'store_pickup_ready',
                'title_en' => $titleEn,
                'body_en' => $bodyEn,
                'title_id' => $titleId,
                'body_id' => $bodyId,
            ]
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
        $isEn = app()->getLocale() === 'en';
        $discountInfoId = $voucher->type === 'percentage' ? "Diskon {$voucher->value}%" : 'Potongan Rp '.number_format($voucher->value, 0, ',', '.');
        $discountInfoEn = $voucher->type === 'percentage' ? "{$voucher->value}% Discount" : 'Rp '.number_format($voucher->value, 0, ',', '.').' Off';

        $titleId = 'Voucher Spesial Baru: '.$voucher->code;
        $bodyId = "Gunakan kode {$voucher->code} untuk {$discountInfoId} di Aroma Palace. Jangan lewatkan!";
        $titleEn = 'New Special Voucher: '.$voucher->code;
        $bodyEn = "Use code {$voucher->code} for {$discountInfoEn} at Aroma Palace. Don't miss out!";

        return $this->sendBroadcast(
            title: $isEn ? $titleEn : $titleId,
            body: $isEn ? $bodyEn : $bodyId,
            url: url('/products'),
            data: [
                'voucher_code' => $voucher->code,
                'type' => 'voucher_reward',
                'title_en' => $titleEn,
                'body_en' => $bodyEn,
                'title_id' => $titleId,
                'body_id' => $bodyId,
            ]
        );
    }

    /**
     * 7. Notifikasi Pembatalan Pesanan (Auto Cancel 24 Jam):
     * - Ke Customer: "Pesanan Dibatalkan"
     * - Ke Admin: "Pesanan Dibatalkan Otomatis"
     */
    /**
     * Remind users about pending orders that will expire in ~1 hour (23–24h window).
     * Runs every 10 minutes via scheduler; sends only once per order (cached).
     *
     * @return int Number of reminders sent
     */
    public function notifyPaymentExpiringSoon(): int
    {
        // Orders created between 23h and 24h ago that are still unpaid and not awaiting confirmation
        $expiringSoon = Order::where('payment_status', 'pending')
            ->whereNotIn('status', ['menunggu_konfirmasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan'])
            ->whereBetween('created_at', [now()->subHours(24), now()->subHours(23)])
            ->whereNotNull('user_id')
            ->get();

        if ($expiringSoon->isEmpty()) {
            return 0;
        }

        $sentCount = 0;

        foreach ($expiringSoon as $order) {
            // Send only once per order (TTL 2h so it doesn't re-fire in the next 10-min run)
            $cacheKey = "fcm_payment_expiring_soon_{$order->id}";
            if (Cache::has($cacheKey)) {
                continue;
            }
            Cache::put($cacheKey, true, now()->addHours(2));

            $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');
            $paymentUrl = url('/payment/'.$order->order_number);

            $titleId = 'Segera Bayar! Pesanan #'.$order->order_number.' Akan Dibatalkan';
            $bodyId = "Pembayaran {$formattedTotal} harus diselesaikan dalam 1 jam. Pesanan Anda akan otomatis dibatalkan jika melewati batas waktu.";
            $titleEn = 'Pay Now! Order #'.$order->order_number.' Expiring Soon';
            $bodyEn = "Payment of {$formattedTotal} must be completed within 1 hour or your order will be automatically canceled.";

            $this->sendToUser(
                user: $order->user_id,
                title: $titleId,
                body: $bodyId,
                url: $paymentUrl,
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'type' => 'payment_expiring_soon',
                    'title_en' => $titleEn,
                    'body_en' => $bodyEn,
                    'title_id' => $titleId,
                    'body_id' => $bodyId,
                ]
            );

            $sentCount++;
        }

        return $sentCount;
    }

    public function notifyOrderCanceled(Order $order, string $reason = 'Batas waktu pembayaran 24 jam telah berakhir.'): void
    {
        $cacheKey = "fcm_order_canceled_sent_{$order->id}";
        if (Cache::has($cacheKey)) {
            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(10));

        if ($order->user_id) {
            $isEn = app()->getLocale() === 'en';
            $reasonEn = $reason === 'Batas waktu pembayaran 24 jam telah berakhir.' ? '24-hour payment deadline has expired.' : $reason;

            $titleId = 'Pesanan Dibatalkan #'.$order->order_number;
            $bodyId = "Pesanan wewangian Anda telah dibatalkan otomatis karena {$reason}";
            $titleEn = 'Order Canceled #'.$order->order_number;
            $bodyEn = "Your luxury fragrance order was canceled automatically: {$reasonEn}";

            $this->sendToUser(
                user: $order->user_id,
                title: $isEn ? $titleEn : $titleId,
                body: $isEn ? $bodyEn : $bodyId,
                url: url('/account/orders'),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'type' => 'order_canceled',
                    'title_en' => $titleEn,
                    'body_en' => $bodyEn,
                    'title_id' => $titleId,
                    'body_id' => $bodyId,
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

    /**
     * 8. Notifikasi Paket Sampai di Tujuan (Jeda 3 hari sebelum selesai otomatis):
     * - Ke Customer: "Pesanan Telah Sampai!"
     * - Ke Admin: "Pesanan Sampai Tujuan"
     */
    public function notifyOrderDelivered(Order $order, ?Shipping $shipping = null): void
    {
        $cacheKey = "fcm_order_delivered_sent_{$order->id}";
        if (Cache::has($cacheKey)) {
            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(30));

        $shippingModel = $shipping ?? $order->shipping;
        $autoCompleteDate = $shippingModel?->auto_completes_at
            ? $shippingModel->auto_completes_at->format('d/m/Y')
            : now()->addDays(3)->format('d/m/Y');

        if ($order->user_id) {
            $isEn = app()->getLocale() === 'en';
            $titleId = 'Pesanan Telah Sampai! #'.$order->order_number;
            $bodyId = "Paket pesanan #{$order->order_number} telah sampai di tujuan. Pesanan otomatis selesai pada {$autoCompleteDate}. Silakan periksa produk Anda.";
            $titleEn = 'Your Order Has Arrived! #'.$order->order_number;
            $bodyEn = "Package for order #{$order->order_number} has arrived at destination. It will automatically complete on {$autoCompleteDate}. Please check your products.";

            $this->sendToUser(
                user: $order->user_id,
                title: $isEn ? $titleEn : $titleId,
                body: $isEn ? $bodyEn : $bodyId,
                url: url('/account/orders'),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'auto_completes_at' => (string) ($shippingModel?->auto_completes_at?->toIso8601String() ?? now()->addDays(3)->toIso8601String()),
                    'type' => 'order_delivered',
                    'title_en' => $titleEn,
                    'body_en' => $bodyEn,
                    'title_id' => $titleId,
                    'body_id' => $bodyId,
                ]
            );
        }

        $this->sendToAdmins(
            title: 'Pesanan Sampai Tujuan #'.$order->order_number,
            body: "Paket pesanan #{$order->order_number} untuk {$order->recipient_name} telah sampai di alamat tujuan.",
            url: '/manajemen-pesanan/'.$order->id,
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'type' => 'admin_order_delivered',
            ]
        );
    }

    /**
     * 9. Notifikasi Pesanan Selesai:
     * - Ke Customer: "Pesanan Selesai!"
     * - Ke Admin: "Pesanan Selesai"
     */
    public function notifyOrderCompleted(Order $order): void
    {
        $cacheKey = "fcm_order_completed_sent_{$order->id}";
        if (Cache::has($cacheKey)) {
            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(30));

        if ($order->user_id) {
            $isEn = app()->getLocale() === 'en';
            $titleId = 'Pesanan Selesai! #'.$order->order_number;
            $bodyId = "Pesanan wewangian mewah #{$order->order_number} telah selesai. Terima kasih telah berbelanja di Aroma Palace!";
            $titleEn = 'Order Completed! #'.$order->order_number;
            $bodyEn = "Your luxury fragrance order #{$order->order_number} is completed. Thank you for shopping with Aroma Palace!";

            $this->sendToUser(
                user: $order->user_id,
                title: $isEn ? $titleEn : $titleId,
                body: $isEn ? $bodyEn : $bodyId,
                url: url('/account/orders'),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'type' => 'order_completed',
                    'title_en' => $titleEn,
                    'body_en' => $bodyEn,
                    'title_id' => $titleId,
                    'body_id' => $bodyId,
                ]
            );
        }

        $this->sendToAdmins(
            title: 'Pesanan Selesai #'.$order->order_number,
            body: "Pesanan #{$order->order_number} dari {$order->recipient_name} telah selesai diterima.",
            url: '/manajemen-pesanan/'.$order->id,
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'type' => 'admin_order_completed',
            ]
        );
    }

    /**
     * 10. Notifikasi Registrasi User Baru:
     * - Ke Customer: Selamat datang
     * - Ke Admin: Pelanggan baru mendaftar
     */
    public function notifyNewUserRegistered(User $user): void
    {
        $cacheKey = "notif_new_user_{$user->id}";
        if (Cache::has($cacheKey)) {
            return;
        }
        Cache::put($cacheKey, true, now()->addHours(1));

        $isEn = app()->getLocale() === 'en';
        $titleId = 'Selamat Datang di Aroma Palace!';
        $bodyId = "Halo {$user->name}, terima kasih telah bergabung di butik wewangian mewah kami. Nikmati koleksi aroma eksklusif dan penawaran istimewa.";
        $titleEn = 'Welcome to Aroma Palace!';
        $bodyEn = "Hello {$user->name}, thank you for joining our luxury fragrance boutique. Explore exclusive scents and special privileges.";

        $this->sendToUser(
            user: $user->id,
            title: $isEn ? $titleEn : $titleId,
            body: $isEn ? $bodyEn : $bodyId,
            url: url('/products'),
            data: [
                'user_id' => (string) $user->id,
                'type' => 'new_user_welcome',
                'title_en' => $titleEn,
                'body_en' => $bodyEn,
                'title_id' => $titleId,
                'body_id' => $bodyId,
            ]
        );

        $this->sendToAdmins(
            title: 'Pelanggan Baru Mendaftar',
            body: "Pelanggan baru {$user->name} ({$user->email}) telah mendaftar akun di Aroma Palace.",
            url: '/manajemen-pengguna',
            data: [
                'user_id' => (string) $user->id,
                'user_name' => (string) $user->name,
                'user_email' => (string) $user->email,
                'type' => 'admin_new_user',
            ]
        );
    }

    /**
     * 11. Notifikasi Perolehan Poin Loyalitas (Belanja):
     * - Ke Customer: Poin diperoleh
     */
    public function notifyPointsEarned(User $user, int $points, Order $order, int $newBalance): void
    {
        $cacheKey = "notif_points_earned_{$order->id}_{$user->id}";
        if (Cache::has($cacheKey)) {
            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(30));

        $isEn = app()->getLocale() === 'en';
        $titleId = "Poin Loyalitas Diperoleh! (+{$points} Poin)";
        $bodyId = "Selamat! Anda memperoleh +{$points} loyalty points dari pesanan #{$order->order_number}. Total saldo poin Anda saat ini: {$newBalance} poin.";
        $titleEn = "Loyalty Points Earned! (+{$points} Points)";
        $bodyEn = "Congratulations! You earned +{$points} loyalty points from order #{$order->order_number}. Your current points balance: {$newBalance} points.";

        $this->sendToUser(
            user: $user->id,
            title: $isEn ? $titleEn : $titleId,
            body: $isEn ? $bodyEn : $bodyId,
            url: url('/account'),
            data: [
                'user_id' => (string) $user->id,
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'points_earned' => (string) $points,
                'new_balance' => (string) $newBalance,
                'type' => 'loyalty_points_earned',
                'title_en' => $titleEn,
                'body_en' => $bodyEn,
                'title_id' => $titleId,
                'body_id' => $bodyId,
            ]
        );
    }

    /**
     * 12. Notifikasi Penukaran Poin Loyalitas (Tukar Reward):
     * - Ke Customer: Voucher didapat
     * - Ke Admin: Pelanggan menukarkan poin
     */
    public function notifyPointsRedeemed(User $user, int $points, string $voucherCode, string $rewardName): void
    {
        $isEn = app()->getLocale() === 'en';
        $titleId = 'Penukaran Poin Berhasil';
        $bodyId = "Anda telah menukarkan {$points} poin dengan voucher {$rewardName} (Kode: {$voucherCode}). Gunakan saat checkout belanja!";
        $titleEn = 'Points Redeemed Successfully';
        $bodyEn = "You have redeemed {$points} points for {$rewardName} voucher (Code: {$voucherCode}). Apply it on your next checkout!";

        $this->sendToUser(
            user: $user->id,
            title: $isEn ? $titleEn : $titleId,
            body: $isEn ? $bodyEn : $bodyId,
            url: url('/account'),
            data: [
                'user_id' => (string) $user->id,
                'voucher_code' => $voucherCode,
                'points_spent' => (string) $points,
                'reward_name' => $rewardName,
                'type' => 'loyalty_points_redeemed',
                'title_en' => $titleEn,
                'body_en' => $bodyEn,
                'title_id' => $titleId,
                'body_id' => $bodyId,
            ]
        );

        $this->sendToAdmins(
            title: 'Pelanggan Menukarkan Poin',
            body: "{$user->name} telah menukarkan {$points} poin untuk voucher {$rewardName} ({$voucherCode}).",
            url: '/manajemen-pengguna',
            data: [
                'user_id' => (string) $user->id,
                'user_name' => (string) $user->name,
                'voucher_code' => $voucherCode,
                'points_spent' => (string) $points,
                'reward_name' => $rewardName,
                'type' => 'admin_points_redeemed',
            ]
        );
    }

    /**
     * Remind admins about paid orders that have not been processed to shipping
     * after 24 hours. Sends one notification per order per hour (cached).
     *
     * @return int Number of reminder notifications sent
     */
    public function notifyUnprocessedPaidOrders(): int
    {
        // Orders that are paid (payment_status=paid) but haven't reached 'dikirim'/'selesai'/'dibatalkan'
        // and were last updated (paid) more than 24 hours ago.
        $stuck = Order::where('payment_status', 'paid')
            ->whereNotIn('status', ['dikirim', 'selesai', 'dibatalkan'])
            ->where('updated_at', '<=', now()->subHours(24))
            ->get();

        if ($stuck->isEmpty()) {
            return 0;
        }

        $sentCount = 0;

        foreach ($stuck as $order) {
            // Throttle: send at most once per hour per order
            $cacheKey = "admin_unprocessed_reminder_{$order->id}_".now()->format('YmdH');
            if (Cache::has($cacheKey)) {
                continue;
            }
            Cache::put($cacheKey, true, now()->addHours(2));

            $hoursStuck = (int) now()->diffInHours($order->updated_at);
            $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');

            $this->sendToAdmins(
                title: 'Pesanan Belum Diproses #'.$order->order_number,
                body: "Pesanan {$formattedTotal} dari {$order->recipient_name} sudah dibayar {$hoursStuck} jam lalu dan belum dikirim.",
                url: '/manajemen-pesanan/'.$order->id,
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'hours_stuck' => (string) $hoursStuck,
                    'type' => 'admin_order_unprocessed',
                ]
            );

            $sentCount++;
        }

        return $sentCount;
    }

    /**
     * 13. Notifikasi Bukti Transfer Manual Diunggah:
     * - Ke Admin: "Bukti Transfer Diunggah – Konfirmasi Diperlukan"
     */
    public function notifyManualPaymentProofUploaded(Order $order): void
    {
        $cacheKey = "fcm_manual_proof_uploaded_{$order->id}_".now()->format('YmdH');
        if (Cache::has($cacheKey)) {
            Log::info("Suppressing duplicate notifyManualPaymentProofUploaded for order #{$order->order_number}");

            return;
        }
        Cache::put($cacheKey, true, now()->addHours(1));

        $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');

        $this->sendToAdmins(
            title: 'Bukti Transfer Diunggah #'.$order->order_number,
            body: "{$order->recipient_name} telah mengunggah bukti transfer {$formattedTotal}. Silakan verifikasi segera.",
            url: '/manajemen-pesanan/'.$order->id,
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'type' => 'admin_manual_payment_proof',
                'payment_method' => 'manual',
            ]
        );
    }

    /**
     * 14. Notifikasi Pembayaran Manual Disetujui (oleh Admin):
     * - Ke Customer: "Pembayaran Manual Dikonfirmasi!"
     */
    public function notifyManualPaymentApproved(Order $order): void
    {
        $cacheKey = "fcm_manual_approved_{$order->id}";
        if (Cache::has($cacheKey)) {
            Log::info("Suppressing duplicate notifyManualPaymentApproved for order #{$order->order_number}");

            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(10));

        $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');

        if ($order->user_id) {
            $titleId = 'Pembayaran Dikonfirmasi! #'.$order->order_number;
            $bodyId = "Bukti transfer {$formattedTotal} Anda telah diverifikasi. Pesanan wewangian Anda sedang kami siapkan.";
            $titleEn = 'Payment Confirmed! #'.$order->order_number;
            $bodyEn = "Your transfer proof of {$formattedTotal} has been verified. Your luxury fragrance order is being prepared.";

            $this->sendToUser(
                user: $order->user_id,
                title: $titleId,
                body: $bodyId,
                url: url('/account/orders'),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'payment_method' => 'manual',
                    'type' => 'payment_success',
                    'title_en' => $titleEn,
                    'body_en' => $bodyEn,
                    'title_id' => $titleId,
                    'body_id' => $bodyId,
                ]
            );
        }

        // Also notify admin side (same as notifyPaymentSuccess admin branch)
        $this->sendToAdmins(
            title: 'Pembayaran Manual Diterima! #'.$order->order_number,
            body: "Pembayaran {$formattedTotal} dari {$order->recipient_name} telah dikonfirmasi secara manual.",
            url: '/manajemen-pesanan/'.$order->id,
            data: [
                'order_id' => (string) $order->id,
                'order_number' => (string) $order->order_number,
                'payment_method' => 'manual',
                'type' => 'admin_payment_received',
            ]
        );
    }

    /**
     * 15. Notifikasi Pembayaran Manual Ditolak (oleh Admin):
     * - Ke Customer: "Bukti Transfer Ditolak"
     */
    public function notifyManualPaymentRejected(Order $order): void
    {
        $cacheKey = "fcm_manual_rejected_{$order->id}";
        if (Cache::has($cacheKey)) {
            Log::info("Suppressing duplicate notifyManualPaymentRejected for order #{$order->order_number}");

            return;
        }
        Cache::put($cacheKey, true, now()->addMinutes(10));

        $formattedTotal = 'Rp '.number_format($order->total_amount, 0, ',', '.');

        if ($order->user_id) {
            $titleId = 'Bukti Transfer Belum Sesuai #'.$order->order_number;
            $bodyId = "Bukti transfer {$formattedTotal} belum dapat diverifikasi oleh admin. Silakan unggah ulang bukti transfer yang valid.";
            $titleEn = 'Transfer Proof Unverified #'.$order->order_number;
            $bodyEn = "Your transfer proof of {$formattedTotal} could not be verified. Please re-upload a valid transfer receipt on the payment page.";

            $this->sendToUser(
                user: $order->user_id,
                title: $titleId,
                body: $bodyId,
                url: url('/payment/'.$order->order_number),
                data: [
                    'order_id' => (string) $order->id,
                    'order_number' => (string) $order->order_number,
                    'payment_method' => 'manual',
                    'type' => 'payment_proof_rejected',
                    'title_en' => $titleEn,
                    'body_en' => $bodyEn,
                    'title_id' => $titleId,
                    'body_id' => $bodyId,
                ]
            );
        }
    }
}
