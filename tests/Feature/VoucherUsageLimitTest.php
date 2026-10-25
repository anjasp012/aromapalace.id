<?php

use App\Models\CartItem;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Voucher;

test('voucher hasBeenUsedBy returns false when user has never used it', function () {
    $user = User::factory()->create();
    $voucher = Voucher::factory()->create([
        'code' => 'PROMOONCE1',
        'value' => 20,
    ]);

    expect($voucher->hasBeenUsedBy($user))->toBeFalse();
    expect($voucher->isValidFor(1000000, $user))->toBeTrue();
    expect($voucher->calculateDiscount(1000000, $user))->toBe(200000);
});

test('voucher hasBeenUsedBy returns true when user has an active or completed order with that voucher', function () {
    $user = User::factory()->create();
    $voucher = Voucher::factory()->create([
        'code' => 'PROMOONCE2',
        'value' => 20,
    ]);

    Order::create([
        'order_number' => 'ARPL-TEST-'.uniqid(),
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'John Doe',
        'recipient_phone' => '081234567890',
        'address' => 'Jl. Kebon Jeruk No. 10',
        'city' => 'Jakarta Barat',
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 1000000,
        'discount_amount' => 200000,
        'voucher_id' => $voucher->id,
        'voucher_code' => $voucher->code,
        'total_amount' => 800000,
    ]);

    expect($voucher->hasBeenUsedBy($user))->toBeTrue();
    expect($voucher->isValidFor(1000000, $user))->toBeFalse();
    expect($voucher->calculateDiscount(1000000, $user))->toBe(0);
});

test('voucher is available again if user previous order was cancelled', function () {
    $user = User::factory()->create();
    $voucher = Voucher::factory()->create([
        'code' => 'PROMOONCE3',
        'value' => 20,
    ]);

    Order::create([
        'order_number' => 'ARPL-TEST-'.uniqid(),
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'John Doe',
        'recipient_phone' => '081234567890',
        'address' => 'Jl. Kebon Jeruk No. 10',
        'city' => 'Jakarta Barat',
        'payment_method' => 'qris',
        'payment_status' => 'canceled',
        'status' => 'dibatalkan',
        'subtotal' => 1000000,
        'discount_amount' => 200000,
        'voucher_id' => $voucher->id,
        'voucher_code' => $voucher->code,
        'total_amount' => 800000,
    ]);

    expect($voucher->hasBeenUsedBy($user))->toBeFalse();
    expect($voucher->isValidFor(1000000, $user))->toBeTrue();
    expect($voucher->calculateDiscount(1000000, $user))->toBe(200000);
});

test('different user can still use the same voucher', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $voucher = Voucher::factory()->create([
        'code' => 'PROMOONCE4',
        'value' => 20,
    ]);

    Order::create([
        'order_number' => 'ARPL-TEST-'.uniqid(),
        'user_id' => $user1->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'User 1',
        'recipient_phone' => '081234567891',
        'address' => 'Alamat 1',
        'city' => 'Jakarta',
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 1000000,
        'discount_amount' => 200000,
        'voucher_id' => $voucher->id,
        'voucher_code' => $voucher->code,
        'total_amount' => 800000,
    ]);

    expect($voucher->hasBeenUsedBy($user1))->toBeTrue();
    expect($voucher->hasBeenUsedBy($user2))->toBeFalse();
    expect($voucher->isValidFor(1000000, $user2))->toBeTrue();
});

test('cart applyVoucher rejects voucher if user has already used it', function () {
    $user = User::factory()->create();
    $voucher = Voucher::factory()->create([
        'code' => 'PROMOONCE5',
        'value' => 20,
    ]);

    Order::create([
        'order_number' => 'ARPL-TEST-'.uniqid(),
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'User Test',
        'recipient_phone' => '081234567890',
        'address' => 'Alamat Test',
        'city' => 'Jakarta',
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 1000000,
        'discount_amount' => 200000,
        'voucher_id' => $voucher->id,
        'voucher_code' => $voucher->code,
        'total_amount' => 800000,
    ]);

    $response = $this->actingAs($user)->post(route('cart.voucher.apply'), [
        'code' => $voucher->code,
    ]);

    $response->assertSessionHas('error');
    $response->assertSessionMissing('applied_voucher');
});

test('available vouchers on checkout excludes already used voucher for that user', function () {
    $user = User::factory()->create();
    $voucher = Voucher::factory()->create([
        'code' => 'PROMOEXCLUDE',
        'name' => 'Exclusive Once Voucher',
        'value' => 20,
    ]);

    $variant = ProductVariant::where('product_id', 1)->firstOrFail();
    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    // Before using: available_vouchers contains PROMOEXCLUDE
    $resBefore = $this->actingAs($user)->get(route('checkout.index'));
    $resBefore->assertOk()->assertInertia(fn ($page) => $page
        ->component('checkout')
        ->where('available_vouchers', fn ($vouchers) => collect($vouchers)->contains('code', 'PROMOEXCLUDE'))
    );

    // Create an order using the voucher
    Order::create([
        'order_number' => 'ARPL-TEST-'.uniqid(),
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'User Test',
        'recipient_phone' => '081234567890',
        'address' => 'Alamat Test',
        'city' => 'Jakarta',
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 1000000,
        'discount_amount' => 200000,
        'voucher_id' => $voucher->id,
        'voucher_code' => $voucher->code,
        'total_amount' => 800000,
    ]);

    // After using: available_vouchers does NOT contain PROMOEXCLUDE
    $resAfter = $this->actingAs($user)->get(route('checkout.index'));
    $resAfter->assertOk()->assertInertia(fn ($page) => $page
        ->component('checkout')
        ->where('available_vouchers', fn ($vouchers) => ! collect($vouchers)->contains('code', 'PROMOEXCLUDE'))
    );
});
