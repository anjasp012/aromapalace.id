<?php

use App\Models\User;

test('guest cannot access admin user management and is redirected to login', function () {
    $this->get('/admin/users')->assertRedirect('/login');
});

test('regular customer receives 403 forbidden when accessing admin user management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/admin/users')
        ->assertForbidden();
});

test('admin can view users index with metrics and users list', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)
        ->get('/admin/users');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.data')
            ->has('metrics')
            ->has('filters')
        );
});

test('admin can view user detail page', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)
        ->get("/admin/users/{$customer->id}");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/show')
            ->where('user.id', $customer->id)
            ->has('membership')
            ->has('point_histories')
            ->has('recent_orders')
        );
});

test('admin can update user role', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)
        ->patch("/admin/users/{$customer->id}/role", [
            'role' => 'admin',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $customer->id,
        'role' => 'admin',
    ]);
});

test('admin cannot change their own role', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->patch("/admin/users/{$admin->id}/role", [
            'role' => 'customer',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $admin->id,
        'role' => 'admin',
    ]);
});

test('admin can add points to customer membership', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)
        ->post("/admin/users/{$customer->id}/points/add", [
            'points' => 250,
            'description' => 'Bonus event',
        ]);

    $response->assertRedirect();
    $customer->refresh();
    expect($customer->membership->points)->toBe(350); // 100 welcome bonus + 250
});

test('admin can deduct points from customer membership', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    // First auto-create membership by adding points or joining
    $this->actingAs($admin)
        ->post("/admin/users/{$customer->id}/points/add", [
            'points' => 100,
            'description' => 'Bonus awal',
        ]);

    $response = $this->actingAs($admin)
        ->post("/admin/users/{$customer->id}/points/deduct", [
            'points' => 50,
            'description' => 'Penyesuaian poin',
        ]);

    $response->assertRedirect();
    $customer->refresh();
    expect($customer->membership->points)->toBe(150); // 100 welcome + 100 bonus - 50 = 150
});

test('admin can delete customer user account', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)
        ->delete("/admin/users/{$customer->id}");

    $response->assertRedirect('/admin/users');
    $this->assertDatabaseMissing('users', ['id' => $customer->id]);
});

test('admin cannot delete an admin user account', function () {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->delete("/admin/users/{$otherAdmin->id}");

    $response->assertRedirect();
    $this->assertDatabaseHas('users', ['id' => $otherAdmin->id]);
});
