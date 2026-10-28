<?php

namespace Database\Seeders;

use App\Http\Controllers\ProductController;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductGallery;
use App\Models\ProductReview;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure categories and brands are seeded first
        $this->call([
            CategorySeeder::class,
            BrandSeeder::class,
        ]);

        // Seed 5 master fragrances first as requested
        $fragrances = array_slice(ProductController::getFragrances(), 0, 5);
        $seededIds = [];

        foreach ($fragrances as $data) {
            $seededIds[] = $data['id'];

            // Match or create category
            $category = Category::where('name', $data['category'])
                ->orWhere('slug', Str::slug($data['category']))
                ->first();

            if (! $category) {
                $category = Category::create([
                    'name' => $data['category'],
                    'slug' => Str::slug($data['category']),
                ]);
            }

            // Match or create brand
            $brand = Brand::where('name', $data['brand'])
                ->orWhere('slug', Str::slug($data['brand']))
                ->first();

            if (! $brand) {
                $brand = Brand::create([
                    'name' => $data['brand'],
                    'slug' => Str::slug($data['brand']),
                ]);
            }

            $product = Product::updateOrCreate(
                ['id' => $data['id']],
                [
                    'name' => $data['name'],
                    'slug' => $data['slug'],
                    'brand_id' => $brand->id,
                    'description' => $data['description'] ?? null,
                ]
            );

            // Sync categories on product
            $categoryIds = [$category->id];
            if (! empty($data['concentration'])) {
                $conc = Category::where('name', $data['concentration'])
                    ->orWhere('slug', Str::slug($data['concentration']))
                    ->first();
                if ($conc) {
                    $categoryIds[] = $conc->id;
                }
            }
            $product->categories()->sync($categoryIds);

            // Seed gallery images for the product
            $allImages = array_values(array_unique(array_filter(array_merge(
                [$data['image']],
                $data['gallery'] ?? []
            ))));

            foreach ($allImages as $galleryImg) {
                ProductGallery::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'image' => $galleryImg,
                    ]
                );
            }

            // Seed product reviews
            if (! empty($data['reviews'])) {
                foreach ($data['reviews'] as $rev) {
                    ProductReview::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'name' => $rev['name'],
                        ],
                        [
                            'rating' => $rev['rating'] ?? 5,
                            'comment' => $rev['comment'] ?? '',
                        ]
                    );
                }
            }

            // Seed variants holding prices for every product
            $rawBase = (int) $data['raw_price'];
            $raw100 = (int) (round($rawBase * 1.55 / 50000) * 50000);
            $origPrice = ! empty($data['originalPrice'])
                ? (int) preg_replace('/[^\d]/', '', $data['originalPrice'])
                : null;
            $discountPercent = ! empty($data['discountBadge'])
                ? (int) abs((int) filter_var($data['discountBadge'], FILTER_SANITIZE_NUMBER_INT))
                : null;

            if ($product->id === 3 || $product->id === 4) {
                // Products with ONLY 1 single variant
                ProductVariant::where('product_id', $product->id)
                    ->where('volume', '!=', 50)
                    ->delete();

                ProductVariant::updateOrCreate(
                    ['product_id' => $product->id, 'volume' => 50],
                    [
                        'name' => 'Signature Atelier Produk (50ml)',
                        'price' => $rawBase,
                        'original_price' => $origPrice,
                        'discount_percent' => $discountPercent,
                        'sku' => 'AP-VAR-50-'.$product->id,
                        'stock' => 40,
                    ]
                );
            } else {
                // Products with multiple variants (50ml & 100ml)
                ProductVariant::where('product_id', $product->id)
                    ->whereNotIn('volume', [50, 100])
                    ->delete();

                // Primary 50ml variant matching the product's headline price
                ProductVariant::updateOrCreate(
                    ['product_id' => $product->id, 'volume' => 50],
                    [
                        'name' => 'Signature Atelier Produk (50ml)',
                        'price' => $rawBase,
                        'original_price' => $origPrice,
                        'discount_percent' => $discountPercent,
                        'sku' => 'AP-VAR-50-'.$product->id,
                        'stock' => 40,
                    ]
                );

                // Larger 100ml decanter variant
                ProductVariant::updateOrCreate(
                    ['product_id' => $product->id, 'volume' => 100],
                    [
                        'name' => 'Grand Decanter (100ml)',
                        'price' => $raw100,
                        'original_price' => null,
                        'discount_percent' => null,
                        'sku' => 'AP-VAR-100-'.$product->id,
                        'stock' => 15,
                    ]
                );
            }
        }

        // Clean up any extraneous products beyond the 5 seeded products
        Product::whereNotIn('id', $seededIds)->delete();
    }
}
