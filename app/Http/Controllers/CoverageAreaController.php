<?php

namespace App\Http\Controllers;

use App\Services\KiriminAjaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}
