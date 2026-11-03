<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class RajaOngkirShippingCostService
{
    protected string $baseUrl = 'https://rajaongkir.komerce.id/api/v1';

    /**
     * Get the shipping API key, preferring the DB setting over env.
     */
    protected function shippingKey(): string
    {
        return (string) Setting::get('rajaongkir_shipping_key', config('services.rajaongkir.shipping_key', ''));
    }

    /**
     * Get the origin sub-district ID for cost calculation, preferring the DB setting over env.
     */
    protected function originSubdistrictId(): int
    {
        return (int) Setting::get('rajaongkir_shipping_origin', 291);
    }

    protected function request(): PendingRequest
    {
        return Http::acceptJson()
            ->withHeaders([
                'key' => $this->shippingKey(),
            ]);
    }

    public function getProvinces(): mixed
    {
        return $this->request()
            ->get($this->baseUrl.'/destination/province')
            ->json();
    }

    public function getCities(int|string $province_id): mixed
    {
        return $this->request()
            ->get($this->baseUrl.'/destination/city/'.$province_id)
            ->json();
    }

    public function getDistricts(int|string $city_id): mixed
    {
        return $this->request()
            ->get($this->baseUrl.'/destination/district/'.$city_id)
            ->json();
    }

    public function getSubDistricts(int|string $district_id): mixed
    {
        return $this->request()
            ->get($this->baseUrl.'/destination/sub-district/'.$district_id)
            ->json();
    }

    public function getcalculateCost(
        int $destination = 30,
        int $weight = 1000,
        string $price = 'lowest'
    ): mixed {
        return $this->request()
            ->asForm()
            ->post($this->baseUrl.'/calculate/district/domestic-cost', [
                'origin' => $this->originSubdistrictId(),
                'destination' => $destination,
                'weight' => $weight,
                'courier' => 'jne:sicepat:ide:sap:jnt:ninja:tiki:lion:anteraja:pos:ncs:rex:rpx',
                'price' => $price,
            ])
            ->json();
    }

    /**
     * Get formatted shipping rates for checkout calculations.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getShippingRates(int $destinationDistrictId, int $weight = 1000): array
    {
        $res = $this->getcalculateCost($destinationDistrictId, $weight);
        $raw = $res['data'] ?? [];

        if (! is_array($raw)) {
            return [];
        }

        return array_values(array_map(function ($item) {
            $arr = (array) $item;
            $code = strtolower((string) ($arr['code'] ?? ''));
            $service = strtoupper((string) ($arr['service'] ?? ''));
            $cost = (int) ($arr['cost'] ?? 0);
            $logoUrl = $this->getCourierLogoUrl($code);

            return [
                'service' => strtoupper($code),
                'name' => ($arr['name'] ?? strtoupper($code)).' - '.($arr['description'] ?? $service),
                'code' => $service,
                'type' => $service,
                'price' => $cost,
                'cost' => $cost,
                'price_formatted' => number_format($cost, 0, ',', '.'),
                'etd' => (string) ($arr['etd'] ?? ''),
                'insurance' => '0',
                'logo' => $logoUrl,
                'courier_logo' => $logoUrl,
            ];
        }, $raw));
    }

    /**
     * Get courier logo CDN URL by service code.
     */
    public function getCourierLogoUrl(?string $serviceCode): string
    {
        $clean = strtolower(trim((string) $serviceCode));
        $clean = str_replace([' ', '-', '_', '&'], '', $clean);

        if ($clean === '' || $clean === 'pickup') {
            return '';
        }

        $courierMap = [
            'jtcargo' => 'jtcargo',
            'jnt' => 'jnt',
            'jt' => 'jnt',
            'jne' => 'jne',
            'sicepat' => 'sicepat',
            'shopee' => 'spx',
            'spx' => 'spx',
            'anteraja' => 'anteraja',
            'lion' => 'lion',
            'ninja' => 'ninja',
            'sap' => 'sap',
            'idexpress' => 'idx',
            'idx' => 'idx',
            'ide' => 'idx',
            'tiki' => 'tiki',
            'posindonesia' => 'posindonesia',
            'posindo' => 'posindonesia',
            'pos' => 'posindonesia',
            'rpx' => 'rpx',
            'sentral' => 'sentral',
            'ncs' => 'ncs',
            'rex' => 'rex',
            'borzo' => 'borzo',
            'gosend' => 'gosend',
            'gojek' => 'gosend',
            'grab' => 'grab',
            'paxel' => 'paxel',
        ];

        foreach ($courierMap as $key => $targetCode) {
            if (str_starts_with($clean, $key)) {
                return "https://storage.googleapis.com/tprt0ezsggqjornc7nf1wwluvgulhr/assets/courier-logo/{$targetCode}.png";
            }
        }

        return "https://storage.googleapis.com/tprt0ezsggqjornc7nf1wwluvgulhr/assets/courier-logo/{$clean}.png";
    }
}
