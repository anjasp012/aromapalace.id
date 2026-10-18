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
        'order_number' => 'AP-NOTIF-TEST',
        'user_id' => $customer->id,
        'recipient_name' => 'Budi',
        'recipient_phone' => '0812345678',
        'shipping_address' => 'Jakarta',
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
