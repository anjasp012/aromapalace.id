<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $name_en
 * @property string $type
 * @property string $slug
 * @property string|null $thumbnail
 * @property string|null $description
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Product> $products
 */
#[Fillable(['name', 'name_en', 'type', 'slug', 'thumbnail', 'description', 'description_en', 'sort_order'])]
class Category extends Model
{
    use FlushesCatalogCache, HasFactory;

    /**
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'categories_product');
    }

    /**
     * Scope for gender categories.
     *
     * @param  Builder<Category>  $query
     * @return Builder<Category>
     */
    public function scopeGenders(Builder $query): Builder
    {
        return $query->where('type', 'genders');
    }

    /**
     * Scope for concentrate categories.
     *
     * @param  Builder<Category>  $query
     * @return Builder<Category>
     */
    public function scopeConcentrates(Builder $query): Builder
    {
        return $query->where('type', 'concentrates');
    }

    /**
     * Scope for scent categories.
     *
     * @param  Builder<Category>  $query
     * @return Builder<Category>
     */
    public function scopeScents(Builder $query): Builder
    {
        return $query->where('type', 'scents');
    }
}
