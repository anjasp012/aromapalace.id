<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

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
            ->throw()
            ->json();
    }

    public function createPayment()
    {
        return $this->request()
            ->post($this->baseUrl.'/payment/create', [
                'order_id' => 'coba'.rand(1, 1000),
                'payment_type' => 'bank_transfer',
                'channel_code' => 'BCA',
                'amount' => 10000,
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
            ->throw()
            ->json();
    }

    public function getPaymentStatus($order_number)
    {
        return $this->request()
            ->get($this->baseUrl.'/status'.$order_number)
            ->throw()
            ->json();
    }

    public function callbackPayment($rawBody, $signature)
    {
        $secretKey = $this->secretKey;

        if (! $signature || ! $secretKey) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        // 4. Generate HMAC SHA256
        $expectedSignature = hash_hmac(
            'sha256',
            $rawBody,
            $secretKey
        );

        // 5. Verifikasi signature
        if (! hash_equals($expectedSignature, $signature)) {
            return response()->json([
                'message' => 'Invalid signature',
            ], 401);
        }

        // 6. Decode payload setelah signature valid
        $data = json_decode($rawBody, true);

        if (! is_array($data)) {
            return response()->json([
                'message' => 'Invalid payload',
            ], 400);
        }

        // 7. Proses pembayaran
        Log::info('Payment Callback Received', $data);

        return response()->json([
            'success' => true,
            'message' => 'Callback received',
        ], 200);
    }

    public function cancelPayment(
        int $destination = 30,
        int $weight = 1000,
        string $price = 'lowest'
    ) {
        return $this->request()
            ->asForm()
            ->post($this->baseUrl.'/user/cancel', [
                'origin' => $this->origin,
                'destination' => $destination,
                'weight' => $weight,
                'courier' => 'jne:sicepat:ide:sap:jnt:ninja:tiki:lion:anteraja:pos:ncs:rex:rpx',
                'price' => $price,
            ])
            ->throw()
            ->json();
    }
}
