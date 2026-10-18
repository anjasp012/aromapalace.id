<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Store;
use App\Models\User;

test('guest cannot access admin routes and is redirected to login', function () {
    $this->get('/admin')->assertRedirect('/login');
    $this->get('/admin/dashboard')->assertRedirect('/login');
    $this->get('/admin/orders')->assertRedirect('/login');
});

test('regular customer receives 403 forbidden when accessing admin dashboard', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/admin/dashboard')
        ->assertForbidden();
});

test('admin can access dashboard and receives metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/dashboard');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('metrics')
            ->has('status_counts')
            ->has('action_needed_orders')
            ->has('recent_orders')
        );
});

test('admin can view orders index with status filter and search', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();

    $order1 = Order::create([
        'order_number' => 'AP-TEST-'.uniqid(),
        'user_id' => $customer->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Sudirman No. 1',
        'city' => 'Jakarta Pusat',
        'courier' => 'JNE Express VIP',
        'shipping_cost' => 0,
        'payment_method' => 'qris',
        'payment_channel' => 'QRIS',
        'payment_code' => 'QRIS-001',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 500000,
        'discount_amount' => 0,
        'total_amount' => 500000,
    ]);

    OrderItem::create([
        'order_id' => $order1->id,
        'product_id' => 1,
        'product_name' => 'Aroma Royal Noir',
        'volume' => '100ml',
        'price' => 500000,
        'quantity' => 1,
        'total_price' => 500000,
    ]);

    $response = $this->actingAs($admin)
        ->get('/admin/orders?status=diproses');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/index')
            ->has('orders.data')
            ->has('filters')
            ->has('tab_counts')
        );
});

test('admin can view order detail page', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();

    $store = Store::factory()->create();

    $order = Order::create([
        'order_number' => 'AP-SHOW-'.uniqid(),
        'user_id' => $customer->id,
        'delivery_type' => 'pickup',
        'recipient_name' => 'Siti Nurhaliza',
        'recipient_phone' => '081987654321',
        'shipping_address' => 'Boutique Grand Indonesia, Level 1',
        'city' => 'Jakarta Pusat',
        'store_id' => $store->id,
        'shipping_cost' => 0,
        'payment_method' => 'bank_transfer',
        'payment_channel' => 'BCA Virtual Account',
        'payment_code' => '8271092819',
        'payment_status' => 'paid',
        'status' => 'menunggu_konfirmasi',
        'subtotal' => 750000,
        'discount_amount' => 0,
        'total_amount' => 750000,
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => 1,
        'product_name' => 'Royal Oud Amber',
        'volume' => '50ml',
        'price' => 750000,
        'quantity' => 1,
        'total_price' => 750000,
    ]);

    $response = $this->actingAs($admin)
        ->get("/admin/orders/{$order->order_number}");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/show')
            ->has('order')
            ->where('order.order_number', $order->order_number)
            ->where('order.delivery_type', 'pickup')
        );
});

test('admin can update order status from menunggu_konfirmasi to diproses and sync payment_status to paid', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();

    $order = Order::create([
        'order_number' => 'AP-STATUS-'.uniqid(),
        'user_id' => $customer->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Ahmad Dani',
        'recipient_phone' => '081234567899',
        'shipping_address' => 'Jl. Thamrin No. 5',
        'city' => 'Jakarta Pusat',
        'courier' => 'JNE Express VIP',
        'shipping_cost' => 0,
        'payment_method' => 'qris',
        'payment_channel' => 'QRIS',
        'payment_code' => 'QRIS-777',
        'payment_status' => 'pending',
        'status' => 'menunggu_konfirmasi',
        'subtotal' => 600000,
        'discount_amount' => 0,
        'total_amount' => 600000,
    ]);

    $response = $this->actingAs($admin)
        ->patch("/admin/orders/{$order->order_number}/status", [
            'status' => 'diproses',
            'notes' => 'Pembayaran terverifikasi oleh admin',
        ]);

    $response->assertRedirect();
    $order->refresh();

    expect($order->status)->toBe('diproses')
        ->and($order->payment_status)->toBe('paid')
        ->and($order->notes)->toBe('Pembayaran terverifikasi oleh admin');
});

test('admin can update status to dikirim and selesai', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();

    $order = Order::create([
        'order_number' => 'AP-FLOW-'.uniqid(),
        'user_id' => $customer->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Dewi Lestari',
        'recipient_phone' => '081234567898',
        'shipping_address' => 'Jl. Gatot Subroto No. 8',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express VIP',
        'shipping_cost' => 0,
        'payment_method' => 'qris',
        'payment_channel' => 'QRIS',
        'payment_code' => 'QRIS-888',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 450000,
        'discount_amount' => 0,
        'total_amount' => 450000,
    ]);

    // Update to dikirim
    $this->actingAs($admin)
        ->patch("/admin/orders/{$order->order_number}/status", [
            'status' => 'dikirim',
            'notes' => 'Resi JNE: VIP-00192837',
        ])
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe('dikirim');

    // Update to selesai
    $this->actingAs($admin)
        ->patch("/admin/orders/{$order->order_number}/status", [
            'status' => 'selesai',
        ])
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe('selesai');
});
