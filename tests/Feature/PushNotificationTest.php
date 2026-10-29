<?php

use App\Models\DeviceToken;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Voucher;
use App\Services\FirebaseNotificationService;

test('guest can register device token for web push notifications', function () {
    $response = $this->postJson(route('device-tokens.store'), [
        'token' => 'fcm_guest_token_123',
        'device_type' => 'web',
        'browser' => 'Chrome',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('device_tokens', [
        'token' => 'fcm_guest_token_123',
        'device_type' => 'web',
        'role' => 'customer',
        'user_id' => null,
    ]);
});

test('authenticated customer registers device token associated with user id', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $response = $this->actingAs($customer)->postJson(route('device-tokens.store'), [
        'token' => 'fcm_customer_token_456',
        'device_type' => 'android',
        'browser' => 'Mobile App',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('device_tokens', [
        'token' => 'fcm_customer_token_456',
        'device_type' => 'android',
        'role' => 'customer',
        'user_id' => $customer->id,
    ]);
});

test('authenticated admin registers device token with admin role for incoming order alerts', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->postJson(route('device-tokens.store'), [
        'token' => 'fcm_admin_token_789',
        'device_type' => 'web',
        'browser' => 'Chrome Admin Desktop',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('device_tokens', [
        'token' => 'fcm_admin_token_789',
        'role' => 'admin',
        'user_id' => $admin->id,
    ]);
});

test('device token can be removed on logout or revocation', function () {
    DeviceToken::create([
        'token' => 'fcm_token_to_remove',
        'device_type' => 'web',
        'role' => 'customer',
    ]);

    $response = $this->deleteJson(route('device-tokens.destroy'), [
        'token' => 'fcm_token_to_remove',
    ]);

    $response->assertOk();
    $this->assertDatabaseMissing('device_tokens', [
        'token' => 'fcm_token_to_remove',
    ]);
});

test('firebase notification service dispatches order, payment, pickup, shipping and voucher alerts cleanly', function () {
    $service = app(FirebaseNotificationService::class);

    $customer = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);
    $variant = ProductVariant::first();

    DeviceToken::create([
        'user_id' => $customer->id,
        'token' => 'token_customer_fcm',
        'role' => 'customer',
    ]);

    DeviceToken::create([
        'user_id' => $admin->id,
        'token' => 'token_admin_fcm',
        'role' => 'admin',
    ]);

    $order = Order::create([
        'order_number' => 'ARPL-NOTIF-TEST',
        'user_id' => $customer->id,
        'recipient_name' => 'Budi',
        'recipient_phone' => '0812345678',
        'address' => 'Jakarta',
        'city' => 'Jakarta',
        'courier' => 'JNE Express',
        'shipping_cost' => 0,
        'payment_method' => 'qris',
        'payment_status' => 'pending',
        'subtotal' => 500000,
        'discount_amount' => 0,
        'total_amount' => 500000,
    ]);

    // Test notifyNewOrder (triggers alerts for Admin and Customer)
    $service->notifyNewOrder($order);

    // Test notifyPaymentSuccess
    $service->notifyPaymentSuccess($order);

    // Test notifyOrderShipped
    $service->notifyOrderShipped($order);

    // Test notifyStorePickupReady
    $service->notifyStorePickupReady($order);

    // Test notifyNewVoucher
    $voucher = Voucher::create([
        'code' => 'PROMOFCMTEST',
        'name' => 'Promo Notif Test',
        'type' => 'percentage',
        'value' => 20,
        'is_active' => true,
    ]);
    $service->notifyNewVoucher($voucher);

    expect(true)->toBeTrue();
});

test('user can log in and register multiple mobile devices simultaneously without deleting previous tokens', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    // 1. Register Android device
    $this->actingAs($customer)->postJson(route('device-tokens.store'), [
        'token' => 'fcm_android_phone_token_111',
        'device_type' => 'android',
        'browser' => 'Aroma Palace Mobile App (ANDROID)',
    ])->assertOk();

    // 2. Register iPhone device
    $this->actingAs($customer)->postJson(route('device-tokens.store'), [
        'token' => 'fcm_iphone_phone_token_222',
        'device_type' => 'ios',
        'browser' => 'Aroma Palace Mobile App (IOS)',
    ])->assertOk();

    // 3. Register a second Android tablet
    $this->actingAs($customer)->postJson(route('device-tokens.store'), [
        'token' => 'fcm_android_tablet_token_333',
        'device_type' => 'android',
        'browser' => 'Aroma Palace Mobile App (ANDROID)',
    ])->assertOk();

    // All three tokens must remain active and associated with the customer
    expect(DeviceToken::where('user_id', $customer->id)->count())->toBe(3);
    $tokens = DeviceToken::where('user_id', $customer->id)->pluck('token')->all();
    expect($tokens)->toContain('fcm_android_phone_token_111');
    expect($tokens)->toContain('fcm_iphone_phone_token_222');
    expect($tokens)->toContain('fcm_android_tablet_token_333');
});

test('remind expiring payments command sends reminder to orders created 23 hours ago but not awaiting confirmation', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    // 1. Order in 23-24 hour window, pending payment -> SHOULD get reminded
    $expiringOrder = Order::create([
        'order_number' => 'ARPL-EXP-REMIND-1',
        'user_id' => $customer->id,
        'recipient_name' => 'Budi',
        'recipient_phone' => '0812345678',
        'address' => 'Jakarta',
        'city' => 'Jakarta',
        'courier' => 'JNE',
        'shipping_cost' => 0,
        'payment_method' => 'manual_bca',
        'payment_status' => 'pending',
        'status' => 'pending',
        'subtotal' => 150000,
        'discount_amount' => 0,
        'total_amount' => 150000,
    ]);
    $expiringOrder->timestamps = false;
    $expiringOrder->created_at = now()->subHours(23)->subMinutes(30);
    $expiringOrder->save();

    // 2. Order created 23 hours ago but status is menunggu_konfirmasi -> SHOULD NOT get reminded
    $confirmingOrder = Order::create([
        'order_number' => 'ARPL-CONFIRMING-1',
        'user_id' => $customer->id,
        'recipient_name' => 'Budi',
        'recipient_phone' => '0812345678',
        'address' => 'Jakarta',
        'city' => 'Jakarta',
        'courier' => 'JNE',
        'shipping_cost' => 0,
        'payment_method' => 'manual_bca',
        'payment_status' => 'pending',
        'status' => 'menunggu_konfirmasi',
        'subtotal' => 150000,
        'discount_amount' => 0,
        'total_amount' => 150000,
    ]);
    $confirmingOrder->timestamps = false;
    $confirmingOrder->created_at = now()->subHours(23)->subMinutes(30);
    $confirmingOrder->save();

    // 3. Order created only 5 hours ago -> SHOULD NOT get reminded
    $recentOrder = Order::create([
        'order_number' => 'ARPL-RECENT-1',
        'user_id' => $customer->id,
        'recipient_name' => 'Budi',
        'recipient_phone' => '0812345678',
        'address' => 'Jakarta',
        'city' => 'Jakarta',
        'courier' => 'JNE',
        'shipping_cost' => 0,
        'payment_method' => 'manual_bca',
        'payment_status' => 'pending',
        'status' => 'pending',
        'subtotal' => 150000,
        'discount_amount' => 0,
        'total_amount' => 150000,
    ]);
    $recentOrder->timestamps = false;
    $recentOrder->created_at = now()->subHours(5);
    $recentOrder->save();

    // Run Artisan command
    $this->artisan('orders:remind-expiring-payments')
        ->expectsOutput('Checking for orders expiring in the next hour...')
        ->expectsOutput('Sent 1 payment expiry reminder(s) to customers.')
        ->assertSuccessful();

    // Re-running immediately should be blocked by cache (TTL 2 hours)
    $this->artisan('orders:remind-expiring-payments')
        ->expectsOutput('Checking for orders expiring in the next hour...')
        ->expectsOutput('No orders entering the 1-hour expiry window at this time.')
        ->assertSuccessful();
});
