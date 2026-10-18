<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property string $name
 * @property string $volume
 * @property int $price
 * @property int|null $original_price
 * @property int|null $discount_percent
 * @property string|null $sku
 * @property int $stock
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read bool $in_stock
 * @property-read Product $product
 */
#[Fillable([
    'product_id',
    'name',
    'volume',
    'price',
    'original_price',
    'discount_percent',
    'sku',
    'stock',
])]
class ProductVariant extends Model
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'product_id' => 'integer',
            'price' => 'integer',
            'original_price' => 'integer',
            'discount_percent' => 'integer',
            'stock' => 'integer',
        ];
    }

    /**
     * Determine if variant is in stock based on inventory count.
     */
    public function getInStockAttribute(): bool
    {
        return $this->stock > 0;
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return HasMany<CartItem, $this>
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class, 'variant_id');
    }
}
