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
     * Safely extract data list from API response without throwing on error responses.
     *
     * @return array<int, mixed>
     */
    protected function extractList(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        if (isset($raw['data']) && is_array($raw['data'])) {
            return $raw['data'];
        }

        if (array_is_list($raw)) {
            return $raw;
        }

        return [];
    }

    /**
     * Get list of provinces with automatic retry if empty.
     */
    public function provinces(): JsonResponse
    {
        $cacheKey = 'coverage:provinces';
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return response()->json([
                'status' => true,
                'data' => $cached,
            ]);
        }

        $raw = $this->fetchWithRetry(fn () => $this->rajaOngkirShippingCostService->getProvinces());
        $list = $this->extractList($raw);

        $provinces = [];
        foreach ($list as $p) {
            if (! is_array($p)) {
                continue;
            }
            $id = $p['id'] ?? $p['province_id'] ?? null;
            if ($id === null) {
                continue;
            }
            $provinces[] = [
                'id' => (int) $id,
                'name' => (string) ($p['name'] ?? $p['province'] ?? ''),
            ];
        }

        if (! empty($provinces)) {
            Cache::put($cacheKey, $provinces, now()->addDays(30));

            return response()->json([
                'status' => true,
                'data' => $provinces,
            ]);
        }

        $errorMessage = is_array($raw) ? ($raw['meta']['message'] ?? $raw['message'] ?? null) : null;

        return response()->json([
            'status' => false,
            'message' => $errorMessage ?: 'Data provinsi sementara belum tersedia dari layanan ekspedisi.',
            'data' => [],
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

        $cacheKey = "coverage:cities:{$provinceId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return response()->json([
                'status' => true,
                'data' => $cached,
            ]);
        }

        $raw = $this->fetchWithRetry(fn () => $this->rajaOngkirShippingCostService->getCities($provinceId));
        $list = $this->extractList($raw);

        $cities = [];
        foreach ($list as $c) {
            if (! is_array($c)) {
                continue;
            }
            $id = $c['id'] ?? $c['city_id'] ?? null;
            if ($id === null) {
                continue;
            }
            $cities[] = [
                'id' => (int) $id,
                'name' => (string) ($c['name'] ?? $c['city_name'] ?? ''),
                'type' => (string) ($c['type'] ?? ''),
            ];
        }

        if (! empty($cities)) {
            Cache::put($cacheKey, $cities, now()->addDays(30));

            return response()->json([
                'status' => true,
                'data' => $cities,
            ]);
        }

        $errorMessage = is_array($raw) ? ($raw['meta']['message'] ?? $raw['message'] ?? null) : null;

        return response()->json([
            'status' => false,
            'message' => $errorMessage ?: 'Data kota sementara belum tersedia dari layanan ekspedisi.',
            'data' => [],
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

        $cacheKey = "coverage:districts:{$cityId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return response()->json([
                'status' => true,
                'data' => $cached,
            ]);
        }

        $raw = $this->fetchWithRetry(fn () => $this->rajaOngkirShippingCostService->getDistricts($cityId));
        $list = $this->extractList($raw);

        $districts = [];
        foreach ($list as $d) {
            if (! is_array($d)) {
                continue;
            }
            $id = $d['id'] ?? $d['district_id'] ?? null;
            if ($id === null) {
                continue;
            }
            $districts[] = [
                'id' => (int) $id,
                'name' => (string) ($d['name'] ?? $d['district_name'] ?? ''),
            ];
        }

        if (! empty($districts)) {
            Cache::put($cacheKey, $districts, now()->addDays(30));

            return response()->json([
                'status' => true,
                'data' => $districts,
            ]);
        }

        $errorMessage = is_array($raw) ? ($raw['meta']['message'] ?? $raw['message'] ?? null) : null;

        return response()->json([
            'status' => false,
            'message' => $errorMessage ?: 'Data kecamatan sementara belum tersedia dari layanan ekspedisi.',
            'data' => [],
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

        $cacheKey = "coverage:subdistricts:{$districtId}";
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && ! empty($cached)) {
            return response()->json([
                'status' => true,
                'data' => $cached,
            ]);
        }

        $raw = $this->fetchWithRetry(fn () => $this->rajaOngkirShippingCostService->getSubDistricts($districtId));
        $list = $this->extractList($raw);

        $subdistricts = [];
        foreach ($list as $s) {
            if (! is_array($s)) {
                continue;
            }
            $id = $s['id'] ?? $s['subdistrict_id'] ?? null;
            if ($id === null) {
                continue;
            }
            $subdistricts[] = [
                'id' => (int) $id,
                'name' => (string) ($s['name'] ?? $s['subdistrict_name'] ?? ''),
                'postal_code' => (string) ($s['zip_code'] ?? ($s['postal_code'] ?? '')),
            ];
        }

        if (! empty($subdistricts)) {
            Cache::put($cacheKey, $subdistricts, now()->addDays(30));

            return response()->json([
                'status' => true,
                'data' => $subdistricts,
            ]);
        }

        $errorMessage = is_array($raw) ? ($raw['meta']['message'] ?? $raw['message'] ?? null) : null;

        return response()->json([
            'status' => false,
            'message' => $errorMessage ?: 'Data kelurahan sementara belum tersedia dari layanan ekspedisi.',
            'data' => [],
        ]);
    }

    /**
     * Retry callback up to $maxRetries if the result is empty.
     *
     * @param  callable(): mixed  $callback
     */
    protected function fetchWithRetry(callable $callback, int $maxRetries = 2, int $sleepUs = 300000): mixed
    {
        $result = $callback();
        if (is_array($result) && ! empty($result['data']) && is_array($result['data'])) {
            return $result;
        }

        for ($i = 0; $i < $maxRetries; $i++) {
            usleep($sleepUs);
            $result = $callback();
            if (is_array($result) && ! empty($result['data']) && is_array($result['data'])) {
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
