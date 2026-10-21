<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Services\CatalogService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class OrderController extends Controller
{
    /**
     * Display the authenticated user's orders history.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login', [
                'notice' => 'Silakan masuk untuk melihat riwayat pesanan Anda.',
            ]);
        }

        if ($user->isAdmin()) {
            return redirect()->route('admin.orders.index');
        }

        $activeTab = (string) $request->query('status', 'all');

        if (! in_array($activeTab, ['all', 'menunggu_pembayaran', 'diproses', 'dikirim', 'selesai'])) {
            $activeTab = 'all';
        }

        $query = $user->orders()->with(['items', 'voucher', 'store'])->latest();

        if ($activeTab === 'menunggu_pembayaran') {
            $query->where(function ($q) {
                $q->where('status', 'menunggu_pembayaran')
                    ->orWhere(function ($sub) {
                        $sub->whereNull('status')->where('payment_status', 'pending');
                    });
            });
        } elseif ($activeTab === 'diproses') {
            $query->where('status', 'diproses');
        } elseif ($activeTab === 'dikirim') {
            $query->where('status', 'dikirim');
        } elseif ($activeTab === 'selesai') {
            $query->where(function ($q) {
                $q->where('status', 'selesai')
                    ->orWhere(function ($sub) {
                        $sub->whereNull('status')->where('payment_status', 'paid');
                    });
            });
        }

        $tabCounts = [
            'all' => $user->orders()->count(),
            'menunggu_pembayaran' => $user->orders()->where(function ($q) {
                $q->where('status', 'menunggu_pembayaran')
                    ->orWhere(function ($sub) {
                        $sub->whereNull('status')->where('payment_status', 'pending');
                    });
            })->count(),
            'diproses' => $user->orders()->where('status', 'diproses')->count(),
            'dikirim' => $user->orders()->where('status', 'dikirim')->count(),
            'selesai' => $user->orders()->where(function ($q) {
                $q->where('status', 'selesai')
                    ->orWhere(function ($sub) {
                        $sub->whereNull('status')->where('payment_status', 'paid');
                    });
            })->count(),
        ];

        $orders = $query->get()->map(function (Order $order) {
            $items = $order->items->map(function (OrderItem $item) {
                $productData = CatalogService::find($item->product_id);

                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'volume' => $item->volume,
                    'price' => $item->price,
                    'price_formatted' => 'Rp '.number_format($item->price, 0, ',', '.'),
                    'quantity' => $item->quantity,
                    'total_price' => $item->total_price,
                    'total_price_formatted' => 'Rp '.number_format($item->total_price, 0, ',', '.'),
                    'image' => $productData['image'] ?? 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                    'slug' => $productData['slug'] ?? '',
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
                'delivery_type' => $order->delivery_type ?: 'delivery',
                'store_id' => $order->store_id,
                'store' => $order->store ? [
                    'id' => $order->store->id,
                    'name' => $order->store->name,
                    'description' => $order->store->description,
                    'thumbnail' => $order->store->thumbnail,
                    'gmaps_link' => $order->store->gmaps_link,
                ] : null,
                'created_at' => $order->created_at?->format('d M Y, H:i').' WIB',
                'created_at_raw' => $order->created_at?->toIso8601String(),
                'pay_before' => $payBefore ? $payBefore->format('d M Y, H:i').' WIB' : null,
                'pay_before_raw' => $payBefore?->toIso8601String(),
                'status' => $order->payment_status,
                'order_status' => $orderStatus,
                'status_label' => $statusLabel,
                'payment_method' => $order->payment_method,
                'payment_channel' => $order->payment_channel,
                'payment_code' => $order->payment_code,
                'recipient_name' => $order->recipient_name,
                'recipient_phone' => $order->recipient_phone,
                'shipping_address' => $order->shipping_address,
                'city' => $order->city,
                'postal_code' => $order->postal_code,
                'courier' => $order->courier,
                'shipping_cost' => $order->shipping_cost,
                'shipping_cost_formatted' => $order->shipping_cost > 0 ? 'Rp '.number_format($order->shipping_cost, 0, ',', '.') : 'Gratis',
                'subtotal' => $order->subtotal,
                'subtotal_formatted' => 'Rp '.number_format($order->subtotal, 0, ',', '.'),
                'discount_amount' => $order->discount_amount,
                'discount_amount_formatted' => 'Rp '.number_format($order->discount_amount, 0, ',', '.'),
                'voucher_code' => $order->voucher_code,
                'voucher_id' => $order->voucher_id,
                'voucher' => $order->voucher ? [
                    'id' => $order->voucher->id,
                    'code' => $order->voucher->code,
                    'name' => $order->voucher->name,
                    'description' => $order->voucher->description,
                    'terms' => $order->voucher->terms ?? [],
                    'type' => $order->voucher->type,
                    'value' => $order->voucher->value,
                ] : null,
                'notes' => $order->notes,
                'total_amount' => $order->total_amount,
                'total_amount_formatted' => 'Rp '.number_format($order->total_amount, 0, ',', '.'),
                'items_count' => $items->sum('quantity'),
                'items' => $items,
            ];
        });

        return Inertia::render('orders', [
            'orders' => $orders,
            'active_tab' => $activeTab,
            'tab_counts' => $tabCounts,
        ]);
    }

    /**
     * Alias for index method.
     */
    public function orders(Request $request): Response|RedirectResponse
    {
        return $this->index($request);
    }

    /**
     * Display printable invoice for an order.
     */
    public function invoice(Request $request, string $order): Response
    {
        $user = $request->user();

        $orderQuery = Order::where(function ($q) use ($order) {
            $q->where('order_number', $order)
                ->orWhere('id', $order);
        });

        if (! $user->isAdmin()) {
            $orderQuery->where('user_id', $user->id);
        }

        $orderModel = $orderQuery
            ->with(['items', 'voucher', 'store'])
            ->firstOrFail();

        $items = $orderModel->items->map(function (OrderItem $item) {
            return [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'volume' => $item->volume,
                'price' => (int) $item->price,
                'price_formatted' => 'Rp '.number_format($item->price, 0, ',', '.'),
                'quantity' => (int) $item->quantity,
                'total_price' => (int) $item->total_price,
                'total_price_formatted' => 'Rp '.number_format($item->total_price, 0, ',', '.'),
            ];
        });

        $dateFormatted = $orderModel->created_at ? $orderModel->created_at->format('d F Y, H:i').' WIB' : now()->format('d F Y, H:i').' WIB';
        $invDateCode = $orderModel->created_at ? $orderModel->created_at->format('Ymd') : date('Ymd');
        $invoiceNumber = 'INV/'.$invDateCode.'/AP/'.str_pad((string) $orderModel->id, 8, '0', STR_PAD_LEFT);

        $orderStatus = $orderModel->status ?: match ($orderModel->payment_status) {
            'paid' => 'diproses',
            'cancelled' => 'dibatalkan',
            default => 'menunggu_pembayaran',
        };

        $isPaid = $orderModel->payment_status === 'paid'
            || in_array($orderStatus, ['diproses', 'dikirim', 'selesai']);

        return Inertia::render('invoice', [
            'order' => [
                'id' => $orderModel->id,
                'order_number' => $orderModel->order_number,
                'invoice_number' => $invoiceNumber,
                'created_at' => $dateFormatted,
                'delivery_type' => $orderModel->delivery_type,
                'recipient_name' => $orderModel->recipient_name,
                'recipient_phone' => $orderModel->recipient_phone,
                'shipping_address' => $orderModel->shipping_address,
                'city' => $orderModel->city,
                'postal_code' => $orderModel->postal_code,
                'courier' => $orderModel->courier,
                'shipping_cost' => (int) $orderModel->shipping_cost,
                'shipping_cost_formatted' => $orderModel->shipping_cost > 0 ? 'Rp '.number_format($orderModel->shipping_cost, 0, ',', '.') : 'Rp 0',
                'payment_method' => $orderModel->payment_method,
                'payment_channel' => $orderModel->payment_channel,
                'payment_status' => $orderModel->payment_status,
                'order_status' => $orderStatus,
                'is_paid' => $isPaid,
                'subtotal' => (int) $orderModel->subtotal,
                'subtotal_formatted' => 'Rp '.number_format($orderModel->subtotal, 0, ',', '.'),
                'discount_amount' => (int) $orderModel->discount_amount,
                'discount_amount_formatted' => 'Rp '.number_format($orderModel->discount_amount, 0, ',', '.'),
                'voucher_code' => $orderModel->voucher_code,
                'total_amount' => (int) $orderModel->total_amount,
                'total_amount_formatted' => 'Rp '.number_format($orderModel->total_amount, 0, ',', '.'),
                'items_count' => $items->sum('quantity'),
                'items' => $items,
            ],
            'seller' => [
                'name' => 'Aroma Palace Official',
                'store_name' => $orderModel->store ? $orderModel->store->name : 'Aroma Palace Boutique',
            ],
            'buyer' => [
                'name' => $orderModel->recipient_name ?: $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Generate and stream/download native PDF invoice.
     */
    public function downloadInvoice(Request $request, string $order): SymfonyResponse
    {
        $user = $request->user();

        $orderQuery = Order::where(function ($q) use ($order) {
            $q->where('order_number', $order)
                ->orWhere('id', is_numeric($order) ? (int) $order : 0);
        });

        if (! $user || ! $user->isAdmin()) {
            if (! $user) {
                abort(401, 'Silakan masuk terlebih dahulu.');
            }
            $orderQuery->where('user_id', $user->id);
        }

        $orderModel = $orderQuery
            ->with(['items', 'voucher', 'store'])
            ->firstOrFail();

        $items = $orderModel->items->map(function (OrderItem $item) {
            return [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'volume' => $item->volume,
                'price' => (int) $item->price,
                'price_formatted' => 'Rp '.number_format($item->price, 0, ',', '.'),
                'quantity' => (int) $item->quantity,
                'total_price' => (int) $item->total_price,
                'total_price_formatted' => 'Rp '.number_format($item->total_price, 0, ',', '.'),
            ];
        });

        $dateFormatted = $orderModel->created_at ? $orderModel->created_at->format('d F Y, H:i').' WIB' : now()->format('d F Y, H:i').' WIB';
        $invDateCode = $orderModel->created_at ? $orderModel->created_at->format('Ymd') : date('Ymd');
        $invoiceNumber = 'INV/'.$invDateCode.'/AP/'.str_pad((string) $orderModel->id, 8, '0', STR_PAD_LEFT);

        $orderStatus = $orderModel->status ?: match ($orderModel->payment_status) {
            'paid' => 'diproses',
            'cancelled' => 'dibatalkan',
            default => 'menunggu_pembayaran',
        };

        $isPaid = $orderModel->payment_status === 'paid'
            || in_array($orderStatus, ['diproses', 'dikirim', 'selesai']);

        $pdfData = [
            'order' => [
                'id' => $orderModel->id,
                'order_number' => $orderModel->order_number,
                'invoice_number' => $invoiceNumber,
                'created_at' => $dateFormatted,
                'delivery_type' => $orderModel->delivery_type,
                'recipient_name' => $orderModel->recipient_name,
                'recipient_phone' => $orderModel->recipient_phone,
                'shipping_address' => $orderModel->shipping_address,
                'city' => $orderModel->city,
                'postal_code' => $orderModel->postal_code,
                'courier' => $orderModel->courier,
                'shipping_cost' => (int) $orderModel->shipping_cost,
                'shipping_cost_formatted' => $orderModel->shipping_cost > 0 ? 'Rp '.number_format($orderModel->shipping_cost, 0, ',', '.') : 'Rp 0',
                'payment_method' => $orderModel->payment_method,
                'payment_channel' => $orderModel->payment_channel,
                'payment_status' => $orderModel->payment_status,
                'order_status' => $orderStatus,
                'is_paid' => $isPaid,
                'subtotal' => (int) $orderModel->subtotal,
                'subtotal_formatted' => 'Rp '.number_format($orderModel->subtotal, 0, ',', '.'),
                'discount_amount' => (int) $orderModel->discount_amount,
                'discount_amount_formatted' => 'Rp '.number_format($orderModel->discount_amount, 0, ',', '.'),
                'voucher_code' => $orderModel->voucher_code,
                'total_amount' => (int) $orderModel->total_amount,
                'total_amount_formatted' => 'Rp '.number_format($orderModel->total_amount, 0, ',', '.'),
                'items_count' => $items->sum('quantity'),
                'items' => $items,
            ],
            'seller' => [
                'name' => 'Aroma Palace Official',
                'store_name' => $orderModel->store ? $orderModel->store->name : 'Aroma Palace Boutique',
            ],
            'buyer' => [
                'name' => $orderModel->recipient_name ?: $user->name,
                'email' => $user->email,
            ],
        ];

        $fileName = 'Invoice-'.$orderModel->order_number.'.pdf';

        $pdf = Pdf::loadView('invoices.pdf', $pdfData)
            ->setPaper('a4', 'portrait')
            ->setOption([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif',
            ]);

        return $pdf->download($fileName);
    }
}
