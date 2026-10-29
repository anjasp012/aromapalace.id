<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property int|null $brand_id
 * @property string|null $description
 * @property string|null $description_en
 * @property bool $is_draft
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Category> $categories
 * @property-read Collection<int, Category> $genders
 * @property-read Collection<int, Category> $concentrates
 * @property-read Collection<int, Category> $scents
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
    'brand_id',
    'description',
    'description_en',
    'is_new_arrivals',
    'is_best_sellers',
    'is_special_offers',
    'is_draft',
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
            'brand_id' => 'integer',
            'is_new_arrivals' => 'boolean',
            'is_best_sellers' => 'boolean',
            'is_special_offers' => 'boolean',
            'is_draft' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include published (non-draft) products.
     *
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_draft', false);
    }

    /**
     * Scope a query to only include draft products.
     *
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('is_draft', true);
    }

    /**
     * @return BelongsToMany<Category, $this>
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'categories_product');
    }

    /**
     * Genders categories relation.
     *
     * @return BelongsToMany<Category, $this>
     */
    public function genders(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'categories_product')->where('type', 'genders');
    }

    /**
     * Concentrates categories relation.
     *
     * @return BelongsToMany<Category, $this>
     */
    public function concentrates(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'categories_product')->where('type', 'concentrates');
    }

    /**
     * Scents categories relation.
     *
     * @return BelongsToMany<Category, $this>
     */
    public function scents(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'categories_product')->where('type', 'scents');
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
