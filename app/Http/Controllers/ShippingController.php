<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Shipping;
use App\Services\KiriminAjaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    /**
     * Track shipment status and history by AWB code or Order Number.
     */
    public function track(Request $request, string $awb): JsonResponse
    {
        $cleanAwb = trim($awb);

        if (empty($cleanAwb)) {
            return response()->json([
                'status' => false,
                'message' => 'Nomor resi tidak valid.',
            ], 422);
        }

        // 1. Find Shipping record directly by AWB (case-insensitive)
        $shipping = Shipping::with(['order.store', 'order.user'])
            ->whereRaw('LOWER(TRIM(awb)) = ?', [strtolower($cleanAwb)])
            ->first();

        // 2. If not found by AWB, check if cleanAwb is a payment code or order number
        if (! $shipping) {
            $shipping = Shipping::with(['order.store', 'order.user'])
                ->where('shipping_payment_code', $cleanAwb)
                ->orWhereHas('order', function ($q) use ($cleanAwb) {
                    $q->where('order_number', $cleanAwb);
                })
                ->first();
        }

        // 3. If shipping record found in database
        if ($shipping) {
            $order = $shipping->order;

            $rawHistories = (array) ($shipping->histories ?? []);
            $histories = collect($rawHistories)->map(function ($item) {
                return [
                    'time' => $item['time'] ?? ($item['date'] ?? null),
                    'status' => $item['status'] ?? null,
                    'note' => $item['note'] ?? ($item['text'] ?? ($item['desc'] ?? '')),
                    'image' => $item['image'] ?? null,
                ];
            })->filter(fn ($h) => ! empty($h['note']) || ! empty($h['time']))->values()->all();

            // Sort descending so the most recent milestone is at the top
            usort($histories, function ($a, $b) {
                $tA = strtotime((string) ($a['time'] ?? '')) ?: 0;
                $tB = strtotime((string) ($b['time'] ?? '')) ?: 0;

                return $tB <=> $tA;
            });

            // Extract proof of delivery images
            $images = (array) ($shipping->image ?? []);
            if (empty($images)) {
                foreach ($histories as $h) {
                    if (! empty($h['image'])) {
                        $img = is_array($h['image']) ? $h['image'] : [$h['image']];
                        $images = array_merge($images, $img);
                    }
                }
            }

            $origin = $shipping->origin ?? [];
            $sender = [
                'name' => $origin['name'] ?? ($order?->store?->name ?? 'Aroma Palace Official'),
                'phone' => $origin['phone'] ?? ($order?->store?->phone ?? null),
                'address' => $origin['address'] ?? ($order?->store?->address ?? null),
            ];

            $destination = $shipping->destination ?? [];
            $recipient = [
                'name' => $destination['name'] ?? ($order?->recipient_name ?? 'Penerima'),
                'phone' => $destination['phone'] ?? ($order?->recipient_phone ?? null),
                'address' => $destination['address'] ?? ($order?->address ?? null),
            ];

            return response()->json([
                'status' => true,
                'data' => [
                    'id' => $shipping->id,
                    'awb' => $shipping->awb ?: $cleanAwb,
                    'order_number' => $order?->order_number,
                    'courier' => $order?->courier ?: 'Kurir Pengiriman',
                    'courier_service' => $order?->courier_service ?: 'EXPRESS',
                    'courier_logo' => app(KiriminAjaService::class)->getCourierLogoUrl($order?->courier ?: $order?->courier_service),
                    'sender' => $sender,
                    'recipient' => $recipient,
                    'text' => $shipping->text ?: 'Status pengiriman aktif',
                    'histories' => $histories,
                    'images' => array_values(array_filter($images)),
                ],
            ]);
        }

        // 4. Fallback if Order exists with this AWB or Order Number
        $order = Order::with('store')
            ->where(function ($q) use ($cleanAwb) {
                $q->where('order_number', $cleanAwb)
                    ->orWhere('id', is_numeric($cleanAwb) ? (int) $cleanAwb : 0);
            })
            ->first();

        if ($order) {
            $sender = [
                'name' => $order->store?->name ?? 'Aroma Palace Official',
                'phone' => $order->store?->phone ?? null,
                'address' => $order->store?->address ?? null,
            ];

            $recipient = [
                'name' => $order->recipient_name ?: 'Penerima',
                'phone' => $order->recipient_phone,
                'address' => $order->address,
            ];

            return response()->json([
                'status' => true,
                'data' => [
                    'id' => null,
                    'awb' => $cleanAwb,
                    'order_number' => $order->order_number,
                    'courier' => $order->courier ?: 'Kurir Pengiriman',
                    'courier_service' => $order->courier_service ?: 'EXPRESS',
                    'courier_logo' => app(KiriminAjaService::class)->getCourierLogoUrl($order->courier ?: $order->courier_service),
                    'sender' => $sender,
                    'recipient' => $recipient,
                    'text' => 'Nomor resi telah diterbitkan.',
                    'histories' => [
                        [
                            'time' => $order->updated_at ? $order->updated_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
                            'status' => 'created',
                            'note' => 'Nomor resi pengiriman diterbitkan. Paket sedang disiapkan untuk penjemputan oleh kurir.',
                            'image' => null,
                        ],
                    ],
                    'images' => [],
                ],
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Data pengiriman untuk nomor resi '.$cleanAwb.' belum ditemukan di sistem.',
        ], 404);
    }
}
