<?php

use App\Models\User;
use App\Models\Voucher;

beforeEach(function () {
    $this->withServerVariables([
        'HTTP_HOST' => config('app.admin_domain', 'admin.aromapalace.id'),
    ]);
});

test('guest cannot access admin voucher routes and is redirected to login', function () {
    $this->get(route('admin.vouchers.index'))->assertRedirect(route('admin.login'));
});

test('regular customer is redirected to login when accessing voucher management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get(route('admin.vouchers.index'))
        ->assertRedirect(route('admin.login'));
});

test('admin can view vouchers index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.vouchers.index'));

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
        ->post(route('admin.vouchers.store'), [
            'code' => 'disc25',
            'name' => 'Diskon 25%',
            'type' => 'percentage',
            'value' => 25,
            'min_order_amount' => 500000,
            'max_discount_amount' => 100000,
            'usage_limit' => 50,
            'is_active' => true,
        ]);

    $response->assertRedirect(route('admin.vouchers.index'));
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
        ->post(route('admin.vouchers.store'), [
            'code' => 'potong50k',
            'name' => 'Potongan 50 Ribu',
            'type' => 'fixed',
            'value' => 50000,
            'min_order_amount' => 200000,
            'is_active' => true,
        ]);

    $response->assertRedirect(route('admin.vouchers.index'));
    $this->assertDatabaseHas('vouchers', [
        'code' => 'POTONG50K',
        'type' => 'fixed',
        'value' => 50000,
    ]);
});

test('admin can store a reward voucher with points required and sync with LoyaltyReward', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.vouchers.store'), [
            'code' => 'rewtest50',
            'name' => 'Voucher Hadiah Poin 50',
            'type' => 'fixed',
            'value' => 50000,
            'voucher_type' => 'reward',
            'points_required' => 250,
            'min_order_amount' => 100000,
            'is_active' => true,
        ]);

    $response->assertRedirect(route('admin.vouchers.index'));
    $this->assertDatabaseHas('vouchers', [
        'code' => 'REWTEST50',
        'voucher_type' => 'reward',
        'points_required' => 250,
    ]);

    $this->assertDatabaseHas('loyalty_rewards', [
        'name' => 'Voucher Hadiah Poin 50',
        'points_required' => 250,
        'reward_value' => 50000,
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
        ->patch(route('admin.vouchers.toggle', $voucher));

    $response->assertRedirect(route('admin.vouchers.index'));
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
        ->delete(route('admin.vouchers.destroy', $voucher));

    $response->assertRedirect(route('admin.vouchers.index'));
    $this->assertDatabaseMissing('vouchers', [
        'id' => $voucher->id,
    ]);
});
