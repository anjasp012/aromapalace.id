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
        $this->senderPhone = $this->formatPhoneNumber((string) Setting::get('shipping_sender_phone', Setting::get('store_phone', '081288889999')));
        $this->senderAddress = (string) Setting::get('shipping_address', Setting::get('store_address', 'Jl. Kemang Raya No. 10, Jakarta Selatan'));
        $this->senderZipcode = (string) Setting::get('shipping_postal_code', '12130');
        $this->prefix = strtoupper(trim((string) Setting::get('kiriminaja_prefix', config('services.kiriminaja.order_prefix', 'ARPL'))));
        if (empty($this->prefix)) {
            $this->prefix = 'ARPL';
        }
    }

    public function getProvinces()
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey
        ])->post($this->baseUrl . '/api/mitra/province');

        return $response->json();
    }
}
