<?php

namespace App\Http\Controllers;

use App\Services\RajaOngkirPaymentService;
use App\Services\RajaOngkirShippingCostService;

class RajaOngkirController extends Controller
{
    public function __construct(
        protected RajaOngkirShippingCostService $rajaOngkirShippingCostService,
        protected RajaOngkirPaymentService $rajaOngkirPaymentService
    ) {}

    public function provinces()
    {
        $data = $this->rajaOngkirShippingCostService->getProvinces();

        return response()->json($data);
    }

    public function cities($province_id)
    {
        $data = $this->rajaOngkirShippingCostService->getCities($province_id);

        return response()->json($data);
    }

    public function districts($city_id)
    {
        $data = $this->rajaOngkirShippingCostService->getDistricts($city_id);

        return response()->json($data);
    }

    public function subDistricts($district_id)
    {
        $data = $this->rajaOngkirShippingCostService->getSubDistricts($district_id);

        return response()->json($data);
    }

    public function calculateCost($destination, $weight, $price)
    {
        $data = $this->rajaOngkirShippingCostService->getcalculateCost($destination, $weight, $price);

        return response()->json($data);
    }

    public function getPaymentMethods()
    {
        $data = $this->rajaOngkirPaymentService->getPaymentMethods();

        return response()->json($data);
    }

    public function createPayment()
    {
        $data = $this->rajaOngkirPaymentService->createPayment();

        return response()->json($data);
    }

    public function callbackPayment(Request $request)
    {
        $rawBody = $request->getContent();
        $signature = $request->header('X-Callback-Api-Key');

        try {
            $data = $this->rajaOngkirPaymentService->callbackPayment(
                $rawBody,
                $signature
            );

            return response()->json($data, 200);

        } catch (\Exception $e) {
            Log::error('KOMERCE CALLBACK ERROR', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], in_array($e->getCode(), [400, 401]) ? $e->getCode() : 500);
        }

    }
}
