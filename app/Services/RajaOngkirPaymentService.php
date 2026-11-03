<?php

namespace App\Services;

use App\Events\OrderPaid;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RajaOngkirPaymentService
{
    /** Base URL for sandbox environment */
    protected const BASE_URL_SANDBOX = 'https://api-sandbox.collaborator.komerce.id/user/api/v1/user';

    /** Base URL for production environment */
    protected const BASE_URL_PRODUCTION = 'https://api.collaborator.komerce.id/user/api/v1/user';

    /**
     * Get the active base URL based on the mode setting.
     */
    protected function baseUrl(): string
    {
        $mode = (string) Setting::get('rajaongkir_payment_mode', config('services.rajaongkir.mode', 'sandbox'));

        return $mode === 'production' ? self::BASE_URL_PRODUCTION : self::BASE_URL_SANDBOX;
    }

    /**
     * Get the payment API key, preferring the DB setting over env.
     */
    protected function paymentKey(): string
    {
        return (string) Setting::get('rajaongkir_payment_key', config('services.rajaongkir.payment_key', ''));
    }

    /**
     * Get the callback URL, preferring the DB setting over env.
     */
    protected function callbackUrl(): string
    {
        return (string) Setting::get('rajaongkir_callback_url', config('services.rajaongkir.callback_url', ''));
    }

    /**
     * Get the callback API key (webhook secret), preferring the DB setting over env.
     */
    protected function callbackApiKey(): string
    {
        return (string) Setting::get('rajaongkir_callback_api_key', config('services.rajaongkir.callback_api_key', ''));
    }

    protected function request(): PendingRequest
    {
        return Http::acceptJson()
            ->withHeaders([
                'x-api-key' => $this->paymentKey(),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ]);
    }

    public function getPaymentMethods(): mixed
    {
        return $this->request()
            ->get($this->baseUrl().'/methods')
            ->json();
    }

    public function createPayment(
        string $orderNumber,
        string $paymentType,
        ?string $channelCode,
        float|int $amount,
        string $customerName = '',
        string $customerEmail = '',
        string $customerPhone = '',
        array $items = [],
        int $expiryDuration = 3600,
    ): mixed {
        $payload = [
            'order_id' => $orderNumber,
            'payment_type' => $paymentType,
            'amount' => (float) $amount,
            'customer' => [
                'name' => $customerName ?: 'Customer',
                'email' => $customerEmail ?: 'customer@aromapalace.id',
                'phone' => $customerPhone ?: '08000000000',
            ],
            'items' => $items ?: [
                ['name' => 'Pesanan', 'quantity' => 1, 'price' => (float) $amount],
            ],
            'expiry_duration' => $expiryDuration,
            'callback_url' => $this->callbackUrl(),
            'callback_API_KEY' => $this->callbackApiKey(),
        ];

        if ($channelCode) {
            $payload['channel_code'] = $channelCode;
        }

        return $this->request()
            ->post($this->baseUrl().'/payment/create', $payload)
            ->json();
    }

    public function getPaymentStatus(string $orderNumber): mixed
    {
        return $this->request()
            ->get($this->baseUrl().'/payment/status/'.$orderNumber)
            ->json();
    }

    public function cancelPayment(string $orderNumber): mixed
    {
        return $this->request()
            ->post($this->baseUrl().'/payment/cancel', [
                'payment_id' => $orderNumber,
                'reason' => 'Customer canceled the order',
            ])
            ->json();
    }

    /**
     * Verify and process an incoming payment callback from RajaOngkir.
     *
     * @param  array<string, mixed>  $data
     * @return array{success: bool, message: string}
     */
    public function callbackPayment(string $rawBody, ?string $signature): array
    {
        $secretKey = $this->callbackApiKey();

        if (! $signature || ! $secretKey) {
            throw new \Exception('Unauthorized', 401);
        }

        $expectedSignature = hash_hmac('sha256', $rawBody, $secretKey);

        if (! hash_equals($expectedSignature, $signature)) {
            throw new \Exception('Invalid signature', 401);
        }

        $data = json_decode($rawBody, true);

        if (! is_array($data)) {
            throw new \Exception('Invalid payload', 400);
        }

        Log::info('RajaOngkir Payment Callback Received', $data);

        $orderNumber = (string) ($data['order_id'] ?? '');
        $status = strtolower((string) ($data['status'] ?? ''));

        if ($orderNumber && $status) {
            DB::transaction(function () use ($orderNumber, $status) {
                $order = Order::where('order_number', $orderNumber)->lockForUpdate()->first();

                if (! $order) {
                    Log::warning('RajaOngkir callback: order not found', ['order_id' => $orderNumber]);

                    return;
                }

                if (in_array($status, ['completed', 'paid', 'success'], true)) {
                    if ($order->payment_status !== 'paid') {
                        $order->update([
                            'payment_status' => 'paid',
                            'status' => 'diproses',
                        ]);

                        try {
                            event(new OrderPaid($order));
                        } catch (\Throwable $e) {
                            Log::warning('Broadcast OrderPaid failed: '.$e->getMessage());
                        }

                        app(FirebaseNotificationService::class)->notifyPaymentSuccess($order);
                    }
                } elseif (in_array($status, ['canceled', 'expired', 'failed'], true)) {
                    if ($order->payment_status !== 'canceled') {
                        app(OrderService::class)->cancelOrder($order, 'Dibatalkan oleh gateway RajaOngkir: '.$status);
                    }
                }
            });
        }

        return [
            'success' => true,
            'message' => 'Callback received',
        ];
    }
}
