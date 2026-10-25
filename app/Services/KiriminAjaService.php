<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\UserAddress;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class KiriminAjaService
{
    protected string $mode;

    protected string $apiKey;

    protected string $baseUrl;

    protected string $pin;

    protected string $storeName;

    protected string $senderName;
    
    protected string $senderPhone;
 
    protected int $senderProvinceId;

    protected int $senderCityId;

    protected int $senderDistrictId;

    protected int $senderSubdistrictId;

    protected string $senderAddress;

    protected int $senderZipcode;

    protected ?string $senderLatitude;

    protected ?string $senderLongitude;

    protected string $prefix;

    public function __construct()
    {
        $this->mode = (string) Setting::get('kiriminaja_mode', 'staging');
        $this->apiKey = (string) Setting::get('kiriminaja_api_key', '');
        $this->baseUrl = $this->mode === 'production' ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com';
        $this->pin = trim((string) Setting::get('kiriminaja_pin', '123456'));
        $this->storeName = (string) Setting::get('store_name', 'Aroma Palace Official');
        $this->senderName = (string) Setting::get('shipping_sender_name', 'Aroma Palace Official');
        $this->senderPhone = (string) Setting::get('shipping_sender_phone');
        $this->senderProvinceId = (int) Setting::get('shipping_province_id');
        $this->senderCityId = (int) Setting::get('shipping_city_id');
        $this->senderDistrictId = (int) Setting::get('shipping_district_id'); //origin
        $this->senderSubdistrictId = (int) Setting::get('shipping_subdistrict_id');
        $this->senderAddress = (string) Setting::get('shipping_address');
        $this->senderZipcode = (int) Setting::get('shipping_postal_code');
        $this->senderLatitude = (float) Setting::get('shipping_latitude');
        $this->senderLongitude = (float) Setting::get('shipping_longitude');
        $this->prefix = strtoupper(trim((string) Setting::get('kiriminaja_prefix')));
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
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/province');

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
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/city/', [
            'provinsi_id' => $province_id
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
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/kecamatan/', [
            'kabupaten_id' => $city_id
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
                    'postal_code' => $arr['postal_code']
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
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/kelurahan/', [
            'kecamatan_id' => $district_id
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
                    'postal_code' => $arr['postal_code']
                ];
            }, $raw));
            Cache::put('kiriminaja:subdistricts:'.$district_id, $items, now()->addDays(30));
            return $items;
        }

        return [];
    }

    public function getActiveCouriers() {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/couriers');
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

    public function shippingPriceExpresss($destination, $weight, $services = []) {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/v6.1/shipping_price', [
            'service' => $services,
            'origin' => $this->senderDistrictId,
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
    public function shippingPriceInstants($destination, $weight, $services = []) {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/v4/instant/pricing', [
            'services' => $services,
            'origin' => $this->senderDistrictId,
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


    public function getShippingPrices($destination, $weight){
        $activeCouriers = $this->getActiveCouriers();
        $shippingPrices = [];
        $expressCouriers = [];
        $instantCouriers = [];
        foreach ($activeCouriers as $courier) {
            if($courier['type'] == 'Express'){
                $expressCouriers[] = [
                    'code' => $courier['code'],
                    'name' => $courier['name'],
                ];
                continue;
            }
            if($courier['type'] == 'Instant'){
                $instantCouriers[] = [
                    'code' => $courier['code'],
                    'name' => $courier['name'],
                ];
                continue;
            }
        }
        $shippingPriceExpresss = $this->shippingPriceExpresss($destination, $weight, $expressCouriers);
        $shippingPriceInstants = $this->shippingPriceInstants($destination, $weight, $instantCouriers);
        return $shippingPriceExpresss;
    }

    public function getPickupSchedules() {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/v2/schedules');
        $json = $response->json();
        $raw = $json['data'] ?? ($json['datas'] ?? ($json['schedules'] ?? []));
        if (is_array($raw) && ! empty($raw)) {
            $items = array_values(array_map(function ($item) {
                $arr = (array) $item;
                return $arr['libur'] == false ? [
                    'clock' => $arr['clock'],
                    'until' => $arr['until']
                ] : null;
            }, $raw));
            return $items;
        }
        return [];
    }

    public function requestPickup($orderModel, $pickupSchedule) {
        $items = $orderModel->orderItems->map(function ($item) {
            return [
                'name' => $item->product_name,
                'price' => $item->price,
                'weight' => $item->volume,
                'width' => 100,
                'height' => 100,
                'length' => 100,
                'qty' => $item->quantity,
            ];
        });
        $response = Http::withHeaders([
        'Content-Type' => 'application/json',
        'Authorization' => 'Bearer ' . $this->apiKey
        ])
        ->post($this->baseUrl . '/api/mitra/v6.2/request_pickup', [
            'address' => $this->senderAddress,
            'phone' => $this->senderPhone,
            'kecamatan_id' => $this->senderDistrictId,
            'kelurahan_id' => $this->senderSubdistrictId,
            'payment_method' => 'credit',
            'pin' => $this->pin,
            'latitude' => $this->senderLatitude,
            'longitude' => $this->senderLongitude,
            'platform_name' => $this->storeName,
            'name' => $this->senderName,
            'zipcode' => $this->senderZipcode,
            'schedule' => $pickupSchedule,
            'packages' => [
                [
                    'order_id' => $orderModel->order_number,
                    'destination_name' => $orderModel->recipient_name,
                    'destination_phone' => $orderModel->recipient_phone,
                    'destination_address' => $orderModel->address,
                    'destination_kecamatan_id' => $orderModel->district_id,
                    'destination_kelurahan_id' => $orderModel->subdistrict_id,
                    'destination_zipcode' => $orderModel->postal_code,
                    'destination_latitude' => (float) $orderModel->latitude,
                    'destination_longitude' => (float) $orderModel->longitude,
                    'weight' => $orderModel->orderItems->sum('volume'),
                    'width' => 100* $orderModel->orderItems->sum('quantity'),
                    'height' => 100* $orderModel->orderItems->sum('quantity'),
                    'length' => 100* $orderModel->orderItems->sum('quantity'),
                    'qty' => $orderModel->orderItems->sum('quantity'),
                    'item_value' => $orderModel->orderItems->sum('total_price'),
                    'shipping_cost' => $orderModel->shipping_cost,
                    'service' => $orderModel->courier_service,
                    'insurance_amount' => 0,
                    'service_type' => $orderModel->courier_service_type,
                    'cod' => 0,
                    'package_type_id' => 7,
                    'item_name' => $orderModel->orderItems->first()->name,
                    'drop' => false,
                    'note' => $orderModel->note,
                    'items' => $items   
                ]
            ]
        ]);
        $json = $response->json();
        dd($json);        
    }
}
