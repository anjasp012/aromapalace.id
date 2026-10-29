<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
use Carbon\Carbon;
use Database\Factories\VoucherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string|null $name_en
 * @property string|null $description
 * @property string|null $description_en
 * @property array<int, string>|null $terms
 * @property string $type
 * @property int $value
 * @property int $min_order_amount
 * @property int|null $max_discount_amount
 * @property int|null $usage_limit
 * @property int $used_count
 * @property Carbon|null $starts_at
 * @property Carbon|null $expires_at
 * @property bool $is_active
 * @property string $voucher_type
 * @property int|null $points_required
 * @property int|null $user_id
 * @property string $applicable_type
 * @property array<int, int>|null $applicable_product_ids
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Order> $orders
 * @property-read User|null $user
 */
#[Fillable([
    'code',
    'name',
    'name_en',
    'description',
    'description_en',
    'terms',
    'type',
    'value',
    'min_order_amount',
    'max_discount_amount',
    'usage_limit',
    'used_count',
    'starts_at',
    'expires_at',
    'is_active',
    'voucher_type',
    'points_required',
    'user_id',
    'applicable_type',
    'applicable_product_ids',
])]
class Voucher extends Model
{
    /** @use HasFactory<VoucherFactory> */
    use FlushesCatalogCache, HasFactory;

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::saved(function () {
            Cache::forget('active_header_vouchers');
        });

        static::deleted(function () {
            Cache::forget('active_header_vouchers');
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'terms' => 'array',
            'value' => 'integer',
            'min_order_amount' => 'integer',
            'max_discount_amount' => 'integer',
            'usage_limit' => 'integer',
            'used_count' => 'integer',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
            'points_required' => 'integer',
            'applicable_product_ids' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this voucher has already been used by a specific user.
     * 1 voucher can only be used once per user.
     */
    public function hasBeenUsedBy(User|int|null $user): bool
    {
        if (! $user) {
            return false;
        }

        $userId = $user instanceof User ? $user->id : (int) $user;
        if ($userId <= 0) {
            return false;
        }

        return Order::where('user_id', $userId)
            ->where(function ($query) {
                $query->where('voucher_id', $this->id)
                    ->orWhere('voucher_code', $this->code);
            })
            ->where('status', '!=', 'dibatalkan')
            ->whereNotIn('payment_status', ['cancelled', 'canceled', 'failed', 'expired'])
            ->exists();
    }

    /**
     * Check if voucher is currently valid for a given subtotal, optional user, and optional cart items.
     */
    public function isValidFor(int $subtotal, User|int|null $user = null, ?array $items = null): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->starts_at && now()->lt($this->starts_at)) {
            return false;
        }

        if ($this->expires_at && now()->gt($this->expires_at)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        if ($subtotal < $this->min_order_amount) {
            return false;
        }

        if ($user !== null && $this->hasBeenUsedBy($user)) {
            return false;
        }

        // Specific product applicability check
        if ($this->applicable_type === 'specific' && ! empty($this->applicable_product_ids)) {
            $allowedIds = array_map('intval', $this->applicable_product_ids);
            if ($items !== null) {
                $hasApplicableProduct = false;
                $applicableSubtotal = 0;
                foreach ($items as $item) {
                    $pid = (int) ($item['product_id'] ?? 0);
                    if (in_array($pid, $allowedIds, true)) {
                        $hasApplicableProduct = true;
                        $applicableSubtotal += (int) ($item['total_price'] ?? 0);
                    }
                }
                if (! $hasApplicableProduct) {
                    return false;
                }
                if ($this->min_order_amount > 0 && $applicableSubtotal < $this->min_order_amount) {
                    return false;
                }
            }
        }

        // Reward voucher ownership check
        if ($this->voucher_type === 'reward' || str_starts_with($this->code, 'REW-')) {
            $userId = $user instanceof User ? $user->id : $user;
            if (! $userId) {
                return false;
            }
            if ($this->user_id && (int) $this->user_id !== (int) $userId) {
                return false;
            }
            $hasClaimed = LoyaltyPointHistory::where('user_id', $userId)
                ->where('type', 'redeemed')
                ->where('reference_id', $this->code)
                ->exists();
            if (! $hasClaimed && ! $this->user_id) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate discount amount for a given subtotal, optional user, and optional cart items.
     */
    public function calculateDiscount(int $subtotal, User|int|null $user = null, ?array $items = null): int
    {
        if (! $this->isValidFor($subtotal, $user, $items)) {
            return 0;
        }

        $applicableSubtotal = $subtotal;
        if ($this->applicable_type === 'specific' && ! empty($this->applicable_product_ids) && $items !== null) {
            $allowedIds = array_map('intval', $this->applicable_product_ids);
            $applicableSubtotal = 0;
            foreach ($items as $item) {
                $pid = (int) ($item['product_id'] ?? 0);
                if (in_array($pid, $allowedIds, true)) {
                    $applicableSubtotal += (int) ($item['total_price'] ?? 0);
                }
            }
        }

        if ($this->type === 'fixed') {
            return min($applicableSubtotal, $this->value);
        }

        // Percentage discount
        $discount = (int) round($applicableSubtotal * ($this->value / 100));

        if ($this->max_discount_amount !== null && $this->max_discount_amount > 0) {
            $discount = min($discount, $this->max_discount_amount);
        }

        return min($applicableSubtotal, $discount);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get human-readable formatted discount label.
     */
    public function getFormattedDiscount(): string
    {
        if (str_contains(strtolower($this->name), 'bebas ongkir') || str_contains(strtolower($this->name), 'free shipping')) {
            return 'Bebas Ongkir';
        }

        if ($this->type === 'percentage') {
            return "Diskon {$this->value}%";
        }

        return 'Potongan Rp '.number_format($this->value, 0, ',', '.');
    }
}
