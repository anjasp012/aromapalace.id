<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\UserAddress;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use KiriminAja\Base\Config\KiriminAjaConfig;
use KiriminAja\Models\PackageData;
use KiriminAja\Models\PackageItemData;
use KiriminAja\Models\RequestPickupData;
use KiriminAja\Models\RequestPickupDataList;
use KiriminAja\Models\ShippingFullPriceData;
use KiriminAja\Services\KiriminAja;

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
        $this->origin = (int) Setting::get('shipping_district_id', 2101); // ID Kecamatan Asal Pengiriman dari Database
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
        $cached = Cache::get('kiriminaja:provinces');
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

                Cache::put('kiriminaja:provinces', $items, now()->addDays(30));

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
        $cacheKey = "kiriminaja:cities:{$provinceId}";
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
        $cacheKey = "kiriminaja:districts:{$cityId}";
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
        $cacheKey = "kiriminaja:subdistricts:{$districtId}";
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
        return Cache::remember('kiriminaja:couriers', now()->addDays(7), function () {
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
     * Mengadopsi arsitektur multi-attempt, live rate matching, dan direct credit payment v6.2.
     *
     * @return array{
     *     success: bool,
     *     courier: string,
     *     service: string,
     *     tracking_number: string,
     *     booking_id: string,
     *     source: string,
     *     message: string,
     *     is_simulation: bool,
     *     adapted: bool,
     *     original_courier?: string,
     *     warning?: string
     * }
     */
    public function createShipment(Order $order): array
    {
        $rawCourier = strtolower((string) ($order->courier ?: ($order->shipping_courier ?? 'jne')));
        $courier = 'jne';
        if (str_contains($rawCourier, 'sicepat')) {
            $courier = 'sicepat';
        } elseif (str_contains($rawCourier, 'j&t') || str_contains($rawCourier, 'jnt')) {
            $courier = 'jnt';
        } elseif (str_contains($rawCourier, 'ninja')) {
            $courier = 'ninja';
        } elseif (str_contains($rawCourier, 'anteraja')) {
            $courier = 'anteraja';
        } elseif (str_contains($rawCourier, 'spx')) {
            $courier = 'spx';
        } elseif (str_contains($rawCourier, 'lion')) {
            $courier = 'lion';
        } elseif (str_contains($rawCourier, 'tiki')) {
            $courier = 'tiki';
        } elseif (str_contains($rawCourier, 'sap')) {
            $courier = 'sap';
        } elseif (str_contains($rawCourier, 'idx')) {
            $courier = 'idx';
        } elseif (preg_match('/^[a-z0-9]+$/', $rawCourier)) {
            $courier = $rawCourier;
        }

        $rawService = strtolower((string) ($order->shipping_service ?? ''));
        if (empty($rawService)) {
            if (str_contains($rawCourier, 'ez')) {
                $rawService = 'ez';
            } elseif (str_contains($rawCourier, 'ctc23')) {
                $rawService = 'ctc23';
            } elseif (str_contains($rawCourier, 'ctc')) {
                $rawService = 'ctc';
            } elseif (str_contains($rawCourier, 'siunt')) {
                $rawService = 'siunt';
            } elseif (str_contains($rawCourier, 'best')) {
                $rawService = 'best';
            } elseif (str_contains($rawCourier, 'gokil')) {
                $rawService = 'gokil';
            } elseif (str_contains($rawCourier, 'reg')) {
                $rawService = 'reg';
            } elseif (str_contains($rawCourier, 'oke')) {
                $rawService = 'oke';
            } elseif (str_contains($rawCourier, 'yes')) {
                $rawService = 'yes';
            } else {
                $rawService = 'reg';
            }
        }
        $service = strtoupper($rawService);

        // Jika mode live dengan API key asli (bukan testing/demo) atau jika sedang dalam test yang mem-fake HTTP
        if ($this->apiKey !== 'demo_kiriminaja_key' && (! empty($this->apiKey) || Http::isFaking())) {
            $recipientName = (string) ($order->recipient_name ?: ($order->user?->name ?: 'Customer'));
            $recipientPhone = (string) ($order->recipient_phone ?: ($order->user?->phone ?: '08123456789'));
            $destinationAddress = (string) ($order->shipping_address ?: 'Alamat Pemesan');
            $destinationCity = (string) ($order->city_name ?: ($order->city ?: 'Jakarta'));
            $destinationPostal = (string) ($order->postal_code ?: '10110');
            $destCityId = $this->resolveDestinationDistrictId($order);

            $orderItems = $order->relationLoaded('items') ? $order->items : $order->items()->get();
            $actualWeight = max(250, (int) $orderItems->sum(fn ($i) => ($i->quantity * 250)));
            $totalQty = max(1, (int) $orderItems->sum('quantity'));
            $boxLength = ($totalQty > 2) ? 25 : 15;
            $boxWidth = ($totalQty > 2) ? 20 : 12;
            $boxHeight = ($totalQty > 2) ? 15 : 10;
            $volumetricWeight = (int) round(($boxLength * $boxWidth * $boxHeight) / 6000 * 1000);
            $packageWeight = max($actualWeight, $volumetricWeight);

            // 1. Cek layanan dan kurir aktif langsung dari KiriminAja pricing via SDK
            $liveRates = $this->getLivePricingServices($this->origin, $destCityId, $packageWeight, [$courier, 'jne', 'sicepat', 'jnt', 'anteraja', 'ninja']);

            // 2. Susun antrian percobaan (attempts) kurir & service type
            $attempts = [];
            $seenKeys = [];

            $addAttempt = function (string $c, string $st, int $cost = 0, bool $isAlternative = false) use (&$attempts, &$seenKeys) {
                $key = strtolower($c).':'.strtolower($st);
                if (! isset($seenKeys[$key])) {
                    $seenKeys[$key] = true;
                    $attempts[] = [
                        'service' => strtolower($c),
                        'service_type' => $st,
                        'cost' => $cost,
                        'is_alternative' => $isAlternative,
                    ];
                }
            };

            // Tahap A: Prioritaskan layanan yang ditemukan di live pricing untuk kurir yang dipilih user
            $courierLiveRates = array_filter($liveRates, fn ($r) => strtolower($r['service'] ?? '') === $courier);
            if (! empty($courierLiveRates)) {
                $matchedRate = null;
                foreach ($courierLiveRates as $r) {
                    $st = strtolower($r['service_type'] ?? '');
                    $sn = strtolower($r['service_name'] ?? '');
                    if (str_contains($st, $rawService) || str_contains($sn, $rawService)) {
                        $matchedRate = $r;
                        break;
                    }
                    if (in_array($rawService, ['reg', 'regular', 'standard']) && (str_contains($st, 'ctc') || str_contains($sn, 'city to city'))) {
                        $matchedRate = $r;
                        break;
                    }
                }
                if ($matchedRate) {
                    $addAttempt($matchedRate['service'], $matchedRate['service_type'], (int) ($matchedRate['cost'] ?? 0));
                }
                foreach ($courierLiveRates as $r) {
                    $addAttempt($r['service'], $r['service_type'], (int) ($r['cost'] ?? 0));
                }
            }

            // Tahap B: Tambahkan candidate codes standar untuk kurir yang diminta
            if ($courier === 'jne') {
                $isJakartaRoute = in_array($this->origin, [151, 152, 153, 154, 155, 2101, 2102, 2103]) && in_array($destCityId, [151, 152, 153, 154, 155, 2101, 2102, 2103]);
                $jneCandidates = $isJakartaRoute
                    ? ['CTC23', 'CTC', 'REG', 'REG23', 'FLREG23', 'REG19', 'ctc', 'reg', 'oke']
                    : ['REG', 'REG23', 'REG19', 'CTC', 'FLREG23', 'reg', 'ctc', 'oke'];
                foreach ($jneCandidates as $cand) {
                    $addAttempt('jne', $cand);
                }
            } elseif ($courier === 'jnt' || $courier === 'j&t') {
                foreach (['EZ', 'ez', 'reg', 'standard'] as $cand) {
                    $addAttempt('jnt', $cand);
                }
            } elseif ($courier === 'sicepat') {
                foreach (['SIUNT', 'REG', 'BEST', 'GOKIL', 'siunt', 'reg'] as $cand) {
                    $addAttempt('sicepat', $cand);
                }
            } elseif ($courier === 'ninja') {
                foreach (['STANDARD', 'REG', 'standard', 'reg'] as $cand) {
                    $addAttempt('ninja', $cand);
                }
            } elseif ($courier === 'anteraja') {
                foreach (['REG', 'SD', 'reg'] as $cand) {
                    $addAttempt('anteraja', $cand);
                }
            } else {
                $addAttempt($courier, strtoupper($rawService));
                $addAttempt($courier, strtolower($rawService));
            }

            // Tahap C: Kurir alternatif jika kurir asli belum aktif
            foreach ($liveRates as $r) {
                if (strtolower($r['service'] ?? '') !== $courier && ! empty($r['service']) && ! empty($r['service_type'])) {
                    $addAttempt($r['service'], $r['service_type'], (int) ($r['cost'] ?? 0), true);
                }
            }

            $addAttempt('sicepat', 'SIUNT', 0, true);
            $addAttempt('jnt', 'EZ', 0, true);
            $addAttempt('ninja', 'STANDARD', 0, true);

            // Normalisasi nomor telepon penerima
            $cleanPhone = preg_replace('/[^0-9]/', '', $recipientPhone);
            if (! str_starts_with($cleanPhone, '0') && ! str_starts_with($cleanPhone, '62')) {
                $cleanPhone = '0'.$cleanPhone;
            }

            // Prefix Order ID (wajib unik di akun KiriminAja & max 20 karakter)
            $cleanPrefix = rtrim($this->prefix ?: 'ARPL', '-');
            $rawOrder = (string) $order->order_number;
            if (! str_starts_with($rawOrder, $cleanPrefix)) {
                $cleanSuffix = preg_replace('/^[A-Za-z0-9]+-?/', '', $rawOrder);
                $kiriminAjaOrderId = Str::limit($cleanPrefix.'-'.$cleanSuffix, 20, '');
            } else {
                $kiriminAjaOrderId = Str::limit($rawOrder, 20, '');
            }

            // 1. Cek apakah pengiriman untuk order_id ini sudah sukses terdaftar di KiriminAja sebelumnya
            $existing = $this->checkExistingShipment($kiriminAjaOrderId);
            if ($existing) {
                $this->updateOrderTracking($order, $existing['tracking_number'], $existing['courier'], $existing['service'], $existing['booking_id']);

                return $existing;
            }

            // 2. Susun data item paket (PackageItemData)
            $packageItems = [];
            if ($orderItems->isEmpty()) {
                $pkgItem = new PackageItemData;
                $pkgItem->name = 'Parfum Aroma Palace';
                $pkgItem->price = max(10000, (int) round($order->total_amount));
                $pkgItem->qty = 1;
                $pkgItem->weight = $packageWeight;
                $pkgItem->width = $boxWidth;
                $pkgItem->length = $boxLength;
                $pkgItem->height = $boxHeight;
                $packageItems[] = $pkgItem;
            } else {
                foreach ($orderItems as $item) {
                    $pkgItem = new PackageItemData;
                    $pkgItem->name = (string) Str::limit($item->product_name ?? 'Parfum Aroma Palace', 50, '');
                    $pkgItem->price = (int) round($item->price ?? 100000);
                    $pkgItem->qty = max(1, (int) ($item->quantity ?? 1));
                    $pkgItem->weight = max(100, (int) round(($item->quantity ?? 1) * 250));
                    $pkgItem->width = $boxWidth;
                    $pkgItem->length = $boxLength;
                    $pkgItem->height = $boxHeight;
                    $packageItems[] = $pkgItem;
                }
            }

            $pickupSchedule = $this->resolvePickupSchedule();

            $successfulResponse = null;
            $succeededCourier = $courier;
            $succeededService = $service;
            $wasAdapted = false;
            $lastError = 'Gagal menghubungi KiriminAja API';

            // 3. Eksekusi antrian percobaan pickup via v6.2 (Credit + PIN) dan fallback SDK
            foreach ($attempts as $attempt) {
                $currCourier = $attempt['service'];
                $currServiceType = $attempt['service_type'];
                $currCost = ($attempt['cost'] > 0) ? $attempt['cost'] : (int) round($order->shipping_cost);

                $pickupData = new RequestPickupData;
                $pickupData->address = $this->senderAddress;
                $pickupData->phone = $this->senderPhone;
                $pickupData->name = $this->senderName;
                $pickupData->zipcode = $this->senderZipcode;
                $pickupData->kecamatan_id = $this->origin;
                $pickupData->schedule = $pickupSchedule;
                $pickupData->platform_name = 'Aroma Palace';

                $pkg = new PackageData;
                $pkg->order_id = $kiriminAjaOrderId;
                $pkg->destination_name = (string) Str::limit($recipientName, 50, '');
                $pkg->destination_phone = (string) Str::limit($cleanPhone, 15, '');
                $pkg->destination_address = (string) Str::limit($destinationAddress, 200, '');
                $pkg->destination_kecamatan_id = $destCityId;
                $pkg->destination_zipcode = $destinationPostal;
                $pkg->weight = $packageWeight;
                $pkg->width = $boxWidth;
                $pkg->length = $boxLength;
                $pkg->height = $boxHeight;
                $pkg->qty = $totalQty;
                $itemValue = (int) round($order->total_amount);
                $pkg->item_value = max(10000, $itemValue);
                $pkg->insurance_amount = 0;
                $pkg->shipping_cost = $currCost;
                $pkg->item_name = 'Parfum Eksklusif Aroma Palace';
                $pkg->service = $currCourier;
                $pkg->service_type = $currServiceType;
                $pkg->cod = 0;
                $pkg->package_type_id = 1;
                $pkg->note = 'Fragile - Parfum Mewah (Jangan Dibanting)';
                if (! empty($packageItems)) {
                    $pkg->items = $packageItems;
                }

                $pickupData->packages->add($pkg);

                // Jika PIN KA Credit tersedia, prioritaskan pemotongan saldo otomatis (v6.2) agar AWB resmi langsung terbit
                if (! empty($this->pin)) {
                    try {
                        $v62Payload = [
                            'address' => $this->senderAddress,
                            'phone' => $this->senderPhone,
                            'name' => $this->senderName,
                            'zipcode' => $this->senderZipcode,
                            'kecamatan_id' => $this->origin,
                            'schedule' => $pickupSchedule,
                            'platform_name' => 'Aroma Palace',
                            'payment_method' => 'credit',
                            'pin' => $this->pin,
                            'packages' => [$pkg->toArray()],
                        ];

                        $httpRes = Http::withToken($this->apiKey)
                            ->withHeaders([
                                'Accept' => 'application/json',
                                'Content-Type' => 'application/json',
                            ])->post(rtrim($this->baseUrl, '/').'/api/mitra/v6.2/request_pickup', $v62Payload);

                        if ($httpRes->successful() && ($httpRes->json('status') === true) && (! empty($httpRes->json('details')) || ! empty($httpRes->json('pickup_number')))) {
                            $successfulResponse = $httpRes->json();
                            $succeededCourier = $currCourier;
                            $succeededService = $currServiceType;
                            $wasAdapted = ! empty($attempt['is_alternative']) || ($currCourier !== $courier);
                            break;
                        }

                        if ($httpRes->json('text') || $httpRes->json('message')) {
                            $lastError = (string) ($httpRes->json('text') ?? $httpRes->json('message'));
                        }
                    } catch (\Throwable $e) {
                        $lastError = $e->getMessage();
                    }
                }

                try {
                    $sdkRes = KiriminAja::requestPickup($pickupData);
                    if ($sdkRes->status && ! empty($sdkRes->data)) {
                        $successfulResponse = (array) $sdkRes->data;
                        $succeededCourier = $currCourier;
                        $succeededService = $currServiceType;
                        $wasAdapted = ! empty($attempt['is_alternative']) || ($currCourier !== $courier);
                        break;
                    }
                    if (! empty($sdkRes->message)) {
                        $lastError = $sdkRes->message;
                    }
                } catch (\Throwable $e) {
                    $lastError = $e->getMessage();
                }

                if (str_contains(strtolower($lastError), 'ip') && str_contains(strtolower($lastError), 'whitelist')) {
                    $lastError .= ' (IP Server belum di-whitelist di Dashboard KiriminAja)';
                    break;
                }

                // Coba retry tanpa array items jika validasi items ditolak API KiriminAja
                if (! $successfulResponse && ! empty($pkg->items)) {
                    if (! empty($this->pin)) {
                        try {
                            $pkgNoItems = $pkg->toArray();
                            unset($pkgNoItems['items']);
                            $v62PayloadNoItems = [
                                'address' => $this->senderAddress,
                                'phone' => $this->senderPhone,
                                'name' => $this->senderName,
                                'zipcode' => $this->senderZipcode,
                                'kecamatan_id' => $this->origin,
                                'schedule' => $pickupSchedule,
                                'platform_name' => 'Aroma Palace',
                                'payment_method' => 'credit',
                                'pin' => $this->pin,
                                'packages' => [$pkgNoItems],
                            ];

                            $retryV62Res = Http::withToken($this->apiKey)
                                ->withHeaders([
                                    'Accept' => 'application/json',
                                    'Content-Type' => 'application/json',
                                ])->post(rtrim($this->baseUrl, '/').'/api/mitra/v6.2/request_pickup', $v62PayloadNoItems);

                            if ($retryV62Res->successful() && ($retryV62Res->json('status') === true) && (! empty($retryV62Res->json('details')) || ! empty($retryV62Res->json('pickup_number')))) {
                                $successfulResponse = $retryV62Res->json();
                                $succeededCourier = $currCourier;
                                $succeededService = $currServiceType;
                                $wasAdapted = ! empty($attempt['is_alternative']) || ($currCourier !== $courier);
                                break;
                            }
                        } catch (\Throwable $e) {
                            // ignore
                        }
                    }

                    $noItemsData = clone $pickupData;
                    $pkgNoItemsObj = clone $pkg;
                    $pkgNoItemsObj->items = null;
                    $noItemsData->packages = new RequestPickupDataList;
                    $noItemsData->packages->add($pkgNoItemsObj);
                    try {
                        $retryItemsRes = KiriminAja::requestPickup($noItemsData);
                        if ($retryItemsRes->status && ! empty($retryItemsRes->data)) {
                            $successfulResponse = (array) $retryItemsRes->data;
                            $succeededCourier = $currCourier;
                            $succeededService = $currServiceType;
                            $wasAdapted = ! empty($attempt['is_alternative']) || ($currCourier !== $courier);
                            break;
                        }
                    } catch (\Throwable $e) {
                        // ignore and continue
                    }
                }

                // Jika terjadi duplikasi order_id atau error umum, coba retry dengan fresh prefix
                if (! $successfulResponse && (
                    str_contains(strtolower($lastError), 'terjadi kesalahan') ||
                    str_contains(strtolower($lastError), 'already') ||
                    str_contains(strtolower($lastError), 'duplikat') ||
                    str_contains(strtolower($lastError), 'diproses ulang') ||
                    str_contains(strtolower($lastError), 'dicancel owner')
                )) {
                    $tracked = $this->checkExistingShipment($pkg->order_id);
                    if ($tracked) {
                        $this->updateOrderTracking($order, $tracked['tracking_number'], $tracked['courier'], $tracked['service'], $tracked['booking_id']);

                        return $tracked;
                    }

                    $freshOrderId = Str::limit($cleanPrefix.'-'.strtoupper(Str::random(10)), 20, '');
                    $pkg->order_id = $freshOrderId;

                    if (! empty($this->pin)) {
                        try {
                            $v62RetryPayload = [
                                'address' => $this->senderAddress,
                                'phone' => $this->senderPhone,
                                'name' => $this->senderName,
                                'zipcode' => $this->senderZipcode,
                                'kecamatan_id' => $this->origin,
                                'schedule' => $pickupSchedule,
                                'platform_name' => 'Aroma Palace',
                                'payment_method' => 'credit',
                                'pin' => $this->pin,
                                'packages' => [$pkg->toArray()],
                            ];

                            $retryFreshRes = Http::withToken($this->apiKey)
                                ->withHeaders([
                                    'Accept' => 'application/json',
                                    'Content-Type' => 'application/json',
                                ])->post(rtrim($this->baseUrl, '/').'/api/mitra/v6.2/request_pickup', $v62RetryPayload);

                            if ($retryFreshRes->successful() && ($retryFreshRes->json('status') === true) && (! empty($retryFreshRes->json('details')) || ! empty($retryFreshRes->json('pickup_number')))) {
                                $successfulResponse = $retryFreshRes->json();
                                $succeededCourier = $currCourier;
                                $succeededService = $currServiceType;
                                $wasAdapted = ! empty($attempt['is_alternative']) || ($currCourier !== $courier);
                                break;
                            }
                        } catch (\Throwable $e) {
                            $lastError = $e->getMessage();
                        }
                    }

                    $retryPickupData = clone $pickupData;
                    $retryPickupData->packages = new RequestPickupDataList;
                    $retryPickupData->packages->add($pkg);

                    try {
                        $retryRes = KiriminAja::requestPickup($retryPickupData);
                        if ($retryRes->status && ! empty($retryRes->data)) {
                            $successfulResponse = (array) $retryRes->data;
                            $succeededCourier = $currCourier;
                            $succeededService = $currServiceType;
                            $wasAdapted = ! empty($attempt['is_alternative']) || ($currCourier !== $courier);
                            break;
                        }
                    } catch (\Throwable $e) {
                        $lastError = $e->getMessage();
                    }
                }
            }

            // 4. Jika seluruh percobaan gagal, periksa alasan (401 IP Whitelist / Ekspedisi)
            if (! $successfulResponse) {
                $is401 = str_contains(strtolower($lastError), '401') || str_contains(strtolower($lastError), 'unauthorized');
                if ($is401) {
                    $blockedIp = $this->detectBlockedIp() ?? '153.60.130.156';
                    $lastError = "Akses API KiriminAja ditolak (HTTP 401). IP server/koneksi Anda [{$blockedIp}] belum terdaftar di IP Whitelist KiriminAja. Silakan tambahkan IP {$blockedIp} di Dashboard KiriminAja -> Pengaturan / Integrasi -> IP Whitelist.";
                } elseif (str_contains(strtolower($lastError), 'tidak tersedia')) {
                    $lastError .= '. Pastikan ekspedisi '.strtoupper($courier).' telah diaktifkan di Dashboard KiriminAja -> Pengaturan / Integrasi -> Ekspedisi, atau pastikan saldo KA Pay mencukupi.';
                }

                // Jika allow_simulation_fallback aktif di lingkungan local / development, terbitkan resi simulasi sandbox
                // agar admin tetap dapat memproses pesanan dan menguji alur tanpa terhenti
                if (config('services.kiriminaja.allow_simulation_fallback', true) && app()->environment('local', 'testing', 'development')) {
                    Log::warning("KiriminAja SDK requestPickup notice: {$lastError}. Mengalihkan ke resi simulasi sandbox.");

                    $simTracking = 'KA-'.strtoupper($courier).'-'.rand(1000000000, 9999999999);
                    $simBooking = 'BKG-'.strtoupper(Str::random(8));

                    $this->updateOrderTracking($order, $simTracking, strtoupper($courier), strtoupper($service), $simBooking);

                    return [
                        'success' => true,
                        'courier' => strtoupper($courier),
                        'service' => strtoupper($service),
                        'tracking_number' => $simTracking,
                        'booking_id' => $simBooking,
                        'is_simulation' => true,
                        'adapted' => false,
                        'source' => 'kiriminaja_sandbox',
                        'warning' => $lastError,
                        'message' => "Resi simulasi KiriminAja diterbitkan ({$simTracking}).",
                    ];
                }

                Log::warning("KiriminAja SDK requestPickup failed: {$lastError}");

                return [
                    'success' => false,
                    'courier' => strtoupper($courier),
                    'service' => strtoupper($service),
                    'tracking_number' => '',
                    'booking_id' => '',
                    'is_simulation' => false,
                    'adapted' => false,
                    'source' => 'kiriminaja_error',
                    'message' => $lastError,
                ];
            }

            // 5. Parsing response dan ambil nomor AWB / Resi resmi
            $details = $successfulResponse['details'] ?? [];
            $firstDetail = (is_array($details) && isset($details[0]) && is_array($details[0]))
                ? $details[0]
                : (is_array($details) ? $details : []);

            $awb = $firstDetail['awb']
                ?? ($firstDetail['tracking_number']
                ?? ($successfulResponse['awb']
                ?? ($successfulResponse['tracking_number'] ?? null)));

            $pickupNumber = $successfulResponse['pickup_number']
                ?? ($firstDetail['pickup_number']
                ?? ($successfulResponse['booking_id']
                ?? ($firstDetail['booking_id'] ?? null)));

            $bookingId = $pickupNumber ?: ($firstDetail['order_id'] ?? ($firstDetail['kj_order_id'] ?? $kiriminAjaOrderId));

            // Jika AWB belum ada di response awal (asynchronous AWB generation), ambil AWB via tracking
            if (empty($awb)) {
                try {
                    usleep(500000); // jeda 0.5 detik agar worker KiriminAja selesai men-generate resi
                    $trackRes = Http::withToken($this->apiKey)
                        ->withHeaders([
                            'Accept' => 'application/json',
                        ])->post(rtrim($this->baseUrl, '/').'/api/mitra/tracking', [
                            'order_id' => $kiriminAjaOrderId,
                        ]);
                    if ($trackRes->successful() && ! empty($trackRes->json('details.awb'))) {
                        $awb = $trackRes->json('details.awb');
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            // Nomor resi pengiriman
            $trackingNumber = (! empty($awb) && is_string($awb))
                ? $awb
                : ($pickupNumber ?: $kiriminAjaOrderId);

            // Simpan resi ke order
            $this->updateOrderTracking($order, $trackingNumber, strtoupper($succeededCourier), strtoupper($succeededService), $bookingId);

            return [
                'success' => true,
                'courier' => strtoupper($succeededCourier),
                'service' => strtoupper($succeededService),
                'tracking_number' => (string) $trackingNumber,
                'booking_id' => (string) $bookingId,
                'is_simulation' => false,
                'adapted' => $wasAdapted,
                'original_courier' => strtoupper($courier),
                'source' => 'kiriminaja_live',
                'message' => 'Resi otomatis KiriminAja berhasil diterbitkan ('.($pickupNumber ?: $trackingNumber).').',
            ];
        }

        // Simulasi Resi Resmi Kurir Otomatis (Testing & Sandbox Fallback)
        $trackingNumber = 'KA-'.strtoupper($courier).'-'.rand(1000000000, 9999999999);
        $bookingId = 'BKG-'.strtoupper(Str::random(8));

        $this->updateOrderTracking($order, $trackingNumber, strtoupper($courier), strtoupper($service), $bookingId);

        return [
            'success' => true,
            'courier' => strtoupper($courier),
            'service' => strtoupper($service),
            'tracking_number' => $trackingNumber,
            'booking_id' => $bookingId,
            'is_simulation' => true,
            'adapted' => false,
            'source' => 'kiriminaja_simulation',
            'message' => "Resi simulasi berhasil diterbitkan ({$trackingNumber}).",
        ];
    }

    /**
     * Alias backward-compatibility untuk requestPickupForOrder.
     */
    public function requestPickupForOrder(Order $order): array
    {
        return $this->createShipment($order);
    }

    /**
     * Cek apakah pengiriman untuk order_id ini sudah sukses terdaftar di KiriminAja sebelumnya.
     *
     * @return array{success: bool, tracking_number: string, courier: string, service: string, booking_id: string, source: string, message: string}|null
     */
    public function checkExistingShipment(string $orderId): ?array
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(5)
                ->post("{$this->baseUrl}/api/mitra/tracking", [
                    'order_id' => $orderId,
                ]);

            if ($response->successful()) {
                $json = $response->json() ?? [];
                $details = $json['details'] ?? null;
                $awb = $details['awb'] ?? ($details['tracking_number'] ?? ($json['awb'] ?? null));
                if (! empty($awb)) {
                    return [
                        'success' => true,
                        'tracking_number' => (string) $awb,
                        'courier' => (string) ($details['service'] ?? 'JNE'),
                        'service' => (string) ($details['service_type'] ?? 'REG'),
                        'booking_id' => (string) ($details['order_id'] ?? $orderId),
                        'source' => 'kiriminaja_live',
                        'is_simulation' => false,
                        'adapted' => false,
                        'message' => "Pengiriman #{$orderId} sudah terdaftar sebelumnya dengan AWB {$awb}.",
                    ];
                }
            }
        } catch (\Throwable $e) {
            // Ignore tracking check errors
        }

        return null;
    }

    /**
     * Update nomor resi dan kurir pesanan di database.
     */
    public function updateOrderTracking(Order $order, string $trackingNumber, string $courier, ?string $service = null, ?string $bookingId = null): void
    {
        $order->tracking_number = $trackingNumber;
        if (! empty($courier)) {
            $formattedCourier = strtoupper($courier);
            if (! empty($service) && ! str_contains(strtoupper((string) $order->courier), $formattedCourier)) {
                $order->courier = $formattedCourier.' ('.strtoupper($service).')';
            } elseif (empty($order->courier)) {
                $order->courier = $formattedCourier;
            }
        }
        $order->save();
    }

    /**
     * Cari ID kecamatan tujuan pengiriman berdasarkan snapshot / alamat pesanan.
     */
    public function resolveDestinationDistrictId(Order $order): int
    {
        if ($order->user_id) {
            $addr = UserAddress::where('user_id', $order->user_id)
                ->when($order->district_name, fn ($q) => $q->where('district_name', $order->district_name))
                ->whereNotNull('district_id')
                ->first()
                ?: UserAddress::where('user_id', $order->user_id)
                    ->whereNotNull('district_id')
                    ->first();

            if ($addr && $addr->district_id) {
                return (int) $addr->district_id;
            }
        }

        if (! empty($order->district_name)) {
            try {
                $searchRes = KiriminAja::getDistrictByName($order->district_name);
                if ($searchRes->status && ! empty($searchRes->data)) {
                    $raw = is_array($searchRes->data) ? $searchRes->data : [];
                    $first = (array) ($raw[0] ?? []);
                    if (! empty($first['id'])) {
                        return (int) $first['id'];
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Failed to resolve district by name '{$order->district_name}': ".$e->getMessage());
            }
        }

        $cityName = (string) ($order->city_name ?: ($order->city ?: ''));
        if (! empty($cityName)) {
            return $this->resolveCityId($cityName);
        }

        return $this->origin ?: 2101;
    }

    /**
     * Cari ID kecamatan berdasarkan nama kota/daerah.
     */
    public function resolveCityId(string $cityName): int
    {
        if (empty($cityName)) {
            return $this->origin ?: 2101;
        }

        try {
            $searchRes = KiriminAja::getDistrictByName($cityName);
            if ($searchRes->status && ! empty($searchRes->data)) {
                $raw = is_array($searchRes->data) ? $searchRes->data : [];
                $first = (array) ($raw[0] ?? []);
                if (! empty($first['id'])) {
                    return (int) $first['id'];
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return $this->origin ?: 2101;
    }

    /**
     * Dapatkan daftar layanan kurir aktif beserta tarif real-time dari SDK KiriminAja.
     *
     * @return array<int, array{service: string, service_type: string, service_name: string, cost: int}>
     */
    public function getLivePricingServices(int $originDistrictId, int $destinationDistrictId, int $weightGrams, array $couriers = []): array
    {
        $rates = $this->getShippingRates($originDistrictId, $destinationDistrictId, $weightGrams, $couriers);

        return array_map(function ($r) {
            return [
                'service' => strtolower((string) ($r['courier_code'] ?? '')),
                'service_type' => (string) ($r['service'] ?? ''),
                'service_name' => (string) ($r['name'] ?? ''),
                'cost' => (int) ($r['price'] ?? 0),
            ];
        }, $rates);
    }

    /**
     * Ambil jadwal pickup aktif terdekat.
     */
    public function resolvePickupSchedule(): string
    {
        $pickupSchedule = now()->addDay()->format('Y-m-d 14:00:00');
        try {
            $schedRes = Http::withToken($this->apiKey)
                ->withHeaders(['Accept' => 'application/json', 'Content-Type' => 'application/json'])
                ->timeout(5)
                ->post("{$this->baseUrl}/api/mitra/v2/schedules");

            if ($schedRes->successful() && ($schedRes->json('status') ?? false)) {
                $schedules = $schedRes->json('schedules') ?? [];
                foreach ($schedules as $slot) {
                    if (empty($slot['libur']) && ! empty($slot['clock'])) {
                        return (string) $slot['clock'];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('KiriminAja schedule fetch error: '.$e->getMessage());
        }

        return $pickupSchedule;
    }

    /**
     * Deteksi IP publik server jika terkena blokir IP Whitelist KiriminAja.
     */
    public function detectBlockedIp(): ?string
    {
        try {
            $ipRes = Http::timeout(3)->get('https://api.ipify.org?format=json');
            if ($ipRes->successful() && ! empty($ipRes->json('ip'))) {
                return (string) $ipRes->json('ip');
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return request()->server('SERVER_ADDR') ?? '153.60.130.156';
    }

    /**
     * Test connection & authentication to KiriminAja API.
     *
     * @return array{success: bool, mode: string, message: string}
     */
    public function testConnection(?string $apiKey = null, ?string $mode = null, ?string $baseUrl = null): array
    {
        $testMode = $mode ?: $this->mode;
        $testKey = $apiKey !== null ? trim($apiKey) : $this->apiKey;

        if (empty($testKey)) {
            return [
                'success' => false,
                'mode' => $testMode,
                'message' => 'API Key KiriminAja belum diatur atau kosong.',
            ];
        }

        $base = $baseUrl ?: ($testMode === 'production' ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com');

        try {
            $response = Http::withToken($testKey)
                ->withHeaders(['Accept' => 'application/json'])
                ->timeout(8)
                ->post("{$base}/api/mitra/v2/provinces");

            if ($response->successful() && ($response->json('status') ?? false)) {
                return [
                    'success' => true,
                    'mode' => $testMode,
                    'message' => 'Koneksi ke KiriminAja berhasil terhubung.',
                ];
            }

            $msg = $response->json('text') ?? ($response->json('message') ?? 'Kredensial API Key tidak valid.');

            return [
                'success' => false,
                'mode' => $testMode,
                'message' => (string) $msg,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'mode' => $testMode,
                'message' => 'Gagal menghubungi server KiriminAja: '.$e->getMessage(),
            ];
        }
    }
}
