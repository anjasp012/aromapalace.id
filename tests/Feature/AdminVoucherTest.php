<?php

use App\Models\User;
use App\Models\Voucher;

test('guest cannot access admin voucher routes and is redirected to login', function () {
    $this->get('/admin/vouchers')->assertRedirect('/login');
});

test('regular customer receives 403 forbidden when accessing voucher management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/admin/vouchers')
        ->assertForbidden();
});

test('admin can view vouchers index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/vouchers');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/vouchers/index')
            ->has('vouchers.data')
            ->has('metrics')
        );
});

test('admin can store a percentage voucher', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post('/admin/vouchers', [
            'code' => 'disc25',
            'name' => 'Diskon 25%',
            'type' => 'percentage',
            'value' => 25,
            'min_order_amount' => 500000,
            'max_discount_amount' => 100000,
            'usage_limit' => 50,
            'is_active' => true,
        ]);

    $response->assertRedirect('/admin/vouchers');
    $this->assertDatabaseHas('vouchers', [
        'code' => 'DISC25',
        'name' => 'Diskon 25%',
        'type' => 'percentage',
        'value' => 25,
    ]);
});

test('admin can store a fixed voucher', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post('/admin/vouchers', [
            'code' => 'potong50k',
            'name' => 'Potongan 50 Ribu',
            'type' => 'fixed',
            'value' => 50000,
            'min_order_amount' => 200000,
            'is_active' => true,
        ]);

    $response->assertRedirect('/admin/vouchers');
    $this->assertDatabaseHas('vouchers', [
        'code' => 'POTONG50K',
        'type' => 'fixed',
        'value' => 50000,
    ]);
});

test('admin can toggle voucher active status', function () {
    $admin = User::factory()->admin()->create();
    $voucher = Voucher::create([
        'code' => 'TOGGLEME',
        'name' => 'Toggle Me',
        'type' => 'percentage',
        'value' => 10,
        'min_order_amount' => 0,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->patch("/admin/vouchers/{$voucher->id}/toggle");

    $response->assertRedirect('/admin/vouchers');
    $this->assertDatabaseHas('vouchers', [
        'id' => $voucher->id,
        'is_active' => false,
    ]);
});

test('admin can delete a voucher', function () {
    $admin = User::factory()->admin()->create();
    $voucher = Voucher::create([
        'code' => 'DELETEME',
        'name' => 'Delete Me',
        'type' => 'fixed',
        'value' => 10000,
        'min_order_amount' => 0,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->delete("/admin/vouchers/{$voucher->id}");

    $response->assertRedirect('/admin/vouchers');
    $this->assertDatabaseMissing('vouchers', [
        'id' => $voucher->id,
    ]);
});
