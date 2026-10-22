<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\MembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function __construct(
        protected MembershipService $membershipService
    ) {}

    /**
     * Display the mobile & desktop customer account hub.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $membership = $this->membershipService->getMembership($user, true);

        // Quick status counts for orders matching order filters
        $orderCounts = [
            'all' => $user->orders()->count(),
            'menunggu_pembayaran' => $user->orders()->where(function ($q) {
                $q->where('status', 'menunggu_pembayaran')
                    ->orWhere(fn ($sub) => $sub->whereNull('status')->where('payment_status', 'pending'));
            })->count(),
            'diproses' => $user->orders()->where('status', 'diproses')->count(),
            'dikirim' => $user->orders()->where('status', 'dikirim')->count(),
            'selesai' => $user->orders()->where(function ($q) {
                $q->where('status', 'selesai')
                    ->orWhere(fn ($sub) => $sub->whereNull('status')->where('payment_status', 'paid'));
            })->count(),
        ];

        $membershipData = null;
        $pointHistories = [];
        $totalPointsIn = 0;
        $totalPointsOut = 0;

        if ($membership) {
            $membershipData = [
                'membership_number' => $membership->membership_number,
                'points' => $membership->points,
                'points_formatted' => number_format($membership->points, 0, ',', '.'),
            ];

            $pointHistories = $membership->pointHistories()
                ->take(30)
                ->get()
                ->map(fn ($h) => [
                    'id' => $h->id,
                    'type' => $h->type,
                    'category' => $h->points >= 0 ? 'masuk' : 'berkurang',
                    'type_label' => $h->points >= 0 ? 'Poin Masuk' : 'Poin Berkurang',
                    'points' => $h->points,
                    'points_formatted' => ($h->points > 0 ? '+' : '').number_format($h->points, 0, ',', '.'),
                    'balance_after' => $h->balance_after,
                    'balance_after_formatted' => number_format($h->balance_after, 0, ',', '.'),
                    'description' => $h->description,
                    'reference_id' => $h->reference_id,
                    'created_at' => $h->created_at?->format('d M Y, H:i').' WIB',
                    'is_positive' => $h->points > 0,
                ])
                ->all();

            $totalPointsIn = (int) $membership->pointHistories()->where('points', '>', 0)->sum('points');
            $totalPointsOut = (int) abs($membership->pointHistories()->where('points', '<', 0)->sum('points'));
        }

        return Inertia::render('account', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'address' => $user->address ?? '',
                'city' => $user->city ?? '',
                'postal_code' => $user->postal_code ?? '',
                'role' => $user->role,
                'joined_at' => $user->created_at ? $user->created_at->format('d M Y') : 'Member Setia',
            ],
            'membership' => $membershipData,
            'point_histories' => $pointHistories,
            'total_points_in' => $totalPointsIn,
            'total_points_in_formatted' => number_format($totalPointsIn, 0, ',', '.'),
            'total_points_out' => $totalPointsOut,
            'total_points_out_formatted' => number_format($totalPointsOut, 0, ',', '.'),
            'order_counts' => $orderCounts,
            'wishlist_count' => (int) $user->wishlists()->count(),
            'addresses' => $user->addresses()->get(),
        ]);
    }

    /**
     * Update customer basic profile info.
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:25'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:15'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? $user->phone,
            'address' => $validated['address'] ?? $user->address,
            'city' => $validated['city'] ?? $user->city,
            'postal_code' => $validated['postal_code'] ?? $user->postal_code,
        ]);

        return back()->with('success', 'Profil dan alamat Anda berhasil diperbarui.');
    }

    /**
     * Update customer account password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Kata sandi akun Anda berhasil diperbarui.');
    }

    /**
     * Delete the customer account (required by App Store guideline 5.1.1(v)).
     *
     * Personal data is removed and the user record is anonymized, so past
     * orders stay intact for the store's transaction records.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        DB::transaction(function () use ($user) {
            $user->wishlists()->delete();
            $user->cartItems()->delete();
            $user->searchHistories()->delete();
            $user->deviceTokens()->delete();
            $user->membership()->delete();

            $user->forceFill([
                'name' => 'Akun Dihapus',
                'email' => 'deleted-'.$user->id.'-'.Str::random(12).'@deleted.aromapalace.id',
                'password' => Hash::make(Str::random(40)),
                'remember_token' => null,
            ])->save();
        });

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')->with('success', 'Akun Anda telah dihapus.');
    }
}
