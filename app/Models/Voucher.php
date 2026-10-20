<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
use Carbon\Carbon;
use Database\Factories\VoucherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Order> $orders
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
        ];
    }

    /**
     * Check if voucher is currently valid for a given subtotal.
     */
    public function isValidFor(int $subtotal): bool
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

        return true;
    }

    /**
     * Calculate discount amount for a given subtotal.
     */
    public function calculateDiscount(int $subtotal): int
    {
        if (! $this->isValidFor($subtotal)) {
            return 0;
        }

        if ($this->type === 'fixed') {
            return min($subtotal, $this->value);
        }

        // Percentage discount
        $discount = (int) round($subtotal * ($this->value / 100));

        if ($this->max_discount_amount !== null && $this->max_discount_amount > 0) {
            $discount = min($discount, $this->max_discount_amount);
        }

        return min($subtotal, $discount);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
