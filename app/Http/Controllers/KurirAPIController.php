<?php

namespace App\Http\Controllers;

use App\Services\KurirAPIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KurirAPIController extends Controller
{
    public function __construct(
        protected KurirAPIService $kurirAPIService
    ) {}

    public function provinces(): JsonResponse
    {
        $data = $this->kurirAPIService->getProvinces();

        return response()->json($data);
    }

    public function cities(int|string $province_id): JsonResponse
    {
        $data = $this->kurirAPIService->getCities($province_id);

        return response()->json($data);
    }

    public function districts(int|string $city_id): JsonResponse
    {
        $data = $this->kurirAPIService->getDistricts($city_id);

        return response()->json($data);
    }

    public function subDistricts(int|string $district_id): JsonResponse
    {
        $data = $this->kurirAPIService->getSubDistricts($district_id);

        return response()->json($data);
    }

    public function rates(Request $request, int|string|null $destination = null, int|float|null $weight = 1000): JsonResponse
    {
        $dest = $destination ?? $request->query('destination', $request->query('destination_district_code'));
        $wt = $weight ?? $request->query('weight', 1000);

        $data = $this->kurirAPIService->getRates($dest, (float) $wt);

        return response()->json($data);
    }

    public function orderShipment(Request $request): JsonResponse
    {
        $data = $this->kurirAPIService->createShippingOrder(
            quoteId: (string) $request->input('quote_id'),
            courierCode: (string) $request->input('courier_code'),
            serviceCode: (string) $request->input('service_code'),
            recipientName: (string) $request->input('recipient_name'),
            recipientPhone: (string) $request->input('recipient_phone'),
            recipientAddress: (string) $request->input('recipient_address'),
            productName: (string) $request->input('product_name'),
            productPrice: (float) $request->input('product_price'),
            quantity: (int) $request->input('quantity', 1),
            insurance: (bool) $request->input('insurance', false),
            note: (string) $request->input('note', ''),
            pickedUpTime: $request->input('picked_up_time')
        );

        return response()->json($data);
    }

    public function orderTracking(string $resi): JsonResponse
    {
        $data = $this->kurirAPIService->orderTracking($resi);

        return response()->json($data);
    }
}
