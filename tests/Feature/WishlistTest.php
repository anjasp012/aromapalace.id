<?php

use App\Models\User;
use App\Models\Wishlist;

test('guests are redirected from wishlist page to login', function () {
    $response = $this->get(route('wishlist.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can view wishlist page', function () {
    $user = User::factory()->create();

    Wishlist::create([
        'user_id' => $user->id,
        'product_id' => 1,
    ]);

    $response = $this->actingAs($user)->get(route('wishlist.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('wishlist')
            ->has('items', 1)
            ->where('items.0.product_id', 1)
        );
});

test('authenticated user can toggle a product into wishlist', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('wishlist.toggle'), [
        'product_id' => 1,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('wishlists', [
        'user_id' => $user->id,
        'product_id' => 1,
    ]);
});

test('toggling an already wishlisted product removes it', function () {
    $user = User::factory()->create();

    Wishlist::create([
        'user_id' => $user->id,
        'product_id' => 1,
    ]);

    $response = $this->actingAs($user)->post(route('wishlist.toggle'), [
        'product_id' => 1,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseMissing('wishlists', [
        'user_id' => $user->id,
        'product_id' => 1,
    ]);
});

test('authenticated user can destroy a wishlist item', function () {
    $user = User::factory()->create();

    Wishlist::create([
        'user_id' => $user->id,
        'product_id' => 2,
    ]);

    $response = $this->actingAs($user)->delete(route('wishlist.destroy', ['productId' => 2]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('wishlists', [
        'user_id' => $user->id,
        'product_id' => 2,
    ]);
});
