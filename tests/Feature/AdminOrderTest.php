<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Store;
use App\Models\User;
use App\Services\KiriminAjaService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

test('guest cannot access admin routes and is redirected to login', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));

    $this->get("http://{$adminDomain}/")
        ->assertRedirect("http://{$adminDomain}/login");
    $this->get("http://{$adminDomain}/dashboard")
        ->assertRedirect("http://{$adminDomain}/login");
    $this->get("http://{$adminDomain}/manajemen-pesanan")
        ->assertRedirect("http://{$adminDomain}/login");
});

test('regular customer cannot access admin dashboard', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get("http://{$adminDomain}/dashboard")
        ->assertRedirect("http://{$adminDomain}/login");
});

test('admin can access dashboard and receives metrics', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get("http://{$adminDomain}/dashboard");

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
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
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
        ->get("http://{$adminDomain}/manajemen-pesanan?status=diproses");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/index')
            ->has('orders.data')
            ->has('filters')
            ->has('tab_counts')
        );
});

test('admin can view order detail page', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
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
        'status' => 'diproses',
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
        ->get("http://{$adminDomain}/manajemen-pesanan/{$order->order_number}");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/show')
            ->has('order')
            ->where('order.order_number', $order->order_number)
            ->where('order.delivery_type', 'pickup')
        );
});

test('admin can update order status from menunggu_pembayaran to diproses and sync payment_status to paid', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
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
        'status' => 'menunggu_pembayaran',
        'subtotal' => 600000,
        'discount_amount' => 0,
        'total_amount' => 600000,
    ]);

    $response = $this->actingAs($admin)
        ->patch("http://{$adminDomain}/manajemen-pesanan/{$order->order_number}/status", [
            'status' => 'diproses',
            'notes' => 'Pembayaran terverifikasi oleh admin',
        ]);

    $response->assertRedirect();
    $order->refresh();

    expect($order->status)->toBe('diproses')
        ->and($order->payment_status)->toBe('paid')
        ->and($order->notes)->toBe('Pembayaran terverifikasi oleh admin');
});

test('admin can update status to dikirim with manual tracking number and selesai', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
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

    // Update to dikirim with manual tracking number
    $this->actingAs($admin)
        ->patch("http://{$adminDomain}/manajemen-pesanan/{$order->order_number}/status", [
            'status' => 'dikirim',
            'shipping_mode' => 'manual',
            'tracking_number' => 'JNE1234567890',
            'notes' => 'Resi JNE Manual',
        ])
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe('dikirim')
        ->and($order->tracking_number)->toBe('JNE1234567890');

    // Update to selesai
    $this->actingAs($admin)
        ->patch("http://{$adminDomain}/manajemen-pesanan/{$order->order_number}/status", [
            'status' => 'selesai',
        ])
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe('selesai');
});

test('admin can ship order with kiriminaja automatic tracking number', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();

    $order = Order::create([
        'order_number' => 'AP-KIRIMIN-'.uniqid(),
        'user_id' => $customer->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Citra Kirana',
        'recipient_phone' => '081234567897',
        'shipping_address' => 'Jl. Senopati No. 20',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express Reguler',
        'shipping_cost' => 18000,
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 350000,
        'discount_amount' => 0,
        'total_amount' => 368000,
    ]);

    // Mock KiriminAjaService
    $mockService = Mockery::mock(KiriminAjaService::class);
    $mockService->shouldReceive('requestPickupForOrder')
        ->once()
        ->with(Mockery::on(fn ($o) => $o->id === $order->id))
        ->andReturn([
            'success' => true,
            'tracking_number' => 'XID-9998887776',
            'courier' => 'JNE Express Reguler',
            'source' => 'kiriminaja_live',
            'message' => 'Resi otomatis KiriminAja berhasil diterbitkan (XID-9998887776).',
        ]);
    $this->app->instance(KiriminAjaService::class, $mockService);

    $response = $this->actingAs($admin)
        ->patch("http://{$adminDomain}/manajemen-pesanan/{$order->order_number}/status", [
            'status' => 'dikirim',
            'shipping_mode' => 'kiriminaja',
        ]);

    $response->assertRedirect();
    $order->refresh();
    expect($order->status)->toBe('dikirim')
        ->and($order->tracking_number)->toBe('XID-9998887776');
});

test('admin receives flash error when kiriminaja request pickup fails', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();

    $order = Order::create([
        'order_number' => 'AP-FAIL-'.uniqid(),
        'user_id' => $customer->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Citra Kirana',
        'recipient_phone' => '081234567897',
        'shipping_address' => 'Jl. Senopati No. 20',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express Reguler',
        'shipping_cost' => 18000,
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 350000,
        'discount_amount' => 0,
        'total_amount' => 368000,
    ]);

    // Mock failure
    $mockService = Mockery::mock(KiriminAjaService::class);
    $mockService->shouldReceive('requestPickupForOrder')
        ->once()
        ->andReturn([
            'success' => false,
            'tracking_number' => '',
            'courier' => 'JNE Express Reguler',
            'source' => 'kiriminaja_error',
            'message' => 'Saldo KiriminAja tidak mencukupi untuk biaya pengiriman.',
        ]);
    $this->app->instance(KiriminAjaService::class, $mockService);

    $response = $this->actingAs($admin)
        ->patch("http://{$adminDomain}/manajemen-pesanan/{$order->order_number}/status", [
            'status' => 'dikirim',
            'shipping_mode' => 'kiriminaja',
        ]);

    $response->assertSessionHas('error');
    $order->refresh();
    // Status must remain diproses, not changed to dikirim!
    expect($order->status)->toBe('diproses')
        ->and($order->tracking_number)->toBeNull();
});

test('kiriminaja service sends insurance_amount as 0 without insurance fee', function () {
    Http::fake([
        '*/api/mitra/v2/schedules' => Http::response(['status' => true, 'schedules' => [['clock' => '2026-10-25 14:00:00']]], 200),
        '*/api/mitra/v6.1/request_pickup' => Http::response([
            'status' => true,
            'pickup_number' => 'PICKUP-TEST-123',
            'details' => [
                [
                    'awb' => 'AWB-TEST-123',
                    'kj_order_id' => 'KJ-123',
                ],
            ],
        ], 200),
    ]);

    $customer = User::factory()->create();
    $order = Order::create([
        'order_number' => 'AP-INS-'.uniqid(),
        'user_id' => $customer->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Citra Kirana',
        'recipient_phone' => '081234567897',
        'shipping_address' => 'Jl. Senopati No. 20',
        'city' => 'Jakarta Selatan',
        'courier' => 'JNE Express Reguler',
        'shipping_cost' => 18000,
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 350000,
        'discount_amount' => 0,
        'total_amount' => 368000,
    ]);

    $service = app(KiriminAjaService::class);
    $result = $service->requestPickupForOrder($order);

    expect($result['success'])->toBeTrue()
        ->and($result['tracking_number'])->toBe('AWB-TEST-123');

    Http::assertSent(function (Request $request) {
        if (! str_contains($request->url(), 'request_pickup')) {
            return false;
        }

        $package = $request['packages'][0] ?? [];

        return isset($package['insurance_amount']) && $package['insurance_amount'] === 0;
    });
});
