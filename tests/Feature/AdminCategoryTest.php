<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;

test('guest cannot access admin category routes and is redirected to login', function () {
    $this->get('/admin/categories')->assertRedirect('/login');
});

test('regular customer receives 403 forbidden when accessing category management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/admin/categories')
        ->assertForbidden();
});

test('admin can view categories index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/categories');

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
        ->post('/admin/categories', [
            'name' => 'Gourmand Delight',
            'slug' => 'gourmand-delight',
            'description' => 'Aroma manis vanila, kopi, dan karamel.',
        ]);

    $response->assertRedirect('/admin/categories');
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
        ->put("/admin/categories/{$category->id}", [
            'name' => 'Updated Category Name',
            'slug' => 'updated-category-name',
            'description' => 'Deskripsi baru.',
        ]);

    $response->assertRedirect('/admin/categories');
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
        ->delete("/admin/categories/{$category->id}");

    $response->assertRedirect('/admin/categories');
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
        ->delete("/admin/categories/{$category->id}");

    $response->assertRedirect('/admin/categories');
    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
    ]);
});
