<?php

namespace App\Http\Controllers;

use App\Services\RajaOngkirPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RajaOngkirController extends Controller
{
    public function __construct(
        protected RajaOngkirPaymentService $rajaOngkirPaymentService
    ) {}

    public function getPaymentMethods()
    {
        $data = $this->rajaOngkirPaymentService->getPaymentMethods();

        return response()->json($data);
    }

    public function createPayment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => ['required', 'string'],
            'payment_type' => ['required', 'string'],
            'amount' => ['required', 'numeric'],
            'channel_code' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $customerName = (string) $request->input('customer.name', $request->input('customer_name', ''));
        $customerEmail = (string) $request->input('customer.email', $request->input('customer_email', ''));
        $customerPhone = (string) $request->input('customer.phone', $request->input('customer_phone', ''));
        $items = (array) $request->input('items', []);
        $expiryDuration = (int) $request->input('expiry_duration', 3600);

        $data = $this->rajaOngkirPaymentService->createPayment(
            (string) $validated['order_id'],
            (string) $validated['payment_type'],
            $validated['channel_code'] ?? null,
            (float) $validated['amount'],
            $customerName,
            $customerEmail,
            $customerPhone,
            $items,
            $expiryDuration
        );

        return response()->json($data);
    }

    public function getPaymentStatus($order_number)
    {
        $data = $this->rajaOngkirPaymentService->getPaymentStatus($order_number);

        return response()->json($data);
    }

    public function cancelPayment($order_number)
    {
        $data = $this->rajaOngkirPaymentService->cancelPayment($order_number);

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
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], in_array($e->getCode(), [400, 401]) ? $e->getCode() : 500);
        }

    }
}
