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
        $settings['kiriminaja_mode'] = $settings['kiriminaja_mode'] ?? config('services.kiriminaja.mode', 'staging');
        $settings['kiriminaja_api_key'] = $settings['kiriminaja_api_key'] ?? config('services.kiriminaja.api_key', '');
        $settings['kiriminaja_prefix'] = $settings['kiriminaja_prefix'] ?? config('services.kiriminaja.prefix', 'ARPL');

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update store and shipping origin settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // Store & Contact Info
            'store_name' => ['required', 'string', 'max:255'],
            'store_email' => ['nullable', 'email', 'max:255'],
            'store_phone' => ['nullable', 'string', 'max:50'],
            'store_whatsapp' => ['nullable', 'string', 'max:50'],
            'store_description' => ['nullable', 'string', 'max:1000'],

            // Shipping & KiriminAja Origin
            'shipping_sender_name' => ['required', 'string', 'max:255'],
            'shipping_sender_phone' => ['required', 'string', 'max:50'],
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

            // KiriminAja API Integration
            'kiriminaja_mode' => ['nullable', 'string', 'in:staging,production'],
            'kiriminaja_api_key' => ['nullable', 'string', 'max:500'],
            'kiriminaja_prefix' => ['nullable', 'string', 'max:20'],
        ]);

        if (isset($validated['kiriminaja_api_key'])) {
            $validated['kiriminaja_api_key'] = trim((string) $validated['kiriminaja_api_key']);
        }
        if (isset($validated['kiriminaja_prefix'])) {
            $validated['kiriminaja_prefix'] = strtoupper(trim((string) $validated['kiriminaja_prefix']));
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
            'kiriminaja_mode' => ['group' => 'shipping', 'type' => 'string'],
            'kiriminaja_api_key' => ['group' => 'shipping', 'type' => 'string'],
            'kiriminaja_prefix' => ['group' => 'shipping', 'type' => 'string'],
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
        ]);

        $apiKey = array_key_exists('api_key', $request->all())
            ? (string) ($request->input('api_key') ?? '')
            : null;

        $result = $service->testConnection($apiKey, $validated['mode'] ?? null);

        return response()->json($result);
    }
}
