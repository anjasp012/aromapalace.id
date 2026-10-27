<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;

beforeEach(function () {
    $this->withServerVariables([
        'HTTP_HOST' => config('app.admin_domain', 'admin.aromapalace.id'),
    ]);
});

test('guest cannot access admin category routes and is redirected to login', function () {
    $this->get(route('admin.categories.index'))->assertRedirect(route('admin.login'));
});

test('regular customer receives 403 or redirect when accessing category management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get(route('admin.categories.index'))
        ->assertRedirect(route('admin.login'));
});

test('admin can view categories index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.categories.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/categories/index')
            ->has('categories.data')
            ->has('metrics')
        );
});

test('admin can store a new category', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.categories.store'), [
            'name' => 'Gourmand Delight',
            'slug' => 'gourmand-delight',
            'description' => 'Aroma manis vanila, kopi, dan karamel.',
        ]);

    $response->assertRedirect(route('admin.categories.index'));
    $this->assertDatabaseHas('categories', [
        'name' => 'Gourmand Delight',
        'slug' => 'gourmand-delight',
    ]);
});

test('admin can update an existing category', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::create([
        'name' => 'Old Category Name',
        'slug' => 'old-category-name',
    ]);

    $response = $this->actingAs($admin)
        ->put(route('admin.categories.update', $category), [
            'name' => 'Updated Category Name',
            'slug' => 'updated-category-name',
            'description' => 'Deskripsi baru.',
        ]);

    $response->assertRedirect(route('admin.categories.index'));
    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
        'name' => 'Updated Category Name',
        'slug' => 'updated-category-name',
    ]);
});

test('admin can delete an empty category', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::create([
        'name' => 'To Be Deleted',
        'slug' => 'to-be-deleted',
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('admin.categories.destroy', $category));

    $response->assertRedirect(route('admin.categories.index'));
    $this->assertDatabaseMissing('categories', [
        'id' => $category->id,
    ]);
});

test('admin cannot delete a category that still has products', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::create([
        'name' => 'Category With Product',
        'slug' => 'category-with-product',
    ]);

    Product::create([
        'name' => 'Test Perfume',
        'slug' => 'test-perfume-cat-guard',
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('admin.categories.destroy', $category));

    $response->assertRedirect(route('admin.categories.index'))
        ->assertSessionHas('error');
    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
    ]);
});
