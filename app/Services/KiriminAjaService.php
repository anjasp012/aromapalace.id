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
    protected string $mode;
    protected string $baseUrl;
    protected string $apiKey;
    protected string $senderName;
    protected string $senderPhone;
    protected string $senderAddress;
    protected int $senderCityId;
    protected string $pin;

    public function __construct()
    {
        $this->mode = (string) Setting::get('kiriminaja_mode', config('services.kiriminaja.mode', 'staging'));
        $this->baseUrl = (string) Setting::get('kiriminaja_base_url', config('services.kiriminaja.base_url', 'https://tdev.kiriminaja.com'));
        $this->apiKey = (string) Setting::get('kiriminaja_api_key', config('services.kiriminaja.api_key', ''));
        $this->senderName = (string) Setting::get('shipping_sender_name', Setting::get('store_name', 'Aroma Palace Haute Parfumerie'));
        $this->senderPhone = (string) Setting::get('shipping_sender_phone', Setting::get('store_phone', '081100001111'));
        $this->senderAddress = (string) Setting::get('shipping_address', Setting::get('store_address', 'Jl. M.H. Thamrin No. 88, Menteng, Jakarta Pusat'));
        $this->senderCityId = (int) Setting::get('shipping_district_id', 151);
        $this->pin = (string) Setting::get('kiriminaja_pin', '123456');

        // Inisialisasi konfigurasi SDK KiriminAja
        try {
            KiriminAjaConfig::setMode($this->mode);
            if (!empty($this->apiKey)) {
                KiriminAjaConfig::setApiTokenKey($this->apiKey);
            }
            if (!empty($this->baseUrl)) {
                KiriminAjaConfig::setBaseUrl($this->baseUrl);
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAjaConfig initialization note: ' . $e->getMessage());
        }
    }

    public function getProvinces(): array
    {
        // 1. Panggilan via SDK
        $sdkRes = KiriminAja::getProvince();

        // 2. Panggilan langsung via HTTP untuk membaca respon asli server KiriminAja
        $rawResBody = null;
        $rawResStatus = null;
        try {
            $raw = Http::timeout(5)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->post(rtrim($this->baseUrl, '/') . '/api/mitra/province', []);

            $rawResStatus = $raw->status();
            $rawResBody = $raw->json() ?: $raw->body();
        } catch (\Throwable $e) {
            $rawResBody = 'Curl error: ' . $e->getMessage();
        }

        // 3. Cek IP yang digunakan VPS
        $ipv4 = null;
        $ipv6or4 = null;
        try {
            $ipv4 = Http::timeout(3)->get('https://api.ipify.org')->body();
        } catch (\Throwable $e) {}

        try {
            $ipv6or4 = Http::timeout(3)->get('https://api64.ipify.org')->body();
        } catch (\Throwable $e) {}

        dd([
            'sdk_result' => $sdkRes,
            'kiriminaja_raw_status' => $rawResStatus,
            'kiriminaja_raw_response' => $rawResBody,
            'vps_ipv4' => $ipv4,
            'vps_default_ip' => $ipv6or4,
            'apakah_vps_default_ipv6' => str_contains($ipv6or4 ?? '', ':'),
            'api_key_digunakan' => substr($this->apiKey, 0, 15) . '...',
            'base_url' => $this->baseUrl,
        ]);

        try {
            return ($res->status && is_array($res->data)) ? $res->data : [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getProvince error: ' . $e->getMessage());
            return [];
        }
    }

}
