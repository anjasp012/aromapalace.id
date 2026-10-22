<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $order_number
 * @property int $user_id
 * @property string $recipient_name
 * @property string $recipient_phone
 * @property string $shipping_address
 * @property string|null $province_name
 * @property string|null $city_name
 * @property string|null $district_name
 * @property string|null $subdistrict_name
 * @property string $city
 * @property string|null $postal_code
 * @property string $courier
 * @property int $shipping_cost
 * @property string $payment_method
 * @property string|null $payment_channel
 * @property string|null $payment_code
 * @property string $payment_status
 * @property string|null $status
 * @property int $subtotal
 * @property int $discount_amount
 * @property string|null $voucher_code
 * @property int|null $voucher_id
 * @property string $delivery_type
 * @property int|null $store_id
 * @property int $total_amount
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Collection<int, OrderItem> $items
 * @property-read Voucher|null $voucher
 * @property-read Store|null $store
 */
#[Fillable([
    'order_number',
    'user_id',
    'delivery_type',
    'store_id',
    'recipient_name',
    'recipient_phone',
    'shipping_address',
    'province_name',
    'city_name',
    'district_name',
    'subdistrict_name',
    'postal_code',
    'courier',
    'shipping_cost',
    'payment_method',
    'payment_channel',
    'payment_code',
    'payment_status',
    'status',
    'subtotal',
    'discount_amount',
    'voucher_code',
    'voucher_id',
    'total_amount',
    'notes',
])]
class Order extends Model
{
    use HasFactory;

    /**
     * Backward-compatible accessor for city -> city_name.
     */
    public function getCityAttribute(): ?string
    {
        return $this->city_name;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'store_id' => 'integer',
            'shipping_cost' => 'integer',
            'subtotal' => 'integer',
            'discount_amount' => 'integer',
            'voucher_id' => 'integer',
            'total_amount' => 'integer',
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
     * @return BelongsTo<Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * @return BelongsTo<Voucher, $this>
     */
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
