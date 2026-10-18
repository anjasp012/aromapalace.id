<?php

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
        'message' => 'Akun administrator tidak diizinkan menggunakan fitur wishlist dan keranjang belanja.',
    ]);
});
