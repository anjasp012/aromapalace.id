<?php

use App\Models\Order;
use App\Models\User;

beforeEach(function () {
    $this->withServerVariables([
        'HTTP_HOST' => config('app.admin_domain', 'admin.aromapalace.id'),
    ]);
});

test('guest cannot access admin user management and is redirected to login', function () {
    $this->get(route('admin.users.index'))->assertRedirect(route('admin.login'));
});

test('regular customer receives 403 or redirect when accessing admin user management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get(route('admin.users.index'))
        ->assertRedirect(route('admin.login'));
});

test('admin can view users index with metrics and users list', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)
        ->get(route('admin.users.index'));

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
        ->get(route('admin.users.show', $customer));

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
        ->patch(route('admin.users.update-role', $customer), [
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
        ->patch(route('admin.users.update-role', $admin), [
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
        ->post(route('admin.users.points.add', $customer), [
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
        ->post(route('admin.users.points.add', $customer), [
            'points' => 100,
            'description' => 'Bonus awal',
        ]);

    $response = $this->actingAs($admin)
        ->post(route('admin.users.points.deduct', $customer), [
            'points' => 50,
            'description' => 'Penyesuaian poin',
        ]);

    $response->assertRedirect();
    $customer->refresh();
    expect($customer->membership->points)->toBe(150); // 100 welcome + 100 bonus - 50 = 150
});

test('admin can delete customer user account with soft delete', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $customer));

    $response->assertRedirect(route('admin.users.index'));
    $this->assertSoftDeleted('users', ['id' => $customer->id]);
});

test('admin cannot delete customer with active order', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create(['role' => 'customer']);

    Order::create([
        'order_number' => 'AP-ACTIVE-'.uniqid(),
        'user_id' => $customer->id,
        'recipient_name' => 'Active Customer',
        'recipient_phone' => '08123456789',
        'address' => 'Jl. Sudirman No. 1',
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 500000,
        'total_amount' => 500000,
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $customer));

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $customer->id,
        'deleted_at' => null,
    ]);
});

test('admin cannot delete an admin user account', function () {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $otherAdmin));

    $response->assertRedirect();
    $this->assertDatabaseHas('users', ['id' => $otherAdmin->id]);
});

test('admin can create a new user account', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Citra Lestari',
            'email' => 'citra@example.com',
            'role' => 'customer',
            'password' => 'secret123',
        ]);

    $response->assertRedirect(route('admin.users.index'));
    $this->assertDatabaseHas('users', [
        'name' => 'Citra Lestari',
        'email' => 'citra@example.com',
        'role' => 'customer',
    ]);

    $newUser = User::where('email', 'citra@example.com')->first();
    expect($newUser)->not->toBeNull()
        ->and($newUser->membership)->not->toBeNull();
});

test('admin can update user account details', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
        'role' => 'customer',
    ]);

    $response = $this->actingAs($admin)
        ->put(route('admin.users.update', $customer), [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'role' => 'customer',
        ]);

    $response->assertRedirect(route('admin.users.index'));
    $this->assertDatabaseHas('users', [
        'id' => $customer->id,
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
    ]);
});
