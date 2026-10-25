<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property int $product_id
 * @property int|null $variant_id
 * @property string $product_name
 * @property string|null $variant_name
 * @property int|null $volume
 * @property int $price
 * @property int $quantity
 * @property int $total_price
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Order $order
 * @property-read Product $product
 * @property-read ProductVariant|null $variant
 */
#[Fillable([
    'order_id',
    'product_id',
    'variant_id',
    'product_name',
    'variant_name',
    'volume',
    'price',
    'quantity',
    'total_price',
])]
class OrderItem extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_id' => 'integer',
            'product_id' => 'integer',
            'variant_id' => 'integer',
            'volume' => 'integer',
            'price' => 'integer',
            'quantity' => 'integer',
            'total_price' => 'integer',
        ];
    }

    /**
     * Set volume attribute ensuring it is always saved as an integer.
     */
    public function setVolumeAttribute($value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['volume'] = null;

            return;
        }

        if (is_numeric($value)) {
            $this->attributes['volume'] = (int) $value;

            return;
        }

        $raw = strtolower(trim((string) $value));
        if (str_contains($raw, 'liter') || (str_contains($raw, 'l') && ! str_contains($raw, 'ml'))) {
            $num = (float) filter_var($raw, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
            $this->attributes['volume'] = (int) ($num * 1000);
        } else {
            $num = (int) filter_var($raw, FILTER_SANITIZE_NUMBER_INT);
            $this->attributes['volume'] = $num > 0 ? $num : null;
        }
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
