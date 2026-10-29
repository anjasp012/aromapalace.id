<?php

namespace App\Services;

use App\Models\Product;
use App\Support\CatalogCache;

class CatalogService
{
    /**
     * Common relations needed for displaying a full product.
     *
     * @var array<int, string>
     */
    public static array $eagerRelations = [
        'variants',
        'galleries',
        'primaryImage',
        'reviews',
        'categories',
        'brandRelation',
    ];

    /**
     * Get all master fragrances from database with relations.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function all(): array
    {
        return CatalogCache::remember('products:all', fn () => Product::published()
            ->with(static::$eagerRelations)
            ->orderBy('id')
            ->get()
            ->map(fn (Product $p) => static::formatProduct($p))
            ->all());
    }

    /**
     * Find a fragrance by its numeric id.
     *
     * @return array<string, mixed>|null
     */
    public static function find(int $id): ?array
    {
        $product = Product::published()->with(static::$eagerRelations)->find($id);

        return $product ? static::formatProduct($product) : null;
    }

    /**
     * Find a fragrance by its slug or id string.
     *
     * @return array<string, mixed>|null
     */
    public static function findBySlug(string $slug): ?array
    {
        return CatalogCache::remember('products:slug:'.md5($slug), function () use ($slug) {
            $product = Product::published()
                ->with(static::$eagerRelations)
                ->where(function ($q) use ($slug) {
                    $q->where('slug', $slug)
                        ->orWhere('id', is_numeric($slug) ? (int) $slug : 0);
                })
                ->first();

            return $product ? static::formatProduct($product) : null;
        });
    }

    /**
     * Find multiple fragrances by their ids.
     *
     * @param  array<int, int>  $ids
     * @return array<int, array<string, mixed>>
     */
    public static function findMany(array $ids): array
    {
        return Product::published()
            ->with(static::$eagerRelations)
            ->whereIn('id', $ids)
            ->get()
            ->map(fn (Product $p) => static::formatProduct($p))
            ->all();
    }

    /**
     * Format Eloquent Product into an array compatible with frontend expectations.
     *
     * @return array<string, mixed>
     */
    public static function formatProduct(Product $p): array
    {
        $primaryImg = $p->primaryImage?->image
            ?? $p->galleries->first()?->image
            ?? 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80';

        $galleryImgs = $p->galleries->isNotEmpty()
            ? $p->galleries->pluck('image')->all()
            : [$primaryImg];

        $reviews = $p->reviews->map(fn ($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'rating' => (float) $r->rating,
            'comment' => $r->comment,
            'date' => $r->created_at?->diffForHumans() ?? 'Baru saja',
        ])->all();

        $avgRating = $p->reviews->isNotEmpty()
            ? round((float) $p->reviews->avg('rating'), 2)
            : 5.0;

        $inStock = $p->variants->isNotEmpty()
            ? $p->variants->contains(fn ($v) => $v->stock > 0)
            : true;

        $brandName = $p->brandRelation?->name ?? 'Aroma Palace';
        $categories = $p->categories;
        $categoryName = $categories->first()?->name ?? 'Fragrance';
        $categoryIds = $categories->pluck('id')->all();
        $genders = $categories->where('type', 'genders')->pluck('name')->values()->all();
        $concentrates = $categories->where('type', 'concentrates')->pluck('name')->values()->all();
        $scents = $categories->where('type', 'scents')->pluck('name')->values()->all();
        $concentrationName = ! empty($concentrates) ? implode(', ', $concentrates) : null;

        // Pricing derived from primary/first variant (ordered by id)
        $primaryVariant = $p->variants->sortBy('id')->first();
        $discountVariant = $p->variants->first(fn ($v) => ! empty($v->original_price) && (int) $v->original_price > (int) $v->price);

        $displayVariant = $discountVariant ?? $primaryVariant;
        $rawPrice = $displayVariant ? (int) $displayVariant->price : ($primaryVariant ? (int) $primaryVariant->price : 0);
        $formattedPrice = 'Rp '.number_format($rawPrice, 0, ',', '.');

        $effectiveDiscountVariant = ($primaryVariant && ! empty($primaryVariant->original_price) && (int) $primaryVariant->original_price > (int) $primaryVariant->price)
            ? $primaryVariant
            : $discountVariant;

        $rawOriginalPrice = $effectiveDiscountVariant?->original_price ? (int) $effectiveDiscountVariant->original_price : null;
        $formattedOriginalPrice = $rawOriginalPrice ? ('Rp '.number_format($rawOriginalPrice, 0, ',', '.')) : null;
        $discountPercent = $effectiveDiscountVariant?->discount_percent ? (int) $effectiveDiscountVariant->discount_percent : null;
        $discountBadge = $discountPercent ? "-{$discountPercent}%" : null;

        $volume = $displayVariant?->volume ?? ($primaryVariant?->volume ?? 50);

        return [
            'id' => $p->id,
            'name' => $p->name,
            'slug' => $p->slug,
            'category_id' => $categories->first()?->id,
            'category_ids' => $categoryIds,
            'categories' => $categories->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'type' => $c->type,
            ])->values()->all(),
            'genders' => $genders,
            'concentrates' => $concentrates,
            'scents' => $scents,
            'brand_id' => $p->brand_id,
            'brand' => $brandName,
            'family' => $categoryName,
            'category' => $categoryName,
            'volume' => $volume,
            'concentration' => $concentrationName,
            'price' => $formattedPrice,
            'raw_price' => $rawPrice,
            'originalPrice' => $formattedOriginalPrice,
            'original_price' => $formattedOriginalPrice,
            'raw_original_price' => $rawOriginalPrice,
            'discountBadge' => $discountBadge,
            'discount_badge' => $discountBadge,
            'discount_percent' => $discountPercent,
            'rating' => $avgRating,
            'reviews_count' => $p->reviews->count(),
            'in_stock' => $inStock,
            'is_new_arrivals' => (bool) $p->is_new_arrivals,
            'is_best_sellers' => (bool) $p->is_best_sellers,
            'is_special_offers' => (bool) $p->is_special_offers,
            'is_draft' => (bool) $p->is_draft,
            'isNew' => (bool) $p->is_new_arrivals,
            'image' => $primaryImg,
            'gallery' => $galleryImgs,
            'tag' => $p->is_best_sellers ? 'Best Seller' : ($p->is_new_arrivals ? 'New Arrival' : ($p->is_special_offers ? 'Special Offer' : null)),
            'mood' => null,
            'description' => $p->description,
            'description_en' => $p->description_en,
            'longevity' => null,
            'sillage' => null,
            'season' => null,
            'maceration' => null,
            'notes' => [
                'top' => 'Fresh Bergamot, Exotic Spices',
                'heart' => 'Rich Floral & Precious Woods',
                'base' => 'Warm Amber, Silk Musk',
            ],
            'reviews' => $reviews,
            'has_variants' => $p->variants->count() > 1,
            'variants' => $p->variants->map(fn ($v) => [
                'id' => $v->id,
                'product_id' => $v->product_id,
                'name' => $v->name,
                'volume' => $v->volume,
                'price' => 'Rp '.number_format((int) $v->price, 0, ',', '.'),
                'raw_price' => (int) $v->price,
                'original_price' => $v->original_price ? ('Rp '.number_format((int) $v->original_price, 0, ',', '.')) : null,
                'raw_original_price' => $v->original_price ? (int) $v->original_price : null,
                'discount_percent' => $v->discount_percent ? (int) $v->discount_percent : null,
                'discount_badge' => $v->discount_percent ? "-{$v->discount_percent}%" : null,
                'sku' => $v->sku,
                'stock' => $v->stock,
                'in_stock' => $v->stock > 0,
            ])->values()->all(),
        ];
    }
}
