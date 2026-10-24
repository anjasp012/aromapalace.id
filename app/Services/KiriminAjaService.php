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

    public function getCities($provinceId) : Returntype {
        try {
            $res = KiriminAja::getCities($provinceId);
            return ($res->status && is_array($res->data)) ? $res->data : [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getCities error: ' . $e->getMessage());
            return [];
        }
    }

    public function getDistricts($cityId) : Returntype {
        try {
            $res = KiriminAja::getDistricts($cityId);
            return ($res->status && is_array($res->data)) ? $res->data : [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getDistricts error: ' . $e->getMessage());
            return [];
        }
    }

    public function getSubDistricts($districtId) : Returntype {
        try {
            $res = KiriminAja::getSubDistricts($districtId);
            return ($res->status && is_array($res->data)) ? $res->data : [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getSubDistricts error: ' . $e->getMessage());
            return [];
        }
    }
}
