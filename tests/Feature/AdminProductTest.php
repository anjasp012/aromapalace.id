<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;

beforeEach(function () {
    $this->withServerVariables([
        'HTTP_HOST' => config('app.admin_domain', 'admin.aromapalace.id'),
    ]);
});

test('guest cannot access admin product routes and is redirected to login', function () {
    $this->get(route('admin.products.index'))->assertRedirect(route('admin.login'));
    $this->get(route('admin.products.create'))->assertRedirect(route('admin.login'));
});

test('regular customer receives 403 or redirect to login when accessing product management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get(route('admin.products.index'))
        ->assertRedirect(route('admin.login'));
});

test('admin can view products index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.products.index'));

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
        ->get(route('admin.products.create'));

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
        'description' => '<p>A luxurious oriental fragrance with <strong>warm amber</strong> and smoky vanilla.</p>',
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
        ->post(route('admin.products.store'), $payload);

    $response->assertRedirect(route('admin.products.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('products', [
        'name' => 'Majestic Amber Gold',
        'slug' => 'majestic-amber-gold',
        'brand_id' => $brand->id,
    ]);

    $this->assertDatabaseHas('categories_product', [
        'category_id' => $category->id,
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

test('admin can store a product with multiple variants having the same volume but different names', function () {
    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Chameleon Color Edition',
        'slug' => 'chameleon-color-edition',
        'variants' => [
            [
                'name' => 'Varian Oren (50ml)',
                'volume' => 50,
                'price' => 1250000,
                'stock' => 15,
            ],
            [
                'name' => 'Varian Hijau (50ml)',
                'volume' => 50,
                'price' => 1350000,
                'stock' => 20,
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post(route('admin.products.store'), $payload);

    $response->assertRedirect(route('admin.products.index'))
        ->assertSessionHas('success');

    $product = Product::where('slug', 'chameleon-color-edition')->first();
    expect($product)->not->toBeNull()
        ->and($product->variants()->count())->toBe(2);

    expect($product->variants()->where('name', 'Varian Oren (50ml)')->first()->volume)->toBe(50);
    expect($product->variants()->where('name', 'Varian Hijau (50ml)')->first()->volume)->toBe(50);
});

test('product creation rejects duplicate variant names in the same request', function () {
    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Duplicate Variant Name Test',
        'variants' => [
            [
                'name' => 'Varian Identik (50ml)',
                'volume' => '50ml',
                'price' => 1000000,
                'stock' => 10,
            ],
            [
                'name' => 'Varian Identik (50ml)',
                'volume' => '50ml',
                'price' => 1200000,
                'stock' => 5,
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post(route('admin.products.store'), $payload);

    $response->assertSessionHasErrors(['variants']);
});

test('admin can view product edit page and update product and variants', function () {
    $admin = User::factory()->admin()->create();

    $product = Product::create([
        'name' => 'Royal Saffron Noir',
        'slug' => 'royal-saffron-noir-'.uniqid(),
        'description' => '<p>Original saffron description</p>',
    ]);

    $variant1 = ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Bottled 50ml',
        'volume' => '50ml',
        'price' => 1200000,
        'stock' => 20,
    ]);

    $editResponse = $this->actingAs($admin)
        ->get(route('admin.products.edit', $product));

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
        'description' => '<p>Updated rich saffron notes with <em>floral heart</em>.</p>',
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
        ->put(route('admin.products.update', $product), $updatePayload);

    $response->assertRedirect(route('admin.products.index'))
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
        ->patch(route('admin.products.variants.update-stock', [$product, $variant]), [
            'stock' => 45,
        ]);

    $response->assertRedirect();
    $variant->refresh();

    expect($variant->stock)->toBe(45);
});

test('admin can delete a product and its variants are soft deleted without deleting order history', function () {
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

    // Create an order item referencing this product
    $customer = User::factory()->create();
    $order = Order::create([
        'order_number' => 'AP-TEST-DEL-'.uniqid(),
        'user_id' => $customer->id,
        'recipient_name' => 'Test Recipient',
        'recipient_phone' => '08123456789',
        'address' => 'Jl. Kemang Raya No. 10',
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'selesai',
        'subtotal' => 900000,
        'total_amount' => 900000,
    ]);

    $orderItem = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'product_name' => 'Delete Me Perfume',
        'variant_name' => '50ml',
        'volume' => 50,
        'price' => 900000,
        'quantity' => 1,
        'total_price' => 900000,
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('admin.products.destroy', $product));

    $response->assertRedirect(route('admin.products.index'))
        ->assertSessionHas('success');

    $this->assertSoftDeleted('products', ['id' => $product->id]);
    $this->assertSoftDeleted('product_variants', ['id' => $variant->id]);

    // The order item MUST NOT be deleted - preserving 1 item in the order!
    $this->assertDatabaseHas('order_items', [
        'id' => $orderItem->id,
        'order_id' => $order->id,
        'product_name' => 'Delete Me Perfume',
    ]);
    expect($order->refresh()->items()->count())->toBe(1);
});

test('admin cannot delete product that is part of an active order', function () {
    $admin = User::factory()->admin()->create();

    $product = Product::create([
        'name' => 'Active Perfume',
        'slug' => 'active-perfume-'.uniqid(),
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'name' => '50ml',
        'volume' => '50ml',
        'price' => 500000,
        'stock' => 10,
    ]);

    $customer = User::factory()->create();
    $activeOrder = Order::create([
        'order_number' => 'AP-TEST-ACT-'.uniqid(),
        'user_id' => $customer->id,
        'recipient_name' => 'Active Customer',
        'recipient_phone' => '08123456789',
        'address' => 'Jl. Kemang Raya No. 10',
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 500000,
        'total_amount' => 500000,
    ]);

    OrderItem::create([
        'order_id' => $activeOrder->id,
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'product_name' => 'Active Perfume',
        'variant_name' => '50ml',
        'volume' => 50,
        'price' => 500000,
        'quantity' => 1,
        'total_price' => 500000,
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('admin.products.destroy', $product));

    $response->assertRedirect(route('admin.products.index'))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
});

test('admin can create product with multiple variants sharing the exact same volume if names differ', function () {
    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Rainbow Scent Collection',
        'description' => '<p>Different colored editions, same volume</p>',
        'variants' => [
            [
                'name' => 'Varian Oren',
                'volume' => '50',
                'price' => 450000,
                'stock' => 20,
            ],
            [
                'name' => 'Varian Hijau',
                'volume' => '50',
                'price' => 450000,
                'stock' => 25,
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post(route('admin.products.store'), $payload);

    $response->assertRedirect(route('admin.products.index'))
        ->assertSessionHas('success');

    $product = Product::where('name', 'Rainbow Scent Collection')->first();
    expect($product)->not->toBeNull()
        ->and($product->variants()->count())->toBe(2);

    $vOren = $product->variants()->where('name', 'Varian Oren')->first();
    $vHijau = $product->variants()->where('name', 'Varian Hijau')->first();

    expect($vOren->volume)->toBe(50)
        ->and($vHijau->volume)->toBe(50)
        ->and($vOren->sku)->not->toBe($vHijau->sku);
});

test('admin cannot create product with duplicate variant names', function () {
    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Duplicate Variant Scent',
        'variants' => [
            [
                'name' => 'Varian Oren',
                'volume' => '50',
                'price' => 450000,
                'stock' => 20,
            ],
            [
                'name' => 'Varian Oren',
                'volume' => '100',
                'price' => 850000,
                'stock' => 15,
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post(route('admin.products.store'), $payload);

    $response->assertSessionHasErrors('variants');
});
