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

        $vpsIp = null;
        try {
            $vpsIp = Http::timeout(3)->get('https://api.ipify.org')->body();
        } catch (\Throwable $e) {
            $vpsIp = $e->getMessage();
        }

        dd([
            'response' => $res,
            'api_key_filled' => !empty($this->apiKey),
            'api_key_preview' => !empty($this->apiKey) ? substr($this->apiKey, 0, 12) . '...' : '(KOSONG DI VPS)',
            'mode' => $this->mode,
            'baseUrl' => $this->baseUrl,
            'vps_outbound_ip' => $vpsIp,
            'catatan' => 'Jika api_key_preview KOSONG, isi di CMS Settings atau .env VPS. Jika api_key sudah ada tapi response 401, daftarkan vps_outbound_ip ke IP Whitelist Dashboard KiriminAja.',
        ]);

        try {
            return ($res->status && is_array($res->data)) ? $res->data : [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getProvince error: ' . $e->getMessage());
            return [];
        }
    }

}
