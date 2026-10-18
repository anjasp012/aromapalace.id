<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;

test('guest cannot access admin product routes and is redirected to login', function () {
    $this->get('/admin/products')->assertRedirect('/login');
    $this->get('/admin/products/create')->assertRedirect('/login');
});

test('regular customer receives 403 forbidden when accessing product management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/admin/products')
        ->assertForbidden();
});

test('admin can view products index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/products');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/products/index')
            ->has('products.data')
            ->has('categories')
            ->has('brands')
            ->has('metrics')
        );
});

test('admin can view product create page', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/products/create');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/products/create')
            ->has('categories')
            ->has('brands')
        );
});

test('admin can store a new product with multiple variants and galleries', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::firstOrCreate(['slug' => 'niche-luxury'], ['name' => 'Niche Luxury']);
    $brand = Brand::firstOrCreate(['slug' => 'royal-oud'], ['name' => 'Royal Oud']);

    $payload = [
        'name' => 'Majestic Amber Gold',
        'slug' => 'majestic-amber-gold',
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'description' => 'A luxurious oriental fragrance with warm amber and smoky vanilla.',
        'images' => [
            'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
        ],
        'variants' => [
            [
                'name' => 'Travel Edition (50ml)',
                'volume' => '50ml',
                'price' => 1500000,
                'original_price' => 1800000,
                'discount_percent' => 17,
                'sku' => 'MAG-50',
                'stock' => 30,
            ],
            [
                'name' => 'Grand Bottle (100ml)',
                'volume' => '100ml',
                'price' => 2600000,
                'original_price' => null,
                'discount_percent' => null,
                'sku' => 'MAG-100',
                'stock' => 15,
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post('/admin/products', $payload);

    $response->assertRedirect('/admin/products')
        ->assertSessionHas('success');

    $this->assertDatabaseHas('products', [
        'name' => 'Majestic Amber Gold',
        'slug' => 'majestic-amber-gold',
        'category_id' => $category->id,
        'brand_id' => $brand->id,
    ]);

    $product = Product::where('slug', 'majestic-amber-gold')->first();
    expect($product)->not->toBeNull()
        ->and($product->variants()->count())->toBe(2)
        ->and($product->galleries()->count())->toBe(1);

    $this->assertDatabaseHas('product_variants', [
        'product_id' => $product->id,
        'volume' => '50ml',
        'price' => 1500000,
        'stock' => 30,
    ]);

    $this->assertDatabaseHas('product_variants', [
        'product_id' => $product->id,
        'volume' => '100ml',
        'price' => 2600000,
        'stock' => 15,
    ]);
});

test('product creation rejects duplicate volumes in the same request', function () {
    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Duplicate Volume Test',
        'variants' => [
            [
                'name' => 'Variant 1 (50ml)',
                'volume' => '50ml',
                'price' => 1000000,
                'stock' => 10,
            ],
            [
                'name' => 'Variant 2 (50ml)',
                'volume' => '50ml',
                'price' => 1200000,
                'stock' => 5,
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post('/admin/products', $payload);

    $response->assertSessionHasErrors(['variants']);
});

test('admin can view product edit page and update product and variants', function () {
    $admin = User::factory()->admin()->create();

    $product = Product::create([
        'name' => 'Royal Saffron Noir',
        'slug' => 'royal-saffron-noir-'.uniqid(),
        'description' => 'Original saffron description',
    ]);

    $variant1 = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Bottled 50ml',
        'volume' => '50ml',
        'price' => 1200000,
        'stock' => 20,
    ]);

    $editResponse = $this->actingAs($admin)
        ->get("/admin/products/{$product->id}/edit");

    $editResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/products/edit')
            ->where('product.name', 'Royal Saffron Noir')
            ->has('product.variants', 1)
        );

    // Update product and add new 100ml variant, updating 50ml price
    $updatePayload = [
        'name' => 'Royal Saffron Noir Intense',
        'slug' => $product->slug,
        'description' => 'Updated rich saffron notes',
        'variants' => [
            [
                'id' => $variant1->id,
                'name' => 'Bottled 50ml Updated',
                'volume' => '50ml',
                'price' => 1350000,
                'stock' => 25,
            ],
            [
                'name' => 'Grand 100ml',
                'volume' => '100ml',
                'price' => 2400000,
                'stock' => 10,
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->put("/admin/products/{$product->id}", $updatePayload);

    $response->assertRedirect('/admin/products')
        ->assertSessionHas('success');

    $product->refresh();
    expect($product->name)->toBe('Royal Saffron Noir Intense')
        ->and($product->variants()->count())->toBe(2);

    $variant1->refresh();
    expect($variant1->name)->toBe('Bottled 50ml Updated')
        ->and($variant1->price)->toBe(1350000)
        ->and($variant1->stock)->toBe(25);
});

test('admin can quickly update a variant stock via patch endpoint', function () {
    $admin = User::factory()->admin()->create();

    $product = Product::create([
        'name' => 'Stock Quick Test',
        'slug' => 'stock-quick-test-'.uniqid(),
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => '50ml',
        'volume' => '50ml',
        'price' => 500000,
        'stock' => 5,
    ]);

    $response = $this->actingAs($admin)
        ->patch("/admin/products/{$product->id}/variants/{$variant->id}/stock", [
            'stock' => 45,
        ]);

    $response->assertRedirect();
    $variant->refresh();

    expect($variant->stock)->toBe(45);
});

test('admin can delete a product and its variants are cascaded', function () {
    $admin = User::factory()->admin()->create();

    $product = Product::create([
        'name' => 'Delete Me Perfume',
        'slug' => 'delete-me-perfume-'.uniqid(),
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => '50ml',
        'volume' => '50ml',
        'price' => 900000,
        'stock' => 10,
    ]);

    $response = $this->actingAs($admin)
        ->delete("/admin/products/{$product->id}");

    $response->assertRedirect('/admin/products')
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('products', ['id' => $product->id]);
    $this->assertDatabaseMissing('product_variants', ['id' => $variant->id]);
});
