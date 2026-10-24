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
        // Request pickup
        $pickup = new RequestPickupData();
        $pickup->address = "Jl. Jodipati No.29";
        $pickup->phone = "08133345678";
        $pickup->name = "Tokotries";
        $pickup->kecamatan_id = 548;
        $pickup->schedule = "2024-01-15 17:00:00";
        $pickup->platform_name = "mitra";

        $package = new PackageData();
        $package->order_id = "YGL-000000019";
        $package->destination_name = "Flag Test";
        $package->destination_phone = "082223323333";
        $package->destination_address = "Jl. Magelang KM 11";
        $package->destination_kecamatan_id = 548;
        $package->weight = 520;
        $package->width = 8;
        $package->height = 8;
        $package->length = 8;
        $package->item_value = 275000;
        $package->shipping_cost = 65000;
        $package->service = "jne";
        $package->service_type = "REG";
        $package->item_name = "Test item";
        $package->package_type_id = 1;
        $package->cod = 0;

        // `items` is optional. When provided, it lists the individual items
        // contained in the package. `item_value` is still required.
        $item = new PackageItemData();
        $item->name = "Kaos Polos";
        $item->price = 125000;
        $item->qty = 2;
        $item->weight = 260;
        $item->width = 4;
        $item->length = 4;
        $item->height = 4;
        $item->metadata = new PackageItemMetadata();
        $item->metadata->sku = "KP-001";
        $item->metadata->variant_label = "Merah / L";
        $package->items = [$item];

        $pickup->packages->add($package);
        dd(KiriminAja::requestPickup($pickup));

    }

}
