<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoverageCity;
use App\Models\CoverageDistrict;
use App\Models\CoverageProvince;
use App\Models\CoverageSubdistrict;
use App\Models\Setting;
use App\Services\RajaOngkirShippingCostService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Display the admin store and shipping settings page.
     */
    public function index(): Response
    {
        $settings = Setting::getAll();

        // Ensure defaults for RajaOngkir payment & shipping gateway integration
        $settings['rajaongkir_shipping_key'] = $settings['rajaongkir_shipping_key'] ?? '';
        $settings['rajaongkir_shipping_origin'] = $settings['shipping_district_id'] ?? $settings['rajaongkir_shipping_origin'] ?? '2101';
        $settings['rajaongkir_payment_mode'] = $settings['rajaongkir_payment_mode'] ?? 'sandbox';
        $settings['rajaongkir_payment_key'] = $settings['rajaongkir_payment_key'] ?? '';
        $settings['rajaongkir_callback_url'] = $settings['rajaongkir_callback_url'] ?? '';
        $settings['rajaongkir_callback_api_key'] = $settings['rajaongkir_callback_api_key'] ?? '';

        $settings['shipping_latitude'] = $settings['shipping_latitude'] ?? $settings['latitude'] ?? '';
        $settings['shipping_longitude'] = $settings['shipping_longitude'] ?? $settings['longitude'] ?? '';
        $settings['latitude'] = $settings['shipping_latitude'];
        $settings['longitude'] = $settings['shipping_longitude'];

        // Ensure defaults for Mobile App & Update settings
        $settings['app_min_version'] = $settings['app_min_version'] ?? '1.0.0';
        $settings['app_latest_version'] = $settings['app_latest_version'] ?? '1.0.0';
        $settings['app_force_update'] = filter_var($settings['app_force_update'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $settings['app_update_title'] = $settings['app_update_title'] ?? 'Pembaruan Aplikasi Tersedia';
        $settings['app_update_message'] = $settings['app_update_message'] ?? 'Versi baru aplikasi Aroma Palace telah tersedia dengan peningkatan fitur dan stabilitas. Mohon perbarui aplikasi Anda untuk melanjutkan berbelanja.';
        $settings['app_playstore_url'] = $settings['app_playstore_url'] ?? 'https://play.google.com/store/apps/details?id=com.aromapalace.app';
        $settings['app_appstore_url'] = $settings['app_appstore_url'] ?? 'https://apps.apple.com/app/aromapalace/id6740000000';

        $rajaOngkir = app(RajaOngkirShippingCostService::class);
        $provinceId = (int) ($settings['shipping_province_id'] ?? 0);
        $cityId = (int) ($settings['shipping_city_id'] ?? 0);
        $districtId = (int) ($settings['shipping_district_id'] ?? 0);

        // 1. Provinces: Load from Database first (0 API hits)
        $initialProvinces = CoverageProvince::query()->orderBy('name')->get(['id', 'name'])->toArray();
        if (empty($initialProvinces)) {
            $raw = $rajaOngkir->getProvinces();
            if (is_array($raw) && isset($raw['data']) && is_array($raw['data'])) {
                $now = now();
                $records = [];
                foreach ($raw['data'] as $p) {
                    if (is_array($p) && isset($p['id'])) {
                        $records[] = [
                            'id' => (int) $p['id'],
                            'name' => (string) ($p['name'] ?? ''),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
                if (! empty($records)) {
                    CoverageProvince::upsert($records, ['id'], ['name', 'updated_at']);
                    $initialProvinces = array_map(fn ($r) => ['id' => $r['id'], 'name' => $r['name']], $records);
                }
            }
        }

        // 2. Cities: Load from Database first (0 API hits)
        $initialCities = $provinceId > 0
            ? CoverageCity::query()->where('province_id', $provinceId)->orderBy('name')->get(['id', 'name', 'type'])->toArray()
            : [];
        if ($provinceId > 0 && empty($initialCities)) {
            $raw = $rajaOngkir->getCities($provinceId);
            if (is_array($raw) && isset($raw['data']) && is_array($raw['data'])) {
                $now = now();
                $records = [];
                foreach ($raw['data'] as $c) {
                    if (is_array($c) && isset($c['id'])) {
                        $records[] = [
                            'id' => (int) $c['id'],
                            'province_id' => $provinceId,
                            'name' => (string) ($c['name'] ?? ''),
                            'type' => (string) ($c['type'] ?? ''),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
                if (! empty($records)) {
                    CoverageCity::upsert($records, ['id'], ['province_id', 'name', 'type', 'updated_at']);
                    $initialCities = array_map(fn ($r) => ['id' => $r['id'], 'name' => $r['name'], 'type' => $r['type']], $records);
                }
            }
        }

        // 3. Districts: Load from Database first (0 API hits)
        $initialDistricts = $cityId > 0
            ? CoverageDistrict::query()->where('city_id', $cityId)->orderBy('name')->get(['id', 'name'])->toArray()
            : [];
        if ($cityId > 0 && empty($initialDistricts)) {
            $raw = $rajaOngkir->getDistricts($cityId);
            if (is_array($raw) && isset($raw['data']) && is_array($raw['data'])) {
                $now = now();
                $records = [];
                foreach ($raw['data'] as $d) {
                    if (is_array($d) && isset($d['id'])) {
                        $records[] = [
                            'id' => (int) $d['id'],
                            'city_id' => $cityId,
                            'name' => (string) ($d['name'] ?? ''),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
                if (! empty($records)) {
                    CoverageDistrict::upsert($records, ['id'], ['city_id', 'name', 'updated_at']);
                    $initialDistricts = array_map(fn ($r) => ['id' => $r['id'], 'name' => $r['name']], $records);
                }
            }
        }

        // 4. Subdistricts: Load from Database first (0 API hits)
        $initialSubdistricts = $districtId > 0
            ? CoverageSubdistrict::query()->where('district_id', $districtId)->orderBy('name')->get(['id', 'name', 'postal_code'])->toArray()
            : [];
        if ($districtId > 0 && empty($initialSubdistricts)) {
            $raw = $rajaOngkir->getSubDistricts($districtId);
            if (is_array($raw) && isset($raw['data']) && is_array($raw['data'])) {
                $now = now();
                $records = [];
                foreach ($raw['data'] as $s) {
                    if (is_array($s) && isset($s['id'])) {
                        $records[] = [
                            'id' => (int) $s['id'],
                            'district_id' => $districtId,
                            'name' => (string) ($s['name'] ?? ''),
                            'postal_code' => (string) ($s['zip_code'] ?? ($s['postal_code'] ?? '')),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
                if (! empty($records)) {
                    CoverageSubdistrict::upsert($records, ['id'], ['district_id', 'name', 'postal_code', 'updated_at']);
                    $initialSubdistricts = array_map(fn ($r) => ['id' => $r['id'], 'name' => $r['name'], 'postal_code' => $r['postal_code']], $records);
                }
            }
        }

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
            'initial_provinces' => $initialProvinces,
            'initial_cities' => $initialCities,
            'initial_districts' => $initialDistricts,
            'initial_subdistricts' => $initialSubdistricts,
        ]);
    }

    /**
     * Update store and shipping origin settings.
     */
    public function update(Request $request): RedirectResponse
    {
        foreach (['shipping_sender_phone', 'store_phone', 'store_whatsapp'] as $phoneField) {
            if ($request->has($phoneField) && filled($request->input($phoneField))) {
                $request->merge([
                    $phoneField => preg_replace('/[\s\-\.]/', '', (string) $request->input($phoneField)),
                ]);
            }
        }

        $validated = $request->validate([
            // Store & Contact Info
            'store_name' => ['required', 'string', 'max:255'],
            'store_email' => ['nullable', 'email', 'max:255'],
            'store_phone' => ['nullable', 'string', 'max:25', 'regex:/^(\+628|628|08|02)[0-9]{6,13}$/'],
            'store_whatsapp' => ['nullable', 'string', 'max:25', 'regex:/^(\+628|628|08|02)[0-9]{6,13}$/'],
            'store_description' => ['nullable', 'string', 'max:1000'],

            // Shipping Origin
            'shipping_sender_name' => ['required', 'string', 'max:255'],
            'shipping_sender_phone' => ['required', 'string', 'max:25', 'regex:/^(\+628|628|08|02)[0-9]{6,13}$/'],
            'shipping_address' => ['required', 'string', 'max:1000'],
            'shipping_province_id' => ['nullable', 'integer'],
            'shipping_province_name' => ['nullable', 'string', 'max:255'],
            'shipping_city_id' => ['nullable', 'integer'],
            'shipping_city_name' => ['nullable', 'string', 'max:255'],
            'shipping_district_id' => ['required', 'integer'],
            'shipping_district_name' => ['nullable', 'string', 'max:255'],
            'shipping_subdistrict_id' => ['nullable', 'integer'],
            'shipping_subdistrict_name' => ['nullable', 'string', 'max:255'],
            'shipping_postal_code' => ['nullable', 'string', 'max:20'],
            'shipping_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'shipping_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            // RajaOngkir API Integration
            'rajaongkir_shipping_key' => ['nullable', 'string', 'max:500'],
            'rajaongkir_shipping_origin' => ['nullable', 'integer'],
            'rajaongkir_payment_mode' => ['nullable', 'string', 'in:sandbox,production'],
            'rajaongkir_payment_key' => ['nullable', 'string', 'max:500'],
            'rajaongkir_callback_url' => ['nullable', 'string', 'max:500'],
            'rajaongkir_callback_api_key' => ['nullable', 'string', 'max:500'],

            // Mobile App & Update Settings
            'app_min_version' => ['nullable', 'string', 'max:25'],
            'app_latest_version' => ['nullable', 'string', 'max:25'],
            'app_force_update' => ['nullable', 'boolean'],
            'app_update_title' => ['nullable', 'string', 'max:255'],
            'app_update_message' => ['nullable', 'string', 'max:1000'],
            'app_playstore_url' => ['nullable', 'url', 'max:500'],
            'app_appstore_url' => ['nullable', 'url', 'max:500'],
        ], [
            'shipping_sender_phone.regex' => 'Nomor telepon pengirim harus dimulai dengan 08, 628, +628, atau 02 dan hanya berisi angka.',
            'store_phone.regex' => 'Nomor telepon toko harus dimulai dengan 08, 628, +628, atau 02 dan hanya berisi angka.',
            'store_whatsapp.regex' => 'Nomor WhatsApp toko harus dimulai dengan 08, 628, +628, atau 02 dan hanya berisi angka.',
        ]);

        if (isset($validated['latitude']) && ! isset($validated['shipping_latitude'])) {
            $validated['shipping_latitude'] = $validated['latitude'];
        } elseif (isset($validated['shipping_latitude']) && ! isset($validated['latitude'])) {
            $validated['latitude'] = $validated['shipping_latitude'];
        }
        if (isset($validated['longitude']) && ! isset($validated['shipping_longitude'])) {
            $validated['shipping_longitude'] = $validated['longitude'];
        } elseif (isset($validated['shipping_longitude']) && ! isset($validated['longitude'])) {
            $validated['longitude'] = $validated['shipping_longitude'];
        }

        if ($request->has('app_force_update')) {
            $validated['app_force_update'] = $request->boolean('app_force_update') ? '1' : '0';
        }

        if (isset($validated['shipping_district_id'])) {
            $validated['rajaongkir_shipping_origin'] = (int) $validated['shipping_district_id'];
        }

        $settingConfigs = [
            'store_name' => ['group' => 'contact', 'type' => 'string'],
            'store_email' => ['group' => 'contact', 'type' => 'string'],
            'store_phone' => ['group' => 'contact', 'type' => 'string'],
            'store_whatsapp' => ['group' => 'contact', 'type' => 'string'],
            'store_description' => ['group' => 'contact', 'type' => 'string'],
            'shipping_sender_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_sender_phone' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_address' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_province_id' => ['group' => 'shipping', 'type' => 'integer'],
            'shipping_province_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_city_id' => ['group' => 'shipping', 'type' => 'integer'],
            'shipping_city_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_district_id' => ['group' => 'shipping', 'type' => 'integer'],
            'shipping_district_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_subdistrict_id' => ['group' => 'shipping', 'type' => 'integer'],
            'shipping_subdistrict_name' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_postal_code' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_latitude' => ['group' => 'shipping', 'type' => 'string'],
            'shipping_longitude' => ['group' => 'shipping', 'type' => 'string'],
            'latitude' => ['group' => 'shipping', 'type' => 'string'],
            'longitude' => ['group' => 'shipping', 'type' => 'string'],
            'rajaongkir_shipping_key' => ['group' => 'payment_gateway', 'type' => 'string'],
            'rajaongkir_shipping_origin' => ['group' => 'payment_gateway', 'type' => 'integer'],
            'rajaongkir_payment_mode' => ['group' => 'payment_gateway', 'type' => 'string'],
            'rajaongkir_payment_key' => ['group' => 'payment_gateway', 'type' => 'string'],
            'rajaongkir_callback_url' => ['group' => 'payment_gateway', 'type' => 'string'],
            'rajaongkir_callback_api_key' => ['group' => 'payment_gateway', 'type' => 'string'],
            'app_min_version' => ['group' => 'app_update', 'type' => 'string'],
            'app_latest_version' => ['group' => 'app_update', 'type' => 'string'],
            'app_force_update' => ['group' => 'app_update', 'type' => 'boolean'],
            'app_update_title' => ['group' => 'app_update', 'type' => 'string'],
            'app_update_message' => ['group' => 'app_update', 'type' => 'string'],
            'app_playstore_url' => ['group' => 'app_update', 'type' => 'string'],
            'app_appstore_url' => ['group' => 'app_update', 'type' => 'string'],
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

        return back()->with('success', 'Pengaturan toko, integrasi RajaOngkir, dan alamat asal berhasil disimpan.');
    }
}
