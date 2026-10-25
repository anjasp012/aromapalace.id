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
        $this->senderPhone = (string) Setting::get('shipping_sender_phone', Setting::get('store_phone', '081288889999'));
        $this->senderAddress = (string) Setting::get('shipping_address', Setting::get('store_address', 'Jl. Kemang Raya No. 10, Jakarta Selatan'));
        $this->senderZipcode = (string) Setting::get('shipping_postal_code', '12130');
        $this->prefix = strtoupper(trim((string) Setting::get('kiriminaja_prefix', config('services.kiriminaja.order_prefix', 'ARPL'))));
        if (empty($this->prefix)) {
            $this->prefix = 'ARPL';
        }
    }

    /**
     * Dapatkan instance Http client dengan header autentikasi KiriminAja.
     */
    protected function client(?string $customKey = null, ?string $customBase = null): PendingRequest
    {
        $token = $customKey !== null ? $customKey : $this->apiKey;

        return Http::withToken($token)
            ->acceptJson()
            ->asJson()
            ->timeout(20);
    }

    /**
     * Ambil daftar provinsi (di-cache 30 hari).
     * Endpoint: POST /api/mitra/province
     *
     * @return array<int, array<string, mixed>>
     */
    public function getProvinces(): array
    {
        $cached = Cache::get('kiriminaja:provinces');
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/mitra/province");

            if ($response->successful()) {
                $json = $response->json();
                $raw = $json['data'] ?? ($json['datas'] ?? ($json['results'] ?? []));

                if (is_array($raw) && ! empty($raw)) {
                    $items = array_values(array_map(function ($item) {
                        $arr = (array) $item;
                        $name = (string) ($arr['provinsi_name'] ?? ($arr['name'] ?? ''));

                        return [
                            'id' => (int) $arr['id'],
                            'name' => $name,
                            'provinsi_name' => $name,
                        ];
                    }, $raw));

                    Cache::put('kiriminaja:provinces', $items, now()->addDays(30));

                    return $items;
                }
            }

            return [];
        } catch (\Throwable $e) {
            Log::warning('KiriminAja getProvince error: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Ambil daftar kota berdasarkan ID provinsi (di-cache 30 hari).
     * Endpoint: POST /api/mitra/city
     *
     * @return array<int, array<string, mixed>>
     */
    public function getCities(int $provinceId): array
    {
        $cacheKey = "kiriminaja:cities:{$provinceId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/mitra/city", [
                'provinsi_id' => $provinceId,
            ]);

            if ($response->successful()) {
                $json = $response->json();
                $raw = $json['data']['datas'] ?? ($json['data']['results'] ?? ($json['data'] ?? ($json['datas'] ?? [])));

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
     * Endpoint: POST /api/mitra/kecamatan
     *
     * @return array<int, array<string, mixed>>
     */
    public function getDistricts(int $cityId): array
    {
        $cacheKey = "kiriminaja:districts:{$cityId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/mitra/kecamatan", [
                'kabupaten_id' => $cityId,
            ]);

            if ($response->successful()) {
                $json = $response->json();
                $raw = $json['data']['datas'] ?? ($json['data']['results'] ?? ($json['data'] ?? ($json['datas'] ?? [])));

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
     * Endpoint: POST /api/mitra/kelurahan
     *
     * @return array<int, array<string, mixed>>
     */
    public function getSubdistricts(int $districtId): array
    {
        $cacheKey = "kiriminaja:subdistricts:{$districtId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return $cached;
        }

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/mitra/kelurahan", [
                'kecamatan_id' => $districtId,
            ]);

            if ($response->successful()) {
                $json = $response->json();
                $raw = $json['data']['results'] ?? ($json['data']['datas'] ?? ($json['data'] ?? ($json['datas'] ?? [])));

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
     * Endpoint: POST /api/mitra/couriers
     *
     * @return array<int, array{code: string, name: string, region: string, type: string}>
     */
    public function getCouriers(): array
    {
        return Cache::remember('kiriminaja:couriers', now()->addDays(7), function () {
            try {
                $response = $this->client()->post("{$this->baseUrl}/api/mitra/couriers");

                if ($response->successful()) {
                    $json = $response->json();
                    $raw = $json['data'] ?? [];

                    if (is_array($raw) && ! empty($raw)) {
                        $domestic = array_values(array_filter($raw, function ($item) {
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
                }
            } catch (\Throwable $e) {
                Log::warning('KiriminAja getCouriers error: '.$e->getMessage());
            }

            return [];
        });
    }

    /**
     * Hitung ongkos kirim real-time semua kurir dari KiriminAja REST API.
     * Endpoint: POST /api/mitra/v6.1/shipping_price
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
            $payload = [
                'origin' => $origin,
                'destination' => $destination,
                'weight' => $weight,
            ];

            if (! empty($couriers)) {
                $payload['couriers'] = $couriers;
            }

            $response = $this->client()->post("{$this->baseUrl}/api/mitra/v6.1/shipping_price", $payload);

            if ($response->successful()) {
                $json = $response->json();
                $raw = $json['data']['results'] ?? ($json['data']['pricing'] ?? ($json['data'] ?? []));
                $results = [];

                if (is_array($raw)) {
                    foreach ($raw as $item) {
                        $arr = (array) $item;
                        $serviceCode = strtolower((string) ($arr['service'] ?? ''));
                        if (empty($serviceCode)) {
                            continue;
                        }

                        $serviceName = (string) ($arr['service_name'] ?? strtoupper($serviceCode));
                        $serviceType = (string) ($arr['service_type'] ?? 'REG');
                        $cost = (int) ($arr['cost'] ?? 0);
                        if ($cost <= 0) {
                            continue;
                        }

                        $etd = (string) ($arr['etd'] ?? '');

                        $results[] = [
                            'code' => $serviceCode.'_'.strtolower($serviceType),
                            'courier_code' => $serviceCode,
                            'name' => $serviceName,
                            'service' => $serviceType,
                            'price' => $cost,
                            'price_formatted' => 'Rp '.number_format($cost, 0, ',', '.'),
                            'etd' => ! empty($etd) ? 'Estimasi '.$etd.' Hari' : '1-3 Hari',
                        ];
                    }
                }

                if (! empty($results)) {
                    Cache::put($cacheKey, $results, now()->addHours(2));

                    return $results;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("KiriminAja getShippingRates (origin: {$origin}, dest: {$destination}) error: ".$e->getMessage());
        }

        return $this->generateFallbackRates();
    }

    /**
     * Tarif cadangan realistis saat offline / testing / rate limit.
     *
     * @return array<int, array{code: string, courier_code: string, name: string, service: string, price: int, price_formatted: string, etd: string}>
     */
    public function generateFallbackRates(): array
    {
        return [
            [
                'code' => 'jne_reg',
                'courier_code' => 'jne',
                'name' => 'JNE Express',
                'service' => 'REG',
                'price' => 18000,
                'price_formatted' => 'Rp 18.000',
                'etd' => 'Estimasi 1-2 Hari',
            ],
            [
                'code' => 'sicepat_reg',
                'courier_code' => 'sicepat',
                'name' => 'SiCepat Ekspres',
                'service' => 'REG',
                'price' => 17000,
                'price_formatted' => 'Rp 17.000',
                'etd' => 'Estimasi 1-2 Hari',
            ],
            [
                'code' => 'jnt_ez',
                'courier_code' => 'jnt',
                'name' => 'J&T Express',
                'service' => 'EZ',
                'price' => 19000,
                'price_formatted' => 'Rp 19.000',
                'etd' => 'Estimasi 1-2 Hari',
            ],
            [
                'code' => 'anteraja_reg',
                'courier_code' => 'anteraja',
                'name' => 'Anteraja Regular',
                'service' => 'REG',
                'price' => 16000,
                'price_formatted' => 'Rp 16.000',
                'etd' => 'Estimasi 1-3 Hari',
            ],
        ];
    }

    /**
     * Dapatkan jadwal pickup terdekat yang tersedia.
     * Endpoint: POST /api/mitra/v2/schedules
     */
    public function resolvePickupSchedule(): string
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/api/mitra/v2/schedules");

            if ($response->successful()) {
                $json = $response->json();
                $schedules = $json['schedules'] ?? ($json['data']['schedules'] ?? []);

                if (is_array($schedules) && ! empty($schedules)) {
                    foreach ($schedules as $sched) {
                        if (is_array($sched) && ! empty($sched['clock']) && empty($sched['expired']) && empty($sched['libur'])) {
                            return (string) $sched['clock'];
                        }
                    }
                    if (! empty($schedules[0]['clock'])) {
                        return (string) $schedules[0]['clock'];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAja resolvePickupSchedule fallback: '.$e->getMessage());
        }

        return now()->addDay()->setTime(14, 0, 0)->format('Y-m-d H:i:s');
    }

    /**
     * Alias untuk createShipment (backward compatibility).
     *
     * @return array<string, mixed>
     */
    public function requestPickupForOrder(Order $order): array
    {
        return $this->createShipment($order);
    }

    /**
     * Request pickup & terbitkan nomor resi otomatis untuk pesanan via REST API KiriminAja.
     * Endpoint: POST /api/mitra/v6.2/request_pickup
     *
     * @return array{
     *     success: bool,
     *     courier: string,
     *     service: string,
     *     tracking_number: string,
     *     booking_id: string,
     *     source: string,
     *     message: string,
     *     shipping_cost: int,
     *     is_simulation: bool,
     *     adapted: bool,
     *     original_courier?: string,
     *     warning?: string
     * }
     */
    public function createShipment(Order $order): array
    {
        // 1. Cek apakah resi resmi sudah ada
        if (! empty($order->tracking_number) &&
            ! str_starts_with($order->tracking_number, 'PUP-') &&
            ! str_starts_with($order->tracking_number, 'MOCK-') &&
            ! str_starts_with($order->tracking_number, 'KJ-')
        ) {
            return [
                'success' => true,
                'courier' => $order->courier ?: 'Kurir Terpilih',
                'service' => 'REG',
                'tracking_number' => $order->tracking_number,
                'booking_id' => $order->tracking_number,
                'shipping_cost' => (int) $order->shipping_cost,
                'source' => 'existing_tracking',
                'message' => 'Pesanan sudah memiliki nomor resi resmi.',
                'is_simulation' => false,
                'adapted' => false,
            ];
        }

        // 2. Resolve destination kecamatan ID
        $destDistrictId = $this->resolveDestinationDistrictId($order);

        // 3. Data Penerima
        $recipientName = trim($order->recipient_name ?: ($order->user?->name ?: 'Pelanggan Aroma Palace'));
        $recipientPhone = trim($order->recipient_phone ?: '081234567890');
        $destAddress = trim($order->shipping_address ?: ($order->city ?: 'Alamat Pemesan'));
        $destZipcode = trim($order->postal_code ?: '12130');

        // 4. Hitung Berat & Nilai Barang
        $weight = 0;
        foreach ($order->items as $item) {
            $w = (int) ($item->weight ?? 250);
            $weight += ($w > 0 ? $w : 250) * max(1, (int) $item->quantity);
        }
        $weight = max(100, $weight ?: 500);

        $itemValue = $order->subtotal > 0 ? (int) $order->subtotal : 150000;

        // 5. Kurir dan Layanan: Cocokkan ke live rate KiriminAja
        $rawCourier = strtolower((string) ($order->courier ?: 'jne'));
        $matchedCourierCode = 'jne';
        if (str_contains($rawCourier, 'sicepat')) {
            $matchedCourierCode = 'sicepat';
        } elseif (str_contains($rawCourier, 'j&t') || str_contains($rawCourier, 'jnt')) {
            $matchedCourierCode = 'jnt';
        } elseif (str_contains($rawCourier, 'anteraja')) {
            $matchedCourierCode = 'anteraja';
        } elseif (str_contains($rawCourier, 'ninja')) {
            $matchedCourierCode = 'ninja';
        } elseif (str_contains($rawCourier, 'pos')) {
            $matchedCourierCode = 'pos';
        } elseif (str_contains($rawCourier, 'tiki')) {
            $matchedCourierCode = 'tiki';
        } elseif (str_contains($rawCourier, 'lion')) {
            $matchedCourierCode = 'lion';
        } elseif (str_contains($rawCourier, 'sap')) {
            $matchedCourierCode = 'sap';
        }

        $rates = $this->getShippingRates($this->origin, $destDistrictId, $weight);
        $selectedRate = null;

        // Cari rate yang kurir dan harganya persis cocok
        foreach ($rates as $r) {
            if ($r['courier_code'] === $matchedCourierCode) {
                if ((int) $order->shipping_cost > 0 && abs($r['price'] - (int) $order->shipping_cost) <= 2000) {
                    $selectedRate = $r;
                    break;
                }
            }
        }

        // Jika tidak ada yang cocok harga, pilih rate pertama dari kurir tersebut
        if (! $selectedRate) {
            foreach ($rates as $r) {
                if ($r['courier_code'] === $matchedCourierCode) {
                    $selectedRate = $r;
                    break;
                }
            }
        }

        // Jika kurir tersebut tidak ada rate di rute ini, pilih rate pertama yang tersedia
        if (! $selectedRate && ! empty($rates)) {
            $selectedRate = $rates[0];
        }

        $selectedCourierCode = $selectedRate ? $selectedRate['courier_code'] : $matchedCourierCode;
        $selectedCourierName = $selectedRate ? $selectedRate['name'] : strtoupper($selectedCourierCode);
        $selectedServiceType = $selectedRate ? $selectedRate['service'] : 'REG';
        $actualShippingCost = $selectedRate ? (int) $selectedRate['price'] : ((int) $order->shipping_cost ?: 10000);

        // 6. Siapkan Order ID yang valid (maksimal 20 karakter untuk KiriminAja)
        $cleanOrderId = (string) $order->order_number;
        if (strlen($cleanOrderId) > 20) {
            $cleanOrderId = substr($cleanOrderId, 0, 20);
        }

        // 7. Jadwal Pickup
        $schedule = $this->resolvePickupSchedule();

        // 8. Payload Request Pickup resmi KiriminAja v6.2
        $payload = [
            'address' => $this->senderAddress,
            'phone' => $this->senderPhone,
            'name' => $this->senderName,
            'zipcode' => $this->senderZipcode,
            'kecamatan_id' => $this->origin,
            'schedule' => $schedule,
            'platform_name' => (string) Setting::get('store_name', 'Aroma Palace'),
            'payment_method' => 'credit',
            'pin' => $this->pin ?: '123456',
            'packages' => [
                [
                    'order_id' => $cleanOrderId,
                    'destination_name' => $recipientName,
                    'destination_phone' => $recipientPhone,
                    'destination_address' => $destAddress,
                    'destination_kecamatan_id' => $destDistrictId,
                    'destination_zipcode' => $destZipcode,
                    'weight' => $weight,
                    'width' => 15,
                    'length' => 15,
                    'height' => 10,
                    'qty' => max(1, (int) $order->items->sum('quantity') ?: 1),
                    'item_value' => $itemValue,
                    'shipping_cost' => $actualShippingCost,
                    'insurance_amount' => 0,
                    'service' => strtolower($selectedCourierCode),
                    'service_type' => $selectedServiceType,
                    'item_name' => 'Parfum Aroma Palace',
                    'note' => 'Fragile - Parfum Mewah',
                    'cod' => 0,
                    'package_type_id' => 1,
                ],
            ],
        ];

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/mitra/v6.2/request_pickup", $payload);
            $json = $response->json() ?? [];

            if ($response->successful() && ($json['status'] ?? false) === true) {
                $pickupNumber = (string) ($json['pickup_number'] ?? '');
                $details = $json['details'] ?? [];
                $detail = $details[0] ?? [];
                $awb = trim((string) ($detail['awb'] ?? ''));

                // Jika di sandbox/staging AWB kosong, gunakan MOCK + pickup number agar CMS sinkron dengan dashboard KiriminAja
                if (empty($awb)) {
                    if ($this->mode === 'staging' || str_contains($this->baseUrl, 'tdev')) {
                        $awb = 'MOCK-'.$pickupNumber;
                    } else {
                        $awb = $pickupNumber ?: ('PUP-'.strtoupper(Str::random(10)));
                    }
                }

                // Update order model
                $order->tracking_number = $awb;
                $order->shipping_cost = $actualShippingCost;
                $order->courier = "{$selectedCourierName} ({$selectedServiceType})";
                $order->save();

                return [
                    'success' => true,
                    'tracking_number' => $awb,
                    'booking_id' => $pickupNumber,
                    'courier' => $order->courier,
                    'service' => $selectedServiceType,
                    'shipping_cost' => $actualShippingCost,
                    'source' => 'kiriminaja_official',
                    'message' => "Resi otomatis KiriminAja berhasil diterbitkan: {$awb}",
                    'is_simulation' => false,
                    'adapted' => false,
                ];
            }

            // Gagal request pickup
            $errMsg = (string) ($json['message'] ?? ($json['text'] ?? ($response->body() ?: 'Gagal membuat request pickup di KiriminAja.')));
            Log::warning('KiriminAja request_pickup failed: '.$errMsg, ['payload' => $payload, 'response' => $json]);

            return [
                'success' => false,
                'tracking_number' => '',
                'booking_id' => '',
                'courier' => $order->courier ?? '',
                'service' => $selectedServiceType,
                'shipping_cost' => $actualShippingCost,
                'source' => 'kiriminaja_error',
                'message' => $errMsg,
                'is_simulation' => false,
                'adapted' => false,
            ];
        } catch (\Throwable $e) {
            Log::error('KiriminAja request_pickup exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return [
                'success' => false,
                'tracking_number' => '',
                'booking_id' => '',
                'courier' => $order->courier ?? '',
                'service' => $selectedServiceType,
                'shipping_cost' => $actualShippingCost,
                'source' => 'kiriminaja_exception',
                'message' => 'Terjadi kesalahan komunikasi dengan server KiriminAja: '.$e->getMessage(),
                'is_simulation' => false,
                'adapted' => false,
            ];
        }
    }

    /**
     * Cek status / detail pesanan yang sudah ada di KiriminAja via order_id.
     * Endpoint: POST /api/mitra/tracking
     *
     * @return array<string, mixed>|null
     */
    public function checkExistingShipment(string $orderId): ?array
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/api/mitra/tracking", [
                'order_id' => $orderId,
            ]);

            if ($response->successful()) {
                $json = $response->json();
                if (($json['status'] ?? false) === true && ! empty($json['details'])) {
                    return (array) $json['details'];
                }
            }
        } catch (\Throwable $e) {
            Log::warning("KiriminAja checkExistingShipment ({$orderId}) error: ".$e->getMessage());
        }

        return null;
    }

    /**
     * Sinkronkan nomor resi resmi dan biaya ongkir aktual dari KiriminAja ke pesanan.
     * Endpoint: POST /api/mitra/tracking
     *
     * @return array{success: bool, tracking_number: string, message: string}
     */
    public function syncTrackingNumber(Order $order): array
    {
        $candidates = array_unique(array_filter([
            $order->tracking_number,
            $order->order_number,
            substr((string) $order->order_number, 0, 20),
        ]));

        foreach ($candidates as $id) {
            try {
                $response = $this->client()->post("{$this->baseUrl}/api/mitra/tracking", [
                    'order_id' => $id,
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $details = $json['details'] ?? ($json['data'] ?? []);

                    if (($json['status'] ?? false) === true && ! empty($details)) {
                        $awb = trim((string) ($details['awb'] ?? ''));
                        $cost = (int) ($details['shipping_cost'] ?? 0);
                        $courier = (string) ($details['service'] ?? '');
                        $service = (string) ($details['service_type'] ?? '');

                        $updated = false;

                        if (! empty($awb) && $awb !== $order->tracking_number) {
                            $order->tracking_number = $awb;
                            $updated = true;
                        }

                        if ($cost > 0 && $cost !== (int) $order->shipping_cost) {
                            $order->shipping_cost = $cost;
                            $updated = true;
                        }

                        if (! empty($courier)) {
                            $formattedCourier = ! empty($service) ? "{$courier} ({$service})" : $courier;
                            if ($formattedCourier !== $order->courier) {
                                $order->courier = $formattedCourier;
                                $updated = true;
                            }
                        }

                        if ($updated) {
                            $order->save();
                        }

                        return [
                            'success' => true,
                            'tracking_number' => $order->tracking_number ?: $awb,
                            'message' => "Nomor resi resmi berhasil disinkronkan: {$order->tracking_number}",
                        ];
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("KiriminAja syncTrackingNumber ({$id}) error: ".$e->getMessage());
            }
        }

        return [
            'success' => false,
            'tracking_number' => (string) ($order->tracking_number ?? ''),
            'message' => 'Nomor resi resmi belum diterbitkan oleh ekspedisi di KiriminAja.',
        ];
    }

    /**
     * Batalkan pengiriman paket di KiriminAja.
     * Endpoint: POST /api/mitra/v3/cancel_shipment
     *
     * @return array<string, mixed>
     */
    public function cancelShipment(string $awb, string $reason = 'Pembatalan oleh admin'): array
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/api/mitra/v3/cancel_shipment?awb=".urlencode($awb).'&reason='.urlencode($reason));

            return $response->json() ?? ['status' => $response->successful()];
        } catch (\Throwable $e) {
            Log::warning("KiriminAja cancelShipment ({$awb}) error: ".$e->getMessage());

            return ['status' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Resolusi destination kecamatan ID berdasarkan alamat pesanan.
     */
    public function resolveDestinationDistrictId(Order $order): int
    {
        // 1. Cek UserAddress terkait jika ada
        if ($order->user_id) {
            $userAddr = UserAddress::where('user_id', $order->user_id)
                ->where('is_primary', true)
                ->first() ?: UserAddress::where('user_id', $order->user_id)->first();

            if ($userAddr && $userAddr->district_id > 0) {
                return (int) $userAddr->district_id;
            }
        }

        // 2. Cek kolom district_name
        if (! empty($order->district_name)) {
            $cacheKey = 'kiriminaja:dest_district:'.Str::slug($order->district_name);
            $cached = Cache::get($cacheKey);
            if ($cached) {
                return (int) $cached;
            }

            try {
                $response = $this->client()->post("{$this->baseUrl}/api/mitra/v2/get_address_by_name", [
                    'search' => $order->district_name,
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $list = $json['data'] ?? ($json['datas'] ?? []);
                    if (! empty($list[0]['id'])) {
                        $id = (int) $list[0]['id'];
                        Cache::put($cacheKey, $id, now()->addDays(30));

                        return $id;
                    }
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        // 3. Cek kolom city_name / city
        $cityTarget = $order->city_name ?: $order->city;
        if (! empty($cityTarget)) {
            $cityId = $this->resolveCityId($cityTarget);
            if ($cityId > 0) {
                $districts = $this->getDistricts($cityId);
                if (! empty($districts[0]['id'])) {
                    return (int) $districts[0]['id'];
                }
            }
        }

        // Fallback default (Jakarta Selatan / Setiabudi)
        return $this->origin ?: 2101;
    }

    /**
     * Resolusi city ID berdasarkan nama kota.
     */
    public function resolveCityId(string $cityName): int
    {
        $clean = strtolower(trim(preg_replace('/^(kota|kabupaten|kab\.|adm\.)\s+/i', '', $cityName)));
        $cacheKey = 'kiriminaja:city_id:'.Str::slug($clean);

        return (int) Cache::remember($cacheKey, now()->addDays(30), function () use ($clean) {
            $provinces = $this->getProvinces();
            foreach ($provinces as $prov) {
                $cities = $this->getCities((int) $prov['id']);
                foreach ($cities as $city) {
                    $target = strtolower(trim(preg_replace('/^(kota|kabupaten|kab\.|adm\.)\s+/i', '', (string) ($city['name'] ?? ''))));
                    if ($target === $clean || str_contains($target, $clean) || str_contains($clean, $target)) {
                        return (int) $city['id'];
                    }
                }
            }

            return 0;
        });
    }

    /**
     * Test koneksi API KiriminAja.
     *
     * @return array{success: bool, message: string, mode: string, base_url: string, raw?: mixed}
     */
    public function testConnection(?string $apiKey = null, ?string $mode = null, ?string $baseUrl = null): array
    {
        $key = $apiKey !== null ? $apiKey : $this->apiKey;
        $m = $mode ?: $this->mode;
        $url = $baseUrl ?: ($m === 'production' ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com');

        if (empty($key)) {
            return [
                'success' => false,
                'message' => 'API Key KiriminAja belum diatur.',
                'mode' => $m,
                'base_url' => $url,
            ];
        }

        try {
            $response = $this->client($key, $url)->post("{$url}/api/mitra/province");

            if ($response->successful()) {
                $json = $response->json();
                if (($json['status'] ?? false) === true) {
                    return [
                        'success' => true,
                        'message' => 'Koneksi ke KiriminAja API berhasil terhubung!',
                        'mode' => $m,
                        'base_url' => $url,
                    ];
                }

                return [
                    'success' => false,
                    'message' => $json['message'] ?? ($json['text'] ?? 'Respon API tidak valid.'),
                    'mode' => $m,
                    'base_url' => $url,
                    'raw' => $json,
                ];
            }

            if ($response->status() === 401) {
                return [
                    'success' => false,
                    'message' => 'API Key tidak valid atau tidak memiliki izin (401 Unauthorized).',
                    'mode' => $m,
                    'base_url' => $url,
                ];
            }

            return [
                'success' => false,
                'message' => "Gagal terhubung ke KiriminAja (HTTP {$response->status()}).",
                'mode' => $m,
                'base_url' => $url,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Koneksi error: '.$e->getMessage(),
                'mode' => $m,
                'base_url' => $url,
            ];
        }
    }
}
