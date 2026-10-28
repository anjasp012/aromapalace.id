<?php

use App\Models\User;

test('home page returns a successful response with database props', function () {
    $response = $this->get(route('home'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('popularProducts')
            ->has('discountedProducts')
            ->has('recommendedProducts')
            ->has('categories')
            ->has('brands')
            ->has('vouchers')
            ->has('articles')
        );
});

test('products page returns a successful response with categories and brands', function () {
    $response = $this->get(route('products.index', ['brand' => 'Aroma Royale']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('products')
            ->has('fragrances')
            ->has('categories')
            ->has('brands')
            ->where('selectedBrand', 'Aroma Royale')
        );
});

test('about page returns a successful response', function () {
    $response = $this->get(route('about'));

    $response->assertOk();
});

test('product detail page returns a successful response with valid slug', function () {
    $response = $this->get(route('products.show', ['slug' => 'oud-imperial-royale']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('product-detail')
            ->has('product')
            ->where('product.slug', 'oud-imperial-royale')
        );
});

test('product detail page returns 404 for non-existent product', function () {
    $response = $this->get(route('products.show', ['slug' => 'non-existent-fragrance-xyz']));

    $response->assertNotFound();
});

test('login page returns a successful response', function () {
    $response = $this->get(route('login'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('login'));
});

test('register page returns a successful response', function () {
    $response = $this->get(route('register'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('register'));
});

test('demo login authenticates the user and redirects', function () {
    $response = $this->post(route('login.post'), [
        'demo' => true,
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertAuthenticated();
});

test('logout invalidates session and redirects', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect(route('home'));
    $this->assertGuest();
});

test('user can register a new account successfully', function () {
    $response = $this->post(route('register.post'), [
        'name' => 'Sultan Wangi',
        'email' => 'sultan@aromapalace.com',
        'password' => 'secret123',
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => 'sultan@aromapalace.com',
    ]);
});
