<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\CatalogService;
use App\Services\FirebaseNotificationService;
use App\Services\MembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ->with(['items', 'store', 'user', 'voucher'])
            ->firstOrFail();

        return Inertia::render('admin/orders/show', [
            'order' => $this->mapOrderDetail($orderModel),
        ]);
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
            'notes' => ['nullable', 'string', 'max:500'],
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
        } elseif ($newStatus === 'menunggu_pembayaran') {
            $orderModel->payment_status = 'pending';
        }

        if (isset($validated['notes'])) {
            $orderModel->notes = $validated['notes'];
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

        $label = match ($newStatus) {
            'selesai' => 'Selesai',
            'dikirim' => $orderModel->delivery_type === 'pickup' ? 'Pengambilan di Butik' : 'Dikirim',
            'diproses' => 'Diproses',
            'menunggu_pembayaran' => 'Menunggu Pembayaran',
            'dibatalkan' => 'Dibatalkan',
            default => $newStatus,
        };

        return back()->with('success', "Status pesanan #{$orderModel->order_number} berhasil diperbarui menjadi \"{$label}\".");
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
            'courier' => $order->courier,
            'city' => $order->city,
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
            'shipping_address' => $order->shipping_address,
            'province_name' => $order->province_name,
            'city_name' => $order->city_name,
            'district_name' => $order->district_name,
            'subdistrict_name' => $order->subdistrict_name,
            'city' => $order->city_name,
            'postal_code' => $order->postal_code,
            'courier' => $order->courier,
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
            'payment_channel' => $order->payment_channel,
            'payment_code' => $order->payment_code,
            'notes' => $order->notes,
            'items_count' => $items->sum('quantity'),
            'items' => $items,
        ];
    }
}
