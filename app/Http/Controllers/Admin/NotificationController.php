<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
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
                'url' => $n->url,
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
}
