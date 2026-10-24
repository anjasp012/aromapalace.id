<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\UserAddress;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use KiriminAja\Base\Config\KiriminAjaConfig;
use KiriminAja\Models\ShippingFullPriceData;
use KiriminAja\Services\KiriminAja;

class KiriminAjaService
{
    protected string $mode;

    protected string $apiKey;

    protected int $origin;

    public function __construct()
    {
        $this->mode = (string) Setting::get('kiriminaja_mode', 'staging');
        $this->apiKey = (string) Setting::get('kiriminaja_api_key', '');
        $this->origin = (int) Setting::get('shipping_district_id', 2101); // ID Kecamatan Asal Pengiriman dari Database

        // Inisialisasi konfigurasi SDK KiriminAja
        try {
            KiriminAjaConfig::setMode($this->mode);
            if (! empty($this->apiKey)) {
                KiriminAjaConfig::setApiTokenKey($this->apiKey);
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAjaConfig initialization note: '.$e->getMessage());
        }
    }

    /**
     * Ambil daftar provinsi (di-cache 30 hari untuk efisiensi API).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getProvinces(): array
    {
        $cached = Cache::get('kiriminaja:provinces:v2');
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $res = KiriminAja::getProvince();
            if ($res->status && is_array($res->data) && ! empty($res->data)) {
                $items = array_values(array_map(function ($item) {
                    $arr = (array) $item;
                    $name = (string) ($arr['provinsi_name'] ?? ($arr['name'] ?? ''));

                    return [
                        'id' => (int) $arr['id'],
                        'name' => $name,
                        'provinsi_name' => $name,
                    ];
                }, $res->data));

                Cache::put('kiriminaja:provinces:v2', $items, now()->addDays(30));

                return $items;
            }

            return [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getProvince error: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Ambil daftar kota berdasarkan ID provinsi (di-cache 30 hari).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getCities(int $provinceId): array
    {
        $cacheKey = "kiriminaja:cities:v2:{$provinceId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $res = KiriminAja::getCity($provinceId);
            if ($res->status && is_array($res->data)) {
                $raw = $res->data['datas'] ?? ($res->data['results'] ?? $res->data);
                if (is_array($raw) && ! empty($raw)) {
                    $items = array_values(array_map(function ($item) use ($provinceId) {
                        $arr = (array) $item;
                        $name = (string) ($arr['kabupaten_name'] ?? ($arr['name'] ?? ''));

                        return [
                            'id' => (int) $arr['id'],
                            'province_id' => (int) ($arr['provinsi_id'] ?? $provinceId),
                            'provinsi_id' => (int) ($arr['provinsi_id'] ?? $provinceId),
                            'name' => $name,
                            'kabupaten_name' => $name,
                            'type' => (string) ($arr['type'] ?? ''),
                            'postal_code' => (string) ($arr['postal_code'] ?? ''),
                        ];
                    }, $raw));

                    Cache::put($cacheKey, $items, now()->addDays(30));

                    return $items;
                }
            }

            return [];
        } catch (\Throwable $e) {
            Log::warning("KiriminAja getCities ({$provinceId}) error: ".$e->getMessage());

            return [];
        }
    }

    /**
     * Ambil daftar kecamatan berdasarkan ID kota (di-cache 30 hari).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getDistricts(int $cityId): array
    {
        $cacheKey = "kiriminaja:districts:v2:{$cityId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $res = KiriminAja::getDistrict($cityId);
            if ($res->status && is_array($res->data)) {
                $raw = $res->data['datas'] ?? ($res->data['results'] ?? $res->data);
                if (is_array($raw) && ! empty($raw)) {
                    $items = array_values(array_map(function ($item) use ($cityId) {
                        $arr = (array) $item;
                        $name = (string) ($arr['kecamatan_name'] ?? ($arr['name'] ?? ''));

                        return [
                            'id' => (int) $arr['id'],
                            'city_id' => (int) ($arr['kabupaten_id'] ?? $cityId),
                            'kabupaten_id' => (int) ($arr['kabupaten_id'] ?? $cityId),
                            'name' => $name,
                            'kecamatan_name' => $name,
                            'postal_code' => (string) ($arr['postal_code'] ?? ''),
                        ];
                    }, $raw));

                    Cache::put($cacheKey, $items, now()->addDays(30));

                    return $items;
                }
            }

            return [];
        } catch (\Throwable $e) {
            Log::warning("KiriminAja getDistricts ({$cityId}) error: ".$e->getMessage());

            return [];
        }
    }

    /**
     * Ambil daftar kelurahan berdasarkan ID kecamatan (di-cache 30 hari).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getSubdistricts(int $districtId): array
    {
        $cacheKey = "kiriminaja:subdistricts:v2:{$districtId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $res = KiriminAja::getSubDistrict($districtId);
            if ($res->status && is_array($res->data)) {
                $raw = $res->data['results'] ?? ($res->data['datas'] ?? $res->data);
                if (is_array($raw) && ! empty($raw)) {
                    $items = array_values(array_map(function ($item) use ($districtId) {
                        $arr = (array) $item;
                        $name = (string) ($arr['kelurahan_name'] ?? ($arr['name'] ?? ''));

                        return [
                            'id' => (int) $arr['id'],
                            'district_id' => (int) ($arr['kecamatan_id'] ?? $districtId),
                            'kecamatan_id' => (int) ($arr['kecamatan_id'] ?? $districtId),
                            'name' => $name,
                            'kelurahan_name' => $name,
                            'postal_code' => (string) ($arr['postal_code'] ?? ''),
                        ];
                    }, $raw));

                    Cache::put($cacheKey, $items, now()->addDays(30));

                    return $items;
                }
            }

            return [];
        } catch (\Throwable $e) {
            Log::warning("KiriminAja getSubdistricts ({$districtId}) error: ".$e->getMessage());

            return [];
        }
    }

    /**
     * Dapatkan daftar kurir yang tersedia (di-cache 7 hari).
     *
     * @return array<int, array{code: string, name: string, region: string, type: string}>
     */
    public function getCouriers(): array
    {
        return Cache::remember('kiriminaja:couriers:v1', now()->addDays(7), function () {
            try {
                $res = KiriminAja::getCouriers();
                if ($res->status && is_array($res->data) && ! empty($res->data)) {
                    $domestic = array_values(array_filter($res->data, function ($item) {
                        $arr = (array) $item;

                        return ($arr['region'] ?? '') === 'DOMESTIC';
                    }));

                    if (! empty($domestic)) {
                        return array_map(function ($item) {
                            $arr = (array) $item;

                            return [
                                'code' => (string) ($arr['code'] ?? ''),
                                'name' => (string) ($arr['name'] ?? ''),
                                'region' => (string) ($arr['region'] ?? 'DOMESTIC'),
                                'type' => (string) ($arr['type'] ?? 'Express'),
                            ];
                        }, $domestic);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('KiriminAja getCouriers error: '.$e->getMessage());
            }

            return [];
        });
    }

    /**
     * Hitung ongkos kirim real-time semua kurir dari KiriminAja SDK (fullShippingPrice).
     *
     * @param  int  $originDistrictId  Origin kecamatan ID
     * @param  int  $destinationDistrictId  Destination kecamatan ID
     * @param  int  $weightGrams  Berat paket dalam gram
     * @return array<int, array{code: string, courier_code: string, name: string, service: string, price: int, price_formatted: string, etd: string}>
     */
    public function getShippingRates(int $originDistrictId, int $destinationDistrictId, int $weightGrams = 1000, ?array $couriers = null): array
    {
        $origin = $originDistrictId > 0 ? $originDistrictId : $this->origin;
        $destination = $destinationDistrictId;
        $weight = max(100, $weightGrams);

        $cacheKey = "kiriminaja:rates:o{$origin}:d{$destination}:w{$weight}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $data = new ShippingFullPriceData;
            $data->origin = $origin;
            $data->destination = $destination;
            $data->weight = $weight;

            $response = KiriminAja::fullShippingPrice($data);

            if ($response->status && ! empty($response->data)) {
                $raw = is_array($response->data) ? ($response->data['results'] ?? ($response->data['pricing'] ?? $response->data)) : [];
                $results = [];

                foreach ($raw as $item) {
                    $arr = (array) $item;
                    $serviceCode = strtolower((string) ($arr['service'] ?? ''));
                    if (empty($serviceCode)) {
                        continue;
                    }

                    $serviceName = (string) ($arr['service_name'] ?? strtoupper($serviceCode));
                    $serviceType = (string) ($arr['service_type'] ?? 'REG');
                    $cost = (int) ($arr['cost'] ?? 0);
                    $etd = (string) ($arr['etd'] ?? '');

                    $results[] = [
                        'code' => $serviceCode.'_'.strtolower($serviceType),
                        'courier_code' => $serviceCode,
                        'name' => $serviceName,
                        'service' => $serviceType,
                        'price' => $cost,
                        'price_formatted' => $cost === 0 ? 'Gratis' : 'Rp '.number_format($cost, 0, ',', '.'),
                        'etd' => ! empty($etd) ? 'Estimasi '.$etd.' Hari' : '1-3 Hari',
                    ];
                }

                if (! empty($results)) {
                    Cache::put($cacheKey, $results, now()->addHours(2));

                    return $results;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("KiriminAja getShippingRates (origin: {$origin}, dest: {$destination}) error: ".$e->getMessage());
        }

        return [];
    }

    /**
     * Request pickup & terbitkan nomor resi otomatis untuk pesanan.
     *
     * @return array{success: bool, tracking_number: string, courier: string, source: string, message: string}
     */
    public function requestPickupForOrder(Order $order): array
    {
        $prefix = (string) Setting::get('kiriminaja_prefix', 'ARPL');
        $orderIdForKiriminAja = $prefix.'-'.$order->order_number;

        // 1. Tentukan kurir & tipe layanan
        $courierRaw = strtolower((string) ($order->courier ?: 'jne'));
        $courierCode = 'jne';
        $serviceType = 'REG';

        if (str_contains($courierRaw, 'j&t') || str_contains($courierRaw, 'jnt')) {
            $courierCode = 'jnt';
            $serviceType = 'EZ';
        } elseif (str_contains($courierRaw, 'sicepat')) {
            $courierCode = 'sicepat';
            $serviceType = 'SIUNT';
        } elseif (str_contains($courierRaw, 'spx')) {
            $courierCode = 'spx';
            $serviceType = '1';
        } elseif (str_contains($courierRaw, 'anteraja')) {
            $courierCode = 'anteraja';
            $serviceType = 'REG';
        } elseif (str_contains($courierRaw, 'lion')) {
            $courierCode = 'lion';
            $serviceType = 'REGPACK';
        } elseif (str_contains($courierRaw, 'tiki')) {
            $courierCode = 'tiki';
            $serviceType = 'REG';
        } elseif (str_contains($courierRaw, 'sap')) {
            $courierCode = 'sap';
            $serviceType = 'FLUDRREG';
        } elseif (str_contains($courierRaw, 'idx')) {
            $courierCode = 'idx';
            $serviceType = '00';
        }

        // 2. Resolve destination kecamatan ID
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

        if (! $destinationDistrictId) {
            $destinationDistrictId = 2101; // default ke Jakarta Selatan
        }

        // 3. Data pengirim dari settings database
        $senderName = (string) Setting::get('shipping_sender_name', Setting::get('store_name', 'Aroma Palace Official'));
        $senderPhone = (string) Setting::get('shipping_sender_phone', Setting::get('store_phone', '081288889999'));
        $senderAddress = (string) Setting::get('shipping_address', Setting::get('store_address', 'Jl. Kemang Raya No. 10, Jakarta Selatan'));
        $originDistrictId = $this->origin ?: 2101;
        $platformName = (string) Setting::get('store_name', 'Aroma Palace');

        $baseUrl = $this->mode === 'production' ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com';
        $token = $this->apiKey;

        // 4. Jadwal pickup
        $pickupSchedule = now()->addDay()->format('Y-m-d 14:00:00');
        try {
            $schedRes = Http::withToken($token)
                ->withHeaders(['Accept' => 'application/json', 'Content-Type' => 'application/json'])
                ->timeout(5)
                ->post("{$baseUrl}/api/mitra/v2/schedules");

            if ($schedRes->successful() && ($schedRes->json('status') ?? false)) {
                $schedules = $schedRes->json('schedules') ?? [];
                foreach ($schedules as $slot) {
                    if (empty($slot['libur']) && ! empty($slot['clock'])) {
                        $pickupSchedule = (string) $slot['clock'];
                        break;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAja schedule fetch error: '.$e->getMessage());
        }

        // 5. Payload paket
        $packagePayload = [
            'order_id' => $orderIdForKiriminAja,
            'destination_name' => (string) ($order->recipient_name ?: ($order->user?->name ?: 'Pelanggan')),
            'destination_phone' => (string) ($order->recipient_phone ?: ($order->user?->phone ?: '081234567890')),
            'destination_address' => (string) ($order->shipping_address ?: 'Alamat Penerima'),
            'destination_kecamatan_id' => $destinationDistrictId,
            'destination_zipcode' => (string) ($order->postal_code ?: '12130'),
            'weight' => max(100, (int) ($order->total_weight ?? 500)),
            'width' => 10,
            'length' => 10,
            'height' => 10,
            'item_value' => max(10000, (int) $order->total_amount),
            'shipping_cost' => (int) $order->shipping_cost,
            'service' => $courierCode,
            'service_type' => $serviceType,
            'item_name' => 'Parfum Aroma Palace',
            'note' => 'Fragile - Parfum Mewah (Jangan Dibanting)',
            'cod' => 0,
            'package_type_id' => 1,
        ];

        $payload = [
            'name' => $senderName,
            'phone' => $senderPhone,
            'address' => $senderAddress,
            'kecamatan_id' => $originDistrictId,
            'schedule' => $pickupSchedule,
            'platform_name' => $platformName,
            'packages' => [$packagePayload],
        ];

        // 6. Request pickup ke API KiriminAja
        try {
            $response = Http::withToken($token)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(15)
                ->post("{$baseUrl}/api/mitra/v6.1/request_pickup", $payload);

            $json = $response->json() ?? [];

            if ($response->successful() && ($json['status'] ?? false)) {
                $details = $json['details'] ?? [];
                $firstDetail = ! empty($details) ? (array) $details[0] : [];
                $pickupNumber = $json['pickup_number'] ?? null;
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

            $errorText = $json['text'] ?? ($json['message'] ?? 'Terjadi kendala pada API KiriminAja');

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
