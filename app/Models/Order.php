<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $order_number
 * @property int $user_id
 * @property string $recipient_name
 * @property string $recipient_phone
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
 * @property-read Shipping|null $shipping
 * @property-read Collection<int, OrderItem> $items
 * @property-read Voucher|null $voucher
 * @property-read Store|null $store
 * @property-read string|null $shipping_address
 * @property-read string|null $province_name
 * @property-read string|null $city_name
 * @property-read string|null $district_name
 * @property-read string|null $subdistrict_name
 * @property-read string|null $city
 * @property-read string|null $postal_code
 * @property-read string|null $tracking_number
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
    'city',
    'courier',
    'tracking_number',
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
     * @var array<int, string>
     */
    protected $with = ['shipping'];

    /**
     * In-memory cache for temporary attributes if set in tests or legacy callers.
     *
     * @var array<string, mixed>
     */
    public array $temporaryShippingData = [];

    /**
     * Intercept setting of address and tracking attributes to prevent unknown column errors.
     */
    public function setAttribute($key, $value)
    {
        $shippingKeys = [
            'shipping_address',
            'province_name',
            'city_name',
            'district_name',
            'subdistrict_name',
            'postal_code',
            'tracking_number',
            'city',
        ];

        if (in_array($key, $shippingKeys)) {
            $this->temporaryShippingData[$key] = $value;

            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    /**
     * Backward-compatible accessor for tracking_number -> shipping.awb.
     */
    public function getTrackingNumberAttribute(): ?string
    {
        return $this->shipping?->awb ?? ($this->temporaryShippingData['tracking_number'] ?? null);
    }

    /**
     * Backward-compatible accessor for shipping_address -> shipping.destination.address.
     */
    public function getShippingAddressAttribute(): ?string
    {
        return $this->shipping?->destination['address'] ?? ($this->temporaryShippingData['shipping_address'] ?? null);
    }

    /**
     * Backward-compatible accessor for province_name.
     */
    public function getProvinceNameAttribute(): ?string
    {
        return $this->shipping?->destination['province_name'] ?? ($this->temporaryShippingData['province_name'] ?? null);
    }

    /**
     * Backward-compatible accessor for city_name.
     */
    public function getCityNameAttribute(): ?string
    {
        return $this->shipping?->destination['city_name'] ?? ($this->temporaryShippingData['city_name'] ?? ($this->temporaryShippingData['city'] ?? null));
    }

    /**
     * Backward-compatible accessor for city -> city_name.
     */
    public function getCityAttribute(): ?string
    {
        return $this->city_name;
    }

    /**
     * Backward-compatible accessor for district_name.
     */
    public function getDistrictNameAttribute(): ?string
    {
        return $this->shipping?->destination['district_name'] ?? ($this->temporaryShippingData['district_name'] ?? null);
    }

    /**
     * Backward-compatible accessor for subdistrict_name.
     */
    public function getSubdistrictNameAttribute(): ?string
    {
        return $this->shipping?->destination['subdistrict_name'] ?? ($this->temporaryShippingData['subdistrict_name'] ?? null);
    }

    /**
     * Backward-compatible accessor for postal_code.
     */
    public function getPostalCodeAttribute(): ?string
    {
        return $this->shipping?->destination['postal_code'] ?? ($this->temporaryShippingData['postal_code'] ?? null);
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
}
