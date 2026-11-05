<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KurirAPIService
{
    protected string $baseUrlV1 = 'https://use.api.co.id/courier/v1';

    protected string $baseUrlV2 = 'https://use.api.co.id/courier/v2';

    /**
     * Get the shipping API key, preferring the DB setting over env.
     */
    public function apiKey(): string
    {
        return (string) Setting::get('kurirapi_key', config('services.kurirapi.key', 'test_E1FHospZPSTE8w8eSaIZBK9fzLOgSnr8oiTI74h5FusWZ'));
    }

    /**
     * Origin district code (6 digits, e.g. 317407 for Kebayoran Baru, Jakarta Selatan).
     */
    public function originDistrictCode(): string
    {
        $origin = (string) Setting::get('shipping_district_id', '');
        if (strlen($origin) === 6 && ctype_digit($origin)) {
            return $origin;
        }

        return '317407';
    }

    protected function request(): PendingRequest
    {
        return Http::acceptJson()
            ->withHeaders([
                'x-api-co-id' => $this->apiKey(),
            ]);
    }

    public function getBalance(): mixed
    {
        return $this->request()
            ->get($this->baseUrlV1.'/balance')
            ->json();
    }

    public function getProvinces(): mixed
    {
        return $this->request()
            ->get($this->baseUrlV1.'/locations/provinces')
            ->json();
    }

    public function getCities(int|string $province_id): mixed
    {
        return $this->request()
            ->get($this->baseUrlV1.'/locations/cities?province='.$province_id)
            ->json();
    }

    public function getDistricts(int|string $city_id): mixed
    {
        return $this->request()
            ->get($this->baseUrlV1.'/locations/districts?city='.$city_id)
            ->json();
    }

    public function getSubDistricts(int|string $district_id): mixed
    {
        // KurirAPI operates up to district (kecamatan) level for domestic shipping rates
        return [
            'is_success' => true,
            'message' => 'Success',
            'data' => [],
        ];
    }

    public function getRates(
        int|string $destination,
        int|float $weight = 1000,
        ?string $origin = null
    ): mixed {
        $originCode = $origin ?: $this->originDistrictCode();
        // Convert weight to kilograms (kg) if in grams
        $weightInKg = $weight >= 100 ? max(1, (float) ceil($weight / 1000)) : max(1, (float) $weight);

        return $this->request()
            ->get($this->baseUrlV2.'/rates', [
                'origin_district_code' => (string) $originCode,
                'destination_district_code' => (string) $destination,
                'weight' => $weightInKg,
            ])
            ->json();
    }

    /**
     * Get formatted shipping rates for checkout calculations.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getShippingRates(int|string $destinationDistrictCode, int $weightInGrams = 1000): array
    {
        try {
            $res = $this->getRates($destinationDistrictCode, $weightInGrams);
            $rates = $res['data']['rates'] ?? [];

            if (! is_array($rates)) {
                return [];
            }

            return array_values(array_map(function ($item) {
                $code = strtoupper((string) ($item['courier_code'] ?? ''));
                $serviceCode = strtoupper((string) ($item['service_code'] ?? ''));
                $courierName = (string) ($item['courier_name'] ?? $code);
                $serviceName = (string) ($item['service_name'] ?? $serviceCode);
                $cost = (int) ($item['price'] ?? 0);
                $image = (string) ($item['courier_image'] ?? '');

                return [
                    'service' => $code,
                    'name' => "{$courierName} - {$serviceName} ({$serviceCode})",
                    'code' => $serviceCode,
                    'type' => $item['service_type'] ?? $serviceName,
                    'price' => $cost,
                    'cost' => $cost,
                    'price_formatted' => number_format($cost, 0, ',', '.'),
                    'etd' => (string) ($item['etd'] ?? ''),
                    'insurance' => '0',
                    'logo' => $image,
                    'courier_logo' => $image,
                ];
            }, $rates));
        } catch (\Throwable $e) {
            Log::error('KurirAPIService getShippingRates error: '.$e->getMessage());

            return [];
        }
    }

    public function createShippingOrder(
        string $quoteId,
        string $courierCode,
        string $serviceCode,
        string $recipientName,
        string $recipientPhone,
        string $recipientAddress,
        string $productName,
        float|int $productPrice,
        int $quantity = 1,
        bool $insurance = false,
        string $note = '',
        ?string $pickedUpTime = null
    ): mixed {
        $payload = [
            'quote_id' => $quoteId,
            'courier_code' => $courierCode,
            'service_code' => $serviceCode,
            'recipient_name' => $recipientName,
            'recipient_phone' => $recipientPhone,
            'recipient_address' => $recipientAddress,
            'product_name' => $productName,
            'product_price' => $productPrice,
            'quantity' => $quantity,
            'insurance' => $insurance,
            'note' => $note,
        ];

        if ($pickedUpTime) {
            $payload['picked_up_time'] = $pickedUpTime;
        }

        return $this->request()
            ->post($this->baseUrlV1.'/orders', $payload)
            ->json();
    }

    public function orderTracking(string $resi): mixed
    {
        return $this->request()
            ->get($this->baseUrlV1.'/orders/track/'.$resi)
            ->json();
    }

    /**
     * Get courier logo URL by courier/service code.
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
                return "https://kurir.api.co.id/couriers/{$targetCode}.png";
            }
        }

        return "https://kurir.api.co.id/couriers/{$clean}.png";
    }
}
