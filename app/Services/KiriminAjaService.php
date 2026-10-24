<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\UserAddress;
use Exception;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use KiriminAja\Base\Config\KiriminAjaConfig;
use KiriminAja\Models\ShippingFullPriceData;
use KiriminAja\Services\KiriminAja;

class KiriminAjaService
{
    protected string $mode;
    protected ?string $baseUrl;
    protected string $apiKey;
    protected int $origin;

    public function __construct()
    {
        $this->mode = (string) Setting::get('kiriminaja_mode');
        $this->apiKey = (string) Setting::get('kiriminaja_api_key');
        $this->origin = (int) Setting::get('shipping_district_id'); // ID Kecamatan Asal Pengiriman dari Database

        // Inisialisasi konfigurasi SDK KiriminAja
        try {
            KiriminAjaConfig::setMode($this->mode);
            if (!empty($this->apiKey)) {
                KiriminAjaConfig::setApiTokenKey($this->apiKey);
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAjaConfig initialization note: ' . $e->getMessage());
        }
    }

    public function getProvinces(): array
    {
        try {
            $res = KiriminAja::getProvince();
            return ($res->status && is_array($res->data)) ? $res->data : [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getProvince error: ' . $e->getMessage());
            return [];
        }
    }

    public function getCities(int $provinceId): array
    {
        try {
            $res = KiriminAja::getCity($provinceId);
            if ($res->status && is_array($res->data)) {
                $items = $res->data['datas'] ?? ($res->data['results'] ?? $res->data);
                return is_array($items) ? $items : [];
            }
            return [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getCities error: ' . $e->getMessage());
            return [];
        }
    }

    public function getDistricts(int $cityId): array
    {
        try {
            $res = KiriminAja::getDistrict($cityId);
            if ($res->status && is_array($res->data)) {
                $items = $res->data['datas'] ?? ($res->data['results'] ?? $res->data);
                return is_array($items) ? $items : [];
            }
            return [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getDistricts error: ' . $e->getMessage());
            return [];
        }
    }

    public function getSubDistricts(int $districtId): array
    {
        try {
            $res = KiriminAja::getSubDistrict($districtId);
            if ($res->status && is_array($res->data)) {
                $items = $res->data['results'] ?? ($res->data['datas'] ?? $res->data);
                return is_array($items) ? $items : [];
            }
            return [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getSubDistricts error: ' . $e->getMessage());
            return [];
        }
    }

    public function getAllCouriers(int $subDistrictId, int $weight = 1000)
    {
        $data = new ShippingFullPriceData();
        $data->origin = $this->origin; // Ambil origin dari database settings (shipping_district_id)
        $data->destination = $subDistrictId;
        $data->weight = max(100, $weight);

        $pricess = KiriminAja::fullShippingPrice($data);
        dd($pricess);
    }
}
