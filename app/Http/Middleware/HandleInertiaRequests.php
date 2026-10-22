<?php

namespace App\Http\Middleware;

use App\Models\Notification;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => fn () => app()->getLocale(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'header_vouchers' => fn () => Cache::remember('active_header_vouchers', 600, function () {
                return Voucher::query()
                    ->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
                    })
                    ->where(function ($q) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
                    })
                    ->select(['id', 'code', 'name', 'name_en', 'description', 'description_en', 'terms', 'type', 'value', 'min_order_amount', 'max_discount_amount'])
                    ->get();
            }),
            'auth' => [
                'user' => $user,
                'is_admin' => fn () => $user ? $user->isAdmin() : false,
                'wishlist_ids' => fn () => ($user && ! $user->isAdmin()) ? $user->wishlists()->pluck('product_id')->all() : [],
                'wishlist_count' => fn () => ($user && ! $user->isAdmin()) ? (int) $user->wishlists()->count() : 0,
                'cart_count' => fn () => ($user && ! $user->isAdmin()) ? (int) $user->cartItems()->count() : 0,
                'membership' => fn () => ($user && ! $user->isAdmin() && $user->membership) ? [
                    'membership_number' => $user->membership->membership_number,
                    'points' => $user->membership->points,
                    'points_formatted' => number_format($user->membership->points, 0, ',', '.'),
                ] : null,
                'search_history' => fn () => $user ? $user->searchHistories()->latest('updated_at')->take(10)->pluck('query')->all() : [],
            ],
            'admin_notifications' => fn () => ($user && $user->isAdmin())
                ? Notification::query()
                    ->where('for_admin', true)
                    ->latest('id')
                    ->take(15)
                    ->get()
                    ->map(fn (Notification $n) => [
                        'id' => $n->id,
                        'type' => $n->type,
                        'title' => $n->title,
                        'body' => $n->body,
                        'url' => $n->url,
                        'is_read' => $n->is_read,
                        'created_at' => $n->created_at ? $n->created_at->diffForHumans() : null,
                    ])
                    ->values()
                    ->all()
                : [],
            'admin_unread_notifications_count' => fn () => ($user && $user->isAdmin())
                ? (int) Notification::query()
                    ->where('for_admin', true)
                    ->where('is_read', false)
                    ->count()
                : 0,
        ];
    }
}
