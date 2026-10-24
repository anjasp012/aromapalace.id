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
])->withHeaders([
          'Authorization' => 'Bearer v4.local.4SJhuA3f8eNSoRjtlkJRMcGpjEELOLzSIWl8HaJ7vnYVVHUe8-NHIU-gEE7BiowIF6GYKQP_FBodo0rJw1eNXa9DvDA0xNs-RzVZN8JarOkS3ZROhXYezDbTgRQknMnNyna9E8hXdagBB6gz6MsWj9OAeKaVIzYiARCbfPQs'
        ])
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
