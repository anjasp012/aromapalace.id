<?php

namespace App\Http\Controllers;

use App\Services\KurirAPIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CoverageAreaController extends Controller
{
    public function __construct(
        protected KurirAPIService $kurirAPIService
    ) {}

    /**
     * Safely extract data list from KurirAPI response.
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
     * Get list of provinces from KurirAPIService.
     */
    public function provinces(): JsonResponse
    {
        $raw = $this->kurirAPIService->getProvinces();
        $list = $this->extractList($raw);

        $provinces = [];
        foreach ($list as $p) {
            if (! is_array($p)) {
                continue;
            }
            $code = $p['code'] ?? $p['id'] ?? null;
            if ($code === null) {
                continue;
            }
            $provinces[] = [
                'id' => (int) $code,
                'code' => (string) $code,
                'name' => (string) ($p['name'] ?? ''),
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $provinces,
        ]);
    }

    /**
     * Get list of cities by province ID / code from KurirAPIService.
     */
    public function cities(Request $request): JsonResponse
    {
        $provinceId = $request->query('province_id', $request->query('province'));
        if (! $provinceId) {
            return response()->json([
                'status' => false,
                'message' => 'Parameter province_id is required.',
                'data' => [],
            ], 422);
        }

        $raw = $this->kurirAPIService->getCities($provinceId);
        $list = $this->extractList($raw);

        $cities = [];
        foreach ($list as $c) {
            if (! is_array($c)) {
                continue;
            }
            $code = $c['code'] ?? $c['id'] ?? null;
            if ($code === null) {
                continue;
            }
            $name = (string) ($c['name'] ?? '');
            $type = str_starts_with($name, 'Kota') ? 'Kota' : 'Kabupaten';

            $cities[] = [
                'id' => (int) $code,
                'code' => (string) $code,
                'name' => $name,
                'type' => $type,
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $cities,
        ]);
    }

    /**
     * Get list of districts (kecamatan) by city ID / code from KurirAPIService.
     */
    public function districts(Request $request): JsonResponse
    {
        $cityId = $request->query('city_id', $request->query('city'));
        if (! $cityId) {
            return response()->json([
                'status' => false,
                'message' => 'Parameter city_id is required.',
                'data' => [],
            ], 422);
        }

        $raw = $this->kurirAPIService->getDistricts($cityId);
        $list = $this->extractList($raw);

        $districts = [];
        foreach ($list as $d) {
            if (! is_array($d)) {
                continue;
            }
            $code = $d['code'] ?? $d['id'] ?? null;
            if ($code === null) {
                continue;
            }
            $districts[] = [
                'id' => (int) $code,
                'code' => (string) $code,
                'name' => (string) ($d['name'] ?? ''),
            ];
        }

        return response()->json([
            'status' => true,
            'data' => $districts,
        ]);
    }

    /**
     * Subdistricts (kelurahan) — KurirAPI operates at district level for rates.
     */
    public function subdistricts(Request $request): JsonResponse
    {
        return response()->json([
            'status' => true,
            'data' => [],
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
