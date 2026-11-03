<?php

namespace App\Http\Controllers;

use App\Models\CoverageCity;
use App\Models\CoverageDistrict;
use App\Models\CoverageProvince;
use App\Models\CoverageSubdistrict;
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
     * Get list of provinces (persisted in database to prevent repeated API calls).
     */
    public function provinces(): JsonResponse
    {
        // 1. Check database first (0 API hits)
        $dbProvinces = CoverageProvince::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        if ($dbProvinces->isNotEmpty()) {
            return response()->json([
                'status' => true,
                'data' => $dbProvinces->map(fn ($p) => [
                    'id' => (int) $p->id,
                    'name' => (string) $p->name,
                ]),
            ]);
        }

        // 2. Fetch once from RajaOngkir
        $raw = $this->rajaOngkirShippingCostService->getProvinces();
        $list = $this->extractList($raw);

        $provinces = [];
        $records = [];
        $now = now();

        foreach ($list as $p) {
            if (! is_array($p)) {
                continue;
            }
            $id = $p['id'] ?? $p['province_id'] ?? null;
            if ($id === null) {
                continue;
            }
            $name = (string) ($p['name'] ?? $p['province'] ?? '');
            $provinces[] = [
                'id' => (int) $id,
                'name' => $name,
            ];
            $records[] = [
                'id' => (int) $id,
                'name' => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 3. Persist to database for future requests
        if (! empty($records)) {
            CoverageProvince::upsert($records, ['id'], ['name', 'updated_at']);

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
     * Get list of cities by province ID (persisted in database).
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

        // 1. Check database first (0 API hits)
        $dbCities = CoverageCity::query()
            ->where('province_id', $provinceId)
            ->orderBy('name')
            ->get(['id', 'name', 'type']);

        if ($dbCities->isNotEmpty()) {
            return response()->json([
                'status' => true,
                'data' => $dbCities->map(fn ($c) => [
                    'id' => (int) $c->id,
                    'name' => (string) $c->name,
                    'type' => (string) ($c->type ?? ''),
                ]),
            ]);
        }

        // 2. Fetch once from RajaOngkir
        $raw = $this->rajaOngkirShippingCostService->getCities($provinceId);
        $list = $this->extractList($raw);

        $cities = [];
        $records = [];
        $now = now();

        foreach ($list as $c) {
            if (! is_array($c)) {
                continue;
            }
            $id = $c['id'] ?? $c['city_id'] ?? null;
            if ($id === null) {
                continue;
            }
            $name = (string) ($c['name'] ?? $c['city_name'] ?? '');
            $type = (string) ($c['type'] ?? '');
            $cities[] = [
                'id' => (int) $id,
                'name' => $name,
                'type' => $type,
            ];
            $records[] = [
                'id' => (int) $id,
                'province_id' => $provinceId,
                'name' => $name,
                'type' => $type,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 3. Persist to database
        if (! empty($records)) {
            CoverageCity::upsert($records, ['id'], ['province_id', 'name', 'type', 'updated_at']);

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
     * Get list of districts (kecamatan) by city ID (persisted in database).
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

        // 1. Check database first (0 API hits)
        $dbDistricts = CoverageDistrict::query()
            ->where('city_id', $cityId)
            ->orderBy('name')
            ->get(['id', 'name']);

        if ($dbDistricts->isNotEmpty()) {
            return response()->json([
                'status' => true,
                'data' => $dbDistricts->map(fn ($d) => [
                    'id' => (int) $d->id,
                    'name' => (string) $d->name,
                ]),
            ]);
        }

        // 2. Fetch once from RajaOngkir
        $raw = $this->rajaOngkirShippingCostService->getDistricts($cityId);
        $list = $this->extractList($raw);

        $districts = [];
        $records = [];
        $now = now();

        foreach ($list as $d) {
            if (! is_array($d)) {
                continue;
            }
            $id = $d['id'] ?? $d['district_id'] ?? null;
            if ($id === null) {
                continue;
            }
            $name = (string) ($d['name'] ?? $d['district_name'] ?? '');
            $districts[] = [
                'id' => (int) $id,
                'name' => $name,
            ];
            $records[] = [
                'id' => (int) $id,
                'city_id' => $cityId,
                'name' => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 3. Persist to database
        if (! empty($records)) {
            CoverageDistrict::upsert($records, ['id'], ['city_id', 'name', 'updated_at']);

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
     * Get list of subdistricts (kelurahan) by district ID (persisted in database).
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

        // 1. Check database first (0 API hits)
        $dbSubdistricts = CoverageSubdistrict::query()
            ->where('district_id', $districtId)
            ->orderBy('name')
            ->get(['id', 'name', 'postal_code']);

        if ($dbSubdistricts->isNotEmpty()) {
            return response()->json([
                'status' => true,
                'data' => $dbSubdistricts->map(fn ($s) => [
                    'id' => (int) $s->id,
                    'name' => (string) $s->name,
                    'postal_code' => (string) ($s->postal_code ?? ''),
                ]),
            ]);
        }

        // 2. Fetch once from RajaOngkir
        $raw = $this->rajaOngkirShippingCostService->getSubDistricts($districtId);
        $list = $this->extractList($raw);

        $subdistricts = [];
        $records = [];
        $now = now();

        foreach ($list as $s) {
            if (! is_array($s)) {
                continue;
            }
            $id = $s['id'] ?? $s['subdistrict_id'] ?? null;
            if ($id === null) {
                continue;
            }
            $name = (string) ($s['name'] ?? $s['subdistrict_name'] ?? '');
            $postalCode = (string) ($s['zip_code'] ?? ($s['postal_code'] ?? ''));
            $subdistricts[] = [
                'id' => (int) $id,
                'name' => $name,
                'postal_code' => $postalCode,
            ];
            $records[] = [
                'id' => (int) $id,
                'district_id' => $districtId,
                'name' => $name,
                'postal_code' => $postalCode,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // 3. Persist to database
        if (! empty($records)) {
            CoverageSubdistrict::upsert($records, ['id'], ['district_id', 'name', 'postal_code', 'updated_at']);

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
