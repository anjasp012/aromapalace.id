<?php

use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;

test('guests are redirected from cart page to login', function () {
    $response = $this->get(route('cart.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can view cart page with products', function () {
    $user = User::factory()->create();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)->get(route('cart.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cart')
            ->has('items', 1)
            ->where('items.0.product_id', 1)
            ->where('items.0.quantity', 2)
            ->has('subtotal')
            ->has('total')
        );
});

test('authenticated user can add product to cart', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('cart.store'), [
        'product_id' => 1,
        'quantity' => 2,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('cart_items', [
        'user_id' => $user->id,
        'product_id' => 1,
        'quantity' => 2,
    ]);
});

test('adding the same product increments quantity', function () {
    $user = User::factory()->create();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->post(route('cart.store'), [
        'product_id' => 1,
        'quantity' => 2,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('cart_items', [
        'user_id' => $user->id,
        'product_id' => 1,
        'quantity' => 3,
    ]);
});

test('authenticated user can update item quantity in cart', function () {
    $user = User::factory()->create();

    $item = CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->patch(route('cart.update', ['id' => $item->id]), [
        'quantity' => 5,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('cart_items', [
        'id' => $item->id,
        'quantity' => 5,
    ]);
});

test('authenticated user can delete an item from cart', function () {
    $user = User::factory()->create();

    $item = CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->delete(route('cart.destroy', ['id' => $item->id]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('cart_items', [
        'id' => $item->id,
    ]);
});

test('authenticated user can clear all items in cart', function () {
    $user = User::factory()->create();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'quantity' => 1,
    ]);

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 2,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)->delete(route('cart.clear'));

    $response->assertRedirect();
    $this->assertDatabaseCount('cart_items', 0);
});

test('authenticated user can add a specific product variant to cart', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->where('volume', '100ml')->firstOrFail();

    $response = $this->actingAs($user)->post(route('cart.store'), [
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('cart_items', [
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);
});

test('cart_count is calculated as unique product_id and variant_id count rather than sum of quantities', function () {
    $user = User::factory()->create();
    $variant1 = ProductVariant::where('product_id', 1)->firstOrFail();
    $variant2 = ProductVariant::where('product_id', 1)->where('id', '!=', $variant1->id)->firstOrFail();

    // Add variant 1 with quantity 5
    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant1->id,
        'quantity' => 5,
    ]);

    // Add variant 2 with quantity 3
    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant2->id,
        'quantity' => 3,
    ]);

    $response = $this->actingAs($user)->get(route('cart.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cart')
            ->where('auth.cart_count', 2)
            ->has('items', 2)
        );
});
