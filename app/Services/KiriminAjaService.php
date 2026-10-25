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
                    'code' => (int) $arr['code'],
                    'name' => $arr['name'],
                    'region' => $arr['region'],
                    'type' => $arr['type'],
                ];
            }, $raw));
            return $items;
        }
        return [];
    }

    public function getShippingPrices($destination, $origin, $weight){
        $activeCouriers = $this->getActiveCouriers();
        dd($activeCouriers);
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
        dd($expressCouriers, $instantCouriers);
    }
}
