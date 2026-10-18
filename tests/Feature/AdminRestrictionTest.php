<?php

use App\Models\Order;
use App\Models\User;

test('admin user cannot access wishlist page and is redirected to admin dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->get(route('wishlist.index'));

    $response->assertRedirect(route('admin.dashboard'));
    $response->assertSessionHas('error');
});

test('admin user cannot toggle wishlist and is redirected to admin dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->post(route('wishlist.toggle'), [
        'product_id' => 1,
    ]);

    $response->assertRedirect(route('admin.dashboard'));
    $this->assertDatabaseMissing('wishlists', [
        'user_id' => $admin->id,
    ]);
});

test('admin user cannot access cart page and is redirected to admin dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->get(route('cart.index'));

    $response->assertRedirect(route('admin.dashboard'));
    $response->assertSessionHas('error');
});

test('admin user cannot add item to cart and is redirected to admin dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->post(route('cart.store'), [
        'product_id' => 1,
        'quantity' => 1,
    ]);

    $response->assertRedirect(route('admin.dashboard'));
    $this->assertDatabaseMissing('cart_items', [
        'user_id' => $admin->id,
    ]);
});

test('admin user cannot access checkout page and is redirected to admin dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->get(route('checkout.index'));

    $response->assertRedirect(route('admin.dashboard'));
    $response->assertSessionHas('error');
});

test('admin user receives 403 forbidden when making json request to cart or wishlist', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->postJson(route('cart.store'), [
        'product_id' => 1,
        'quantity' => 1,
    ]);

    $response->assertForbidden();
    $response->assertJson([
        'message' => 'Akun administrator tidak diizinkan menggunakan fitur customer ini.',
    ]);
});

test('admin user accessing account/orders is redirected to admin orders index', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->get(route('account.orders'));

    $response->assertRedirect(route('admin.orders.index'));
});

test('customer only sees their own orders on account/orders', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    Order::create([
        'order_number' => 'AP-TEST-USER-A',
        'user_id' => $userA->id,
        'recipient_name' => 'User A',
        'recipient_phone' => '0812345678',
        'shipping_address' => 'Alamat A',
        'city' => 'Jakarta',
        'courier' => 'JNE',
        'shipping_cost' => 0,
        'payment_method' => 'bca_va',
        'payment_status' => 'pending',
        'subtotal' => 100000,
        'discount_amount' => 0,
        'total_amount' => 100000,
    ]);

    Order::create([
        'order_number' => 'AP-TEST-USER-B',
        'user_id' => $userB->id,
        'recipient_name' => 'User B',
        'recipient_phone' => '0812345679',
        'shipping_address' => 'Alamat B',
        'city' => 'Surabaya',
        'courier' => 'JNE',
        'shipping_cost' => 0,
        'payment_method' => 'bca_va',
        'payment_status' => 'pending',
        'subtotal' => 200000,
        'discount_amount' => 0,
        'total_amount' => 200000,
    ]);

    $response = $this->actingAs($userA)->get(route('account.orders'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders')
            ->has('orders', 1)
            ->where('orders.0.order_number', 'AP-TEST-USER-A')
        );
});
