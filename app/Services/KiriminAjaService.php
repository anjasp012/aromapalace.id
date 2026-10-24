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
use KiriminAja\Services\KiriminAja;

class KiriminAjaService
{

    
    public function getProvinces(): array
    {
        $response = Http::withOptions([
    'curl' => [
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    ],
])->withToken(config('services.kiriminaja.token'))
  ->post('https://tdev.kiriminaja.com/api/mitra/province');

dd([
    'status' => $response->status(),
    'body' => $response->json(),
]);
        try {
            $res = KiriminAja::getProvince();
            return ($res->status && is_array($res->data)) ? $res->data : [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getProvince error: ' . $e->getMessage());
            return [];
        }
    }

}
