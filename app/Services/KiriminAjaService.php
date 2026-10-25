<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class KiriminAjaService
{
    protected string $mode;

    protected string $apiKey;

    protected int $origin;

    protected string $baseUrl;

    protected string $pin;

    protected string $senderName;

    protected string $senderPhone;

    protected string $senderAddress;

    protected string $senderZipcode;

    protected string $prefix;

    public function __construct()
    {
        $this->mode = (string) Setting::get('kiriminaja_mode', 'staging');
        $this->apiKey = (string) Setting::get('kiriminaja_api_key', '');
        $this->origin = (int) Setting::get('shipping_district_id', 2101); // ID Kecamatan Asal Pengiriman
        $this->baseUrl = $this->mode === 'production' ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com';
        $this->pin = trim((string) Setting::get('kiriminaja_pin', '123456'));
        $this->senderName = (string) Setting::get('shipping_sender_name', Setting::get('store_name', 'Aroma Palace Official'));
        $this->senderPhone = (string) Setting::get('shipping_sender_phone', Setting::get('store_phone', '081288889999'));
        $this->senderAddress = (string) Setting::get('shipping_address', Setting::get('store_address', 'Jl. Kemang Raya No. 10, Jakarta Selatan'));
        $this->senderZipcode = (string) Setting::get('shipping_postal_code', '12130');
        $this->prefix = strtoupper(trim((string) Setting::get('kiriminaja_prefix', config('services.kiriminaja.order_prefix', 'ARPL'))));
        if (empty($this->prefix)) {
            $this->prefix = 'ARPL';
        }
    }

    public function getProvinces()
    {
        $cached = Cache::get('kiriminaja:provinces');
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->post($this->baseUrl.'/api/mitra/province');

        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['results'] ?? []));

        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;
                $name = (string) ($arr['provinsi_name'] ?? ($arr['name'] ?? ''));

                return [
                    'id' => (int) $arr['id'],
                    'name' => $name,
                    'provinsi_name' => $name,
                ];
            }, $raw));
            Cache::put('kiriminaja:provinces', $items, now()->addDays(30));

            return $items;
        }

        return [];
    }

    public function getCities($province_id)
    {
        $cached = Cache::get('kiriminaja:cities:'.$province_id);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->post($this->baseUrl.'/api/mitra/city/', [
            'provinsi_id' => $province_id,
        ]);

        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['results'] ?? []));

        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;
                $name = (string) ($arr['kabupaten_name'] ?? ($arr['name'] ?? ''));

                return [
                    'id' => (int) $arr['id'],
                    'name' => $name,
                    'kabupaten_name' => $name,
                    'type' => $arr['type'],
                    'postal_code' => $arr['postal_code'],
                ];
            }, $raw));
            Cache::put('kiriminaja:cities:'.$province_id, $items, now()->addDays(30));

            return $items;
        }

        return [];
    }

    public function getDistricts($city_id)
    {
        $cached = Cache::get('kiriminaja:districts:'.$city_id);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->post($this->baseUrl.'/api/mitra/kecamatan/', [
            'kabupaten_id' => $city_id,
        ]);

        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['results'] ?? []));

        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;
                $name = (string) ($arr['kecamatan_name'] ?? ($arr['name'] ?? ''));

                return [
                    'id' => (int) $arr['id'],
                    'name' => $name,
                    'kecamatan_name' => $name,
                    'postal_code' => $arr['postal_code'],
                ];
            }, $raw));
            Cache::put('kiriminaja:districts:'.$city_id, $items, now()->addDays(30));

            return $items;
        }

        return [];
    }

    public function getSubDistricts($district_id)
    {
        $cached = Cache::get('kiriminaja:subdistricts:'.$district_id);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->post($this->baseUrl.'/api/mitra/kelurahan/', [
            'kecamatan_id' => $district_id,
        ]);

        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['results'] ?? []));

        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;
                $name = (string) ($arr['kelurahan_name'] ?? ($arr['name'] ?? ''));

                return [
                    'id' => (int) $arr['id'],
                    'name' => $name,
                    'kelurahan_name' => $name,
                    'postal_code' => $arr['postal_code'],
                ];
            }, $raw));
            Cache::put('kiriminaja:subdistricts:'.$district_id, $items, now()->addDays(30));

            return $items;
        }

        return [];
    }

    public function getActiveCouriers()
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->post($this->baseUrl.'/api/mitra/couriers');
        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['results'] ?? []));
        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;

                return [
                    'code' => $arr['code'],
                    'name' => $arr['name'],
                    'region' => $arr['region'],
                    'type' => $arr['type'],
                ];
            }, $raw));

            return $items;
        }

        return [];
    }

    public function shippingPriceExpresss($destination, $origin, $weight, $services = [])
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->post($this->baseUrl.'/api/mitra/v6.1/shipping_price', [
            'service' => $services,
            'origin' => $origin,
            'destination' => $destination,
            'weight' => $weight,
        ]);
        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['results'] ?? []));
        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;

                return [
                    'service' => strtoupper($arr['service']),
                    'name' => $arr['service_name'],
                    'code' => $arr['service_type'],
                    'price' => $arr['cost'],
                    'price_formatted' => number_format($arr['cost'], 0, ',', '.'),
                    'etd' => $arr['etd'],
                    'insurance' => number_format($arr['insurance'], 0, ',', '.'),
                ];
            }, $raw));

            return $items;
        }

        return [];
    }

    public function shippingPriceInstants($destination, $origin, $weight, $services = [])
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->post($this->baseUrl.'/api/mitra/v4/instant/pricing', [
            'services' => $services,
            'origin' => $origin,
            'destination' => $destination,
            'weight' => $weight,
        ]);
        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['results'] ?? []));
        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;

                return [
                    'name' => $arr['name'],
                    'etd' => $arr['costs']['estimation'],
                    'cost' => $arr['costs']['price']['total_price'],
                ];
            }, $raw));

            return $items;
        }

        return [];
    }

    public function getShippingPrices($destination, $origin, $weight)
    {
        $activeCouriers = $this->getActiveCouriers();
        $shippingPrices = [];
        $expressCouriers = [];
        $instantCouriers = [];
        foreach ($activeCouriers as $courier) {
            if ($courier['type'] == 'Express') {
                $expressCouriers[] = [
                    'code' => $courier['code'],
                    'name' => $courier['name'],
                ];

                continue;
            }
            if ($courier['type'] == 'Instant') {
                $instantCouriers[] = [
                    'code' => $courier['code'],
                    'name' => $courier['name'],
                ];

                continue;
            }
        }
        $shippingPriceExpresss = $this->shippingPriceExpresss($destination, $origin, $weight, $expressCouriers);
        $shippingPriceInstants = $this->shippingPriceInstants($destination, $origin, $weight, $instantCouriers);

        return $shippingPriceExpresss;
    }

    public function getPickupSchedules()
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->post($this->baseUrl.'/api/mitra/v2/schedules');
        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['schedules'] ?? []));
        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;

                return $arr['libur'] == false ? [
                    'clock' => $arr['clock'],
                    'until' => $arr['until'],
                ] : null;
            }, $raw));

            return $items;
        }

        return [];
    }

    public function requestPickup($orderModel, $pickupSchedule)
    {

        dd($orderModel, $pickupSchedule);
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer '.$this->apiKey,
        ])
            ->post($this->baseUrl.'/api/mitra/v6.2/request_pickup', [
                'address' => $orderModel->address,
                'phone' => $orderModel->recipient_phone,
                'kecamatan_id' => $orderModel->district_id,
                'kelurahan_id' => $orderModel->subdistrict_id,
                'payment_method' => 'credit',
                'pin' => '123456',
                'latitude' => $orderModel->latitude,
                'longitude' => $orderModel->longitude,
                'platform_name' => 'Aroma Palace',
                'name' => $orderModel->recipient_name,
                'zipcode' => $orderModel->postal_code,
                'schedule' => $pickupSchedule,
                'packages' => [
                    [
                        'order_id' => 'DEVX-0000000000001',
                        'destination_name' => 'PENERIMA TESTING',
                        'destination_phone' => '6282200000000',
                        'destination_address' => 'Jl. Danau Ranau, Sawojajar, Kota Malang, Jawa Timur 65139',
                        'destination_kecamatan_id' => 3635,
                        'destination_kelurahan_id' => 46740,
                        'destination_zipcode' => '65139',
                        'destination_latitude' => -7.976862,
                        'destination_longitude' => 112.6564411,
                        'weight' => 1000,
                        'width' => 10,
                        'height' => 10,
                        'length' => 10,
                        'qty' => 1,
                        'item_value' => 100000,
                        'shipping_cost' => 16000,
                        'service' => 'jnt',
                        'insurance_amount' => 0,
                        'service_type' => 'EZ',
                        'cod' => 0,
                        'package_type_id' => 7,
                        'item_name' => 'iPhone 17 Pro Max 2TB',
                        'drop' => false,
                        'note' => 'iPhone Sangar',
                        'items' => [
                            [
                                'name' => 'iPhone 17 Pro Max 2TB',
                                'price' => 1000000,
                                'weight' => 1000,
                                'width' => 10,
                                'height' => 10,
                                'length' => 10,
                                'qty' => 1,
                                'metadata' => [
                                    'sku' => '2531030304',
                                    'variant_label' => '2TB',
                                ],
                            ],
                        ],
                    ],
                ],
            ]);
    }
}
