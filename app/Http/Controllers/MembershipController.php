<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyPointHistory;
use App\Models\LoyaltyReward;
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
                    ->map(function (Voucher $v) {
                        $isExpired = $v->expires_at && $v->expires_at->isPast();
                        $isUsed = $v->usage_limit !== null && $v->used_count >= $v->usage_limit;

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

        // Available catalog rewards to redeem
        $rewards = LoyaltyReward::where('is_active', true)
            ->orderBy('points_required', 'asc')
            ->get()
            ->map(function (LoyaltyReward $r) use ($membership) {
                $userPoints = $membership ? $membership->points : 0;
                $canRedeem = $membership && ($userPoints >= $r->points_required);

                return [
                    'id' => $r->id,
                    'name' => $r->name,
                    'description' => $r->description,
                    'points_required' => $r->points_required,
                    'reward_type' => $r->reward_type,
                    'reward_value' => $r->reward_value,
                    'formatted_discount' => $r->getFormattedDiscount(),
                    'min_order_formatted' => $r->min_order_amount > 0 ? 'Min. Belanja Rp '.number_format($r->min_order_amount, 0, ',', '.') : 'Tanpa Min. Belanja',
                    'can_redeem' => $canRedeem,
                    'shortage' => max(0, $r->points_required - $userPoints),
                ];
            })
            ->all();

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
        if (! $user) {
            return redirect()->route('login')->with('notice', 'Silakan masuk terlebih dahulu untuk bergabung ke Royale Club.');
        }

        $this->membershipService->join($user);

        return back()->with('success', 'Selamat! Anda resmi menjadi anggota Royale Club dan mendapatkan 100 Poin Sambutan.');
    }

    /**
     * User redeems points for a reward.
     */
    public function redeem(Request $request, LoyaltyReward $reward): RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        $result = $this->membershipService->redeemReward($user, $reward);

        if (! $result['success']) {
            return back()->with('error', $result['message']);
        }

        return back()->with('success', $result['message']);
    }
}
