<?php

namespace App\Services;

use App\Models\LoyaltyPointHistory;
use App\Models\LoyaltyReward;
use App\Models\Membership;
use App\Models\Order;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MembershipService
{
    /**
     * Activate or fetch user membership.
     */
    public function getMembership(User $user, bool $autoCreate = false): ?Membership
    {
        $membership = $user->membership()->with(['pointHistories'])->first();

        if (! $membership && $autoCreate && ! $user->isAdmin()) {
            $membership = $this->join($user);
        }

        return $membership;
    }

    /**
     * Join membership program and grant welcome points.
     */
    public function join(User $user): Membership
    {
        return DB::transaction(function () use ($user) {
            $existing = $user->membership;
            if ($existing) {
                return $existing;
            }

            $number = 'AP-ROYALE-'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT).'-'.strtoupper(Str::random(3));

            $membership = Membership::create([
                'user_id' => $user->id,
                'membership_number' => $number,
                'points' => 100,
                'lifetime_points' => 100,
                'joined_at' => now(),
            ]);

            LoyaltyPointHistory::create([
                'user_id' => $user->id,
                'membership_id' => $membership->id,
                'type' => 'bonus',
                'points' => 100,
                'balance_after' => 100,
                'description' => 'Bonus Selamat Datang Royale Club (+100 Poin)',
                'reference_id' => 'WELCOME-BONUS',
                'created_at' => now(),
            ]);

            return $membership;
        });
    }

    /**
     * Manually add points (Poin Masuk).
     */
    public function addPoints(User $user, int $points, string $description, ?string $referenceId = null, string $type = 'masuk'): LoyaltyPointHistory
    {
        $membership = $this->getMembership($user, true);

        return DB::transaction(function () use ($user, $membership, $points, $description, $referenceId, $type) {
            $membership->points += $points;
            $membership->lifetime_points += $points;
            $membership->save();

            return LoyaltyPointHistory::create([
                'user_id' => $user->id,
                'membership_id' => $membership->id,
                'type' => $type,
                'points' => abs($points),
                'balance_after' => $membership->points,
                'description' => $description,
                'reference_id' => $referenceId,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Manually deduct points (Poin Berkurang).
     */
    public function deductPoints(User $user, int $points, string $description, ?string $referenceId = null, string $type = 'berkurang'): ?LoyaltyPointHistory
    {
        $membership = $this->getMembership($user, true);
        $pointsToDeduct = abs($points);

        if ($membership->points < $pointsToDeduct) {
            return null;
        }

        return DB::transaction(function () use ($user, $membership, $pointsToDeduct, $description, $referenceId, $type) {
            $membership->points -= $pointsToDeduct;
            $membership->save();

            return LoyaltyPointHistory::create([
                'user_id' => $user->id,
                'membership_id' => $membership->id,
                'type' => $type,
                'points' => -$pointsToDeduct,
                'balance_after' => $membership->points,
                'description' => $description,
                'reference_id' => $referenceId,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Award loyalty points for a completed order (Poin Masuk dari Belanja).
     * Rule: Tiap pesanan nambah poin (1 poin per Rp 10.000 belanja).
     */
    public function awardOrderPoints(Order $order): ?LoyaltyPointHistory
    {
        $user = $order->user;
        if (! $user) {
            return null;
        }

        $membership = $user->membership ?? $this->join($user);

        // Check if points already awarded for this order
        $alreadyAwarded = LoyaltyPointHistory::where('membership_id', $membership->id)
            ->where('reference_id', $order->order_number)
            ->where('type', 'earned')
            ->exists();

        if ($alreadyAwarded) {
            return null;
        }

        $amount = (int) $order->total_amount;
        if ($amount < 10000) {
            return null;
        }

        // 1 poin per Rp 10.000 belanja
        $earnedPoints = (int) max(1, floor($amount / 10000));

        return DB::transaction(function () use ($user, $membership, $earnedPoints, $order) {
            $membership->points += $earnedPoints;
            $membership->lifetime_points += $earnedPoints;
            $membership->save();

            return LoyaltyPointHistory::create([
                'user_id' => $user->id,
                'membership_id' => $membership->id,
                'type' => 'earned',
                'points' => $earnedPoints,
                'balance_after' => $membership->points,
                'description' => "Poin Belanja Pesanan #{$order->order_number} (+{$earnedPoints} Poin)",
                'reference_id' => $order->order_number,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Redeem points for a reward voucher.
     *
     * @return array{success: bool, message: string, voucher?: Voucher}
     */
    public function redeemReward(User $user, LoyaltyReward $reward): array
    {
        $membership = $user->membership()->first();
        if (! $membership) {
            return [
                'success' => false,
                'message' => 'Anda belum terdaftar sebagai anggota Royale Club. Silakan aktifkan keanggotaan terlebih dahulu.',
            ];
        }

        if ($membership->points < $reward->points_required) {
            $shortage = $reward->points_required - $membership->points;

            return [
                'success' => false,
                'message' => "Poin Anda tidak mencukupi untuk reward ini (kurang {$shortage} poin lagi).",
            ];
        }

        return DB::transaction(function () use ($user, $membership, $reward) {
            // Deduct points
            $membership->points -= $reward->points_required;
            $membership->save();

            // Generate unique voucher code
            $voucherCode = 'REW-'.strtoupper(Str::random(6));

            $voucher = Voucher::create([
                'code' => $voucherCode,
                'name' => "Reward Royale: {$reward->name}",
                'description' => "Voucher hasil penukaran {$reward->points_required} loyalty points oleh {$user->name}.",
                'type' => $reward->reward_type,
                'value' => $reward->reward_value,
                'min_order_amount' => $reward->min_order_amount,
                'max_discount_amount' => $reward->max_discount_amount,
                'usage_limit' => 1,
                'used_count' => 0,
                'starts_at' => now(),
                'expires_at' => now()->addDays(30),
                'is_active' => true,
            ]);

            // Record transaction history
            LoyaltyPointHistory::create([
                'user_id' => $user->id,
                'membership_id' => $membership->id,
                'type' => 'redeemed',
                'points' => -$reward->points_required,
                'balance_after' => $membership->points,
                'description' => "Tukar Reward: {$reward->name} (-{$reward->points_required} Poin)",
                'reference_id' => $voucherCode,
                'created_at' => now(),
            ]);

            return [
                'success' => true,
                'message' => "Selamat! Voucher {$reward->name} berhasil diklaim dengan kode: {$voucherCode}",
                'voucher' => $voucher,
            ];
        });
    }
}
