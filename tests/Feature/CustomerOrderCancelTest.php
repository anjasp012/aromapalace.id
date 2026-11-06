<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $category = Category::create([
        'name' => 'Signature',
        'slug' => 'signature',
        'description' => 'Aroma Palace Signature Collections',
    ]);

    $product = Product::create([
        'name' => 'Oud Royale Test',
        'slug' => 'oud-royale-test',
        'category_id' => $category->id,
        'description' => 'Test Product',
        'base_price' => 500000,
        'is_published' => true,
    ]);

    ProductVariant::create([
        'product_id' => $product->id,
        'name' => '50ml EDP',
        'sku' => 'OUD-ROYALE-50',
        'price' => 500000,
        'stock' => 10,
        'volume' => '50ml',
    ]);
});

test('customer can cancel unpaid order from order details', function () {
    $user = User::factory()->create();
    $variant = ProductVariant::first();

    $voucher = Voucher::create([
        'code' => 'DISC50',
        'name' => 'Discount 50k',
        'type' => 'fixed',
        'value' => 50000,
        'min_order_amount' => 100000,
        'quota' => 10,
        'used_count' => 1,
        'is_active' => true,
    ]);

    $order = Order::create([
        'order_number' => 'ARPL-CANCEL-TEST-001',
        'user_id' => $user->id,
        'recipient_name' => 'John Doe',
        'recipient_phone' => '081234567890',
        'address' => 'Jl. Test No. 1',
        'city' => 'Jakarta',
        'courier' => 'JNE REG',
        'shipping_cost' => 10000,
        'payment_method' => 'bca_va',
        'payment_channel' => 'BCA Virtual Account',
        'payment_code' => '8808123456',
        'payment_status' => 'pending',
        'status' => 'menunggu_pembayaran',
        'subtotal' => 500000,
        'discount_amount' => 50000,
        'voucher_id' => $voucher->id,
        'voucher_code' => 'DISC50',
        'total_amount' => 460000,
    ]);

    $order->items()->create([
        'product_id' => $variant->product_id,
        'variant_id' => $variant->id,
        'product_name' => 'Oud Royale Test',
        'variant_name' => '50ml EDP',
        'volume' => '50ml',
        'price' => 500000,
        'quantity' => 2,
        'total_price' => 1000000,
    ]);

    $initialStock = $variant->fresh()->stock;

    $response = $this->actingAs($user)->post(route('account.orders.cancel', ['order' => $order->id]));

    $response->assertSessionHas('success');

    $order->refresh();
    expect($order->status)->toBe('dibatalkan');
    expect($order->payment_status)->toBe('canceled');

    // Stock should be restored
    expect($variant->fresh()->stock)->toBe($initialStock + 2);

    // Voucher used count should be decremented
    expect($voucher->fresh()->used_count)->toBe(0);
});

test('order details mapping sets can_cancel to true when order is unpaid and false when paid', function () {
    $user = User::factory()->create();

    $unpaidOrder = Order::create([
        'order_number' => 'ARPL-MAP-UNPAID',
        'user_id' => $user->id,
        'recipient_name' => 'Customer Unpaid',
        'recipient_phone' => '0812345678',
        'address' => 'Jakarta',
        'courier' => 'JNE',
        'shipping_cost' => 0,
        'payment_method' => 'bca_va',
        'payment_status' => 'pending',
        'status' => 'menunggu_pembayaran',
        'subtotal' => 100000,
        'total_amount' => 100000,
    ]);

    $paidOrder = Order::create([
        'order_number' => 'ARPL-MAP-PAID',
        'user_id' => $user->id,
        'recipient_name' => 'Customer Paid',
        'recipient_phone' => '0812345679',
        'address' => 'Jakarta',
        'courier' => 'JNE',
        'shipping_cost' => 0,
        'payment_method' => 'bca_va',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 100000,
        'total_amount' => 100000,
    ]);

    $response = $this->actingAs($user)->get(route('account.orders'));
    $response->assertOk();

    $response->assertInertia(function ($page) {
        $orders = collect($page->toArray()['props']['orders']);
        $unpaid = $orders->firstWhere('order_number', 'ARPL-MAP-UNPAID');
        $paid = $orders->firstWhere('order_number', 'ARPL-MAP-PAID');

        expect($unpaid['can_cancel'])->toBeTrue();
        expect($paid['can_cancel'])->toBeFalse();
    });
});

test('customer cannot cancel already paid or processing order', function () {
    $user = User::factory()->create();

    $order = Order::create([
        'order_number' => 'ARPL-PAID-001',
        'user_id' => $user->id,
        'recipient_name' => 'John Doe',
        'recipient_phone' => '081234567890',
        'address' => 'Jl. Test No. 1',
        'courier' => 'JNE REG',
        'shipping_cost' => 10000,
        'payment_method' => 'bca_va',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 500000,
        'total_amount' => 510000,
    ]);

    $response = $this->actingAs($user)->post(route('account.orders.cancel', ['order' => $order->id]));

    $response->assertSessionHas('error');
    $order->refresh();
    expect($order->status)->toBe('diproses');
    expect($order->payment_status)->toBe('paid');
});

test('customer cannot cancel order owned by another user', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $order = Order::create([
        'order_number' => 'ARPL-OTHER-USER',
        'user_id' => $owner->id,
        'recipient_name' => 'Owner',
        'recipient_phone' => '081234567890',
        'address' => 'Jl. Test No. 1',
        'courier' => 'JNE REG',
        'shipping_cost' => 10000,
        'payment_method' => 'bca_va',
        'payment_status' => 'pending',
        'status' => 'menunggu_pembayaran',
        'subtotal' => 500000,
        'total_amount' => 510000,
    ]);

    $response = $this->actingAs($otherUser)->post(route('account.orders.cancel', ['order' => $order->id]));

    $response->assertForbidden();
    $order->refresh();
    expect($order->status)->toBe('menunggu_pembayaran');
});

