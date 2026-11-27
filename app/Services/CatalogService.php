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
        $rawPrimary = $p->primaryImage?->image
            ?? $p->galleries->first()?->image;
        $primaryImg = ($rawPrimary && ! str_contains((string) $rawPrimary, 'unsplash.com'))
            ? $rawPrimary
            : null;

        $galleryImgs = $p->galleries
            ->pluck('image')
            ->reject(fn ($img) => empty($img) || str_contains((string) $img, 'unsplash.com'))
            ->values()
            ->all();

        $reviews = $p->reviews->map(fn ($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'rating' => (float) $r->rating,
            'comment' => $r->comment,
            'date' => $r->created_at?->diffForHumans() ?? 'Baru saja',
        ])->all();

        $avgRating = $p->reviews->isNotEmpty()
            ? round((float) $p->reviews->avg('rating'), 2)
            : 0.0;

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
            'name' => static::formatProductName($p->name),
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

    /**
     * Format a product name to have uniform, elegant Title Case across all storefront views.
     */
    public static function formatProductName(?string $name): string
    {
        if (empty($name)) {
            return '';
        }

        $trimmed = trim($name);
        if ($trimmed === '') {
            return '';
        }

        $alwaysUpper = [
            'EDP', 'EDT', 'EDC', 'PDB', 'EXT', 'OG',
            'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
        ];

        $alwaysLower = [
            'by', 'de', 'du', 'la', 'le', 'des', 'di', 'del', 'della',
            'von', 'van', 'and', 'for', 'in', 'of', 'the', 'pour', 'avec', 'et',
        ];

        $tokens = preg_split('/(\s+)/u', $trimmed, -1, PREG_SPLIT_DELIM_CAPTURE);
        $wordIndex = 0;

        foreach ($tokens as $idx => $token) {
            if (preg_match('/^\s+$/u', $token)) {
                continue;
            }

            if (preg_match('/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u', $token, $m)) {
                $prefix = $m[1] ?? '';
                $core = $m[2] ?? '';
                $suffix = $m[3] ?? '';

                if ($core === '') {
                    continue;
                }

                if (preg_match('/^\d+\s*ml$/iu', $core)) {
                    $tokens[$idx] = $prefix.strtolower($core).$suffix;
                    $wordIndex++;

                    continue;
                }

                $cleanAlpha = strtoupper((string) preg_replace('/[^\p{L}\p{N}]/u', '', $core));

                if (in_array($cleanAlpha, $alwaysUpper, true)) {
                    $tokens[$idx] = $prefix.strtoupper($core).$suffix;
                    $wordIndex++;

                    continue;
                }

                $lowerCore = mb_strtolower($core, 'UTF-8');
                if ($wordIndex > 0 && in_array($lowerCore, $alwaysLower, true)) {
                    $tokens[$idx] = $prefix.$lowerCore.$suffix;
                    $wordIndex++;

                    continue;
                }

                $parts = preg_split("/([-–—'’])/u", $core, -1, PREG_SPLIT_DELIM_CAPTURE);
                $transformedParts = [];
                foreach ($parts as $pIdx => $part) {
                    if (preg_match("/^[-–—'’]$/u", $part) || $part === '') {
                        $transformedParts[] = $part;

                        continue;
                    }
                    $partUpper = strtoupper($part);
                    if (in_array($partUpper, $alwaysUpper, true)) {
                        $transformedParts[] = $partUpper;

                        continue;
                    }
                    $partLower = mb_strtolower($part, 'UTF-8');
                    if ($wordIndex > 0 && $pIdx > 0 && in_array($partLower, $alwaysLower, true)) {
                        $transformedParts[] = $partLower;

                        continue;
                    }
                    $transformedParts[] = mb_convert_case($part, MB_CASE_TITLE, 'UTF-8');
                }

                $tokens[$idx] = $prefix.implode('', $transformedParts).$suffix;
                $wordIndex++;
            }
        }

        return implode('', $tokens);
    }
}
