<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the admin executive dashboard.
     */
    public function index(Request $request): Response
    {
        $totalRevenue = (int) Order::where('payment_status', 'paid')->sum('total_amount');
        $totalOrders = Order::count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalProducts = Product::count();

        $statusCounts = [
            'menunggu_pembayaran' => Order::where('status', 'menunggu_pembayaran')
                ->orWhere(fn ($q) => $q->whereNull('status')->where('payment_status', 'pending'))
                ->count(),
            'diproses' => Order::where('status', 'diproses')->count(),
            'dikirim' => Order::where('status', 'dikirim')->where('delivery_type', 'delivery')->count(),
            'pengambilan' => Order::where('status', 'dikirim')->where('delivery_type', 'pickup')->count(),
            'selesai' => Order::where('status', 'selesai')
                ->orWhere(fn ($q) => $q->whereNull('status')->where('payment_status', 'paid'))
                ->count(),
            'dibatalkan' => Order::where('status', 'dibatalkan')->orWhere('payment_status', 'cancelled')->count(),
        ];

        // Action needed: orders currently processing
        $actionNeededOrders = Order::with(['items', 'store', 'user'])
            ->where('status', 'diproses')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn (Order $order) => $this->mapOrderSummary($order));

        // Recent 8 orders
        $recentOrders = Order::with(['items', 'store', 'user'])
            ->latest()
            ->take(8)
            ->get()
            ->map(fn (Order $order) => $this->mapOrderSummary($order));

        return Inertia::render('admin/dashboard', [
            'metrics' => [
                'total_revenue' => $totalRevenue,
                'total_revenue_formatted' => 'Rp '.number_format($totalRevenue, 0, ',', '.'),
                'total_orders' => $totalOrders,
                'total_customers' => $totalCustomers,
                'total_products' => $totalProducts,
                'needs_action_count' => $statusCounts['diproses'],
            ],
            'status_counts' => $statusCounts,
            'action_needed_orders' => $actionNeededOrders,
            'recent_orders' => $recentOrders,
        ]);
    }

    /**
     * Map order for list/summary views.
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
            'customer_email' => $order->user?->email,
            'delivery_type' => $order->delivery_type ?: 'delivery',
            'store_name' => $order->store?->name,
            'total_amount' => $order->total_amount,
            'total_amount_formatted' => 'Rp '.number_format($order->total_amount, 0, ',', '.'),
            'payment_channel' => $order->payment_channel,
            'payment_status' => $order->payment_status,
            'order_status' => $orderStatus,
            'status_label' => $statusLabel,
            'items_count' => $order->items->sum('quantity'),
            'first_item' => $order->items->first()?->product_name,
            'created_at' => $order->created_at?->format('d M Y, H:i').' WIB',
            'created_at_human' => $order->created_at?->diffForHumans(),
        ];
    }
}
