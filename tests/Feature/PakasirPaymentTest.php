<?php

use App\Models\CartItem;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\Http;

test('pakasir webhook updates order status to paid on completed event', function () {
    $user = User::factory()->create();
    $order = Order::create([
        'order_number' => 'ARPL-TEST-'.time(),
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Raden Arya',
        'recipient_phone' => '089529591732',
        'address' => 'Jl. Kemang Raya No. 10',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP',
        'shipping_cost' => 0,
        'payment_method' => 'qris',
        'payment_channel' => 'QRIS Instant (Pakasir)',
        'payment_code' => 'QRIS-123456',
        'payment_status' => 'pending',
        'status' => 'menunggu_pembayaran',
        'subtotal' => 250000,
        'discount_amount' => 0,
        'total_amount' => 250000,
    ]);

    $response = $this->withHeaders([
        'X-Secret' => config('services.pakasir.webhook_secret', '8e87d94431e74a6f8e8bf4ebb75476ac'),
    ])->postJson(route('webhook.pakasir'), [
        'order_id' => $order->order_number,
        'txn_id' => 'tx_test_123',
        'amount' => 250000,
        'status' => 'completed',
        'completed_at' => now()->toIso8601String(),
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'payment_status' => 'paid',
        ]);

    $order->refresh();
    expect($order->payment_status)->toBe('paid')
        ->and($order->status)->toBe('diproses');
});

test('pakasir webhook rejects invalid secret with 401', function () {
    $response = $this->withHeaders([
        'X-Secret' => 'wrong-secret-key',
    ])->postJson(route('webhook.pakasir'), [
        'order_id' => 'ARPL-NONEXISTENT',
        'txn_id' => 'tx_fake',
        'status' => 'completed',
    ]);

    $response->assertStatus(401);
});

test('pakasir webhook returns 404 for unknown order with valid secret', function () {
    $response = $this->withHeaders([
        'X-Secret' => config('services.pakasir.webhook_secret', '8e87d94431e74a6f8e8bf4ebb75476ac'),
    ])->postJson(route('webhook.pakasir'), [
        'order_id' => 'ARPL-DOES-NOT-EXIST-999',
        'txn_id' => 'tx_nonexistent',
        'status' => 'completed',
    ]);

    $response->assertStatus(404);
});

test('authenticated user can trigger check payment status', function () {
    $user = User::factory()->create();
    $order = Order::create([
        'order_number' => 'ARPL-STATUS-'.time(),
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Raden Arya',
        'recipient_phone' => '089529591732',
        'address' => 'Jl. Kemang Raya No. 10',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP',
        'shipping_cost' => 0,
        'payment_method' => 'bri_va',
        'payment_channel' => 'BRI Virtual Account (Pakasir)',
        'payment_code' => '1280012345678',
        'payment_status' => 'pending',
        'status' => 'menunggu_pembayaran',
        'subtotal' => 350000,
        'discount_amount' => 0,
        'total_amount' => 350000,
    ]);

    Http::fake([
        '*/api/v2/create-transaction/*' => Http::response([
            'txn_id' => 'tx_check_status_1',
            'project' => 'aromapalace-id',
            'order_id' => $order->order_number,
            'amount' => 350000,
            'payment_method' => 'bri_va',
            'va_number' => '1280012345678',
        ], 200),
        '*/api/v2/transaction-status/*' => Http::response([
            'txn_id' => 'tx_check_status_1',
            'order_id' => $order->order_number,
            'amount' => 350000,
            'status' => 'completed',
            'completed_at' => now()->toIso8601String(),
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('payment.check', ['order' => $order->order_number]));

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'payment_status' => 'paid',
        ]);

    $order->refresh();
    expect($order->payment_status)->toBe('paid');
});

test('checkout store handles qris payment method and creates transaction', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    Http::fake([
        '*create-transaction*' => Http::response([
            'txn_id' => 'tx_pakasir_qris_demo',
            'project' => 'aromapalace-id',
            'order_id' => 'ARPL-TEST',
            'amount' => 150000,
            'fee' => 1500,
            'total_payment' => 150000,
            'payment_method' => 'qris',
            'qr_string' => '00020101021226...qris_demo',
            'expires_at' => now()->addHours(24)->toIso8601String(),
            'is_sandbox' => true,
        ], 200),
    ]);

    $response = $this->actingAs($user)->post(route('checkout.store'), [
        'recipient_name' => 'Arya Test',
        'recipient_phone' => '081234567890',
        'delivery_type' => 'delivery',
        'address' => 'Jl. Mawar 123',
        'city' => 'Jakarta Selatan',
        'postal_code' => '12190',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'payment_method' => 'qris',
    ]);

    $order = Order::where('user_id', $user->id)->latest('id')->first();
    expect($order)->not->toBeNull()
        ->and($order->payment_method)->toBe('qris')
        ->and($order->payment_code)->toBe('00020101021226...qris_demo');

    $response->assertRedirect(route('payment.show', ['order' => $order->order_number]));
});

test('checkout index provides active payment methods from database', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->get(route('checkout.index'));
    $response->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('checkout')
        ->has('payment_methods', 11)
        ->where('payment_methods.0.code', 'payment_link')
        ->where('payment_methods.1.code', 'qris')
    );
});

test('checkout store rejects unknown payment method', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->post(route('checkout.store'), [
        'recipient_name' => 'Arya Test',
        'recipient_phone' => '081234567890',
        'delivery_type' => 'delivery',
        'address' => 'Jl. Mawar 123',
        'city' => 'Jakarta Selatan',
        'postal_code' => '12190',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'payment_method' => 'non_existent_bank',
    ]);

    $response->assertSessionHasErrors(['payment_method']);
});

test('checkout store handles pakasir failure cleanly without creating order', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::where('product_id', 1)->firstOrFail();

    CartItem::create([
        'user_id' => $user->id,
        'product_id' => 1,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    Http::fake([
        '*create-transaction*' => Http::response([
            'message' => 'Merchant account suspended or rate limited',
        ], 500),
    ]);

    $response = $this->actingAs($user)->post(route('checkout.store'), [
        'recipient_name' => 'Arya Test',
        'recipient_phone' => '081234567890',
        'delivery_type' => 'delivery',
        'address' => 'Jl. Mawar 123',
        'city' => 'Jakarta Selatan',
        'postal_code' => '12190',
        'courier' => 'JNE Express VIP (Bebas Ongkir)',
        'payment_method' => 'qris',
    ]);

    $response->assertRedirect(route('checkout.index'));
    $response->assertSessionHas('error');

    // Order MUST NOT be created
    $orderCount = Order::where('user_id', $user->id)->count();
    expect($orderCount)->toBe(0);

    // Cart items MUST NOT be deleted
    expect($user->cartItems()->count())->toBe(1);
});
