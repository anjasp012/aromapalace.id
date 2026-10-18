<?php

use Database\Seeders\StoreSeeder;

beforeEach(function () {
    $this->seed(StoreSeeder::class);
});

test('stores page renders successfully with seeded stores', function () {
    $response = $this->get(route('stores.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stores')
            ->has('stores')
            ->where('stores.0.name', 'Flagship Boutique Senayan City Jakarta')
        );
});

test('stores page filters by search keyword', function () {
    $response = $this->get(route('stores.index', ['search' => 'Surabaya']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stores')
            ->has('stores', 1)
            ->where('stores.0.name', 'Boutique Tunjungan Plaza 5 Surabaya')
            ->where('searchQuery', 'Surabaya')
        );
});

test('stores page filters by city', function () {
    $response = $this->get(route('stores.index', ['city' => 'Jakarta']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stores')
            ->has('stores', 2)
            ->where('selectedCity', 'Jakarta')
        );
});

test('stores page filters by city and search query combined', function () {
    $response = $this->get(route('stores.index', ['city' => 'Jakarta', 'search' => 'Senayan']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stores')
            ->has('stores', 1)
            ->where('stores.0.name', 'Flagship Boutique Senayan City Jakarta')
            ->where('selectedCity', 'Jakarta')
            ->where('searchQuery', 'Senayan')
        );
});

test('stores page returns empty list when search does not match', function () {
    $response = $this->get(route('stores.index', ['search' => 'KotaYangTidakAda']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stores')
            ->has('stores', 0)
            ->where('searchQuery', 'KotaYangTidakAda')
        );
});
