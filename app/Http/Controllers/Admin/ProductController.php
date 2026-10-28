<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductGallery;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products with variants, categories, and inventory metrics.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $categoryId = $request->query('category_id');
        $brandId = $request->query('brand_id');
        $stockFilter = (string) $request->query('stock_filter', 'all');

        $query = Product::with(['categories', 'brand', 'variants', 'galleries'])->latest('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhereHas('variants', function ($vq) use ($search) {
                        $vq->where('sku', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%")
                            ->orWhere('volume', 'like', "%{$search}%");
                    })
                    ->orWhereHas('brand', function ($bq) use ($search) {
                        $bq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('categories', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($categoryId && $categoryId !== 'all') {
            $query->whereHas('categories', function ($cq) use ($categoryId) {
                $cq->where('categories.id', $categoryId);
            });
        }

        if ($brandId && $brandId !== 'all') {
            $query->where('brand_id', $brandId);
        }

        if ($stockFilter === 'low_stock') {
            $query->whereHas('variants', function ($vq) {
                $vq->where('stock', '>', 0)->where('stock', '<=', 10);
            });
        } elseif ($stockFilter === 'out_of_stock') {
            $query->whereDoesntHave('variants', function ($vq) {
                $vq->where('stock', '>', 0);
            });
        }

        $products = $query->paginate(12)->withQueryString()->through(function (Product $product) {
            $primaryImage = $product->galleries->first()?->image
                ?: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80';

            $totalStock = $product->variants->sum('stock');
            $minPrice = $product->variants->min('price') ?? 0;
            $maxPrice = $product->variants->max('price') ?? 0;

            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->categories->first() ? [
                    'id' => $product->categories->first()->id,
                    'name' => $product->categories->first()->name,
                    'type' => $product->categories->first()->type,
                ] : null,
                'categories' => $product->categories->map(fn (Category $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'type' => $c->type,
                ]),
                'brand' => $product->brand ? [
                    'id' => $product->brand->id,
                    'name' => $product->brand->name,
                ] : null,
                'description' => $product->description,
                'description_en' => $product->description_en,
                'primary_image' => $primaryImage,
                'images_count' => $product->galleries->count(),
                'total_stock' => $totalStock,
                'min_price' => $minPrice,
                'min_price_formatted' => 'Rp '.number_format($minPrice, 0, ',', '.'),
                'max_price' => $maxPrice,
                'max_price_formatted' => 'Rp '.number_format($maxPrice, 0, ',', '.'),
                'variants' => $product->variants->map(fn (ProductVariant $variant) => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'volume' => $variant->volume,
                    'price' => $variant->price,
                    'price_formatted' => 'Rp '.number_format($variant->price, 0, ',', '.'),
                    'original_price' => $variant->original_price,
                    'original_price_formatted' => $variant->original_price ? 'Rp '.number_format($variant->original_price, 0, ',', '.') : null,
                    'discount_percent' => $variant->discount_percent,
                    'sku' => $variant->sku,
                    'stock' => $variant->stock,
                    'in_stock' => $variant->stock > 0,
                ]),
                'variants_count' => $product->variants->count(),
                'created_at' => $product->created_at?->format('d M Y'),
            ];
        });

        // Summary metrics
        $totalProducts = Product::count();
        $totalVariants = ProductVariant::count();
        $lowStockCount = Product::whereHas('variants', fn ($q) => $q->where('stock', '>', 0)->where('stock', '<=', 10))->count();
        $outOfStockCount = Product::whereDoesntHave('variants', fn ($q) => $q->where('stock', '>', 0))->count();

        $categories = Category::select('id', 'name', 'type')->orderBy('type')->orderBy('name')->get();
        $brands = Brand::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId ?: 'all',
                'brand_id' => $brandId ?: 'all',
                'stock_filter' => $stockFilter,
            ],
            'metrics' => [
                'total_products' => $totalProducts,
                'total_variants' => $totalVariants,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'total_categories' => $categories->count(),
                'total_brands' => $brands->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new product with variants.
     */
    public function create(): Response
    {
        $categories = Category::select('id', 'name', 'type')->orderBy('type')->orderBy('name')->get();
        $brands = Brand::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('admin/products/create', [
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    /**
     * Store a newly created product with its variants and gallery images in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'description' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.volume' => ['required'],
            'variants.*.price' => ['required', 'integer', 'min:0'],
            'variants.*.original_price' => ['nullable', 'integer', 'min:0'],
            'variants.*.discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
        ]);

        // Validate that variant names within the same request are distinct
        $variantNames = array_map(fn ($v) => trim(mb_strtolower($v['name'])), $validated['variants']);
        if (count($variantNames) !== count(array_unique($variantNames))) {
            return back()->withErrors(['variants' => 'Setiap varian dalam satu produk harus memiliki nama varian yang berbeda (contoh: Varian Oren, Varian Hijau).'])->withInput();
        }

        DB::transaction(function () use ($validated, $request) {
            $slug = ! empty($validated['slug'])
                ? Str::slug($validated['slug'])
                : $this->generateUniqueSlug($validated['name']);

            $product = Product::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'brand_id' => $validated['brand_id'] ?? null,
                'description' => $validated['description'] ?? null,
                'description_en' => $validated['description_en'] ?? null,
            ]);

            // Sync categories (supports category_ids array or single category_id)
            $catIds = $request->input('category_ids', []);
            if (empty($catIds) && $request->filled('category_id')) {
                $catIds = [(int) $request->input('category_id')];
            }
            $product->categories()->sync($catIds);

            // Save gallery images
            $hasGalleries = false;

            // 1. Handle uploaded image files
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    if ($file instanceof UploadedFile && $file->isValid()) {
                        $path = $file->store('products', 'public');
                        ProductGallery::create([
                            'product_id' => $product->id,
                            'image' => Storage::url($path),
                        ]);
                        $hasGalleries = true;
                    }
                }
            }

            // 2. Handle string image URLs (tests or seeds)
            if ($request->has('images') && is_array($request->input('images'))) {
                foreach ($request->input('images') as $img) {
                    if (is_string($img) && ! empty($img)) {
                        ProductGallery::create([
                            'product_id' => $product->id,
                            'image' => trim($img),
                        ]);
                        $hasGalleries = true;
                    }
                }
            }

            // 3. Fallback default image if none provided
            if (! $hasGalleries) {
                ProductGallery::create([
                    'product_id' => $product->id,
                    'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                ]);
            }

            // Save variants
            foreach ($validated['variants'] as $index => $v) {
                $price = (int) $v['price'];
                $originalPrice = ! empty($v['original_price']) ? (int) $v['original_price'] : null;

                $discountPercent = $v['discount_percent'] ?? null;
                if ($originalPrice && $originalPrice > $price && ! $discountPercent) {
                    $discountPercent = (int) round((($originalPrice - $price) / $originalPrice) * 100);
                }

                $volInt = (int) filter_var($v['volume'], FILTER_SANITIZE_NUMBER_INT);
                $variantSlug = Str::slug($v['name']) ?: 'v'.($index + 1);
                $sku = ! empty($v['sku'])
                    ? trim($v['sku'])
                    : 'AP-'.$product->id.'-'.$volInt.'-'.$variantSlug;

                ProductVariant::create([
                    'product_id' => $product->id,
                    'name' => $v['name'],
                    'volume' => $volInt,
                    'price' => $price,
                    'original_price' => $originalPrice,
                    'discount_percent' => $discountPercent,
                    'sku' => $sku,
                    'stock' => (int) $v['stock'],
                ]);
            }
        });

        return redirect()->route('admin.products.index')
            ->with('success', "Produk \"{$validated['name']}\" beserta variannya berhasil ditambahkan!");
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product): Response
    {
        $product->load(['categories', 'brand', 'variants', 'galleries']);

        $categories = Category::select('id', 'name', 'type')->orderBy('type')->orderBy('name')->get();
        $brands = Brand::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('admin/products/edit', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category_id' => $product->categories->first()?->id,
                'category_ids' => $product->categories->pluck('id')->all(),
                'categories' => $product->categories->map(fn (Category $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'type' => $c->type,
                ]),
                'brand_id' => $product->brand_id,
                'description' => $product->description,
                'description_en' => $product->description_en,
                'images' => $product->galleries->pluck('image')->all(),
                'variants' => $product->variants->map(fn (ProductVariant $variant) => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'volume' => $variant->volume,
                    'price' => $variant->price,
                    'original_price' => $variant->original_price,
                    'discount_percent' => $variant->discount_percent,
                    'sku' => $variant->sku,
                    'stock' => $variant->stock,
                ]),
            ],
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    /**
     * Update the specified product, galleries, and variants.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product->id),
            ],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'description' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'existing_images' => ['nullable', 'array'],
            'existing_images.*' => ['string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.volume' => ['required'],
            'variants.*.price' => ['required', 'integer', 'min:0'],
            'variants.*.original_price' => ['nullable', 'integer', 'min:0'],
            'variants.*.discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
        ]);

        // Validate that variant names within the same request are distinct
        $variantNames = array_map(fn ($v) => trim(mb_strtolower($v['name'])), $validated['variants']);
        if (count($variantNames) !== count(array_unique($variantNames))) {
            return back()->withErrors(['variants' => 'Setiap varian dalam satu produk harus memiliki nama varian yang berbeda (contoh: Varian Oren, Varian Hijau).'])->withInput();
        }

        DB::transaction(function () use ($validated, $request, $product) {
            $slug = ! empty($validated['slug'])
                ? Str::slug($validated['slug'])
                : Str::slug($validated['name']);

            $product->update([
                'name' => $validated['name'],
                'slug' => $slug,
                'brand_id' => $validated['brand_id'] ?? null,
                'description' => $validated['description'] ?? null,
                'description_en' => $validated['description_en'] ?? null,
            ]);

            // Sync categories (supports category_ids array or single category_id)
            $catIds = $request->input('category_ids', []);
            if (empty($catIds) && $request->filled('category_id')) {
                $catIds = [(int) $request->input('category_id')];
            }
            $product->categories()->sync($catIds);

            // Sync galleries
            // 1. Keep existing images passed by client
            $existingImages = $request->input('existing_images', []);
            if (! is_array($existingImages)) {
                $existingImages = [];
            }

            // Delete gallery rows no longer in existing_images
            $product->galleries()->whereNotIn('image', $existingImages)->delete();

            // 2. Upload new image files
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    if ($file instanceof UploadedFile && $file->isValid()) {
                        $path = $file->store('products', 'public');
                        ProductGallery::create([
                            'product_id' => $product->id,
                            'image' => Storage::url($path),
                        ]);
                    }
                }
            }

            // 3. Also support new string image URLs if any
            if ($request->has('images') && is_array($request->input('images'))) {
                foreach ($request->input('images') as $img) {
                    if (is_string($img) && ! empty($img) && ! in_array($img, $existingImages)) {
                        ProductGallery::create([
                            'product_id' => $product->id,
                            'image' => trim($img),
                        ]);
                    }
                }
            }

            // 4. Default fallback if all galleries were deleted
            if ($product->galleries()->count() === 0) {
                ProductGallery::create([
                    'product_id' => $product->id,
                    'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
                ]);
            }

            // Sync variants
            $submittedVariantIds = [];
            foreach ($validated['variants'] as $index => $v) {
                $price = (int) $v['price'];
                $originalPrice = ! empty($v['original_price']) ? (int) $v['original_price'] : null;

                $discountPercent = $v['discount_percent'] ?? null;
                if ($originalPrice && $originalPrice > $price && ! $discountPercent) {
                    $discountPercent = (int) round((($originalPrice - $price) / $originalPrice) * 100);
                }

                $volInt = (int) filter_var($v['volume'], FILTER_SANITIZE_NUMBER_INT);
                $variantSlug = Str::slug($v['name']) ?: 'v'.($index + 1);
                $sku = ! empty($v['sku'])
                    ? trim($v['sku'])
                    : 'AP-'.$product->id.'-'.$volInt.'-'.$variantSlug;

                if (! empty($v['id'])) {
                    $existingVariant = ProductVariant::where('product_id', $product->id)
                        ->where('id', $v['id'])
                        ->first();

                    if ($existingVariant) {
                        $existingVariant->update([
                            'name' => $v['name'],
                            'volume' => $volInt,
                            'price' => $price,
                            'original_price' => $originalPrice,
                            'discount_percent' => $discountPercent,
                            'sku' => $sku,
                            'stock' => (int) $v['stock'],
                        ]);
                        $submittedVariantIds[] = $existingVariant->id;

                        continue;
                    }
                }

                $newVariant = ProductVariant::create([
                    'product_id' => $product->id,
                    'name' => $v['name'],
                    'volume' => $volInt,
                    'price' => $price,
                    'original_price' => $originalPrice,
                    'discount_percent' => $discountPercent,
                    'sku' => $sku,
                    'stock' => (int) $v['stock'],
                ]);
                $submittedVariantIds[] = $newVariant->id;
            }

            // Delete removed variants that are no longer present
            $product->variants()->whereNotIn('id', $submittedVariantIds)->delete();
        });

        return redirect()->route('admin.products.index')
            ->with('success', "Produk \"{$validated['name']}\" berhasil diperbarui!");
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        // Prevent deleting product if it's currently in an active order
        $hasActiveOrders = OrderItem::where('product_id', $product->id)
            ->whereHas('order', function ($query) {
                $query->whereIn('status', ['menunggu_pembayaran', 'diproses', 'dikirim'])
                    ->orWhere(fn ($q) => $q->whereNull('status')->whereIn('payment_status', ['pending', 'paid']));
            })
            ->exists();

        if ($hasActiveOrders) {
            return redirect()->route('admin.products.index')->with('error', "Produk \"{$product->name}\" tidak dapat dihapus saat ini karena sedang berada dalam transaksi pesanan aktif yang belum selesai.");
        }

        $name = $product->name;

        // Clean up wishlist and cart entries for this discontinued product
        $product->wishlists()->delete();
        $product->cartItems()->delete();

        // Soft delete variants and product (historical order items remain intact)
        $product->variants()->delete();
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', "Produk \"{$name}\" berhasil dihapus.");
    }

    /**
     * Quickly update a variant's stock from table without opening full edit form.
     */
    public function updateVariantStock(Request $request, Product $product, ProductVariant $variant): RedirectResponse
    {
        $validated = $request->validate([
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        $variant->update(['stock' => (int) $validated['stock']]);

        return back()->with('success', "Stok varian {$variant->volume} berhasil diperbarui menjadi {$variant->stock} unit.");
    }

    /**
     * Delete a single variant.
     */
    public function destroyVariant(Product $product, ProductVariant $variant): RedirectResponse
    {
        if ($product->variants()->count() <= 1) {
            return back()->with('error', 'Produk harus memiliki setidaknya 1 varian aktif.');
        }

        $volume = $variant->volume;
        $variant->delete();

        return back()->with('success', "Varian {$volume} berhasil dihapus dari produk \"{$product->name}\".");
    }

    /**
     * Generate unique slug for products.
     */
    protected function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $count = 1;

        while (Product::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $count++;
            $slug = "{$baseSlug}-{$count}";
        }

        return $slug;
    }
}
