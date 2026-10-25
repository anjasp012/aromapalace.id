<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
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
 * @property int $volume
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
    use FlushesCatalogCache, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'product_id' => 'integer',
            'volume' => 'integer',
            'price' => 'integer',
            'original_price' => 'integer',
            'discount_percent' => 'integer',
            'stock' => 'integer',
        ];
    }

    /**
     * Set volume attribute ensuring it is always saved as an integer (e.g. 500, 1000).
     */
    public function setVolumeAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['volume'] = (int) $value;

            return;
        }

        $raw = strtolower(trim((string) $value));
        if (str_contains($raw, 'liter') || (str_contains($raw, 'l') && ! str_contains($raw, 'ml'))) {
            $num = (float) filter_var($raw, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
            $this->attributes['volume'] = (int) ($num * 1000);
        } else {
            $this->attributes['volume'] = (int) filter_var($raw, FILTER_SANITIZE_NUMBER_INT);
        }
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
