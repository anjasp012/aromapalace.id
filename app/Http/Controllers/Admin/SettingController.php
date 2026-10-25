<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\KiriminAjaService;
use Illuminate\Http\JsonResponse;
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

        // Ensure defaults for KiriminAja integration
        $settings['kiriminaja_mode'] = $settings['kiriminaja_mode'] ?? 'staging';
        $settings['kiriminaja_api_key'] = $settings['kiriminaja_api_key'] ?? '';
        $settings['kiriminaja_prefix'] = $settings['kiriminaja_prefix'] ?? 'ARPL';
        $settings['kiriminaja_pin'] = $settings['kiriminaja_pin'] ?? '123456';
        $settings['shipping_latitude'] = $settings['shipping_latitude'] ?? $settings['latitude'] ?? '';
        $settings['shipping_longitude'] = $settings['shipping_longitude'] ?? $settings['longitude'] ?? '';
        $settings['latitude'] = $settings['shipping_latitude'];
        $settings['longitude'] = $settings['shipping_longitude'];

        $kiriminAja = app(KiriminAjaService::class);
        $fetchWithRetry = function (callable $callback): array {
            $res = $callback();
            if (! empty($res) && is_array($res)) {
                return $res;
            }
            for ($i = 0; $i < 2; $i++) {
                usleep(300000);
                $res = $callback();
                if (! empty($res) && is_array($res)) {
                    return $res;
                }
            }

            return is_array($res) ? $res : [];
        };

        $initialProvinces = $fetchWithRetry(fn () => $kiriminAja->getProvinces());

        $provinceId = (int) ($settings['shipping_province_id'] ?? 0);
        $initialCities = $provinceId > 0 ? $fetchWithRetry(fn () => $kiriminAja->getCities($provinceId)) : [];

        $cityId = (int) ($settings['shipping_city_id'] ?? 0);
        $initialDistricts = $cityId > 0 ? $fetchWithRetry(fn () => $kiriminAja->getDistricts($cityId)) : [];

        $districtId = (int) ($settings['shipping_district_id'] ?? 0);
        $initialSubdistricts = $districtId > 0 ? $fetchWithRetry(fn () => $kiriminAja->getSubdistricts($districtId)) : [];

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

            // Shipping & KiriminAja Origin
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

            // KiriminAja API Integration
            'kiriminaja_mode' => ['nullable', 'string', 'in:staging,production'],
            'kiriminaja_api_key' => ['nullable', 'string', 'max:500'],
            'kiriminaja_prefix' => ['nullable', 'string', 'max:20'],
            'kiriminaja_pin' => ['nullable', 'string', 'max:10'],
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

        if (isset($validated['kiriminaja_api_key'])) {
            $validated['kiriminaja_api_key'] = trim((string) $validated['kiriminaja_api_key']);
        }
        if (isset($validated['kiriminaja_prefix'])) {
            $validated['kiriminaja_prefix'] = strtoupper(trim((string) $validated['kiriminaja_prefix']));
        }
        if (isset($validated['kiriminaja_pin'])) {
            $validated['kiriminaja_pin'] = trim((string) $validated['kiriminaja_pin']);
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
            'kiriminaja_mode' => ['group' => 'shipping', 'type' => 'string'],
            'kiriminaja_api_key' => ['group' => 'shipping', 'type' => 'string'],
            'kiriminaja_prefix' => ['group' => 'shipping', 'type' => 'string'],
            'kiriminaja_pin' => ['group' => 'shipping', 'type' => 'string'],
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

        return back()->with('success', 'Pengaturan toko, integrasi KiriminAja, dan alamat asal berhasil disimpan.');
    }

    /**
     * Test KiriminAja API connection and authorization.
     */
    public function testKiriminAja(Request $request, KiriminAjaService $service): JsonResponse
    {
        $validated = $request->validate([
            'mode' => ['nullable', 'string', 'in:staging,production'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'base_url' => ['nullable', 'string', 'max:255'],
        ]);

        $apiKey = array_key_exists('api_key', $request->all())
            ? (string) ($request->input('api_key') ?? '')
            : null;

        $result = method_exists($service, 'testConnection')
            ? $service->testConnection(
                $apiKey,
                $validated['mode'] ?? null,
                $validated['base_url'] ?? null
            )
            : [
                'success' => ! empty($apiKey),
                'mode' => $validated['mode'] ?? 'staging',
                'message' => empty($apiKey) ? 'API key kosong.' : 'Terkoneksi.',
            ];

        return response()->json($result);
    }
}
