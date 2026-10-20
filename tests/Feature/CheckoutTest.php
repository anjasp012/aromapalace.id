<?php

use App\Models\CartItem;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Models\Voucher;

test('guests are redirected from checkout page to login', function () {
    $response = $this->get(route('checkout.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated user with empty cart is redirected to cart page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('checkout.index'));

    $response->assertRedirect(route('cart.index'));
});

test('authenticated user with cart items can view checkout page', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)->get(route('checkout.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('checkout')
            ->has('items', 1)
            ->where('items.0.product_id', 1)
            ->where('items.0.quantity', 2)
            ->has('subtotal')
            ->has('total')
        );
});

test('authenticated user can complete checkout and place order', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)->post(route('checkout.store'), [
        'recipient_name' => 'Dimas Pratama',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Senopati No. 45, Kebayoran Baru',
        'city' => 'Jakarta Selatan',
        'postal_code' => '12190',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'payment_method' => 'bri_va',
        'voucher_code' => 'AROMA40',
        'notes' => 'Tolong bubble wrap tebal',
    ]);

    $order = Order::where('user_id', $user->id)->first();
    expect($order)->not->toBeNull();
    expect($order->recipient_name)->toBe('Dimas Pratama');
    expect($order->payment_method)->toBe('bri_va');
    expect($order->voucher_code)->toBe('AROMA40');
    expect($order->discount_amount)->toBeGreaterThan(0);
    expect($order->items()->count())->toBe(1);

    // Cart should be emptied
    expect($user->cartItems()->count())->toBe(0);

    $response->assertRedirect(route('payment.show', ['order' => $order->order_number]));
});

test('authenticated user can view their payment page', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    $order = Order::create([
        'order_number' => 'AP-TEST-001',
        'user_id' => $user->id,
        'recipient_name' => 'Dimas Pratama',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Senopati No. 45',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'shipping_cost' => 0,
        'payment_method' => 'bca_va',
        'payment_channel' => 'BCA Virtual Account',
        'payment_code' => '8808112345678',
        'payment_status' => 'pending',
        'subtotal' => 2000000,
        'discount_amount' => 0,
        'total_amount' => 2000000,
    ]);

    $order->items()->create([
        'product_id' => 1,
        'variant_id' => $variant->id,
        'product_name' => 'Oud Impérial Royale',
        'variant_name' => $variant->name,
        'volume' => $variant->volume,
        'price' => $variant->price,
        'quantity' => 1,
        'total_price' => $variant->price,
    ]);

    $response = $this->actingAs($user)->get(route('payment.show', ['order' => $order->order_number]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payment')
            ->where('order.order_number', 'AP-TEST-001')
            ->where('order.payment_code', '8808112345678')
            ->has('order.total_amount_formatted')
        );

    // Numeric ID URL redirects to order_number URL
    $numericResponse = $this->actingAs($user)->get(route('payment.show', ['order' => $order->id]));
    $numericResponse->assertRedirect(route('payment.show', ['order' => $order->order_number]));
});

test('authenticated user can view orders page even when they have no orders', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('account.orders'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->has('orders', 0)
        );
});

test('authenticated user can view their order history list on orders page', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    $order = Order::create([
        'order_number' => 'AP-ORDERS-001',
        'user_id' => $user->id,
        'recipient_name' => 'Dimas Pratama',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Senopati No. 45',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'shipping_cost' => 0,
        'payment_method' => 'bca_va',
        'payment_channel' => 'BCA Virtual Account',
        'payment_code' => '8808112345678',
        'payment_status' => 'pending',
        'subtotal' => 2000000,
        'discount_amount' => 0,
        'total_amount' => 2000000,
    ]);

    $order->items()->create([
        'product_id' => 1,
        'variant_id' => $variant->id,
        'product_name' => 'Oud Impérial Royale',
        'variant_name' => $variant->name,
        'volume' => $variant->volume,
        'price' => $variant->price,
        'quantity' => 1,
        'total_price' => $variant->price,
    ]);

    $response = $this->actingAs($user)->get(route('account.orders'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->has('orders', 1)
            ->where('orders.0.order_number', 'AP-ORDERS-001')
            ->where('orders.0.status', 'pending')
        );
});

test('orders page provides tab counts and supports serverside status filtering', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    $order1 = Order::create([
        'order_number' => 'AP-ORDER-PND',
        'user_id' => $user->id,
        'recipient_name' => 'Dimas',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Senopati',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'shipping_cost' => 0,
        'payment_method' => 'bca_va',
        'payment_channel' => 'BCA Virtual Account',
        'payment_code' => '8808112345678',
        'payment_status' => 'pending',
        'status' => 'menunggu_pembayaran',
        'subtotal' => 1000000,
        'discount_amount' => 0,
        'total_amount' => 1000000,
    ]);
    $order1->items()->create([
        'product_id' => 1,
        'variant_id' => $variant->id,
        'product_name' => 'Oud Impérial Royale',
        'variant_name' => $variant->name,
        'volume' => $variant->volume,
        'price' => $variant->price,
        'quantity' => 1,
        'total_price' => $variant->price,
    ]);

    $order2 = Order::create([
        'order_number' => 'AP-ORDER-CNF',
        'user_id' => $user->id,
        'recipient_name' => 'Dimas',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Senopati',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'shipping_cost' => 0,
        'payment_method' => 'bca_va',
        'payment_channel' => 'BCA Virtual Account',
        'payment_code' => '8808112345679',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 1200000,
        'discount_amount' => 0,
        'total_amount' => 1200000,
    ]);
    $order2->items()->create([
        'product_id' => 1,
        'variant_id' => $variant->id,
        'product_name' => 'Oud Impérial Royale',
        'variant_name' => $variant->name,
        'volume' => $variant->volume,
        'price' => $variant->price,
        'quantity' => 1,
        'total_price' => $variant->price,
    ]);

    $order3 = Order::create([
        'order_number' => 'AP-ORDER-PRC',
        'user_id' => $user->id,
        'recipient_name' => 'Dimas',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Senopati',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'shipping_cost' => 0,
        'payment_method' => 'credit_card',
        'payment_channel' => 'Kartu Kredit (Visa/Mastercard)',
        'payment_code' => 'AUTH-12345',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 1500000,
        'discount_amount' => 0,
        'total_amount' => 1500000,
    ]);
    $order3->items()->create([
        'product_id' => 1,
        'variant_id' => $variant->id,
        'product_name' => 'Oud Impérial Royale',
        'variant_name' => $variant->name,
        'volume' => $variant->volume,
        'price' => $variant->price,
        'quantity' => 1,
        'total_price' => $variant->price,
    ]);

    $order4 = Order::create([
        'order_number' => 'AP-ORDER-SHP',
        'user_id' => $user->id,
        'recipient_name' => 'Dimas',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Senopati',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'shipping_cost' => 0,
        'payment_method' => 'credit_card',
        'payment_channel' => 'Kartu Kredit (Visa/Mastercard)',
        'payment_code' => 'AUTH-67890',
        'payment_status' => 'paid',
        'status' => 'dikirim',
        'subtotal' => 2000000,
        'discount_amount' => 0,
        'total_amount' => 2000000,
    ]);
    $order4->items()->create([
        'product_id' => 1,
        'variant_id' => $variant->id,
        'product_name' => 'Oud Impérial Royale',
        'variant_name' => $variant->name,
        'volume' => $variant->volume,
        'price' => $variant->price,
        'quantity' => 1,
        'total_price' => $variant->price,
    ]);

    // Check all tab default
    $responseAll = $this->actingAs($user)->get(route('account.orders'));
    $responseAll->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->where('active_tab', 'all')
            ->where('tab_counts.all', 4)
            ->where('tab_counts.menunggu_pembayaran', 1)
            ->where('tab_counts.diproses', 2)
            ->where('tab_counts.dikirim', 1)
            ->where('tab_counts.selesai', 0)
            ->has('orders', 4)
        );

    // Filter menunggu_pembayaran
    $responseMenungguBayar = $this->actingAs($user)->get(route('account.orders', ['status' => 'menunggu_pembayaran']));
    $responseMenungguBayar->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->where('active_tab', 'menunggu_pembayaran')
            ->has('orders', 1)
            ->where('orders.0.order_number', 'AP-ORDER-PND')
        );

    // Filter diproses
    $responseDiproses = $this->actingAs($user)->get(route('account.orders', ['status' => 'diproses']));
    $responseDiproses->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->where('active_tab', 'diproses')
            ->has('orders', 2)
        );

    // Filter dikirim
    $responseDikirim = $this->actingAs($user)->get(route('account.orders', ['status' => 'dikirim']));
    $responseDikirim->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->where('active_tab', 'dikirim')
            ->has('orders', 1)
            ->where('orders.0.order_number', 'AP-ORDER-SHP')
        );

    // Filter selesai (empty in this scenario)
    $responseSelesai = $this->actingAs($user)->get(route('account.orders', ['status' => 'selesai']));
    $responseSelesai->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->where('active_tab', 'selesai')
            ->has('orders', 0)
        );
});

test('checkout index provides available vouchers with description and terms', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    Voucher::create([
        'code' => 'TESTVOUCHER_SK',
        'name' => 'Diskon Eksklusif Tester',
        'description' => 'Potongan 20% untuk pengujian',
        'terms' => [
            'Berlaku untuk semua item parfum tester',
            'Maksimal potongan Rp 500.000',
        ],
        'type' => 'percentage',
        'value' => 20,
        'min_order_amount' => 500000,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->get(route('checkout.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('checkout')
            ->has('available_vouchers')
            ->where('available_vouchers', fn ($vouchers) => collect($vouchers)->contains(fn ($v) => $v['code'] === 'TESTVOUCHER_SK' &&
                $v['description'] === 'Potongan 20% untuk pengujian' &&
                is_array($v['terms']) &&
                count($v['terms']) === 2
            ))
        );
});

test('checkout links voucher_id and increments used_count when voucher is applied', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 2,
    ]);

    $voucher = Voucher::create([
        'code' => 'LINKTEST50',
        'name' => 'Diskon 50 Ribu',
        'description' => 'Potongan langsung Rp 50.000',
        'terms' => ['Khusus order baru', 'Tidak dapat digabung dengan promo lain'],
        'type' => 'fixed',
        'value' => 50000,
        'min_order_amount' => 100000,
        'usage_limit' => 10,
        'used_count' => 0,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post(route('checkout.store'), [
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567899',
        'shipping_address' => 'Jl. Gatot Subroto No. 12',
        'city' => 'Jakarta Selatan',
        'postal_code' => '12930',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'payment_method' => 'bri_va',
        'voucher_code' => 'LINKTEST50',
    ]);

    $order = Order::where('user_id', $user->id)->first();
    expect($order)->not->toBeNull();
    expect($order->voucher_id)->toBe($voucher->id);
    expect($order->voucher_code)->toBe('LINKTEST50');
    expect($order->discount_amount)->toBe(50000);

    $voucher->refresh();
    expect($voucher->used_count)->toBe(1);

    // Also verify order detail modal in orders history exposes voucher details
    $orderResponse = $this->actingAs($user)->get(route('account.orders'));
    $orderResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->where('orders.0.voucher.name', 'Diskon 50 Ribu')
            ->where('orders.0.voucher.description', 'Potongan langsung Rp 50.000')
            ->has('orders.0.voucher.terms', 2)
        );
});

test('authenticated user can checkout with store pickup option and select a store', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();
    $store = Store::first() ?? Store::create([
        'name' => 'Aroma Palace Flagship Senopati',
        'description' => 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan',
        'latitude' => -6.2297,
        'longitude' => 106.8075,
        'gmaps_link' => 'https://maps.google.com',
    ]);

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->post(route('checkout.store'), [
        'delivery_type' => 'pickup',
        'store_id' => $store->id,
        'recipient_name' => 'Aditya Wijaya',
        'recipient_phone' => '081298765432',
        'payment_method' => 'bri_va',
    ]);

    $order = Order::where('user_id', $user->id)->first();
    expect($order)->not->toBeNull();
    expect($order->delivery_type)->toBe('pickup');
    expect($order->store_id)->toBe($store->id);
    expect($order->store->id)->toBe($store->id);
    expect($order->shipping_cost)->toBe(0);
    expect($order->courier)->toContain('Ambil Mandiri di Butik');
    expect($order->city)->toBe('Ambil di Butik');

    $response->assertRedirect(route('payment.show', ['order' => $order->order_number]));
});

test('checkout rejects cod payment method', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->post(route('checkout.store'), [
        'recipient_name' => 'Dimas Pratama',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Senopati No. 45',
        'city' => 'Jakarta Selatan',
        'payment_method' => 'cod',
    ]);

    $response->assertSessionHasErrors(['payment_method']);
    expect(Order::where('user_id', $user->id)->count())->toBe(0);
});

test('authenticated user can view invoice page of their order', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    $order = Order::create([
        'order_number' => 'AP-INV-TEST-001',
        'user_id' => $user->id,
        'recipient_name' => 'Anjas Putra',
        'recipient_phone' => '089529591732',
        'shipping_address' => 'Klepu, Ceper',
        'city' => 'Kabupaten Klaten',
        'courier' => 'JNE REG',
        'shipping_cost' => 0,
        'payment_method' => 'bri_va',
        'payment_channel' => 'BRI Virtual Account (Pakasir)',
        'payment_code' => '1280012345678',
        'payment_status' => 'pending',
        'status' => 'menunggu_pembayaran',
        'subtotal' => 6800000,
        'discount_amount' => 0,
        'total_amount' => 6800000,
    ]);

    $order->items()->create([
        'product_id' => 1,
        'variant_id' => $variant->id,
        'product_name' => 'MacBook Air M1 8/256GB',
        'variant_name' => 'Space Grey',
        'volume' => '2000 gr',
        'price' => 6800000,
        'quantity' => 1,
        'total_price' => 6800000,
    ]);

    $response = $this->actingAs($user)->get(route('orders.invoice', ['order' => $order->order_number]));
    $response->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('invoice')
        ->where('order.order_number', 'AP-INV-TEST-001')
        ->where('order.recipient_name', 'Anjas Putra')
        ->where('order.is_paid', false)
        ->has('order.items', 1)
    );
});

test('user cannot view invoice of another user order', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $order = Order::create([
        'order_number' => 'AP-INV-OTHER-002',
        'user_id' => $owner->id,
        'recipient_name' => 'Owner',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Owner',
        'city' => 'Jakarta',
        'courier' => 'JNE',
        'shipping_cost' => 0,
        'payment_method' => 'bri_va',
        'payment_channel' => 'BRI VA',
        'payment_code' => '12800000000',
        'payment_status' => 'paid',
        'status' => 'selesai',
        'subtotal' => 100000,
        'discount_amount' => 0,
        'total_amount' => 100000,
    ]);

    $response = $this->actingAs($otherUser)->get(route('orders.invoice', ['order' => $order->order_number]));
    $response->assertNotFound();
});
