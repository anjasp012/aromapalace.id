<?php

use App\Models\Brand;
use App\Models\Product;
use App\Models\SearchHistory;
use App\Models\User;

test('search suggestions returns products and brands matching query', function () {
    $brand = Brand::first() ?? Brand::create([
        'name' => 'Royal Oud Perfumes',
        'slug' => 'royal-oud-perfumes',
    ]);

    $product = Product::first() ?? Product::create([
        'name' => 'Royal Amber Dubai',
        'slug' => 'royal-amber-dubai',
        'brand_id' => $brand->id,
    ]);

    $response = $this->getJson(route('search.suggestions', ['q' => substr($product->name, 0, 5)]));

    $response->assertOk()
        ->assertJsonStructure([
            'products',
            'brands',
        ]);
});

test('search suggestions returns empty arrays for empty query', function () {
    $response = $this->getJson(route('search.suggestions', ['q' => '']));

    $response->assertOk()
        ->assertExactJson([
            'products' => [],
            'brands' => [],
        ]);
});

test('authenticated user can store search query in search_histories database', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('search.history.store'), [
        'query' => 'Maison Francis Kurkdjian',
    ]);

    $response->assertOk();

    $this->assertDatabaseHas('search_histories', [
        'user_id' => $user->id,
        'query' => 'Maison Francis Kurkdjian',
    ]);
});

test('guest search history from browser can be synced to database upon login', function () {
    $user = User::factory()->create();

    $guestSearches = ['Dubai Oud', 'Baccarat Rouge', 'Rose Vanilla'];

    $response = $this->actingAs($user)->postJson(route('search.history.sync'), [
        'queries' => $guestSearches,
    ]);

    $response->assertOk()
        ->assertJsonFragment([
            'history' => array_reverse($guestSearches),
        ]);

    foreach ($guestSearches as $term) {
        $this->assertDatabaseHas('search_histories', [
            'user_id' => $user->id,
            'query' => $term,
        ]);
    }
});

test('authenticated user can delete single search history item and clear all search histories', function () {
    $user = User::factory()->create();

    SearchHistory::create(['user_id' => $user->id, 'query' => 'Oud Wood']);
    SearchHistory::create(['user_id' => $user->id, 'query' => 'Jazz Club']);

    // Delete single
    $response = $this->actingAs($user)->deleteJson(route('search.history.destroy'), [
        'query' => 'Oud Wood',
    ]);

    $response->assertOk();
    $this->assertDatabaseMissing('search_histories', [
        'user_id' => $user->id,
        'query' => 'Oud Wood',
    ]);
    $this->assertDatabaseHas('search_histories', [
        'user_id' => $user->id,
        'query' => 'Jazz Club',
    ]);

    // Clear all
    $response = $this->actingAs($user)->deleteJson(route('search.history.destroy'), [
        'all' => true,
    ]);

    $response->assertOk();
    $this->assertDatabaseMissing('search_histories', [
        'user_id' => $user->id,
        'query' => 'Jazz Club',
    ]);
});
