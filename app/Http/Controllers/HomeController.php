<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\SliderPromo;
use App\Models\Voucher;
use App\Services\CatalogService;
use App\Support\CatalogCache;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Display the Aroma Palace home showcase page.
     */
    public function index(): Response
    {
        return Inertia::render('home', CatalogCache::remember('home', fn () => $this->homeData()));
    }

    /**
     * Build the home page props from the database.
     *
     * @return array<string, mixed>
     */
    protected function homeData(): array
    {
        // 1. Popular Products from DB (ordered by reviews or highest rating)
        $popularProducts = Product::published()->with([
            'variants',
            'galleries',
            'primaryImage',
            'reviews',
            'categories',
            'brandRelation',
        ])
            ->withCount('reviews')
            ->orderByDesc('reviews_count')
            ->take(5)
            ->get()
            ->map(function (Product $p) {
                $formatted = CatalogService::formatProduct($p);
                $formatted['isPopular'] = true;

                return $formatted;
            })
            ->values()
            ->all();

        // 2. Discounted Products from DB (having variants with original_price > price)
        $discountedProducts = Product::published()->with([
            'variants',
            'galleries',
            'primaryImage',
            'reviews',
            'categories',
            'brandRelation',
        ])
            ->whereHas('variants', fn ($v) => $v->whereNotNull('original_price')->whereColumn('original_price', '>', 'price'))
            ->get()
            ->map(fn (Product $p) => CatalogService::formatProduct($p))
            ->values()
            ->all();

        // If discounted is empty, fallback to popular or newest
        if (empty($discountedProducts)) {
            $discountedProducts = $popularProducts;
        }

        // 3. Recommended Products from DB (Curated Just For You - Limit 5)
        $recommendedProducts = Product::published()->with([
            'variants',
            'galleries',
            'primaryImage',
            'reviews',
            'categories',
            'brandRelation',
        ])
            ->latest('id')
            ->take(5)
            ->get()
            ->map(fn (Product $p) => CatalogService::formatProduct($p))
            ->values()
            ->all();

        if (empty($recommendedProducts)) {
            $recommendedProducts = $popularProducts;
        }

        // 4. Scents from DB (Product by Scents - Only Scents, limit 7)
        $scents = Category::scents()
            ->withCount('products')
            ->orderBy('id', 'asc')
            ->take(7)
            ->get()
            ->map(function (Category $c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'name_en' => $c->name_en,
                    'slug' => $c->slug,
                    'description' => $c->description,
                    'description_en' => $c->description_en,
                    'productsCount' => (int) $c->products_count,
                    'image' => $c->thumbnail ?: null,
                    'type' => 'scents',
                ];
            })
            ->values()
            ->all();

        // 5. Brands from DB (Featured Brands - Limit 5)
        $brands = Brand::withCount('products')
            ->take(5)
            ->get()
            ->map(function (Brand $b) {
                return [
                    'name' => $b->name,
                    'slug' => $b->slug,
                    'description' => $b->description ?? '',
                    'description_en' => $b->description_en ?? '',
                    'collectionsCount' => $b->products_count,
                    'image' => $b->thumbnail ?? 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=200&q=80',
                ];
            })->values()->all();

        // 6. Vouchers from DB
        $vouchers = Voucher::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
            })
            ->get()
            ->map(function (Voucher $v) {
                $badge = $v->type === 'percentage'
                    ? "Diskon {$v->value}%"
                    : 'Potongan Rp '.number_format($v->value, 0, ',', '.');
                $expiry = $v->expires_at
                    ? $v->expires_at->format('d M Y')
                    : 'Berlaku Selamanya';
                $minSpend = $v->min_order_amount > 0
                    ? 'Rp '.number_format($v->min_order_amount, 0, ',', '.')
                    : 'Tanpa Min. Belanja';
                $maxDiscount = $v->max_discount_amount
                    ? 'Maks. Rp '.number_format($v->max_discount_amount, 0, ',', '.')
                    : null;

                return [
                    'code' => $v->code,
                    'badge' => $badge,
                    'expiry' => $expiry,
                    'title' => $v->name,
                    'title_en' => $v->name_en,
                    'desc' => $v->description ?? "Gunakan kode promo {$v->code} untuk mendapatkan diskon istimewa.",
                    'desc_en' => $v->description_en,
                    'minSpend' => $minSpend,
                    'maxDiscount' => $maxDiscount,
                    'terms' => $v->terms ?? [
                        "Gunakan kode promo {$v->code} saat checkout.",
                        $v->min_order_amount > 0 ? "Minimal belanja {$minSpend}." : 'Tanpa minimal belanja.',
                        'Berlaku selama periode promosi aktif.',
                    ],
                ];
            })
            ->values()
            ->all();

        // 7. Articles from DB
        $articles = Article::published()
            ->latest()
            ->take(4)
            ->get()
            ->map(fn (Article $art) => [
                'id' => $art->id,
                'slug' => $art->slug,
                'title' => $art->title,
                'title_en' => $art->title_en,
                'readTime' => $art->read_time,
                'date' => $art->created_at->format('d M Y'),
                'excerpt' => $art->excerpt,
                'excerpt_en' => $art->excerpt_en,
                'thumbnail' => $art->thumbnail,
            ])
            ->values()
            ->all();

        // 8. Slider Promos from DB
        $sliderPromos = SliderPromo::query()
            ->latest('id')
            ->get()
            ->map(fn (SliderPromo $slider) => [
                'id' => $slider->id,
                'title' => $slider->title,
                'title_en' => $slider->title_en,
                'description' => $slider->description,
                'description_en' => $slider->description_en,
                'link' => $slider->link ?? '/products',
                'thumbnail' => $slider->thumbnail,
            ])
            ->values()
            ->all();

        return [
            'popularProducts' => $popularProducts,
            'discountedProducts' => $discountedProducts,
            'recommendedProducts' => $recommendedProducts,
            'scents' => $scents,
            'categories' => $scents,
            'brands' => $brands,
            'vouchers' => $vouchers,
            'articles' => $articles,
            'sliderPromos' => $sliderPromos,
            'stats' => [
                'creations' => '24+',
                'sourcing_countries' => '18',
                'concentration' => '30% Extrait',
                'rating' => '4.9/5.0',
            ],
        ];
    }
}
