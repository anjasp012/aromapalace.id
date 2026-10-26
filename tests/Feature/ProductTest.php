<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Services\CatalogService;

test('seeder seeds exactly 5 products with category_id and brand_id', function () {
    $this->assertDatabaseCount('products', 5);

    $products = Product::with(['categoryRelation', 'brandRelation'])->get();
    expect($products)->toHaveCount(5);

    foreach ($products as $product) {
        expect($product->category_id)->not->toBeNull()
            ->and($product->brand_id)->not->toBeNull()
            ->and($product->categoryRelation)->toBeInstanceOf(Category::class)
            ->and($product->brandRelation)->toBeInstanceOf(Brand::class);
    }
});

test('catalog service includes category_id and brand_id in formatted products', function () {
    $firstProduct = CatalogService::find(1);
    $model = Product::findOrFail(1);

    expect($firstProduct)->not->toBeNull()
        ->and($firstProduct['category_id'])->toBe($model->category_id)
        ->and($firstProduct['brand_id'])->toBe($model->brand_id);
});

test('products page filters by brand on the server', function () {
    $response = $this->get(route('products.index', ['brand' => 'Aroma Royale']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->has('fragrances', 1)
            ->where('fragrances.0.brand', 'Aroma Royale')
            ->where('selectedBrand', 'Aroma Royale')
        );
});

test('products page filters by search query on the server', function () {
    $response = $this->get(route('products.index', ['search' => 'Oud Impérial']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->has('fragrances', 1)
            ->where('fragrances.0.name', 'Oud Impérial Royale')
        );
});

test('products page filters by price tier on the server', function () {
    // Under 1.500.000 (none of the 5 luxury perfumes is under 1.5jt)
    $response = $this->get(route('products.index', ['price' => 'under-1500']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->has('fragrances', 0)
        );

    // 1.5jt - 2.5jt
    $response2 = $this->get(route('products.index', ['price' => '1500-2500']));
    $response2->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->has('fragrances', 5)
        );
});

test('products page sorts products on the server', function () {
    $response = $this->get(route('products.index', ['sort' => 'price-desc']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->where('fragrances.0.name', 'Oud Impérial Royale') // Most expensive at 2.450.000
        );

    $responseAsc = $this->get(route('products.index', ['sort' => 'price-asc']));
    $responseAsc->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->where('fragrances.0.name', 'Cédrat de Capri') // Cheapest at 1.750.000
        );
});

test('products page filters by discount on the server', function () {
    $response = $this->get(route('products.index', ['discount' => '1']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->has('fragrances', 2)
            ->where('filters.onlyDiscount', true)
            ->where('fragrances.0.discountBadge', '-15%')
            ->where('fragrances.1.discountBadge', '-10%')
        );
});

test('products page filters by category slug on the server', function () {
    $response = $this->get(route('products.index', ['category' => 'parfum-pria']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->has('fragrances', 1)
            ->where('fragrances.0.category', 'Parfum Pria')
            ->where('selectedCategory', 'Parfum Pria')
            ->where('filters.activeCategory', 'Parfum Pria')
            ->where('filters.searchQuery', '')
        );
});

test('products page filters by brand slug on the server', function () {
    $response = $this->get(route('products.index', ['brand' => 'aroma-royale']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->has('fragrances', 1)
            ->where('fragrances.0.brand', 'Aroma Royale')
            ->where('selectedBrand', 'Aroma Royale')
            ->where('filters.activeBrand', 'Aroma Royale')
            ->where('filters.searchQuery', '')
        );
});
