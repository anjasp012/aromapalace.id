<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyPointHistory;
use App\Models\Voucher;
use App\Services\MembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    public function __construct(
        protected MembershipService $membershipService
    ) {}

    /**
     * Display the Royale Club Membership & Loyalty dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $membership = $user ? $this->membershipService->getMembership($user) : null;

        $membershipData = null;
        $histories = [];
        $userVouchers = [];

        if ($membership) {
            $membershipData = [
                'id' => $membership->id,
                'membership_number' => $membership->membership_number,
                'points' => $membership->points,
                'points_formatted' => number_format($membership->points, 0, ',', '.'),
                'lifetime_points' => $membership->lifetime_points,
                'lifetime_points_formatted' => number_format($membership->lifetime_points, 0, ',', '.'),
                'joined_at' => $membership->joined_at?->format('d M Y') ?? $membership->created_at?->format('d M Y'),
            ];

            // Point transactions history (Poin Masuk & Poin Berkurang)
            $histories = LoyaltyPointHistory::where('membership_id', $membership->id)
                ->latest('created_at')
                ->take(50)
                ->get()
                ->map(function (LoyaltyPointHistory $h) {
                    return [
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
                    ];
                })
                ->all();

            $totalPointsIn = (int) LoyaltyPointHistory::where('membership_id', $membership->id)->where('points', '>', 0)->sum('points');
            $totalPointsOut = (int) abs(LoyaltyPointHistory::where('membership_id', $membership->id)->where('points', '<', 0)->sum('points'));

            // Fetch user's redeemed vouchers
            $redeemedCodes = LoyaltyPointHistory::where('membership_id', $membership->id)
                ->where('type', 'redeemed')
                ->whereNotNull('reference_id')
                ->pluck('reference_id')
                ->all();

            if (! empty($redeemedCodes)) {
                $userVouchers = Voucher::whereIn('code', $redeemedCodes)
                    ->latest()
                    ->get()
                    ->map(function (Voucher $v) use ($user) {
                        $isExpired = $v->expires_at && $v->expires_at->isPast();
                        $isUsed = $v->hasBeenUsedBy($user->id) || ($v->usage_limit !== null && $v->used_count >= $v->usage_limit);

                        return [
                            'id' => $v->id,
                            'code' => $v->code,
                            'name' => $v->name,
                            'description' => $v->description,
                            'type' => $v->type,
                            'formatted_discount' => $v->type === 'percentage' ? $v->value.'%' : 'Rp '.number_format($v->value, 0, ',', '.'),
                            'min_order_amount_formatted' => $v->min_order_amount > 0 ? 'Min. Belanja Rp '.number_format($v->min_order_amount, 0, ',', '.') : 'Tanpa Min. Belanja',
                            'expires_at' => $v->expires_at?->format('d M Y'),
                            'is_valid' => $v->is_active && ! $isExpired && ! $isUsed,
                            'status_label' => $isUsed ? 'Sudah Digunakan' : ($isExpired ? 'Kedaluwarsa' : 'Aktif'),
                        ];
                    })
                    ->all();
            }
        }

        // Available catalog rewards to redeem directly from vouchers database table
        $rewards = Voucher::query()
            ->where('voucher_type', 'reward')
            ->whereNull('user_id')
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now());
            })
            ->orderBy('points_required', 'asc')
            ->get()
            ->map(function (Voucher $v) use ($membership) {
                $userPoints = $membership ? $membership->points : 0;
                $pointsReq = $v->points_required ?? 0;
                $canRedeem = $membership && ($userPoints >= $pointsReq);

                return [
                    'id' => $v->id,
                    'name' => $v->name,
                    'name_en' => $v->name_en,
                    'description' => $v->description,
                    'description_en' => $v->description_en,
                    'points_required' => $pointsReq,
                    'reward_type' => $v->type,
                    'reward_value' => $v->value,
                    'formatted_discount' => $v->getFormattedDiscount(),
                    'min_order_formatted' => $v->min_order_amount > 0 ? 'Min. Belanja Rp '.number_format($v->min_order_amount, 0, ',', '.') : 'Tanpa Min. Belanja',
                    'can_redeem' => $canRedeem,
                    'shortage' => max(0, $pointsReq - $userPoints),
                ];
            })->all();

        return Inertia::render('membership', [
            'is_member' => (bool) $membership,
            'membership' => $membershipData,
            'histories' => $histories,
            'total_points_in' => $totalPointsIn ?? 0,
            'total_points_in_formatted' => number_format($totalPointsIn ?? 0, 0, ',', '.'),
            'total_points_out' => $totalPointsOut ?? 0,
            'total_points_out_formatted' => number_format($totalPointsOut ?? 0, 0, ',', '.'),
            'rewards' => $rewards,
            'user_vouchers' => $userVouchers,
        ]);
    }

    /**
     * User joins / activates Royale Membership.
     */
    public function join(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isEn = app()->getLocale() === 'en';
        if (! $user) {
            return redirect()->route('login')->with('notice', $isEn ? 'Please sign in first to join Royale Club.' : 'Silakan masuk terlebih dahulu untuk bergabung ke Royale Club.');
        }

        $this->membershipService->join($user);

        return back()->with('success', $isEn ? 'Congratulations! You are officially a Royale Club member with 100 Welcome Points.' : 'Selamat! Anda resmi menjadi anggota Royale Club dan mendapatkan 100 Poin Sambutan.');
    }

    /**
     * User redeems points for a reward voucher.
     */
    public function redeem(Request $request, $reward): RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        $voucher = $reward instanceof Voucher ? $reward : Voucher::find($reward);

        if (! $voucher) {
            return back()->with('error', 'Reward voucher tidak ditemukan.');
        }

        $result = $this->membershipService->redeemReward($user, $voucher);

        if (! $result['success']) {
            return back()->with('error', $result['message']);
        }

        return back()->with('success', $result['message']);
    }
}
