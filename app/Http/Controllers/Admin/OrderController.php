<?php

namespace App\Http\Controllers\Admin;

use App\Events\ShippingUpdated;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Setting;
use App\Models\Voucher;
use App\Services\CatalogService;
use App\Services\FirebaseNotificationService;
use App\Services\KiriminAjaService;
use App\Services\MembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * Display a listing of orders with filters and pagination.
     */
    public function index(Request $request): Response
    {
        $status = (string) $request->query('status', 'all');
        $deliveryType = (string) $request->query('delivery_type', 'all');
        $search = trim((string) $request->query('search', ''));

        $query = Order::with(['items', 'store', 'user', 'voucher'])->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('recipient_name', 'like', "%{$search}%")
                    ->orWhere('recipient_phone', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($deliveryType !== 'all') {
            $query->where('delivery_type', $deliveryType);
        }

        if ($status === 'menunggu_pembayaran') {
            $query->where(function ($q) {
                $q->where('status', 'menunggu_pembayaran')
                    ->orWhere(fn ($sub) => $sub->whereNull('status')->where('payment_status', 'pending'));
            });
        } elseif ($status === 'diproses') {
            $query->where('status', 'diproses');
        } elseif ($status === 'dikirim') {
            $query->where('status', 'dikirim')->where(function ($q) {
                $q->where('delivery_type', 'delivery')->orWhereNull('delivery_type');
            });
        } elseif ($status === 'pengambilan') {
            $query->where('status', 'dikirim')->where('delivery_type', 'pickup');
        } elseif ($status === 'selesai') {
            $query->where(function ($q) {
                $q->where('status', 'selesai')
                    ->orWhere(fn ($sub) => $sub->whereNull('status')->where('payment_status', 'paid'));
            });
        } elseif ($status === 'dibatalkan') {
            $query->where(function ($q) {
                $q->where('status', 'dibatalkan')
                    ->orWhere('payment_status', 'cancelled');
            });
        }

        $orders = $query->paginate(15)->withQueryString()->through(fn (Order $order) => $this->mapOrderSummary($order));

        $tabCounts = [
            'all' => Order::count(),
            'menunggu_pembayaran' => Order::where('status', 'menunggu_pembayaran')
                ->orWhere(fn ($q) => $q->whereNull('status')->where('payment_status', 'pending'))
                ->count(),
            'diproses' => Order::where('status', 'diproses')->count(),
            'dikirim' => Order::where('status', 'dikirim')->where(function ($q) {
                $q->where('delivery_type', 'delivery')->orWhereNull('delivery_type');
            })->count(),
            'pengambilan' => Order::where('status', 'dikirim')->where('delivery_type', 'pickup')->count(),
            'selesai' => Order::where('status', 'selesai')
                ->orWhere(fn ($q) => $q->whereNull('status')->where('payment_status', 'paid'))
                ->count(),
            'dibatalkan' => Order::where('status', 'dibatalkan')->orWhere('payment_status', 'cancelled')->count(),
        ];

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => [
                'status' => $status,
                'delivery_type' => $deliveryType,
                'search' => $search,
            ],
            'tab_counts' => $tabCounts,
        ]);
    }

    /**
     * Display detailed order page with timeline and items.
     */
    public function show(Request $request, string $order): Response
    {

        $orderModel = Order::where(function ($q) use ($order) {
            $q->where('order_number', $order)->orWhere('id', $order);
        })
            ->with(['items', 'store', 'user', 'voucher', 'shipping'])
            ->firstOrFail();

        return Inertia::render('admin/orders/show', [
            'order' => $this->mapOrderDetail($orderModel),
            'pickupSchedules' => Inertia::defer(function () {
                $service = app(KiriminAjaService::class);

                return $service->getPickupSchedules();
            }),
        ]);
    }

    /**
     * Display printable thermal shipping label for the order.
     */
    public function shippingLabel(Request $request, string $order): Response
    {
        $orderModel = Order::where(function ($q) use ($order) {
            $q->where('order_number', $order)->orWhere('id', $order);
        })
            ->with(['items', 'store', 'user', 'voucher', 'shipping'])
            ->firstOrFail();

        return Inertia::render('admin/orders/shipping-label', [
            'order' => $this->mapOrderDetail($orderModel),
        ]);
    }

    /**
     * Sinkronkan nomor resi (AWB) dan status pengiriman resmi langsung dari KiriminAja.
     */
    public function syncResi(Request $request, string $order): RedirectResponse
    {
        $orderModel = Order::where(function ($q) use ($order) {
            $q->where('order_number', $order)->orWhere('id', $order);
        })->firstOrFail();

        $result = app(KiriminAjaService::class)->syncTrackingNumber($orderModel);

        if ($result['success'] ?? false) {
            try {
                broadcast(new ShippingUpdated($orderModel->fresh(['shipping'])));
            } catch (\Throwable $e) {
                Log::warning('Failed to broadcast ShippingUpdated on syncResi: '.$e->getMessage());
            }

            return back()->with('success', $result['message']);
        }

        return back()->with('error', $result['message'] ?? 'Nomor resi resmi belum dapat disinkronkan dari KiriminAja.');
    }

    /**
     * Update order status and related payment status.
     */
    public function updateStatus(Request $request, string $order): RedirectResponse
    {
        $orderModel = Order::where(function ($q) use ($order) {
            $q->where('order_number', $order)->orWhere('id', $order);
        })->firstOrFail();

        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                'in:menunggu_pembayaran,diproses,dikirim,pengambilan,selesai,dibatalkan',
            ],
            'shipping_mode' => ['nullable', 'string', 'in:kiriminaja,manual'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'awb' => ['nullable', 'string', 'max:100'],
            'courier' => ['nullable', 'string', 'max:100'],
            'courier_service' => ['nullable', 'string', 'max:100'],
            'courier_service_type' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
            'pickup_schedule' => ['nullable', 'string', 'max:100'],
            'schedule' => ['nullable', 'string', 'max:100'],
        ]);

        $newStatus = $validated['status'];
        if ($newStatus === 'pengambilan') {
            $newStatus = 'dikirim';
        }

        $orderModel->status = $newStatus;

        if (in_array($newStatus, ['diproses', 'dikirim', 'selesai'])) {
            $orderModel->payment_status = 'paid';
        } elseif ($newStatus === 'dibatalkan') {
            $orderModel->payment_status = 'cancelled';
            if ($orderModel->getOriginal('status') !== 'dibatalkan' && $orderModel->voucher_id) {
                Voucher::where('id', $orderModel->voucher_id)
                    ->where('used_count', '>', 0)
                    ->decrement('used_count');
            }
        } elseif ($newStatus === 'menunggu_pembayaran') {
            $orderModel->payment_status = 'pending';
        }

        if (isset($validated['notes'])) {
            $orderModel->notes = $validated['notes'];
        }

        $customFlash = null;
        $manualAwb = trim((string) ($validated['awb'] ?? ($validated['tracking_number'] ?? '')));

        // Handle shipping & tracking number when status is dikirim or when tracking_number is provided
        if ($newStatus === 'dikirim' && $orderModel->delivery_type !== 'pickup') {
            $shippingMode = $validated['shipping_mode'] ?? null;

            if ($shippingMode === 'kiriminaja') {
                $pickupSchedule = $validated['pickup_schedule'] ?? ($validated['schedule'] ?? null);
                $service = app(KiriminAjaService::class);
                if (method_exists($service, 'requestPickup')) {
                    $kirimResult = $service->requestPickup($orderModel, $pickupSchedule);
                } else {
                    $kirimResult = ['success' => false, 'message' => 'Layanan request pickup KiriminAja belum tersedia.'];
                }

                $pickupCode = $kirimResult['pickup_number'] ?? ($kirimResult['tracking_number'] ?? ($kirimResult['awb'] ?? null));

                if (empty($pickupCode)) {
                    $errMsg = $kirimResult['message'] ?? 'Gagal membuat request pickup di KiriminAja.';

                    return back()->with('error', "Gagal menerbitkan Resi Otomatis KiriminAja: {$errMsg}. Silakan periksa data pesanan atau gunakan Resi Manual.");
                }

                $awb = (! empty($kirimResult['awb']) && $kirimResult['awb'] !== '')
                    ? $kirimResult['awb']
                    : ($kirimResult['tracking_number'] ?? 'Menunggu...');

                $orderModel->shipping()->updateOrCreate(
                    ['order_id' => $orderModel->id],
                    [
                        'shipping_payment_code' => $kirimResult['pickup_number'] ?? $pickupCode,
                        'awb' => $awb,
                        'text' => $kirimResult['text'] ?? null,
                        'image' => $kirimResult['image'] ?? [],
                        'origin' => $kirimResult['origin'] ?? [],
                        'destination' => $kirimResult['destination'] ?? [],
                        'histories' => $kirimResult['histories'] ?? [],
                    ]
                );

                $customFlash = "Pesanan #{$orderModel->order_number} berhasil dikirim dengan Resi Otomatis KiriminAja: {$awb}.";
            } elseif (! empty($manualAwb)) {
                $orderModel->shipping()->updateOrCreate(
                    ['order_id' => $orderModel->id],
                    [
                        'awb' => $manualAwb,
                    ]
                );

                $customFlash = "Pesanan #{$orderModel->order_number} berhasil dikirim dengan Resi Manual: {$manualAwb}.";
            }
        } elseif (! empty($manualAwb)) {
            $orderModel->shipping()->updateOrCreate(
                ['order_id' => $orderModel->id],
                [
                    'awb' => $manualAwb,
                ]
            );
        }

        $orderModel->save();

        // Trigger push notifications
        if ($newStatus === 'dikirim') {
            if ($orderModel->delivery_type === 'pickup') {
                app(FirebaseNotificationService::class)->notifyStorePickupReady($orderModel);
            } else {
                app(FirebaseNotificationService::class)->notifyOrderShipped($orderModel);
            }
        } elseif ($newStatus === 'diproses' || $newStatus === 'selesai') {
            app(FirebaseNotificationService::class)->notifyPaymentSuccess($orderModel);
            app(MembershipService::class)->awardOrderPoints($orderModel);
        }

        // Broadcast real-time update via WebSockets
        try {
            broadcast(new ShippingUpdated($orderModel->fresh(['shipping'])));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast ShippingUpdated on updateStatus: '.$e->getMessage());
        }

        $label = match ($newStatus) {
            'selesai' => 'Selesai',
            'dikirim' => $orderModel->delivery_type === 'pickup' ? 'Pengambilan di Butik' : 'Dikirim',
            'diproses' => 'Diproses',
            'menunggu_pembayaran' => 'Menunggu Pembayaran',
            'dibatalkan' => 'Dibatalkan',
            default => $newStatus,
        };

        $flashMessage = $customFlash ?? "Status pesanan #{$orderModel->order_number} berhasil diperbarui menjadi \"{$label}\".";

        return back()->with('success', $flashMessage);
    }

    /**
     * Map order for summary list views.
     *
     * @return array<string, mixed>
     */
    protected function mapOrderSummary(Order $order): array
    {
        $orderStatus = $order->status ?: match ($order->payment_status) {
            'paid' => 'diproses',
            'cancelled' => 'dibatalkan',
            default => 'menunggu_pembayaran',
        };

        $isPickup = $order->delivery_type === 'pickup';
        $statusLabel = match ($orderStatus) {
            'selesai' => 'Selesai',
            'dikirim' => $isPickup ? 'Pengambilan' : 'Dikirim',
            'diproses' => 'Diproses',
            'menunggu_pembayaran' => 'Menunggu Pembayaran',
            'dibatalkan' => 'Dibatalkan',
            default => ucfirst(str_replace('_', ' ', $orderStatus)),
        };

        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'recipient_name' => $order->recipient_name,
            'recipient_phone' => $order->recipient_phone,
            'customer_name' => $order->user?->name,
            'customer_email' => $order->user?->email,
            'delivery_type' => $order->delivery_type ?: 'delivery',
            'store_id' => $order->store_id,
            'store_name' => $order->store?->name,
            'courier_service' => $order->courier_service,
            'courier_service_type' => $order->courier_service_type,
            'courier' => $order->courier,
            'courier_logo' => app(KiriminAjaService::class)->getCourierLogoUrl($order->courier ?: $order->courier_service),
            'tracking_number' => $order->shipping?->awb,
            'city' => $order->city_name,
            'total_amount' => $order->total_amount,
            'total_amount_formatted' => 'Rp '.number_format($order->total_amount, 0, ',', '.'),
            'payment_method' => $order->payment_method,
            'payment_channel' => $order->payment_channel,
            'payment_status' => $order->payment_status,
            'order_status' => $orderStatus,
            'status_label' => $statusLabel,
            'items_count' => $order->items->sum('quantity'),
            'items_preview' => $order->items->take(2)->map(fn (OrderItem $item) => [
                'name' => $item->product_name,
                'quantity' => $item->quantity,
                'variant' => $item->variant_name,
                'volume' => $item->volume,
            ]),
            'created_at' => $order->created_at?->format('d M Y, H:i').' WIB',
            'created_at_human' => $order->created_at?->diffForHumans(),
        ];
    }

    /**
     * Map order for full detail views.
     *
     * @return array<string, mixed>
     */
    protected function mapOrderDetail(Order $order): array
    {
        $items = $order->items->map(function (OrderItem $item) {
            $productData = CatalogService::find($item->product_id);

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'volume' => $item->volume,
                'price' => (int) $item->price,
                'price_formatted' => 'Rp '.number_format($item->price, 0, ',', '.'),
                'quantity' => (int) $item->quantity,
                'total_price' => (int) $item->total_price,
                'total_price_formatted' => 'Rp '.number_format($item->total_price, 0, ',', '.'),
                'image' => $productData['image'] ?? 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
            ];
        });

        $orderStatus = $order->status ?: match ($order->payment_status) {
            'paid' => 'diproses',
            'cancelled' => 'dibatalkan',
            default => 'menunggu_pembayaran',
        };

        $isPickup = $order->delivery_type === 'pickup';
        $statusLabel = match ($orderStatus) {
            'selesai' => 'Selesai',
            'dikirim' => $isPickup ? 'Pengambilan' : 'Dikirim',
            'diproses' => 'Diproses',
            'menunggu_pembayaran' => 'Menunggu Pembayaran',
            'dibatalkan' => 'Dibatalkan',
            default => ucfirst(str_replace('_', ' ', $orderStatus)),
        };

        $payBefore = $order->created_at ? $order->created_at->copy()->addDay() : null;

        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'created_at' => $order->created_at?->format('d M Y, H:i').' WIB',
            'created_at_human' => $order->created_at?->diffForHumans(),
            'pay_before' => $payBefore ? $payBefore->format('d M Y, H:i').' WIB' : null,
            'status' => $order->payment_status,
            'payment_status' => $order->payment_status,
            'order_status' => $orderStatus,
            'status_label' => $statusLabel,
            'delivery_type' => $order->delivery_type ?: 'delivery',
            'store' => $order->store ? [
                'id' => $order->store->id,
                'name' => $order->store->name,
                'description' => $order->store->description,
                'thumbnail' => $order->store->thumbnail,
                'gmaps_link' => $order->store->gmaps_link,
            ] : null,
            'user' => $order->user ? [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email' => $order->user->email,
            ] : null,
            'recipient_name' => $order->recipient_name,
            'recipient_phone' => $order->recipient_phone,
            'address' => $order->address,
            'province_id' => $order->province_id,
            'province_name' => $order->province_name,
            'city_id' => $order->city_id,
            'city_name' => $order->city_name,
            'district_id' => $order->district_id,
            'district_name' => $order->district_name,
            'subdistrict_id' => $order->subdistrict_id,
            'subdistrict_name' => $order->subdistrict_name,
            'city' => $order->city_name,
            'postal_code' => $order->postal_code,
            'latitude' => $order->latitude,
            'longitude' => $order->longitude,
            'courier_service' => $order->courier_service,
            'courier_service_type' => $order->courier_service_type,
            'courier' => $order->courier,
            'courier_logo' => app(KiriminAjaService::class)->getCourierLogoUrl($order->courier ?: $order->courier_service),
            'tracking_number' => $order->shipping?->awb,
            'shipping_payment_code' => $order->shipping?->shipping_payment_code,
            'delivered_at' => $order->shipping?->delivered_at?->format('d/m/Y, H:i').' WIB',
            'auto_completes_at' => $order->shipping?->auto_completes_at?->toIso8601String(),
            'auto_completes_at_formatted' => $order->shipping?->auto_completes_at?->format('d/m/Y'),
            'auto_completes_at_time' => $order->shipping?->auto_completes_at?->format('d/m/Y, H:i').' WIB',
            'shipping' => $order->shipping ? [
                'id' => $order->shipping->id,
                'shipping_payment_code' => $order->shipping->shipping_payment_code,
                'awb' => $order->shipping->awb,
                'text' => $order->shipping->text,
                'image' => $order->shipping->image,
                'origin' => $order->shipping->origin,
                'destination' => $order->shipping->destination,
                'histories' => $order->shipping->histories,
                'delivered_at' => $order->shipping->delivered_at?->format('d/m/Y, H:i').' WIB',
                'auto_completes_at' => $order->shipping->auto_completes_at?->toIso8601String(),
                'auto_completes_at_formatted' => $order->shipping->auto_completes_at?->format('d/m/Y'),
                'auto_completes_at_time' => $order->shipping->auto_completes_at?->format('d/m/Y, H:i').' WIB',
            ] : null,
            'shipping_cost' => (int) $order->shipping_cost,
            'shipping_cost_formatted' => $order->shipping_cost > 0 ? 'Rp '.number_format($order->shipping_cost, 0, ',', '.') : 'Gratis',
            'subtotal' => (int) $order->subtotal,
            'subtotal_formatted' => 'Rp '.number_format($order->subtotal, 0, ',', '.'),
            'discount_amount' => (int) $order->discount_amount,
            'discount_amount_formatted' => 'Rp '.number_format($order->discount_amount, 0, ',', '.'),
            'voucher_code' => $order->voucher_code,
            'voucher' => $order->voucher ? [
                'code' => $order->voucher->code,
                'name' => $order->voucher->name,
                'type' => $order->voucher->type,
                'value' => $order->voucher->value,
            ] : null,
            'total_amount' => (int) $order->total_amount,
            'total_amount_formatted' => 'Rp '.number_format($order->total_amount, 0, ',', '.'),
            'payment_method' => $order->payment_method,
            'payment_code' => $order->payment_code,
            'notes' => $order->notes,
            'items_count' => $items->sum('quantity'),
            'total_qty' => $items->sum('quantity'),
            'weight_formatted' => max(500, $items->sum('quantity') * 350).'gr',
            'is_cod' => $order->payment_method === 'cod' || str_contains(strtolower($order->payment_channel ?? ''), 'cod'),
            'sender' => [
                'name' => Setting::get('shipping_sender_name', Setting::get('store_name', 'Aroma Palace Official')),
                'phone' => Setting::get('shipping_sender_phone', Setting::get('store_phone', '081288889999')),
                'address' => Setting::get('shipping_address', 'Jl. Kemang Raya No. 10'),
                'province_name' => Setting::get('shipping_province_name', 'DKI Jakarta'),
                'city_name' => Setting::get('shipping_city_name', 'Kota Administrasi Jakarta Selatan'),
                'district_name' => Setting::get('shipping_district_name', 'Kebayoran Baru'),
                'subdistrict_name' => Setting::get('shipping_subdistrict_name', 'Kramat Pela'),
                'postal_code' => Setting::get('shipping_postal_code', '12130'),
            ],
            'items' => $items,
        ];
    }
}
