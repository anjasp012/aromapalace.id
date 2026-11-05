<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\KurirAPIService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShippingServiceController extends Controller
{
    public function __construct(
        protected KurirAPIService $kurirAPIService
    ) {}

    /**
     * Display the courier & shipping origin settings page with balance.
     */
    public function index(): Response
    {
        $allSettings = Setting::pluck('value', 'key')->all();

        $settings = [
            'kurirapi_key' => $allSettings['kurirapi_key'] ?? '',
            'shipping_sender_name' => $allSettings['shipping_sender_name'] ?? 'Aroma Palace Official',
            'shipping_sender_phone' => $allSettings['shipping_sender_phone'] ?? '081288889999',
            'shipping_address' => $allSettings['shipping_address'] ?? 'Jl. Kemang Raya No. 10',
            'shipping_province_id' => $allSettings['shipping_province_id'] ?? '31',
            'shipping_province_name' => $allSettings['shipping_province_name'] ?? 'DKI Jakarta',
            'shipping_city_id' => $allSettings['shipping_city_id'] ?? '3174',
            'shipping_city_name' => $allSettings['shipping_city_name'] ?? 'Kota Jakarta Selatan',
            'shipping_district_id' => $allSettings['shipping_district_id'] ?? '317407',
            'shipping_district_name' => $allSettings['shipping_district_name'] ?? 'Kebayoran Baru',
            'shipping_subdistrict_name' => $allSettings['shipping_subdistrict_name'] ?? 'Kramat Pela',
            'shipping_postal_code' => $allSettings['shipping_postal_code'] ?? '12130',
            'shipping_latitude' => $allSettings['shipping_latitude'] ?? ($allSettings['latitude'] ?? '-6.2608'),
            'shipping_longitude' => $allSettings['shipping_longitude'] ?? ($allSettings['longitude'] ?? '106.8152'),
        ];

        // Fetch balance from KurirAPI
        $balanceData = $this->kurirAPIService->getBalance();
        $isSuccess = (bool) ($balanceData['is_success'] ?? false);
        $rawBalance = $balanceData['data']['balance'] ?? null;
        $currency = $balanceData['data']['currency'] ?? 'IDR';

        $balance = [
            'is_connected' => $isSuccess,
            'amount' => $rawBalance !== null ? (int) $rawBalance : null,
            'amount_formatted' => $rawBalance !== null ? 'Rp '.number_format((int) $rawBalance, 0, ',', '.') : 'Tidak dapat memuat saldo',
            'currency' => $currency,
            'message' => $balanceData['message'] ?? ($isSuccess ? 'Terhubung' : 'Gagal menghubungi server'),
        ];

        // Preload locations
        $provinceId = (int) ($settings['shipping_province_id'] ?? 0);
        $cityId = (int) ($settings['shipping_city_id'] ?? 0);

        $rawProvinces = $this->kurirAPIService->getProvinces();
        $provincesData = is_array($rawProvinces) ? ($rawProvinces['data'] ?? (array_is_list($rawProvinces) ? $rawProvinces : [])) : [];
        $initialProvinces = array_map(fn ($p) => [
            'id' => (int) ($p['code'] ?? $p['id']),
            'name' => (string) ($p['name'] ?? ''),
        ], $provincesData);

        $initialCities = [];
        if ($provinceId > 0) {
            $rawCities = $this->kurirAPIService->getCities($provinceId);
            $citiesData = is_array($rawCities) ? ($rawCities['data'] ?? (array_is_list($rawCities) ? $rawCities : [])) : [];
            $initialCities = array_map(fn ($c) => [
                'id' => (int) ($c['code'] ?? $c['id']),
                'name' => (string) ($c['name'] ?? ''),
                'type' => str_starts_with((string) ($c['name'] ?? ''), 'Kota') ? 'Kota' : 'Kabupaten',
            ], $citiesData);
        }

        $initialDistricts = [];
        if ($cityId > 0) {
            $rawDistricts = $this->kurirAPIService->getDistricts($cityId);
            $districtsData = is_array($rawDistricts) ? ($rawDistricts['data'] ?? (array_is_list($rawDistricts) ? $rawDistricts : [])) : [];
            $initialDistricts = array_map(fn ($d) => [
                'id' => (int) ($d['code'] ?? $d['id']),
                'name' => (string) ($d['name'] ?? ''),
            ], $districtsData);
        }

        return Inertia::render('admin/shipping-services/index', [
            'settings' => $settings,
            'balance' => $balance,
            'initial_provinces' => $initialProvinces,
            'initial_cities' => $initialCities,
            'initial_districts' => $initialDistricts,
        ]);
    }

    /**
     * Update courier & shipping origin settings.
     */
    public function update(Request $request): RedirectResponse
    {
        if ($request->has('shipping_sender_phone')) {
            $request->merge([
                'shipping_sender_phone' => preg_replace('/[\s\-\.]/', '', (string) $request->input('shipping_sender_phone')),
            ]);
        }

        $validated = $request->validate([
            'kurirapi_key' => ['nullable', 'string', 'max:500'],
            'shipping_sender_name' => ['required', 'string', 'max:255'],
            'shipping_sender_phone' => ['required', 'string', 'max:25', 'regex:/^(\+628|628|08|02)[0-9]{6,13}$/'],
            'shipping_address' => ['required', 'string', 'max:1000'],
            'shipping_province_id' => ['nullable', 'integer'],
            'shipping_province_name' => ['nullable', 'string', 'max:255'],
            'shipping_city_id' => ['nullable', 'integer'],
            'shipping_city_name' => ['nullable', 'string', 'max:255'],
            'shipping_district_id' => ['required', 'integer'],
            'shipping_district_name' => ['nullable', 'string', 'max:255'],
            'shipping_subdistrict_name' => ['nullable', 'string', 'max:255'],
            'shipping_postal_code' => ['nullable', 'string', 'max:20'],
            'shipping_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'shipping_longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ], [
            'shipping_sender_phone.regex' => 'Nomor telepon pengirim harus dimulai dengan 08, 628, +628, atau 02 dan hanya berisi angka.',
            'shipping_district_id.required' => 'Kecamatan asal pengiriman (Origin ID) wajib dipilih.',
        ]);

        $settingConfigs = [
            'kurirapi_key' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_sender_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_sender_phone' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_address' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_province_id' => ['group' => 'shipping', 'type' => 'integer'],
            'shipping_province_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_city_id' => ['group' => 'shipping', 'type' => 'integer'],
            'shipping_city_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_district_id' => ['group' => 'shipping', 'type' => 'integer'],
            'shipping_district_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_subdistrict_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_postal_code' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_latitude' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_longitude' => ['group' => 'shipping', 'type' => 'string'],
        ];

        foreach ($settingConfigs as $key => $config) {
            if (array_key_exists($key, $validated)) {
                Setting::set(
                    $key,
                    $validated[$key],
                    $config['group'],
                    $config['type']
                );
            }
        }

        Setting::clearCache();

        return back()->with('success', 'Pengaturan layanan pengiriman dan origin butik berhasil disimpan.');
    }
}
