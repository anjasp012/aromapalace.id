<?php

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\User;

test('guest cannot access admin payment method routes and is redirected to login', function () {
    $this->get('/admin/payment-methods')->assertRedirect('/login');
});

test('regular customer receives 403 forbidden when accessing payment method management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/admin/payment-methods')
        ->assertForbidden();
});

test('admin can view payment methods index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/payment-methods');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/payment-methods/index')
            ->has('paymentMethods.data')
            ->has('metrics.total_methods')
        );
});

test('admin can store a new payment method', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post('/admin/payment-methods', [
            'name' => 'Bank Mandiri Virtual Account',
            'code' => 'mandiri_va',
            'icon' => 'mandiri',
        ]);

    $response->assertRedirect('/admin/payment-methods');
    $this->assertDatabaseHas('payment_methods', [
        'name' => 'Bank Mandiri Virtual Account',
        'code' => 'mandiri_va',
        'icon' => 'mandiri',
    ]);
});

test('admin can update an existing payment method', function () {
    $admin = User::factory()->admin()->create();
    $pm = PaymentMethod::create([
        'name' => 'BCA KlikPay',
        'code' => 'bca_klikpay',
        'icon' => 'bca',
    ]);

    $response = $this->actingAs($admin)
        ->put("/admin/payment-methods/{$pm->id}", [
            'name' => 'BCA Virtual Account Updated',
            'code' => 'bca_va_updated',
            'icon' => 'https://example.com/bca.png',
        ]);

    $response->assertRedirect('/admin/payment-methods');
    $this->assertDatabaseHas('payment_methods', [
        'id' => $pm->id,
        'name' => 'BCA Virtual Account Updated',
        'code' => 'bca_va_updated',
    ]);
});

test('admin can delete a payment method not used by orders', function () {
    $admin = User::factory()->admin()->create();
    $pm = PaymentMethod::create([
        'name' => 'Unused Payment Channel',
        'code' => 'unused_channel',
    ]);

    $response = $this->actingAs($admin)
        ->delete("/admin/payment-methods/{$pm->id}");

    $response->assertRedirect('/admin/payment-methods');
    $this->assertDatabaseMissing('payment_methods', [
        'id' => $pm->id,
    ]);
});

test('admin cannot delete a payment method that is in use by orders', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();
    $pm = PaymentMethod::create([
        'name' => 'Protected Payment Channel',
        'code' => 'protected_channel',
    ]);

    Order::create([
        'order_number' => 'ORD-TEST-PM-GUARD',
        'user_id' => $customer->id,
        'delivery_type' => 'shipping',
        'recipient_name' => 'John Doe',
        'recipient_phone' => '08123456789',
        'shipping_address' => 'Jl. Mawar No. 12',
        'city' => 'Jakarta',
        'courier' => 'JNE Express',
        'payment_method' => 'protected_channel',
        'payment_status' => 'pending',
        'status' => 'pending',
        'subtotal' => 500000,
        'total_amount' => 500000,
    ]);

    $response = $this->actingAs($admin)
        ->delete("/admin/payment-methods/{$pm->id}");

    $response->assertRedirect('/admin/payment-methods');
    $this->assertDatabaseHas('payment_methods', [
        'id' => $pm->id,
    ]);
});
