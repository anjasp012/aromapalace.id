<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Shipping;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KiriminAjaWebhookController extends Controller
{
    /**
     * Handle KiriminAja webhook / callback to populate shipping table.
     */
    public function handle(Request $request): JsonResponse
    {
        Log::info('KiriminAja Webhook received', $request->all());

        $orderNumber = $request->input('order_id') ?? $request->input('order_number');
        $awb = $request->input('awb') ?? ($request->input('tracking_number') ?? null);

        $order = null;
        if ($orderNumber) {
            $order = Order::where('order_number', $orderNumber)->first();
        }
        if (! $order && $awb) {
            $shipping = Shipping::where('awb', $awb)->first();
            $order = $shipping?->order;
        }

        if (! $order) {
            return response()->json([
                'status' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        $order->shipping()->updateOrCreate(
            ['order_id' => $order->id],
            [
                'awb' => $awb ?: $order->shipping?->awb,
                'text' => $request->input('text') ?? $order->shipping?->text,
                'image' => $request->input('image') ?? $order->shipping?->image,
                'origin' => $request->input('origin') ?? $order->shipping?->origin,
                'destination' => $request->input('destination') ?? $order->shipping?->destination,
                'histories' => $request->input('histories') ?? $order->shipping?->histories,
            ]
        );

        return response()->json([
            'status' => true,
            'message' => 'Shipping callback berhasil diproses.',
        ]);
    }
}
