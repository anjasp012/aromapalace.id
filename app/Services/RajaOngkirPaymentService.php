<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RajaOngkirPaymentService
{
    protected string $baseUrl = 'https://api-sandbox.collaborator.komerce.id/user/api/v1/user';

    protected string $callbackUrl;

    protected string $secretKey;

    public function __construct()
    {
        $this->callbackUrl = config('services.rajaongkir.callback_url');
        $this->secretKey = config('services.rajaongkir.callback_api_key');
    }

    protected function request()
    {
        return Http::acceptJson()
            ->withHeaders([
                'x-api-key' => config('services.rajaongkir.payment_key'),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ]);
    }

    public function getPaymentMethods()
    {
        return $this->request()
            ->get($this->baseUrl.'/methods')
            ->json();
    }

    public function createPayment($order_number, $payment_type, $channel_code, $amount)
    {
        return $this->request()
            ->post($this->baseUrl.'/payment/create', [
                ...($order_number ? ['order_id' => $order_number] : []),
                'payment_type' => $payment_type,
                ...($channel_code ? ['channel_code' => $channel_code] : []),
                $amount ?: 'amount' => (float) $amount,
                'customer' => [
                    'name' => 'anjas',
                    'email' => 'anjas@gmail.com',
                    'phone' => '089529591732',
                ],
                'items' => [
                    [
                        'name' => 'Product A',
                        'quantity' => 2,
                        'price' => 50000,
                    ],
                ],
                'expiry_duration' => 3600,
                'callback_url' => $this->callbackUrl,
                'callback_API_KEY' => $this->secretKey,
            ])
            ->json();
    }

    public function getPaymentStatus($order_number = 'KPAY-c8e8/KM/2026')
    {
        return $this->request()
            ->get($this->baseUrl.'/payment/status/'.$order_number)
            ->json();
    }

    public function cancelPayment($order_number = 'KPAY-c8e8/KM/2026')
    {
        return $this->request()
            ->post($this->baseUrl.'/payment/cancel', [
                'payment_id' => 'KPAY-c8e8/KM/2026',
                'reason' => 'Customer canceled the order',
            ])
            ->json();
    }

    public function callbackPayment($rawBody, $signature)
    {
        $secretKey = $this->secretKey;

        if (! $signature || ! $secretKey) {
            throw new \Exception('Unauthorized', 401);
        }

        $expectedSignature = hash_hmac(
            'sha256',
            $rawBody,
            $secretKey
        );

        if (! hash_equals($expectedSignature, $signature)) {
            throw new \Exception('Invalid signature', 401);
        }

        $data = json_decode($rawBody, true);

        if (! is_array($data)) {
            throw new \Exception('Invalid payload', 400);
        }

        Log::info('Payment Callback Received', $data);

        return [
            'success' => true,
            'message' => 'Callback received',
        ];
    }
}
