<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\UserAddress;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use KiriminAja\Base\Config\Cache\Mode;
use KiriminAja\Base\Config\KiriminAjaConfig;
use KiriminAja\Models\PackageData;
use KiriminAja\Models\RequestPickupData;
use KiriminAja\Models\ShippingFullPriceData;
use KiriminAja\Services\KiriminAja;

class KiriminAjaService
{
    public function __construct()
    {
        $this->applyConfig($this->getApiKey(), $this->getMode());
    }

    /**
     * Apply configuration into the official KiriminAja SDK singleton.
     */
    protected function applyConfig(?string $apiKey = null, ?string $mode = null): void
    {
        $activeMode = $mode ?: $this->getMode();
        $rawToken = $apiKey !== null && trim($apiKey) !== '' ? $apiKey : $this->getApiKey();
        $token = trim(trim($rawToken), "\"'");

        KiriminAjaConfig::setMode($activeMode === 'production' ? Mode::Production : Mode::Staging);
        KiriminAjaConfig::setApiTokenKey($token);

        $baseUrl = $this->getBaseUrl($activeMode);
        if (! empty($baseUrl)) {
            KiriminAjaConfig::setBaseUrl($baseUrl);
        }
    }

    /**
     * Extract array list from KiriminAja SDK response data.
     */
    protected function extractDataItems(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        if (isset($raw['datas']) && is_array($raw['datas'])) {
            return $raw['datas'];
        }
        if (isset($raw['results']) && is_array($raw['results'])) {
            return $raw['results'];
        }
        if (isset($raw['schedules']) && is_array($raw['schedules'])) {
            return $raw['schedules'];
        }
        if (array_is_list($raw) || isset($raw[0])) {
            return $raw;
        }

        return [];
    }

    /**
     * Get active KiriminAja API key from Setting (database) or config fallback.
     */
    public function getApiKey(): string
    {
        $dbKey = Setting::get('kiriminaja_api_key');
        if (! empty($dbKey)) {
            return trim((string) $dbKey);
        }

        return trim((string) config('services.kiriminaja.api_key', ''));
    }

    /**
     * Get active KiriminAja mode ('staging' or 'production').
     */
    public function getMode(): string
    {
        $dbMode = Setting::get('kiriminaja_mode');
        if (! empty($dbMode)) {
            return (string) $dbMode;
        }

        return (string) config('services.kiriminaja.mode', 'staging');
    }

    /**
     * Get active KiriminAja base URL.
     */
    public function getBaseUrl(?string $mode = null): string
    {
        $customBaseUrl = config('services.kiriminaja.base_url');
        if (! empty($customBaseUrl)) {
            return rtrim((string) $customBaseUrl, '/');
        }

        $activeMode = $mode ?: $this->getMode();

        return $activeMode === 'production'
            ? 'https://client.kiriminaja.com'
            : 'https://tdev.kiriminaja.com';
    }

    /**
     * Get registered KiriminAja order prefix.
     */
    public function getPrefix(): string
    {
        $dbPrefix = Setting::get('kiriminaja_prefix');
        if (! empty($dbPrefix)) {
            return strtoupper(trim((string) $dbPrefix));
        }

        $configPrefix = config('services.kiriminaja.prefix', 'ARPL');

        return strtoupper(trim((string) $configPrefix)) ?: 'ARPL';
    }

    /**
     * Test API connection and authorization to KiriminAja via official SDK.
     *
     * @return array{success: bool, mode: string, message: string, token_preview: string, details?: mixed}
     */
    public function testConnection(?string $apiKey = null, ?string $mode = null): array
    {
        $activeMode = $mode ?: $this->getMode();
        $token = $apiKey !== null ? trim(trim($apiKey), "\"'") : $this->getApiKey();
        $tokenPreview = strlen($token) > 10 ? substr($token, 0, 8).'...'.substr($token, -6) : '(kosong)';

        if (empty($token)) {
            return [
                'success' => false,
                'mode' => $activeMode,
                'message' => 'API Key belum diisi. Harap masukkan API Key KiriminAja.',
                'token_preview' => $tokenPreview,
            ];
        }

        if ($activeMode === 'production' && str_starts_with($token, 'v4.local.')) {
            return [
                'success' => false,
                'mode' => $activeMode,
                'message' => 'Token "v4.local..." adalah token Staging (Sandbox). Token ini tidak dapat digunakan di Mode Production (Live). Harap masukkan API Key Production Anda dari dashboard KiriminAja atau ubah Mode ke Staging.',
                'token_preview' => $tokenPreview,
            ];
        }

        try {
            $this->applyConfig($token, $activeMode);

            $data = new ShippingFullPriceData;
            $data->origin = 1;
            $data->destination = 2;
            $data->weight = 1000;

            $response = KiriminAja::fullShippingPrice($data);

            if ($response && ($response->status ?? false)) {
                return [
                    'success' => true,
                    'mode' => $activeMode,
                    'message' => 'Koneksi ke KiriminAja ('.ucfirst($activeMode).') via SDK berhasil & terautentikasi.',
                    'token_preview' => $tokenPreview,
                    'details' => (array) ($response->data ?? []),
                ];
            }

            $rawText = (string) ($response->message ?? ($response->text ?? ''));

            if (str_contains(strtolower($rawText), '401') || str_contains(strtolower($rawText), 'unauthorized')) {
                return [
                    'success' => false,
                    'mode' => $activeMode,
                    'message' => "401 Unauthorized: API Key ditolak oleh server KiriminAja ({$activeMode}). Penyebab umum: (1) Token salah atau tidak cocok dengan Mode {$activeMode}, atau (2) IP koneksi Anda belum didaftarkan di whitelist dashboard KiriminAja.",
                    'token_preview' => $tokenPreview,
                ];
            }

            return [
                'success' => false,
                'mode' => $activeMode,
                'message' => 'KiriminAja merespons: '.($rawText ?: 'Gagal menghubungi service KiriminAja.'),
                'token_preview' => $tokenPreview,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'mode' => $activeMode,
                'message' => 'Gagal menghubungi server KiriminAja: '.$e->getMessage(),
                'token_preview' => $tokenPreview,
            ];
        }
    }

    /**
     * Get list of provinces directly from KiriminAja SDK.
     *
     * @return array<int, array{id: int, name: string}>
     */
    public function getProvinces(): array
    {
        $cacheKey = 'kiriminaja:provinces:sdk_live';
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $this->applyConfig();
            $response = KiriminAja::getProvince();
            dd($response);

            if ($response && ($response->status ?? false) && ! empty($response->data)) {
                $items = $this->extractDataItems($response->data);

                if (! empty($items)) {
                    $result = array_values(array_map(function ($item) {
                        $arr = (array) $item;

                        return [
                            'id' => (int) ($arr['id'] ?? $arr['provinsi_id'] ?? 0),
                            'name' => (string) ($arr['provinsi_name'] ?? $arr['name'] ?? ''),
                        ];
                    }, $items));

                    Cache::put($cacheKey, $result, now()->addDays(7));

                    return $result;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getProvince error: '.$e->getMessage());
        }

        return [];
    }

    /**
     * Get list of cities by province ID directly from KiriminAja SDK.
     *
     * @return array<int, array{id: int, province_id: int, name: string, type: string, postal_code: string}>
     */
    public function getCities(int $provinceId): array
    {
        $cacheKey = "kiriminaja:cities:prov_{$provinceId}:sdk_live";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $this->applyConfig();
            $response = KiriminAja::getCity($provinceId);

            if ($response && ($response->status ?? false) && ! empty($response->data)) {
                $items = $this->extractDataItems($response->data);

                if (! empty($items)) {
                    $result = array_values(array_map(function ($item) use ($provinceId) {
                        $arr = (array) $item;

                        return [
                            'id' => (int) ($arr['id'] ?? $arr['kabupaten_id'] ?? 0),
                            'province_id' => (int) ($arr['provinsi_id'] ?? $provinceId),
                            'name' => (string) ($arr['kabupaten_name'] ?? $arr['name'] ?? ''),
                            'type' => (string) ($arr['type'] ?? 'Kota/Kabupaten'),
                            'postal_code' => (string) ($arr['postal_code'] ?? ''),
                        ];
                    }, $items));

                    Cache::put($cacheKey, $result, now()->addDays(7));

                    return $result;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("KiriminAja getCity({$provinceId}) error: ".$e->getMessage());
        }

        return [];
    }

    /**
     * Get list of districts (kecamatan) by city ID directly from KiriminAja SDK.
     *
     * @return array<int, array{id: int, city_id: int, name: string, postal_code: string}>
     */
    public function getDistricts(int $cityId): array
    {
        $cacheKey = "kiriminaja:districts:city_{$cityId}:sdk_live";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $this->applyConfig();
            $response = KiriminAja::getDistrict($cityId);

            if ($response && ($response->status ?? false) && ! empty($response->data)) {
                $items = $this->extractDataItems($response->data);

                if (! empty($items)) {
                    $result = array_values(array_map(function ($item) use ($cityId) {
                        $arr = (array) $item;

                        return [
                            'id' => (int) ($arr['id'] ?? $arr['kecamatan_id'] ?? 0),
                            'city_id' => (int) ($arr['kabupaten_id'] ?? $cityId),
                            'name' => (string) ($arr['kecamatan_name'] ?? $arr['name'] ?? ''),
                            'postal_code' => (string) ($arr['postal_code'] ?? ''),
                        ];
                    }, $items));

                    Cache::put($cacheKey, $result, now()->addDays(7));

                    return $result;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("KiriminAja getDistrict({$cityId}) error: ".$e->getMessage());
        }

        return [];
    }

    /**
     * Get list of subdistricts (kelurahan) by district ID directly from KiriminAja SDK.
     *
     * @return array<int, array{id: int, district_id: int, name: string, postal_code: string}>
     */
    public function getSubdistricts(int $districtId): array
    {
        $cacheKey = "kiriminaja:subdistricts:district_{$districtId}:sdk_live";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $this->applyConfig();
            $response = KiriminAja::getSubDistrict($districtId);

            if ($response && ($response->status ?? false) && ! empty($response->data)) {
                $items = $this->extractDataItems($response->data);

                if (! empty($items)) {
                    $result = array_values(array_map(function ($item) use ($districtId) {
                        $arr = (array) $item;

                        return [
                            'id' => (int) ($arr['id'] ?? $arr['kelurahan_id'] ?? 0),
                            'district_id' => (int) ($arr['kecamatan_id'] ?? $districtId),
                            'name' => (string) ($arr['kelurahan_name'] ?? $arr['name'] ?? ''),
                            'postal_code' => (string) ($arr['postal_code'] ?? ''),
                        ];
                    }, $items));

                    Cache::put($cacheKey, $result, now()->addDays(7));

                    return $result;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("KiriminAja getSubDistrict({$districtId}) error: ".$e->getMessage());
        }

        return [];
    }

    /**
     * Get list of available domestic couriers directly from KiriminAja SDK.
     *
     * @return array<int, array{code: string, name: string, region: string, type: string}>
     */
    public function getCouriers(): array
    {
        $cacheKey = 'kiriminaja:couriers:sdk_live';
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $this->applyConfig();
            $response = KiriminAja::getCouriers();

            if ($response && ($response->status ?? false) && ! empty($response->data)) {
                $items = $this->extractDataItems($response->data);

                $domestic = array_values(array_filter($items, function ($item) {
                    $arr = (array) $item;

                    return ($arr['region'] ?? '') === 'DOMESTIC';
                }));

                $result = array_values(array_map(function ($item) {
                    $arr = (array) $item;

                    return [
                        'code' => (string) ($arr['code'] ?? ''),
                        'name' => (string) ($arr['name'] ?? ''),
                        'region' => (string) ($arr['region'] ?? 'DOMESTIC'),
                        'type' => (string) ($arr['type'] ?? 'Express'),
                    ];
                }, $domestic));

                if (! empty($result)) {
                    Cache::put($cacheKey, $result, now()->addDay());

                    return $result;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getCouriers error: '.$e->getMessage());
        }

        return [];
    }

    /**
     * Get shipping rates for one or more couriers between two districts directly from KiriminAja SDK.
     *
     * @param  int  $originDistrictId  Origin kecamatan ID
     * @param  int  $destinationDistrictId  Destination kecamatan ID
     * @param  int  $weightGrams  Package weight in grams
     * @param  string[]|null  $couriers  Optional specific courier codes to query
     * @return array<int, array{code: string, courier_code: string, name: string, service: string, price: int, price_formatted: string, etd: string}>
     */
    public function getShippingRates(int $originDistrictId, int $destinationDistrictId, int $weightGrams = 500, ?array $couriers = null): array
    {
        $cacheKey = "kiriminaja:rates:o{$originDistrictId}:d{$destinationDistrictId}:w{$weightGrams}:sdk_live";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            if ($couriers !== null && ! empty($couriers)) {
                $courierLower = array_map('strtolower', $couriers);

                return array_values(array_filter($cached, fn ($r) => in_array($r['courier_code'], $courierLower)));
            }

            return $cached;
        }

        $brandMap = [
            'jne' => 'JNE',
            'jnt' => 'J&T',
            'jtcargo' => 'J&T Cargo',
            'sicepat' => 'SiCepat',
            'anteraja' => 'AnterAja',
            'lion' => 'Lion Parcel',
            'tiki' => 'Tiki',
            'sap' => 'SAP',
            'idx' => 'ID Express',
            'spx' => 'SPX',
            'ninja' => 'Ninja Express',
            'pos' => 'Pos Indonesia',
            'posindonesia' => 'Pos Indonesia',
        ];

        try {
            $this->applyConfig();

            $data = new ShippingFullPriceData;
            $data->origin = $originDistrictId;
            $data->destination = $destinationDistrictId;
            $data->weight = max(100, $weightGrams);

            $response = KiriminAja::fullShippingPrice($data);

            if ($response && ($response->status ?? false) && ! empty($response->data)) {
                $raw = (array) $response->data;
                $items = $raw['results'] ?? $raw['datas'] ?? (isset($raw[0]) ? $raw : []);

                $results = [];
                foreach ($items as $item) {
                    $arr = (array) $item;
                    $courierCode = strtolower((string) ($arr['service'] ?? $arr['courier_code'] ?? $arr['code'] ?? ''));
                    $serviceType = (string) ($arr['service_type'] ?? $arr['service_code'] ?? $arr['group'] ?? 'Regular');
                    $serviceName = (string) ($arr['service_name'] ?? $serviceType);
                    $price = (int) ($arr['cost'] ?? $arr['price'] ?? $arr['finalRate'] ?? 0);
                    $rawEtd = trim((string) ($arr['etd'] ?? $arr['estimated_day'] ?? ''));
                    $etd = ! empty($rawEtd) ? "Estimasi {$rawEtd} Hari" : 'Estimasi 1-3 Hari';

                    $brand = $brandMap[$courierCode] ?? strtoupper($courierCode);
                    $displayName = $serviceName;
                    if (! empty($brand) && ! str_starts_with(strtolower($displayName), strtolower(explode(' ', $brand)[0]))) {
                        $displayName = $brand.' '.$serviceName;
                    }

                    $code = strtolower($courierCode.'_'.preg_replace('/[^a-zA-Z0-9]/', '', $serviceType ?: $serviceName));

                    $results[] = [
                        'code' => $code,
                        'courier_code' => $courierCode,
                        'name' => $displayName,
                        'service' => $serviceType,
                        'price' => $price,
                        'price_formatted' => $price === 0 ? 'Gratis' : 'Rp '.number_format($price, 0, ',', '.'),
                        'etd' => $etd,
                    ];
                }

                if (! empty($results)) {
                    usort($results, fn ($a, $b) => $a['price'] <=> $b['price']);
                    Cache::put($cacheKey, $results, now()->addHours(2));

                    if ($couriers !== null && ! empty($couriers)) {
                        $courierLower = array_map('strtolower', $couriers);

                        return array_values(array_filter($results, fn ($r) => in_array($r['courier_code'], $courierLower)));
                    }

                    return $results;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAja fullShippingPrice failed: '.$e->getMessage());
        }

        return [];
    }

    /**
     * Fallback shipping rates proxy (returns empty array).
     *
     * @return array<int, mixed>
     */
    public function fallbackShippingRates(): array
    {
        return [];
    }

    /**
     * Request pickup and obtain automatic AWB / tracking number from KiriminAja via SDK.
     *
     * @return array{success: bool, tracking_number: string, courier: string, source: string, message: string}
     */
    public function requestPickupForOrder(Order $order): array
    {
        $prefix = $this->getPrefix();

        $rawNumber = (string) $order->order_number;
        $cleanNumber = preg_replace('/^(?:'.preg_quote($prefix, '/').'|AP)[-_]?/i', '', $rawNumber);
        $cleanNumber = preg_replace('/[^0-9A-Za-z_-]/', '', (string) $cleanNumber);
        if (empty($cleanNumber)) {
            $cleanNumber = date('Ymd').'-'.substr(str_shuffle('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 5);
        }
        $orderIdForKiriminAja = substr($prefix.'-'.$cleanNumber, 0, 20);

        // Courier & service mapping
        $courierRaw = strtolower((string) ($order->courier ?: 'jne'));
        $courierCode = 'jne';
        $serviceType = 'REG';

        if (str_contains($courierRaw, 'jne')) {
            $courierCode = 'jne';
            $serviceType = 'REG';
        } elseif (str_contains($courierRaw, 'j&t') || str_contains($courierRaw, 'jnt')) {
            $courierCode = 'jnt';
            $serviceType = 'EZ';
        } elseif (str_contains($courierRaw, 'sicepat')) {
            $courierCode = 'sicepat';
            $serviceType = 'SIUNT';
        } elseif (str_contains($courierRaw, 'anteraja')) {
            $courierCode = 'anteraja';
            $serviceType = 'REG';
        } elseif (str_contains($courierRaw, 'lion')) {
            $courierCode = 'lion';
            $serviceType = 'REGPACK';
        } elseif (str_contains($courierRaw, 'tiki')) {
            $courierCode = 'tiki';
            $serviceType = 'REG';
        } elseif (str_contains($courierRaw, 'pos')) {
            $courierCode = 'pos';
            $serviceType = 'Pos Reguler';
        } elseif (str_contains($courierRaw, 'ninja')) {
            $courierCode = 'ninja';
            $serviceType = 'STANDARD';
        }

        // Destination district resolution
        $destinationDistrictId = null;
        if ($order->user_id) {
            $addr = UserAddress::where('user_id', $order->user_id)
                ->when($order->district_name, fn ($q) => $q->where('district_name', $order->district_name))
                ->whereNotNull('district_id')
                ->first()
                ?: UserAddress::where('user_id', $order->user_id)
                    ->whereNotNull('district_id')
                    ->first();
            if ($addr && $addr->district_id) {
                $destinationDistrictId = (int) $addr->district_id;
            }
        }
        if (! $destinationDistrictId && ! empty($order->district_name)) {
            try {
                $this->applyConfig();
                $resp = KiriminAja::getDistrictByName($order->district_name);
                if ($resp && ($resp->status ?? false) && ! empty($resp->data)) {
                    $first = is_array($resp->data) ? ($resp->data[0] ?? null) : null;
                    if ($first && ! empty($first['id'])) {
                        $destinationDistrictId = (int) $first['id'];
                    }
                }
            } catch (\Throwable) {
                // Ignore and use default
            }
        }
        if (! $destinationDistrictId) {
            $destinationDistrictId = 2101; // Default to Setiabudi, Jakarta Selatan
        }

        // Sender details
        $senderName = (string) Setting::get('shipping_sender_name', Setting::get('store_name', 'Aroma Palace Official'));
        $senderPhone = (string) Setting::get('shipping_sender_phone', Setting::get('store_phone', '081288889999'));
        $senderAddress = (string) Setting::get('shipping_address', Setting::get('store_address', 'Jl. Kemang Raya No. 10, Jakarta Selatan'));
        $originDistrictId = (int) Setting::get('shipping_district_id', config('services.kiriminaja.origin_district_id', 4712));
        $platformName = (string) Setting::get('store_name', 'Aroma Palace');

        $token = $this->getApiKey();
        $mode = $this->getMode();

        if (empty($token)) {
            return [
                'success' => false,
                'tracking_number' => '',
                'courier' => $order->courier ?: strtoupper($courierCode),
                'source' => 'kiriminaja_empty_token',
                'message' => 'API Key KiriminAja belum diatur. Silakan atur API Key di menu Pengaturan Toko.',
            ];
        }

        if ($mode === 'production' && str_starts_with($token, 'v4.local.')) {
            return [
                'success' => false,
                'tracking_number' => '',
                'courier' => $order->courier ?: strtoupper($courierCode),
                'source' => 'kiriminaja_mode_mismatch',
                'message' => 'API Key yang digunakan adalah token Staging (v4.local...), tetapi Mode sistem diatur ke Production. Harap gunakan API Key Production dari KiriminAja atau ubah Mode ke Staging.',
            ];
        }

        $this->applyConfig($token, $mode);

        // Fetch pickup schedule from SDK
        $pickupSchedule = null;
        try {
            $schedRes = KiriminAja::getSchedules();
            if ($schedRes && ($schedRes->status ?? false) && ! empty($schedRes->data)) {
                $schedules = is_array($schedRes->data) ? $schedRes->data : [];
                foreach ($schedules as $slot) {
                    $slotArr = (array) $slot;
                    if (empty($slotArr['libur']) && ! empty($slotArr['clock'])) {
                        $pickupSchedule = (string) $slotArr['clock'];
                        break;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAja schedule fetch error: '.$e->getMessage());
        }

        if (! $pickupSchedule) {
            $pickupSchedule = now()->addDay()->format('Y-m-d 14:00:00');
        }

        // Build SDK PackageData
        $pkg = new PackageData;
        $pkg->order_id = $orderIdForKiriminAja;
        $pkg->destination_name = (string) ($order->recipient_name ?: ($order->user?->name ?: 'Pelanggan'));
        $pkg->destination_phone = (string) ($order->recipient_phone ?: ($order->user?->phone ?: '081234567890'));
        $pkg->destination_address = (string) ($order->shipping_address ?: 'Alamat Penerima');
        $pkg->destination_kecamatan_id = $destinationDistrictId;
        $pkg->destination_zipcode = (string) ($order->postal_code ?: '12130');
        $pkg->weight = max(100, (int) ($order->total_weight ?? 500));
        $pkg->width = 10;
        $pkg->length = 10;
        $pkg->height = 10;
        $pkg->item_value = max(10000, (int) $order->total_amount);
        $pkg->shipping_cost = (int) $order->shipping_cost;
        $pkg->service = $courierCode;
        $pkg->service_type = $serviceType;
        $pkg->item_name = 'Parfum Aroma Palace';
        $pkg->note = 'Fragile - Parfum Mewah (Jangan Dibanting)';
        $pkg->cod = 0;
        $pkg->package_type_id = 1;

        // Build SDK RequestPickupData
        $pickupData = new RequestPickupData;
        $pickupData->name = $senderName;
        $pickupData->phone = $senderPhone;
        $pickupData->address = $senderAddress;
        $pickupData->kecamatan_id = $originDistrictId;
        $pickupData->schedule = $pickupSchedule;
        $pickupData->platform_name = $platformName;
        $pickupData->packages->add($pkg);

        try {
            $response = KiriminAja::requestPickup($pickupData);

            if ($response && ($response->status ?? false)) {
                $respData = (array) ($response->data ?? []);
                $pickupNumber = $respData['pickup_number'] ?? null;
                $details = $respData['details'] ?? [];
                $firstDetail = ! empty($details) ? (array) $details[0] : [];
                $awb = $firstDetail['awb'] ?? null;
                $trackingNumber = $awb ?: ($pickupNumber ?: ($firstDetail['kj_order_id'] ?? $orderIdForKiriminAja));

                Log::info("KiriminAja requestPickup success for order #{$order->order_number}: pickup_number={$pickupNumber}, tracking={$trackingNumber}");

                return [
                    'success' => true,
                    'tracking_number' => (string) $trackingNumber,
                    'courier' => $order->courier ?: strtoupper($courierCode),
                    'source' => 'kiriminaja_live',
                    'message' => 'Resi otomatis KiriminAja berhasil diterbitkan ('.($pickupNumber ?: $trackingNumber).').',
                ];
            }

            $errorText = (string) ($response->message ?? 'Terjadi kendala pada API KiriminAja');

            // Automatic retry if order ID was previously submitted
            if (str_contains($errorText, 'tidak bisa diproses ulang') || str_contains($errorText, 'belum dicancel')) {
                $retryUniqueSuffix = strtoupper(substr(uniqid(), -4));
                $retryOrderId = substr($prefix.'-'.substr($cleanNumber, 0, 10).'-'.$retryUniqueSuffix, 0, 20);

                $pkg->order_id = $retryOrderId;
                $pickupData->packages->remove($orderIdForKiriminAja);
                $pickupData->packages->add($pkg);

                Log::info("KiriminAja auto-retrying pickup with fresh order_id {$retryOrderId} for order #{$order->order_number}");

                $retryRes = KiriminAja::requestPickup($pickupData);
                if ($retryRes && ($retryRes->status ?? false)) {
                    $retryData = (array) ($retryRes->data ?? []);
                    $retryPickupNum = $retryData['pickup_number'] ?? null;
                    $retryDetails = $retryData['details'] ?? [];
                    $firstRetryDetail = ! empty($retryDetails) ? (array) $retryDetails[0] : [];
                    $retryAwb = $firstRetryDetail['awb'] ?? null;
                    $trackingNumber = $retryAwb ?: ($retryPickupNum ?: ($firstRetryDetail['kj_order_id'] ?? $retryOrderId));

                    Log::info("KiriminAja retry requestPickup success for order #{$order->order_number}: tracking={$trackingNumber}");

                    return [
                        'success' => true,
                        'tracking_number' => (string) $trackingNumber,
                        'courier' => $order->courier ?: strtoupper($courierCode),
                        'source' => 'kiriminaja_live',
                        'message' => 'Resi otomatis KiriminAja berhasil diterbitkan ('.($retryPickupNum ?: $trackingNumber).').',
                    ];
                }
            }

            if (str_contains(strtolower($errorText), '401') || str_contains(strtolower($errorText), 'unauthorized')) {
                $errorText = "401 Unauthorized: API Key KiriminAja ditolak ({$mode}). Pastikan API Key dan IP Whitelist pada akun KiriminAja Anda sudah sesuai.";
            }

            Log::error("KiriminAja requestPickup rejected for order #{$order->order_number}: {$errorText}");

            return [
                'success' => false,
                'tracking_number' => '',
                'courier' => $order->courier ?: strtoupper($courierCode),
                'source' => 'kiriminaja_error',
                'message' => $errorText,
            ];
        } catch (\Throwable $e) {
            Log::error("KiriminAja requestPickup exception for order #{$order->order_number}: ".$e->getMessage());

            return [
                'success' => false,
                'tracking_number' => '',
                'courier' => $order->courier ?: strtoupper($courierCode),
                'source' => 'kiriminaja_exception',
                'message' => 'Koneksi ke KiriminAja bermasalah: '.$e->getMessage(),
            ];
        }
    }
}
