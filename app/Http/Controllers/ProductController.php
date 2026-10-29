<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Services\CatalogService;
use App\Support\CatalogCache;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display the perfume catalog with filterable scent families.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'q', 'category', 'brand', 'gender', 'concentration', 'scent', 'scent_profile',
            'price', 'price_tier', 'min_price', 'min',
            'max_price', 'max', 'rating', 'min_rating', 'discount', 'promo', 'sort', 'sortBy',
            'tag', 'collection', 'new_arrivals', 'best_sellers', 'special_offers', 'is_new_arrivals', 'is_best_sellers', 'is_special_offers',
        ]);

        return Inertia::render('products', CatalogCache::remember(
            'products:index:'.CatalogCache::hash($filters),
            fn () => $this->productIndexData($request),
        ));
    }

    /**
     * Build the product listing props for the given filters.
     *
     * @return array<string, mixed>
     */
    protected function productIndexData(Request $request): array
    {
        $query = Product::published()->with([
            'variants',
            'categories',
            'brandRelation',
            'galleries',
            'primaryImage',
            'reviews',
        ]);

        // 1. Text Search Query
        $search = trim((string) $request->input('search', $request->input('q', '')));
        if ($search !== '') {
            $query->where(function ($sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('brandRelation', fn ($b) => $b->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('categories', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        // 2. Brand
        $selectedBrand = (string) $request->input('brand', 'All');
        if ($selectedBrand !== '' && $selectedBrand !== 'All') {
            $brandModel = Brand::where('slug', $selectedBrand)
                ->orWhere('name', $selectedBrand)
                ->first();

            if ($brandModel) {
                $selectedBrand = $brandModel->name;
                $query->where('brand_id', $brandModel->id);
            } else {
                $query->whereHas('brandRelation', fn ($b) => $b->where('name', $selectedBrand)->orWhere('slug', $selectedBrand));
            }
        }

        // 3. Gender
        $selectedGender = (string) $request->input('gender', 'All');
        if ($selectedGender !== '' && $selectedGender !== 'All') {
            $genderModel = Category::where('type', 'genders')
                ->where(function ($q) use ($selectedGender) {
                    $q->where('slug', $selectedGender)
                        ->orWhere('name', $selectedGender)
                        ->orWhere('name_en', $selectedGender);
                })
                ->first();

            if ($genderModel) {
                $selectedGender = $genderModel->name;
                $query->whereHas('categories', fn ($c) => $c->where('categories.id', $genderModel->id));
            } else {
                $query->whereHas('categories', fn ($c) => $c->where('categories.type', 'genders')->where(function ($cq) use ($selectedGender) {
                    $cq->where('categories.name', $selectedGender)
                        ->orWhere('categories.slug', $selectedGender)
                        ->orWhere('categories.name_en', $selectedGender);
                }));
            }
        }

        // 4. Concentration
        $selectedConcentration = (string) $request->input('concentration', 'All');
        if ($selectedConcentration !== '' && $selectedConcentration !== 'All') {
            $concModel = Category::where('type', 'concentrates')
                ->where(function ($q) use ($selectedConcentration) {
                    $q->where('slug', $selectedConcentration)
                        ->orWhere('name', $selectedConcentration)
                        ->orWhere('name_en', $selectedConcentration);
                })
                ->first();

            if ($concModel) {
                $selectedConcentration = $concModel->name;
                $query->whereHas('categories', fn ($c) => $c->where('categories.id', $concModel->id));
            } else {
                $query->whereHas('categories', fn ($c) => $c->where('categories.type', 'concentrates')->where(function ($cq) use ($selectedConcentration) {
                    $cq->where('categories.name', $selectedConcentration)
                        ->orWhere('categories.slug', $selectedConcentration)
                        ->orWhere('categories.name_en', $selectedConcentration);
                }));
            }
        }

        // 5. Scent Profile
        $selectedScent = (string) $request->input('scent', $request->input('scent_profile', 'All'));
        if ($selectedScent !== '' && $selectedScent !== 'All') {
            $scentModel = Category::where('type', 'scents')
                ->where(function ($q) use ($selectedScent) {
                    $q->where('slug', $selectedScent)
                        ->orWhere('name', $selectedScent)
                        ->orWhere('name_en', $selectedScent);
                })
                ->first();

            if ($scentModel) {
                $selectedScent = $scentModel->name;
                $query->whereHas('categories', fn ($c) => $c->where('categories.id', $scentModel->id));
            } else {
                $query->whereHas('categories', fn ($c) => $c->where('categories.type', 'scents')->where(function ($cq) use ($selectedScent) {
                    $cq->where('categories.name', $selectedScent)
                        ->orWhere('categories.slug', $selectedScent)
                        ->orWhere('categories.name_en', $selectedScent);
                }));
            }
        }

        // 6. Generic Category (for backwards-compatibility)
        $selectedCategory = (string) $request->input('category', 'All');
        if ($selectedCategory !== '' && $selectedCategory !== 'All') {
            $catModel = Category::where('slug', $selectedCategory)
                ->orWhere('name', $selectedCategory)
                ->orWhere('name_en', $selectedCategory)
                ->first();

            if ($catModel) {
                $selectedCategory = $catModel->name;
                $query->whereHas('categories', fn ($c) => $c->where('categories.id', $catModel->id));
                if ($catModel->type === 'genders' && $selectedGender === 'All') {
                    $selectedGender = $catModel->name;
                } elseif ($catModel->type === 'concentrates' && $selectedConcentration === 'All') {
                    $selectedConcentration = $catModel->name;
                } elseif ($catModel->type === 'scents' && $selectedScent === 'All') {
                    $selectedScent = $catModel->name;
                }
            } else {
                $query->whereHas('categories', fn ($c) => $c->where('name', $selectedCategory)->orWhere('slug', $selectedCategory));
            }
        }

        // 7. Price Tier & Custom Min/Max
        $priceTier = (string) $request->input('price', $request->input('price_tier', 'all'));
        if ($priceTier === 'under-500' || $priceTier === 'under-500k') {
            $query->whereHas('variants', fn ($v) => $v->where('price', '<', 500000));
        } elseif ($priceTier === '500-1000' || $priceTier === '500k-1m' || $priceTier === '500-1jt') {
            $query->whereHas('variants', fn ($v) => $v->whereBetween('price', [500000, 1000000]));
        } elseif ($priceTier === 'above-1000' || $priceTier === 'above-1m' || $priceTier === 'above-1jt') {
            $query->whereHas('variants', fn ($v) => $v->where('price', '>', 1000000));
        } elseif ($priceTier === 'under-1500') {
            $query->whereHas('variants', fn ($v) => $v->where('price', '<', 1500000));
        } elseif ($priceTier === '1500-2500') {
            $query->whereHas('variants', fn ($v) => $v->whereBetween('price', [1500000, 2500000]));
        } elseif ($priceTier === 'above-2500') {
            $query->whereHas('variants', fn ($v) => $v->where('price', '>', 2500000));
        }

        $minPrice = $request->input('min_price', $request->input('min'));
        if ($minPrice !== null && $minPrice !== '' && is_numeric($minPrice)) {
            $query->whereHas('variants', fn ($v) => $v->where('price', '>=', (int) $minPrice));
        }

        $maxPrice = $request->input('max_price', $request->input('max'));
        if ($maxPrice !== null && $maxPrice !== '' && is_numeric($maxPrice)) {
            $query->whereHas('variants', fn ($v) => $v->where('price', '<=', (int) $maxPrice));
        }

        // 8. Min Rating
        $rating = $request->input('rating', $request->input('min_rating'));
        if ($rating !== null && $rating !== '' && is_numeric($rating)) {
            $minRating = (float) $rating;
            if ($minRating > 0) {
                $query->whereRaw('(SELECT COALESCE(AVG(rating), 5.0) FROM product_reviews WHERE product_reviews.product_id = products.id) >= ?', [$minRating]);
            }
        } else {
            $minRating = 0;
        }

        // 9. Promo / Discount Filter
        $onlyDiscount = $request->boolean('discount') || $request->input('discount') === '1' || $request->input('promo') === '1';
        if ($onlyDiscount) {
            $query->whereHas('variants', fn ($v) => $v->whereNotNull('original_price')->whereColumn('original_price', '>', 'price'));
        }

        // 10. Tag / Collection Filter (new arrivals, best sellers, special offers)
        $tag = (string) $request->input('tag', $request->input('collection', ''));
        if ($tag === 'new-arrivals' || $tag === 'new_arrivals' || $request->boolean('new_arrivals') || $request->boolean('is_new_arrivals')) {
            $query->where('is_new_arrivals', true);
        } elseif ($tag === 'best-sellers' || $tag === 'best_sellers' || $request->boolean('best_sellers') || $request->boolean('is_best_sellers')) {
            $query->where('is_best_sellers', true);
        } elseif ($tag === 'special-offers' || $tag === 'special_offers' || $request->boolean('special_offers') || $request->boolean('is_special_offers')) {
            $query->where(function ($q) {
                $q->where('is_special_offers', true)
                    ->orWhereHas('variants', fn ($v) => $v->whereNotNull('original_price')->whereColumn('original_price', '>', 'price'));
            });
        }

        // 10. Sorting (Harga Terendah, Harga Tertinggi, Nama A-Z, Nama Z-A)
        $sortBy = (string) $request->input('sort', $request->input('sortBy', ''));
        match ($sortBy) {
            'price-asc' => $query->withMin('variants', 'price')->orderBy('variants_min_price', 'asc')->orderBy('id', 'asc'),
            'price-desc' => $query->withMin('variants', 'price')->orderByDesc('variants_min_price')->orderBy('id', 'asc'),
            'name-asc' => $query->orderBy('name', 'asc')->orderBy('id', 'asc'),
            'name-desc' => $query->orderBy('name', 'desc')->orderBy('id', 'asc'),
            'popular' => $query->withCount('reviews')->orderByDesc('reviews_count')->orderBy('id', 'asc'),
            'rating' => $query->withAvg('reviews', 'rating')->withCount('reviews')->orderByRaw('COALESCE(reviews_avg_rating, 0) DESC')->orderByDesc('reviews_count')->orderBy('id', 'asc'),
            'discount' => $query->withMax('variants', 'discount_percent')->orderByRaw('COALESCE(variants_max_discount_percent, 0) DESC')->orderBy('id', 'asc'),
            default => $query->orderBy('id', 'asc'),
        };

        $fragrances = $query->get()->map(fn (Product $p) => CatalogService::formatProduct($p))->all();

        $genderItems = Category::where('type', 'genders')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_en', 'slug'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'name_en' => $c->name_en ?: $c->name,
                'slug' => $c->slug,
            ])->all();

        $concentrationItems = Category::where('type', 'concentrates')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_en', 'slug'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'name_en' => $c->name_en ?: $c->name,
                'slug' => $c->slug,
            ])->all();

        $scentItems = Category::where('type', 'scents')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_en', 'slug'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'name_en' => $c->name_en ?: $c->name,
                'slug' => $c->slug,
            ])->all();

        $brandItems = Brand::orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'slug'])
            ->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'slug' => $b->slug,
            ])->all();

        $dbCategories = Category::orderBy('sort_order', 'asc')->orderBy('name', 'asc')->pluck('name')->all();
        $categories = array_values(array_unique(array_merge(['All'], $dbCategories)));

        $brands = array_values(array_unique(array_merge(
            ['All'],
            Brand::orderBy('sort_order', 'asc')->orderBy('name', 'asc')->pluck('name')->all()
        )));

        $genders = array_values(array_unique(array_merge(['All'], array_column($genderItems, 'name'))));
        $concentrations = array_values(array_unique(array_merge(['All'], array_column($concentrationItems, 'name'))));
        $scents = array_values(array_unique(array_merge(['All'], array_column($scentItems, 'name'))));

        return [
            'fragrances' => $fragrances,
            'categories' => $categories,
            'brands' => $brands,
            'brandItems' => $brandItems,
            'genders' => $genders,
            'genderItems' => $genderItems,
            'concentrations' => $concentrations,
            'concentrationItems' => $concentrationItems,
            'scents' => $scents,
            'scentItems' => $scentItems,
            'selectedCategory' => $selectedCategory,
            'selectedBrand' => $selectedBrand,
            'selectedGender' => $selectedGender,
            'selectedConcentration' => $selectedConcentration,
            'selectedScent' => $selectedScent,
            'filters' => [
                'searchQuery' => $search,
                'activeCategory' => $selectedCategory,
                'activeBrand' => $selectedBrand,
                'activeGender' => $selectedGender,
                'activeConcentration' => $selectedConcentration,
                'activeScent' => $selectedScent,
                'priceTier' => $priceTier,
                'customMin' => (string) ($minPrice ?? ''),
                'customMax' => (string) ($maxPrice ?? ''),
                'minRating' => $minRating,
                'onlyDiscount' => $onlyDiscount,
                'sortBy' => $sortBy,
                'tag' => $tag ?: null,
            ],
            'totalCount' => count($fragrances),
        ];
    }

    /**
     * Display a single fragrance detail showcase.
     */
    public function show(string $slug): Response
    {
        $allFragrances = CatalogService::all();
        $product = CatalogService::findBySlug($slug);

        if (! $product) {
            abort(404, 'Wewangian tidak ditemukan');
        }

        // Get related products from the same category or brand, excluding current product
        $relatedProducts = collect($allFragrances)
            ->filter(function (array $item) use ($product): bool {
                return $item['id'] !== $product['id'] &&
                    ($item['category'] === $product['category'] || $item['brand'] === $product['brand']);
            })
            ->take(5)
            ->values()
            ->all();

        // If not enough related from same family, pad with other popular ones
        if (count($relatedProducts) < 5) {
            $otherIds = array_merge([$product['id']], array_column($relatedProducts, 'id'));
            $fillers = collect($allFragrances)
                ->filter(fn (array $item): bool => ! in_array($item['id'], $otherIds, true))
                ->take(5 - count($relatedProducts))
                ->values()
                ->all();
            $relatedProducts = array_merge($relatedProducts, $fillers);
        }

        return Inertia::render('product-detail', [
            'product' => $product,
            'relatedProducts' => Inertia::defer(fn () => $relatedProducts),
        ]);
    }

    /**
     * Alias for show method.
     */
    public function productDetail(string $slug): Response
    {
        return $this->show($slug);
    }

    /**
     * Alias for index method.
     */
    public function products(Request $request): Response
    {
        return $this->index($request);
    }

    /**
     * Get the master list of all fragrances available in the atelier catalog.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getFragrances(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'Oud Impérial Royale',
                'slug' => 'oud-imperial-royale',
                'brand' => 'Aroma Royale',
                'family' => 'Oriental Woody',
                'category' => 'Parfum Pria',
                'volume' => '50ml',
                'concentration' => 'Extrait de Parfum (32%)',
                'price' => 'Rp 2.450.000',
                'originalPrice' => 'Rp 2.880.000',
                'discountBadge' => '-15%',
                'raw_price' => 2450000,
                'rating' => 4.9,
                'reviews_count' => 128,
                'in_stock' => true,
                'image' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Grand Reserve',
                'mood' => 'Regal, Opulent, Enigmatic',
                'description' => 'Sebuah mahakarya wewangian oud bangsawan yang memadukan kayu gaharu Kamboja berusia puluhan tahun dengan saffron Persia dan ambergris emas. Diracik khusus dengan teknik maserasi tradisional dalam tong kayu ek untuk menghasilkan kedalaman aroma yang berkarakter kuat, megah, dan tak terlupakan.',
                'longevity' => '14 - 18 Jam (Sangat Tahan Lama)',
                'sillage' => 'Proyeksi Megah (Radius 2-3 Meter)',
                'season' => 'Malam Hari, Acara Formal & Suhu Sejuk',
                'maceration' => '180 Hari dalam Tong Kayu Ek Prancis',
                'notes' => [
                    'top' => 'Persian Saffron, Italian Bergamot, Green Cardamom',
                    'heart' => 'Taif Rose Absolute, Smoked Incense, Nutmeg',
                    'base' => 'Cambodian Royal Agarwood (Oud), Golden Ambergris, Italian Leather',
                ],
                'reviews' => [
                    [
                        'name' => 'Raden Arya W.',
                        'rating' => 5,
                        'date' => '3 hari lalu',
                        'comment' => 'Oud paling halus dan megah yang pernah saya miliki. Proyeksinya luar biasa berwibawa tanpa menusuk hidung. Tahan hingga seharian penuh!',
                        'verified' => true,
                    ],
                    [
                        'name' => 'Dimas Prasetyo',
                        'rating' => 5,
                        'date' => '1 minggu lalu',
                        'comment' => 'Packaging kotak beludrunya sangat mewah. Scent trail-nya membuat banyak orang menanyakan parfum apa yang saya gunakan.',
                        'verified' => true,
                    ],
                    [
                        'name' => 'Hendrawan S.',
                        'rating' => 4.8,
                        'date' => '2 minggu lalu',
                        'comment' => 'Kombinasi saffron dan gaharu yang sempurna. Sangat cocok dipakai meeting malam hari dengan kolega VIP.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 2,
                'name' => 'Velours de Rose & Amber',
                'slug' => 'velours-de-rose-amber',
                'brand' => 'Maison Floral',
                'family' => 'Floral',
                'category' => 'Parfum Wanita',
                'volume' => '100ml',
                'concentration' => 'Eau de Parfum (22%)',
                'price' => 'Rp 1.950.000',
                'originalPrice' => 'Rp 2.160.000',
                'discountBadge' => '-10%',
                'raw_price' => 1950000,
                'rating' => 4.85,
                'reviews_count' => 96,
                'in_stock' => true,
                'image' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Bestseller',
                'mood' => 'Romantic, Sensual, Radiant',
                'description' => 'Kelembutan kelopak mawar Centifolia dari perkebunan Grasse yang dipetik di fajar hari, diselimuti bourbon vanilla Madagaskar dan kehangatan white amber. Memberikan sensasi sentuhan gaun sutra beludru yang elegan dan memikat.',
                'longevity' => '10 - 14 Jam',
                'sillage' => 'Sedang hingga Kuat (Intim & Romantis)',
                'season' => 'Sore Hari, Acara Spesial & Kencan Elegan',
                'maceration' => '120 Hari Ekstraksi Bunga Alami',
                'notes' => [
                    'top' => 'Pink Pepper, Sweet Lychee, Mandarin Blossom',
                    'heart' => 'Centifolia Rose, Turkish Rose Absolute, White Peony',
                    'base' => 'Bourbon Vanilla, Cashmere Wood, Warm White Amber',
                ],
                'reviews' => [
                    [
                        'name' => 'Clarissa Stephanie',
                        'rating' => 5,
                        'date' => '5 hari lalu',
                        'comment' => 'Aroma mawar yang paling elegan, manisnya pas berkat vanilla bourbon. Wanginya menempel di jaket bahkan setelah dua hari.',
                        'verified' => true,
                    ],
                    [
                        'name' => 'Nadia Amanda',
                        'rating' => 4.9,
                        'date' => '2 minggu lalu',
                        'comment' => 'Suka sekali dengan sentuhan white amber di dry-down-nya. Memberi kesan wanita anggun dan berkelas.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 3,
                'name' => 'Santal Céleste',
                'slug' => 'santal-celeste',
                'brand' => 'Artisanal Niche',
                'family' => 'Woody',
                'category' => 'Unisex Fragrance',
                'volume' => '75ml',
                'concentration' => 'Extrait de Parfum (28%)',
                'price' => 'Rp 2.150.000',
                'raw_price' => 2150000,
                'rating' => 4.92,
                'reviews_count' => 114,
                'in_stock' => true,
                'isNew' => true,
                'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Limited Harvest',
                'mood' => 'Calm, Sophisticated, Ethereal',
                'description' => 'Kayu cendana Mysore murni berpadu dengan keanggunan iris Florentina, papirus mesir kuno, dan hembusan cedar Virginia yang menenangkan batin dan memancarkan aura ketenangan intelektual.',
                'longevity' => '12 - 16 Jam',
                'sillage' => 'Aura Halus Elegan (1.5 - 2 Meter)',
                'season' => 'Sehari-hari, Galeri Seni, Pertemuan Eksklusif',
                'maceration' => '150 Hari',
                'notes' => [
                    'top' => 'Florentine Iris, Violet Leaf, Italian Lemon',
                    'heart' => 'Cardamom Pod, Papyrus Reed, Tonka Bean',
                    'base' => 'Mysore Sandalwood, Virginia Cedarwood, Silk Musk',
                ],
                'reviews' => [
                    [
                        'name' => 'Fauzan Hakim',
                        'rating' => 5,
                        'date' => '4 hari lalu',
                        'comment' => 'Santal terbaik! Creamy sandalwood dengan sentuhan iris yang membuat aromanya sangat bersih dan tenang.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 4,
                'name' => 'Cédrat de Capri',
                'slug' => 'cedrat-de-capri',
                'brand' => 'Capri Fragranze',
                'family' => 'Fresh Citrus',
                'category' => 'Unisex Fragrance',
                'volume' => '100ml',
                'concentration' => 'Eau de Parfum (20%)',
                'price' => 'Rp 1.750.000',
                'raw_price' => 1750000,
                'rating' => 4.78,
                'reviews_count' => 82,
                'in_stock' => true,
                'image' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Summer Signature',
                'mood' => 'Effervescent, Sunlit, Refreshing',
                'description' => 'Kilauan sinar matahari pesisir Mediterania dalam botol. Jeruk Cédrat Capri segar dipadukan dengan garam laut murni, kelopak neroli, dan kayu hanyut yang memancarkan energi positif tak berujung.',
                'longevity' => '8 - 10 Jam (Sangat tahan untuk golongan citrus)',
                'sillage' => 'Segar & Semerbak (1 - 2 Meter)',
                'season' => 'Pagi Hari, Cuaca Tropis, Liburan Pantai',
                'maceration' => '90 Hari Destilasi Dingin',
                'notes' => [
                    'top' => 'Capri Cedrat, Green Mandarin, Bitter Orange',
                    'heart' => 'Neroli Petals, Petitgrain, Sea Salt Breeze',
                    'base' => 'Sunlit Driftwood, White Amber, Haitian Vetiver',
                ],
                'reviews' => [
                    [
                        'name' => 'Jessica Tan',
                        'rating' => 4.8,
                        'date' => '1 minggu lalu',
                        'comment' => 'Citrus paling mewah yang pernah saya cium. Tidak seperti pengharum mobil, tapi seperti angin laut di resort bintang lima.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 5,
                'name' => 'Vanille Noire d’Ambre',
                'slug' => 'vanille-noire-d-ambre',
                'brand' => 'Amber & Tonka',
                'family' => 'Gourmand Oriental',
                'category' => 'Parfum Wanita',
                'volume' => '50ml',
                'concentration' => 'Extrait de Parfum (30%)',
                'price' => 'Rp 2.300.000',
                'raw_price' => 2300000,
                'rating' => 4.95,
                'reviews_count' => 140,
                'in_stock' => true,
                'isPopular' => true,
                'image' => 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Connoisseur Pick',
                'mood' => 'Intoxicating, Warm, Addictive',
                'description' => 'Vanila asap Madagaskar yang gelap berpadu dengan kakao murni, getah benzoin, dan amber keemasan. Sebuah kenikmatan gourmand tingkat tinggi yang adiktif dan menggoda indera.',
                'longevity' => '14 - 18 Jam',
                'sillage' => 'Kuat & Mengikat',
                'season' => 'Malam Hari, Musim Hujan, Suasana Romantis',
                'maceration' => '180 Hari',
                'notes' => [
                    'top' => 'Roasted Almond, Ceylon Cinnamon Bark, Bergamot',
                    'heart' => 'Smoked Madagascar Vanilla, Dark Cacao, Clove',
                    'base' => 'Benzoin Resin, Golden Amber, Peruvian Balsam',
                ],
                'reviews' => [
                    [
                        'name' => 'Anindya Putri',
                        'rating' => 5,
                        'date' => '3 hari lalu',
                        'comment' => 'Vanilanya bukan tipe manis kue murahan, tapi sangat dewasa, smoky, dan sensual. Favorit mutlak!',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 6,
                'name' => 'Fumée Sacrée',
                'slug' => 'fumee-sacree',
                'brand' => 'Atelier Sacré',
                'family' => 'Smoky Leather',
                'category' => 'Parfum Pria',
                'volume' => '50ml',
                'concentration' => 'Extrait de Parfum (35%)',
                'price' => 'Rp 2.650.000',
                'raw_price' => 2650000,
                'rating' => 4.88,
                'reviews_count' => 74,
                'in_stock' => true,
                'image' => 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Atelier Only',
                'mood' => 'Mystic, Dark, Commanding',
                'description' => 'Aroma dupa suci kuil kuno berpadu dengan asap birch tar, daun tembakau cured, dan kulit Rusia hitam pekat. Karakter aroma yang misterius, berwibawa, dan memancarkan kekuasaan sunyi.',
                'longevity' => '16 - 20 Jam',
                'sillage' => 'Sangat Kuat (Jejak Aroma Bertahan Lama)',
                'season' => 'Malam Hari Khusus & Acara Formal Eksklusif',
                'maceration' => '210 Hari',
                'notes' => [
                    'top' => 'Black Pepper, Birch Tar, Wild Juniper',
                    'heart' => 'Frankincense Tears, Guaiacwood, Tobacco Leaf',
                    'base' => 'Cuir de Russie, Castoreum Accord, Black Patchouli',
                ],
                'reviews' => [
                    [
                        'name' => 'Bambang Soediro',
                        'rating' => 5,
                        'date' => '2 minggu lalu',
                        'comment' => 'Karakter smoky leather terkuat dan termewah di koleksi saya. Benar-benar wangi pria pemimpin.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 7,
                'name' => 'Baccarat Rouge Extrait 540',
                'slug' => 'baccarat-rouge-540-extrait',
                'brand' => 'Maison Francis Kurkdjian',
                'family' => 'Oriental Woody',
                'category' => 'Unisex Fragrance',
                'volume' => '70ml',
                'concentration' => 'Extrait de Parfum (30%)',
                'price' => 'Rp 4.950.000',
                'originalPrice' => 'Rp 5.500.000',
                'discountBadge' => '-10%',
                'raw_price' => 4950000,
                'rating' => 4.98,
                'reviews_count' => 210,
                'in_stock' => true,
                'isPopular' => true,
                'image' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Iconic Niche',
                'mood' => 'Luminous, Opulent, Addictive',
                'description' => 'Ikon wewangian niche dunia. Melati Grandiflorum dari Mesir berpadu dengan almon pahit Maroko dan kehangatan ambergris kayu cedar. Menghasilkan pendaran aroma mineral amber kristal yang magis.',
                'longevity' => '16 - 24 Jam',
                'sillage' => 'Legendaris & Mengisi Ruangan',
                'season' => 'Sepanjang Masa, Red Carpet & Acara Termewah',
                'maceration' => '180 Hari',
                'notes' => [
                    'top' => 'Grandiflorum Jasmine, Saffron Pistils',
                    'heart' => 'Bitter Almond, Cedarwood Essence',
                    'base' => 'Ambergris Accord, Woody Musk, Fir Balsam',
                ],
                'reviews' => [
                    [
                        'name' => 'Victoria Chandra',
                        'rating' => 5,
                        'date' => '1 hari lalu',
                        'comment' => 'Tidak diragukan lagi karya seni master perfumer. Tahan berhari-hari di baju dan baunya sangat mahal.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 8,
                'name' => 'Delina Exclusif Royal',
                'slug' => 'delina-exclusif-royal',
                'brand' => 'Parfums de Marly',
                'family' => 'Floral',
                'category' => 'Parfum Wanita',
                'volume' => '75ml',
                'concentration' => 'Parfum (28%)',
                'price' => 'Rp 3.850.000',
                'originalPrice' => 'Rp 4.400.000',
                'discountBadge' => '-12%',
                'raw_price' => 3850000,
                'rating' => 4.96,
                'reviews_count' => 175,
                'in_stock' => true,
                'isPopular' => true,
                'image' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Crown Jewel',
                'mood' => 'Sensual, Regal, Hypnotic',
                'description' => 'Mawar Damaskus yang bermandikan aroma buah pir dan leci manis, kemudian diperkaya dengan sentuhan dupa lembut, gaharu, dan vanila hangat. Karakter feminin ratu kerajaan yang mempesona.',
                'longevity' => '12 - 16 Jam',
                'sillage' => 'Sangat Kuat & Memikat',
                'season' => 'Pernikahan, Gala Dinner & Perayaan Mewah',
                'maceration' => '140 Hari',
                'notes' => [
                    'top' => 'Lychee, Crispy Pear, Italian Bergamot',
                    'heart' => 'Turkish Damask Rose, Incense Tears, Oud Wood',
                    'base' => 'Madagascar Vanilla, Golden Amber, Evernyl',
                ],
                'reviews' => [
                    [
                        'name' => 'Siti Maulida',
                        'rating' => 5,
                        'date' => '4 hari lalu',
                        'comment' => 'Juara parfum floral mewah. Dupa dan oud-nya membuat aroma mawarnya jadi sangat berbobot dan sensual.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 9,
                'name' => 'Royal Discovery Set (6 x 10ml)',
                'slug' => 'royal-discovery-set',
                'brand' => 'Aroma Palace Private Blend',
                'family' => 'Oriental Woody',
                'category' => 'Discovery Sets',
                'volume' => '60ml Total',
                'concentration' => 'Extrait de Parfum Set',
                'price' => 'Rp 1.250.000',
                'originalPrice' => 'Rp 1.500.000',
                'discountBadge' => '-17%',
                'raw_price' => 1250000,
                'rating' => 4.91,
                'reviews_count' => 89,
                'in_stock' => true,
                'isNew' => true,
                'image' => 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Best Value',
                'mood' => 'Versatile, Luxurious, Explorative',
                'description' => 'Koleksi eksklusif 6 vial atomiser mewah berukuran 10ml berisi pilihan extrait paling ikonik dari Aroma Palace. Dilengkapi kartu panduan piramida aroma dan voucher belanja.',
                'longevity' => '12+ Jam Setiap Varian',
                'sillage' => 'Bervariasi Sesuai Varian',
                'season' => 'Sangat Ideal untuk Travel & Hadiah Eksklusif',
                'maceration' => 'Koleksi Formula Pilihan',
                'notes' => [
                    'top' => 'Curated Oud, Rose, Citrus Top Notes',
                    'heart' => 'Amber, Spices, Floral Bouquets',
                    'base' => 'Precious Woods, Musk, Madagascar Vanilla',
                ],
                'reviews' => [
                    [
                        'name' => 'Budi Santoso',
                        'rating' => 5,
                        'date' => '1 minggu lalu',
                        'comment' => 'Solusi terbaik sebelum beli full bottle. Semua 6 wanginya tidak ada yang mengecewakan!',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 10,
                'name' => 'Neroli Portofino Aqua',
                'slug' => 'neroli-portofino-aqua',
                'brand' => 'Riviera Scents',
                'family' => 'Fresh Citrus',
                'category' => 'Unisex Fragrance',
                'volume' => '100ml',
                'concentration' => 'Eau de Toilette (15%)',
                'price' => 'Rp 1.450.000',
                'raw_price' => 1450000,
                'rating' => 4.75,
                'reviews_count' => 58,
                'in_stock' => true,
                'image' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Fresh Crisp',
                'mood' => 'Mediterranean, Clean, Uplifting',
                'description' => 'Aroma hembusan angin laut Riviera Italia berpadu dengan keharuman bunga jeruk neroli Tunisia, daun lavender, dan amber kristal yang menyejukkan jiwa.',
                'longevity' => '7 - 9 Jam',
                'sillage' => 'Segar Bersih (1 Meter)',
                'season' => 'Siang Hari Tropis & Olahraga Outdoor Elegan',
                'maceration' => '90 Hari',
                'notes' => [
                    'top' => 'Italian Lemon, Mandarin, Myrtle',
                    'heart' => 'Tunisian Neroli, Orange Flower, Lavender',
                    'base' => 'Amber, Angelica Root, Ambrette Seed',
                ],
                'reviews' => [
                    [
                        'name' => 'Irwan Kurnia',
                        'rating' => 4.7,
                        'date' => '2 minggu lalu',
                        'comment' => 'Segar sekali saat cuaca panas terik di Jakarta. Bikin semangat kerja seharian.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 11,
                'name' => 'Cuir de Russie Noir',
                'slug' => 'cuir-de-russie-noir',
                'brand' => 'Imperial Parfums',
                'family' => 'Smoky Leather',
                'category' => 'Parfum Pria',
                'volume' => '100ml',
                'concentration' => 'Eau de Parfum (22%)',
                'price' => 'Rp 2.850.000',
                'raw_price' => 2850000,
                'rating' => 4.87,
                'reviews_count' => 64,
                'in_stock' => true,
                'image' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Private Reserve',
                'mood' => 'Bold, Charismatic, Seductive',
                'description' => 'Aroma kulit istana kekaisaran Rusia yang disamak dengan kulit pohon birch, thyme herbal, dan tembakau pipa Kuba. Menegaskan aura pria karismatik yang percaya diri.',
                'longevity' => '12 - 16 Jam',
                'sillage' => 'Kuat & Berkesan',
                'season' => 'Malam Hari, Musim Dingin, Acara Formal',
                'maceration' => '160 Hari',
                'notes' => [
                    'top' => 'Clary Sage, French Lavender, Wild Thyme',
                    'heart' => 'Smoky Leather, Birch Tar, Iris Root',
                    'base' => 'Beaver Castoreum Accord, Cuban Tobacco, Oakmoss',
                ],
                'reviews' => [
                    [
                        'name' => 'Rangga Perkasa',
                        'rating' => 5,
                        'date' => '3 minggu lalu',
                        'comment' => 'Aroma maskulin sejati. Bau kulit mewahnya berkelas seperti interior mobil sport baru.',
                        'verified' => true,
                    ],
                ],
            ],
            [
                'id' => 12,
                'name' => 'Fleur Blanche & Pivoine',
                'slug' => 'fleur-blanche-pivoine',
                'brand' => 'Jardin Secret',
                'family' => 'Floral',
                'category' => 'Parfum Wanita',
                'volume' => '100ml',
                'concentration' => 'Eau de Parfum (20%)',
                'price' => 'Rp 1.650.000',
                'originalPrice' => 'Rp 1.850.000',
                'discountBadge' => '-10%',
                'raw_price' => 1650000,
                'rating' => 4.82,
                'reviews_count' => 77,
                'in_stock' => true,
                'image' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
                'gallery' => [
                    'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                ],
                'tag' => 'Spring Blossom',
                'mood' => 'Delicate, Graceful, Dreamy',
                'description' => 'Taman bunga rahasia di musim semi. Peony putih yang bermekaran diiringi melati Sambac, lily of the valley, dan musk sutra lembut yang membangkitkan impian manis.',
                'longevity' => '9 - 12 Jam',
                'sillage' => 'Lembut Anggun (1.5 Meter)',
                'season' => 'Pagi & Siang Hari, Afternoon Tea, Busana Kasual Chic',
                'maceration' => '100 Hari',
                'notes' => [
                    'top' => 'Morning Dew Drops, Green Apple, Crisp Freesia',
                    'heart' => 'White Peony, Lily of the Valley, Jasmine Sambac',
                    'base' => 'Virginia Cedarwood, Sheer Silk Musk, Heliotrope',
                ],
                'reviews' => [
                    [
                        'name' => 'Devi Sartika',
                        'rating' => 4.9,
                        'date' => '1 minggu lalu',
                        'comment' => 'Sangat feminin dan lembut. Wangi peony putihnya bikin hati senang setiap kali mencium aromanya.',
                        'verified' => true,
                    ],
                ],
            ],
        ];
    }
}
