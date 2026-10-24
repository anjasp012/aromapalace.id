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
        $res = KiriminAja::getProvince();

        $vpsIpv4 = null;
        $vpsDualStack = null;
        try {
            $vpsIpv4 = Http::timeout(3)->get('https://api.ipify.org')->body();
        } catch (\Throwable $e) {}

        try {
            $vpsDualStack = Http::timeout(3)->get('https://api64.ipify.org')->body();
        } catch (\Throwable $e) {}

        dd([
            'response' => $res,
            'api_key_filled' => !empty($this->apiKey),
            'mode' => $this->mode,
            'baseUrl' => $this->baseUrl,
            'vps_ipv4_only' => $vpsIpv4,
            'vps_default_ip_used' => $vpsDualStack,
            'is_using_ipv6' => str_contains($vpsDualStack ?? '', ':'),
        ]);

        try {
            return ($res->status && is_array($res->data)) ? $res->data : [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getProvince error: ' . $e->getMessage());
            return [];
        }
    }

}
