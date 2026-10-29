<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display the full notifications page in Admin panel.
     */
    public function page(Request $request): Response
    {
        $query = Notification::query()->where('for_admin', true);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'unread') {
                $query->where('is_read', false);
            } elseif ($request->status === 'read') {
                $query->where('is_read', true);
            }
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $type = $request->type;
            if ($type === 'orders') {
                $query->whereIn('type', ['new_order', 'admin_new_order']);
            } elseif ($type === 'payments') {
                $query->whereIn('type', ['payment_success', 'admin_payment_received']);
            } elseif ($type === 'shipping') {
                $query->whereIn('type', ['order_shipped', 'admin_order_shipped', 'store_pickup_ready', 'admin_store_pickup_ready']);
            } elseif ($type === 'delivered') {
                $query->whereIn('type', ['order_delivered', 'admin_order_delivered']);
            } elseif ($type === 'completed') {
                $query->whereIn('type', ['order_completed', 'admin_order_completed']);
            } elseif ($type === 'canceled') {
                $query->whereIn('type', ['order_canceled', 'admin_order_canceled']);
            } elseif ($type === 'users') {
                $query->whereIn('type', ['new_user_welcome', 'admin_new_user']);
            } elseif ($type === 'loyalty') {
                $query->whereIn('type', ['loyalty_points_earned', 'loyalty_points_redeemed', 'admin_points_redeemed', 'voucher_reward', 'promo']);
            } elseif ($type === 'system') {
                $query->whereIn('type', ['system', 'general', 'admin']);
            } else {
                $query->where('type', $type);
            }
        }

        $notifications = $query->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Notification $n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'body' => $n->body,
                'url' => $n->admin_url ?: $n->url,
                'data' => $n->data,
                'is_read' => $n->is_read,
                'created_at' => $n->created_at ? $n->created_at->format('d M Y H:i') : null,
                'time_ago' => $n->created_at ? $n->created_at->diffForHumans() : null,
            ]);

        $metrics = [
            'total' => Notification::where('for_admin', true)->count(),
            'unread' => Notification::where('for_admin', true)->where('is_read', false)->count(),
            'read' => Notification::where('for_admin', true)->where('is_read', true)->count(),
        ];

        return Inertia::render('admin/notifications/index', [
            'notifications' => $notifications,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all'),
                'type' => $request->input('type', 'all'),
            ],
            'metrics' => $metrics,
        ]);
    }

    /**
     * Get recent notifications for admin topbar.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::query()
            ->where('for_admin', true)
            ->latest('id')
            ->take(20)
            ->get()
            ->map(fn (Notification $n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'body' => $n->body,
                'url' => $n->admin_url ?: $n->url,
                'is_read' => $n->is_read,
                'created_at' => $n->created_at ? $n->created_at->diffForHumans() : null,
            ]);

        $unreadCount = Notification::query()
            ->where('for_admin', true)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Notification $notification): RedirectResponse|JsonResponse
    {
        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        if (request()->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }

    /**
     * Mark all admin notifications as read.
     */
    public function markAllAsRead(): RedirectResponse|JsonResponse
    {
        Notification::query()
            ->where('for_admin', true)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        if (request()->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }

    /**
     * Mark a notification as read and redirect to its destination URL.
     */
    public function goToNotification(Notification $notification): RedirectResponse
    {
        if (! $notification->is_read) {
            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }

        $targetUrl = $notification->admin_url ?: $notification->url;

        if (! empty($targetUrl)) {
            return redirect($targetUrl);
        }

        return redirect()->route('admin.notifications.page');
    }

    /**
     * Delete a notification.
     */
    public function destroy(Notification $notification): RedirectResponse
    {
        $notification->delete();

        return back()->with('success', 'Notifikasi berhasil dihapus.');
    }
}
