<?php

use App\Models\Brand;
use App\Models\Product;
use App\Models\User;

beforeEach(function () {
    $this->withServerVariables([
        'HTTP_HOST' => config('app.admin_domain', 'admin.aromapalace.id'),
    ]);
});

test('guest cannot access admin brand routes and is redirected to login', function () {
    $this->get(route('admin.brands.index'))->assertRedirect(route('admin.login'));
});

test('regular customer receives 403 or redirect when accessing brand management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get(route('admin.brands.index'))
        ->assertRedirect(route('admin.login'));
});

test('admin can view brands index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.brands.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/brands/index')
            ->has('brands.data')
            ->has('metrics')
        );
});

test('admin can store a new brand', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.brands.store'), [
            'name' => 'Xerjoff Atelier',
            'slug' => 'xerjoff-atelier',
            'thumbnail' => 'https://example.com/logo.jpg',
            'description' => 'Rumah parfum mewah asal Italia.',
        ]);

    $response->assertRedirect(route('admin.brands.index'));
    $this->assertDatabaseHas('brands', [
        'name' => 'Xerjoff Atelier',
        'slug' => 'xerjoff-atelier',
    ]);
});

test('admin can update an existing brand', function () {
    $admin = User::factory()->admin()->create();
    $brand = Brand::create([
        'name' => 'Old Brand Name',
        'slug' => 'old-brand-name',
    ]);

    $response = $this->actingAs($admin)
        ->put(route('admin.brands.update', $brand), [
            'name' => 'Updated Brand Name',
            'slug' => 'updated-brand-name',
            'thumbnail' => 'https://example.com/updated.jpg',
            'description' => 'Deskripsi brand baru.',
        ]);

    $response->assertRedirect(route('admin.brands.index'));
    $this->assertDatabaseHas('brands', [
        'id' => $brand->id,
        'name' => 'Updated Brand Name',
        'slug' => 'updated-brand-name',
    ]);
});

test('admin can delete an empty brand', function () {
    $admin = User::factory()->admin()->create();
    $brand = Brand::create([
        'name' => 'Brand To Be Deleted',
        'slug' => 'brand-to-be-deleted',
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('admin.brands.destroy', $brand));

    $response->assertRedirect(route('admin.brands.index'));
    $this->assertDatabaseMissing('brands', [
        'id' => $brand->id,
    ]);
});

test('admin cannot delete a brand that still has products', function () {
    $admin = User::factory()->admin()->create();
    $brand = Brand::create([
        'name' => 'Brand With Product',
        'slug' => 'brand-with-product',
    ]);

    Product::create([
        'name' => 'Test Perfume Brand Guard',
        'slug' => 'test-perfume-brand-guard',
        'brand_id' => $brand->id,
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('admin.brands.destroy', $brand));

    $response->assertRedirect(route('admin.brands.index'))
        ->assertSessionHas('error');
    $this->assertDatabaseHas('brands', [
        'id' => $brand->id,
    ]);
});
