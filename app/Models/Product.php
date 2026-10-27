<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property int|null $category_id
 * @property int|null $brand_id
 * @property string|null $description
 * @property string|null $description_en
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Category|null $category
 * @property-read Category|null $categoryRelation
 * @property-read Brand|null $brand
 * @property-read Brand|null $brandRelation
 * @property-read Collection<int, ProductVariant> $variants
 * @property-read Collection<int, ProductGallery> $galleries
 * @property-read Collection<int, ProductReview> $reviews
 * @property-read ProductGallery|null $primaryImage
 * @property-read Collection<int, Wishlist> $wishlists
 * @property-read Collection<int, CartItem> $cartItems
 */
#[Fillable([
    'name',
    'slug',
    'category_id',
    'brand_id',
    'description',
    'description_en',
])]
class Product extends Model
{
    /** @use HasFactory<UserFactory> */
    use FlushesCatalogCache, HasFactory, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category_id' => 'integer',
            'brand_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function categoryRelation(): BelongsTo
    {
        return $this->category();
    }

    /**
     * @return BelongsTo<Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    /**
     * @return BelongsTo<Brand, $this>
     */
    public function brandRelation(): BelongsTo
    {
        return $this->brand();
    }

    /**
     * @return HasMany<ProductVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('id', 'asc');
    }

    /**
     * @return HasMany<ProductGallery, $this>
     */
    public function galleries(): HasMany
    {
        return $this->hasMany(ProductGallery::class);
    }

    /**
     * @return HasOne<ProductGallery, $this>
     */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductGallery::class)->oldestOfMany();
    }

    /**
     * @return HasMany<ProductReview, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class)->latest();
    }

    /**
     * @return HasMany<Wishlist, $this>
     */
    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    /**
     * @return HasMany<CartItem, $this>
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
