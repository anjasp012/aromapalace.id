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
        $popularProducts = Product::with([
            'variants',
            'galleries',
            'primaryImage',
            'reviews',
            'categoryRelation',
            'brandRelation',
        ])
            ->withCount('reviews')
            ->orderByDesc('reviews_count')
            ->take(10)
            ->get()
            ->map(function (Product $p) {
                $formatted = CatalogService::formatProduct($p);
                $formatted['isPopular'] = true;

                return $formatted;
            })
            ->values()
            ->all();

        // 2. Discounted Products from DB (having variants with original_price > price)
        $discountedProducts = Product::with([
            'variants',
            'galleries',
            'primaryImage',
            'reviews',
            'categoryRelation',
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

        // 3. Recommended Products from DB
        $recommendedProducts = Product::with([
            'variants',
            'galleries',
            'primaryImage',
            'reviews',
            'categoryRelation',
            'brandRelation',
        ])
            ->latest('id')
            ->take(10)
            ->get()
            ->map(fn (Product $p) => CatalogService::formatProduct($p))
            ->values()
            ->all();

        if (empty($recommendedProducts)) {
            $recommendedProducts = $popularProducts;
        }

        // 4. Categories from DB
        $categoryImages = [
            'parfum-pria' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80',
            'parfum-wanita' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=400&q=80',
            'unisex-fragrance' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
            'discovery-sets-vials' => 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=400&q=80',
            'artisanal-attar' => 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=400&q=80',
        ];

        $categories = Category::all()->map(function (Category $c) use ($categoryImages) {
            return [
                'name' => $c->name,
                'name_en' => $c->name_en,
                'slug' => $c->slug,
                'description' => $c->description,
                'description_en' => $c->description_en,
                'image' => $categoryImages[$c->slug] ?? 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
            ];
        })->values()->all();

        // 5. Brands from DB
        $brands = Brand::withCount('products')->get()->map(function (Brand $b) {
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
        $articles = Article::query()
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
            'categories' => $categories,
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
