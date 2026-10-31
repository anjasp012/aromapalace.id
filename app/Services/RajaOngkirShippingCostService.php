<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class RajaOngkirShippingCostService
{
    protected string $baseUrl = 'https://rajaongkir.komerce.id/api/v1';

    protected float $origin = 291;

    protected function request()
    {
        return Http::acceptJson()
            ->withHeaders([
                'key' => config('services.rajaongkir.shipping_key'),
            ]);
    }

    public function getProvinces()
    {
        return $this->request()
            ->get($this->baseUrl.'/destination/province')
            ->json();
    }

    public function getCities($province_id)
    {

        return $this->request()
            ->get($this->baseUrl.'/destination/city/'.$province_id)
            ->json();
    }

    public function getDistricts($city_id)
    {
        return $this->request()
            ->get($this->baseUrl.'/destination/district/'.$city_id)
            ->json();
    }

    public function getSubDistricts($district_id)
    {
        return $this->request()
            ->get($this->baseUrl.'/destination/sub-district/'.$district_id)
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
            ->json();
    }
}
