<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DeviceTokenController extends Controller
{
    /**
     * Register or update an FCM device token.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'device_type' => ['nullable', 'string', 'in:web,android,ios'],
            'browser' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();
        $deviceType = $validated['device_type'] ?? 'web';
        $role = $user ? ($user->isAdmin() ? 'admin' : 'customer') : 'customer';

        $deviceToken = DeviceToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $user?->id,
                'device_type' => $deviceType,
                'role' => $role,
                'browser' => $validated['browser'] ?? $request->header('User-Agent'),
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Token perangkat berhasil didaftarkan.',
            'data' => [
                'id' => $deviceToken->id,
                'role' => $deviceToken->role,
                'device_type' => $deviceToken->device_type,
            ],
        ]);
    }

    /**
     * Remove an FCM device token (e.g. on logout or revoke).
     */
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        DeviceToken::where('token', $validated['token'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Token perangkat berhasil dihapus.',
        ]);
    }

    /**
     * Poll for newly placed orders for Admin real-time notifications.
     */
    public function pollAdminOrders(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->isAdmin()) {
            return response()->json(['has_new' => false], 403);
        }

        $lastOrderId = (int) $request->query('last_order_id', 0);

        // First call sets baseline
        if ($lastOrderId <= 0) {
            $maxId = (int) Order::max('id');

            return response()->json([
                'has_new' => false,
                'latest_order_id' => $maxId,
                'orders' => [],
            ]);
        }

        $newOrders = Order::where('id', '>', $lastOrderId)
            ->latest('id')
            ->take(5)
            ->get();

        if ($newOrders->isEmpty()) {
            return response()->json([
                'has_new' => false,
                'latest_order_id' => $lastOrderId,
                'orders' => [],
            ]);
        }

        $orders = $newOrders->map(fn (Order $order) => [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'recipient_name' => $order->recipient_name,
            'total_amount' => $order->total_amount,
            'total_amount_formatted' => 'Rp '.number_format($order->total_amount, 0, ',', '.'),
            'delivery_type' => $order->delivery_type,
            'url' => url('/admin/orders/'.$order->id),
        ]);

        return response()->json([
            'has_new' => true,
            'latest_order_id' => (int) $newOrders->max('id'),
            'orders' => $orders,
        ]);
    }

    /**
     * Poll for recent updates on customer orders (status changed, shipped, pickup ready, etc).
     */
    public function pollCustomerOrders(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['has_new' => false], 401);
        }

        $since = $request->query('since');
        $sinceTime = $since ? Carbon::parse($since) : now()->subMinutes(1);

        $updatedOrders = $user->orders()
            ->where('updated_at', '>', $sinceTime)
            ->latest('updated_at')
            ->take(3)
            ->get();

        $events = [];
        foreach ($updatedOrders as $order) {
            $events[] = [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'delivery_type' => $order->delivery_type,
                'updated_at' => $order->updated_at?->toIso8601String(),
            ];
        }

        return response()->json([
            'has_new' => ! empty($events),
            'server_time' => now()->toIso8601String(),
            'events' => $events,
        ]);
    }
}
