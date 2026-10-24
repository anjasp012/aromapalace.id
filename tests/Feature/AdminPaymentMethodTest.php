<?php

use App\Models\CartItem;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\ProductVariant;
use App\Models\User;

test('guest cannot access admin payment method routes and is redirected to login', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));

    $this->get("http://{$adminDomain}/manajemen-pembayaran")
        ->assertRedirect("http://{$adminDomain}/login");
});

test('regular customer cannot access payment method management', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get("http://{$adminDomain}/manajemen-pembayaran")
        ->assertRedirect("http://{$adminDomain}/login");
});

test('admin can view payment methods index with metrics', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get("http://{$adminDomain}/manajemen-pembayaran");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/payment-methods/index')
            ->has('paymentMethods.data')
            ->has('metrics.total_methods')
            ->has('metrics.active_methods')
            ->has('metrics.inactive_methods')
        );
});

test('admin can store a new payment method with active status', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post("http://{$adminDomain}/manajemen-pembayaran", [
            'name' => 'Bank Mandiri Virtual Account',
            'code' => 'mandiri_va',
            'icon' => null,
            'is_active' => true,
        ]);

    $response->assertRedirect(route('admin.payment-methods.index'));
    $this->assertDatabaseHas('payment_methods', [
        'name' => 'Bank Mandiri Virtual Account',
        'code' => 'mandiri_va',
        'is_active' => true,
    ]);
});

test('admin can update an existing payment method including is_active', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();
    $pm = PaymentMethod::create([
        'name' => 'BCA KlikPay',
        'code' => 'bca_klikpay',
        'icon' => 'bca',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->put("http://{$adminDomain}/manajemen-pembayaran/{$pm->id}", [
            'name' => 'BCA Virtual Account Updated',
            'code' => 'bca_va_updated',
            'is_active' => false,
        ]);

    $response->assertRedirect(route('admin.payment-methods.index'));
    $this->assertDatabaseHas('payment_methods', [
        'id' => $pm->id,
        'name' => 'BCA Virtual Account Updated',
        'code' => 'bca_va_updated',
        'is_active' => false,
    ]);
});

test('admin can toggle active status of a payment method', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();
    $pm = PaymentMethod::create([
        'name' => 'DANA Gateway',
        'code' => 'dana_test',
        'is_active' => true,
    ]);

    // 1. Toggle to inactive
    $response = $this->actingAs($admin)
        ->patch("http://{$adminDomain}/manajemen-pembayaran/{$pm->id}/toggle");

    $response->assertSessionHas('success');
    expect($pm->fresh()->is_active)->toBeFalse();

    // 2. Toggle back to active
    $this->actingAs($admin)
        ->patch("http://{$adminDomain}/manajemen-pembayaran/{$pm->id}/toggle");

    expect($pm->fresh()->is_active)->toBeTrue();
});

test('customer checkout only displays active payment methods', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $variant = ProductVariant::first();

    if ($variant) {
        CartItem::create([
            'user_id' => $customer->id,
            'product_id' => $variant->product_id,
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);
    }

    $activePm = PaymentMethod::create([
        'name' => 'Active Test Method',
        'code' => 'active_test_method',
        'is_active' => true,
    ]);

    $inactivePm = PaymentMethod::create([
        'name' => 'Inactive Test Method',
        'code' => 'inactive_test_method',
        'is_active' => false,
    ]);

    $response = $this->actingAs($customer)
        ->get(route('checkout.index'));

    $response->assertOk()
        ->assertInertia(function ($page) use ($activePm, $inactivePm) {
            $paymentMethods = collect($page->toArray()['props']['payment_methods']);
            expect($paymentMethods->pluck('code'))->toContain($activePm->code)
                ->and($paymentMethods->pluck('code'))->not->toContain($inactivePm->code);
        });
});

test('customer checkout rejects inactive payment method', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $variant = ProductVariant::first();

    $inactivePm = PaymentMethod::create([
        'name' => 'Disabled Channel',
        'code' => 'disabled_channel',
        'is_active' => false,
    ]);

    $response = $this->actingAs($customer)
        ->post(route('checkout.store'), [
            'delivery_type' => 'pickup',
            'store_id' => null,
            'recipient_name' => 'Jane Doe',
            'recipient_phone' => '081234567890',
            'payment_method' => 'disabled_channel',
            'items' => [
                [
                    'product_id' => $variant ? $variant->product_id : 1,
                    'variant_id' => $variant ? $variant->id : null,
                    'quantity' => 1,
                ],
            ],
        ]);

    $response->assertSessionHasErrors(['payment_method']);
});

test('admin can delete a payment method not used by orders', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();
    $pm = PaymentMethod::create([
        'name' => 'Unused Payment Channel',
        'code' => 'unused_channel',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->delete("http://{$adminDomain}/manajemen-pembayaran/{$pm->id}");

    $response->assertRedirect(route('admin.payment-methods.index'));
    $this->assertDatabaseMissing('payment_methods', [
        'id' => $pm->id,
    ]);
});

test('admin cannot delete a payment method that is in use by orders', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();
    $pm = PaymentMethod::create([
        'name' => 'Protected Payment Channel',
        'code' => 'protected_channel',
        'is_active' => true,
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
        ->delete("http://{$adminDomain}/manajemen-pembayaran/{$pm->id}");

    $response->assertRedirect(route('admin.payment-methods.index'));
    $this->assertDatabaseHas('payment_methods', [
        'id' => $pm->id,
    ]);
});
