<?php

namespace App\Http\Controllers;

use App\Services\RajaOngkirShippingCostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CoverageAreaController extends Controller
{
    public function __construct(
        protected RajaOngkirShippingCostService $rajaOngkirShippingCostService
    ) {}

    /**
     * Get list of provinces with automatic retry if empty.
     */
    public function provinces(): JsonResponse
    {
        $raw = $this->fetchWithRetry(fn () => $this->rajaOngkirShippingCostService->getProvinces());
        $list = $raw['data'] ?? $raw;
        $provinces = array_values(array_map(fn ($p) => [
            'id' => (int) $p['id'],
            'name' => (string) ($p['name'] ?? ''),
        ], is_array($list) ? $list : []));

        return response()->json([
            'status' => ! empty($provinces),
            'data' => $provinces,
        ]);
    }

    /**
     * Get list of cities by province ID with automatic retry if empty.
     */
    public function cities(Request $request): JsonResponse
    {
        $provinceId = (int) $request->query('province_id');
        if ($provinceId <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'Parameter province_id is required.',
                'data' => [],
            ], 422);
        }

        $raw = $this->fetchWithRetry(fn () => $this->rajaOngkirShippingCostService->getCities($provinceId));
        $list = $raw['data'] ?? $raw;
        $cities = array_values(array_map(fn ($c) => [
            'id' => (int) $c['id'],
            'name' => (string) ($c['name'] ?? ''),
            'type' => (string) ($c['type'] ?? ''),
        ], is_array($list) ? $list : []));

        return response()->json([
            'status' => ! empty($cities),
            'data' => $cities,
        ]);
    }

    /**
     * Get list of districts (kecamatan) by city ID with automatic retry if empty.
     */
    public function districts(Request $request): JsonResponse
    {
        $cityId = (int) $request->query('city_id');
        if ($cityId <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'Parameter city_id is required.',
                'data' => [],
            ], 422);
        }

        $raw = $this->fetchWithRetry(fn () => $this->rajaOngkirShippingCostService->getDistricts($cityId));
        $list = $raw['data'] ?? $raw;
        $districts = array_values(array_map(fn ($d) => [
            'id' => (int) $d['id'],
            'name' => (string) ($d['name'] ?? ''),
        ], is_array($list) ? $list : []));

        return response()->json([
            'status' => ! empty($districts),
            'data' => $districts,
        ]);
    }

    /**
     * Get list of subdistricts (kelurahan) by district ID with automatic retry if empty.
     */
    public function subdistricts(Request $request): JsonResponse
    {
        $districtId = (int) $request->query('district_id');
        if ($districtId <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'Parameter district_id is required.',
                'data' => [],
            ], 422);
        }

        $raw = $this->fetchWithRetry(fn () => $this->rajaOngkirShippingCostService->getSubDistricts($districtId));
        $list = $raw['data'] ?? $raw;
        $subdistricts = array_values(array_map(fn ($s) => [
            'id' => (int) $s['id'],
            'name' => (string) ($s['name'] ?? ''),
            'postal_code' => (string) ($s['zip_code'] ?? ($s['postal_code'] ?? '')),
        ], is_array($list) ? $list : []));

        return response()->json([
            'status' => ! empty($subdistricts),
            'data' => $subdistricts,
        ]);
    }

    /**
     * Retry callback up to $maxRetries if the result is empty.
     *
     * @param  callable(): array  $callback
     */
    protected function fetchWithRetry(callable $callback, int $maxRetries = 2, int $sleepUs = 300000): array
    {
        $result = $callback();
        if (! empty($result) && is_array($result)) {
            return $result;
        }

        for ($i = 0; $i < $maxRetries; $i++) {
            usleep($sleepUs);
            $result = $callback();
            if (! empty($result) && is_array($result)) {
                return $result;
            }
        }

        return is_array($result) ? $result : [];
    }

    /**
     * Geocode an address, district, or city to latitude and longitude coordinates.
     */
    public function geocode(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q'));
        if (empty($q)) {
            return response()->json([
                'status' => false,
                'message' => 'Parameter q is required.',
                'data' => null,
            ], 422);
        }

        $cacheKey = 'geocode:'.md5(strtolower($q));
        $data = Cache::remember($cacheKey, now()->addDays(30), function () use ($q) {
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'AromaPalace-Ecommerce/1.0 (contact@aromapalace.id)',
                ])->timeout(6)->get('https://nominatim.openstreetmap.org/search', [
                    'format' => 'json',
                    'q' => $q,
                    'countrycodes' => 'id',
                    'limit' => 1,
                ]);

                if ($response->successful() && ! empty($response->json())) {
                    $first = $response->json()[0];

                    return [
                        'latitude' => (float) $first['lat'],
                        'longitude' => (float) $first['lon'],
                        'display_name' => $first['display_name'] ?? '',
                    ];
                }
            } catch (\Throwable $e) {
                // fall through
            }

            return null;
        });

        if (! $data) {
            return response()->json([
                'status' => false,
                'message' => 'Lokasi tidak ditemukan pada peta.',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }
}
