<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class RajaOngkirPaymentService
{
    protected string $baseUrl = 'https://api-sandbox.collaborator.komerce.id/user/api/v1';

    protected function request()
    {
        return Http::acceptJson()
            ->withHeaders([
                'x-api-key' => config('services.rajaongkir.payment_key'),
            ]);
    }

    public function getPaymentMethods()
    {
        return $this->request()
            ->get($this->baseUrl.'/user/methods')
            ->throw()
            ->json();
    }

    public function getcalculateCost(
        int $destination = 30,
        int $weight = 1000,
        string $price = 'lowest'
    ) {
        return $this->request()
            ->asForm()
            ->post($this->baseUrl.'/calculate/district/domestic-cost', [
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
