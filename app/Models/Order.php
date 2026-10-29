<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $order_number
 * @property int $user_id
 * @property string $recipient_name
 * @property string $recipient_phone
 * @property string|null $address
 * @property int|null $province_id
 * @property string|null $province_name
 * @property int|null $city_id
 * @property string|null $city_name
 * @property int|null $district_id
 * @property string|null $district_name
 * @property int|null $subdistrict_id
 * @property string|null $subdistrict_name
 * @property string|null $postal_code
 * @property float|null $latitude
 * @property float|null $longitude
 * @property string|null $courier_service
 * @property string|null $courier_service_type
 * @property string|null $courier
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
 * @property-read Shipping|null $shipping
 * @property-read Collection<int, OrderItem> $items
 * @property-read Collection<int, OrderItem> $orderItems
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
    'address',
    'province_id',
    'province_name',
    'city_id',
    'city_name',
    'district_id',
    'district_name',
    'subdistrict_id',
    'subdistrict_name',
    'postal_code',
    'latitude',
    'longitude',
    'courier_service',
    'courier_service_type',
    'shipping_cost',
    'payment_method',
    'payment_channel',
    'payment_code',
    'payment_status',
    'payment_proof',
    'payment_proof_uploaded_at',
    'payment_sender_name',
    'payment_notes',
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
    use HasFactory, SoftDeletes;

    /**
     * @var array<int, string>
     */
    protected $with = ['shipping'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'store_id' => 'integer',
            'province_id' => 'integer',
            'city_id' => 'integer',
            'district_id' => 'integer',
            'subdistrict_id' => 'integer',
            'shipping_cost' => 'integer',
            'subtotal' => 'integer',
            'discount_amount' => 'integer',
            'voucher_id' => 'integer',
            'total_amount' => 'integer',
            'latitude' => 'float',
            'longitude' => 'float',
            'payment_proof_uploaded_at' => 'datetime',
        ];
    }

    /**
     * Determine if order payment is manual confirmation.
     */
    public function getIsManualAttribute(): bool
    {
        if (str_starts_with($this->payment_method ?? '', 'manual_')
            || str_contains(strtolower($this->payment_channel ?? ''), 'manual')
            || str_contains(strtolower($this->payment_method ?? ''), 'manual')
        ) {
            return true;
        }

        if (! empty($this->payment_method)) {
            $pm = PaymentMethod::where('code', $this->payment_method)->first();
            if ($pm && $pm->is_manual) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    /**
     * Relation to Shipping table (populated from KiriminAja callback/response).
     *
     * @return HasOne<Shipping, $this>
     */
    public function shipping(): HasOne
    {
        return $this->hasOne(Shipping::class);
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

    /**
     * Alias for items relation to support $order->orderItems.
     *
     * @return HasMany<OrderItem, $this>
     */
    public function orderItems(): HasMany
    {
        return $this->items();
    }

    /**
     * Get formatted courier display string.
     */
    public function getCourierAttribute(): ?string
    {
        $service = $this->attributes['courier_service'] ?? null;
        $type = $this->attributes['courier_service_type'] ?? null;

        if ($service === 'pickup') {
            return $type ?: 'Ambil Mandiri di Butik';
        }

        if ($service && $type) {
            return "{$service} {$type}";
        }

        return $service ?: ($type ?: null);
    }

    /**
     * Set courier attributes safely when a combined courier string is passed.
     */
    public function setCourierAttribute($value): void
    {
        if (empty($value)) {
            return;
        }

        if (is_string($value) && str_contains($value, ' - ')) {
            [$service, $type] = explode(' - ', $value, 2);
            $this->attributes['courier_service'] = trim($service);
            $this->attributes['courier_service_type'] = trim($type);
        } elseif (is_string($value) && preg_match('/^(J&T|JNE|SiCepat|Anteraja|TIKI|POS|Wahana|Ninja|Lion)\s+(.+)$/i', $value, $matches)) {
            $this->attributes['courier_service'] = trim($matches[1]);
            $this->attributes['courier_service_type'] = trim($matches[2]);
        } else {
            $this->attributes['courier_service'] = $value;
        }
    }
}
