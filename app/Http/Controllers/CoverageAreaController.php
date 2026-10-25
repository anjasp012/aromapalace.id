<?php

namespace App\Http\Controllers;

use App\Services\KiriminAjaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CoverageAreaController extends Controller
{
    public function __construct(
        protected KiriminAjaService $kiriminAjaService
    ) {}

    /**
     * Get list of provinces.
     */
    public function provinces(): JsonResponse
    {

        $provinces = $this->kiriminAjaService->getProvinces();

        return response()->json([
            'status' => true,
            'data' => $provinces,
        ]);
    }

    /**
     * Get list of cities by province ID.
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

        $cities = $this->kiriminAjaService->getCities($provinceId);

        return response()->json([
            'status' => true,
            'data' => $cities,
        ]);
    }

    /**
     * Get list of districts (kecamatan) by city ID.
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

        $districts = $this->kiriminAjaService->getDistricts($cityId);

        return response()->json([
            'status' => true,
            'data' => $districts,
        ]);
    }

    /**
     * Get list of subdistricts (kelurahan) by district ID.
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

        $subdistricts = $this->kiriminAjaService->getSubdistricts($districtId);

        return response()->json([
            'status' => true,
            'data' => $subdistricts,
        ]);
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
