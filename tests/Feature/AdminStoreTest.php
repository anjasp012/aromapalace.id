<?php

use App\Models\Order;
use App\Models\Store;
use App\Models\User;

test('guest cannot access admin store routes and is redirected to login', function () {
    $this->get('/admin/stores')->assertRedirect('/login');
});

test('regular customer receives 403 forbidden when accessing store management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/admin/stores')
        ->assertForbidden();
});

test('admin can view stores index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/stores');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/stores/index')
            ->has('stores.data')
            ->has('metrics.total_stores')
            ->has('metrics.total_pickup_orders')
        );
});

test('admin can store a new store location', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post('/admin/stores', [
            'name' => 'Boutique Kota Kasablanka',
            'description' => 'Kota Kasablanka Mall Lt. 1 Unit 120, Jakarta Selatan',
            'thumbnail' => 'https://example.com/store.jpg',
            'latitude' => -6.2238,
            'longitude' => 106.8431,
            'gmaps_link' => 'https://maps.google.com/?q=-6.2238,106.8431',
        ]);

    $response->assertRedirect('/admin/stores');
    $this->assertDatabaseHas('stores', [
        'name' => 'Boutique Kota Kasablanka',
        'latitude' => -6.2238,
        'longitude' => 106.8431,
    ]);
});

test('admin can update an existing store location', function () {
    $admin = User::factory()->admin()->create();
    $store = Store::factory()->create([
        'name' => 'Old Store Name',
        'latitude' => -6.1,
        'longitude' => 106.8,
    ]);

    $response = $this->actingAs($admin)
        ->put("/admin/stores/{$store->id}", [
            'name' => 'Updated Boutique Plaza Indonesia',
            'description' => 'Plaza Indonesia Level 2, Jakarta Pusat',
            'thumbnail' => 'https://example.com/new.jpg',
            'latitude' => -6.1932,
            'longitude' => 106.8228,
        ]);

    $response->assertRedirect('/admin/stores');
    $this->assertDatabaseHas('stores', [
        'id' => $store->id,
        'name' => 'Updated Boutique Plaza Indonesia',
        'latitude' => -6.1932,
        'longitude' => 106.8228,
    ]);
});

test('admin can delete a store with no orders', function () {
    $admin = User::factory()->admin()->create();
    $store = Store::factory()->create([
        'name' => 'Store To Delete',
    ]);

    $response = $this->actingAs($admin)
        ->delete("/admin/stores/{$store->id}");

    $response->assertRedirect('/admin/stores');
    $this->assertDatabaseMissing('stores', [
        'id' => $store->id,
    ]);
});

test('admin cannot delete a store that has associated pickup orders', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();
    $store = Store::factory()->create([
        'name' => 'Protected Flagship Store',
    ]);

    Order::create([
        'order_number' => 'ORD-TEST-STORE-GUARD',
        'user_id' => $customer->id,
        'delivery_type' => 'pickup',
        'store_id' => $store->id,
        'recipient_name' => 'Jane Doe',
        'recipient_phone' => '08198765432',
        'shipping_address' => 'Ambil di Butik Flagship Senayan',
        'city' => 'Jakarta Pusat',
        'shipping_cost' => 0,
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 1500000,
        'total_amount' => 1500000,
    ]);

    $response = $this->actingAs($admin)
        ->delete("/admin/stores/{$store->id}");

    $response->assertRedirect('/admin/stores');
    $this->assertDatabaseHas('stores', [
        'id' => $store->id,
    ]);
});
