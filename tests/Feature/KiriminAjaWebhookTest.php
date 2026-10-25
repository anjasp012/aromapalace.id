<?php

use App\Models\Order;
use App\Models\Setting;
use App\Models\Shipping;
use App\Models\User;

beforeEach(function () {
    Setting::set('kiriminaja_api_key', 'test_secret_api_key');
});

test('kiriminaja webhook updates awb on processed_packages event', function () {
    $user = User::factory()->create();
    $order = Order::create([
        'order_number' => 'ARPL-TEST-PROC-01',
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Budi',
        'recipient_phone' => '081234567890',
        'address' => 'Jl. Sudirman No. 1',
        'courier_service' => 'jne',
        'courier_service_type' => 'REG',
        'shipping_cost' => 10000,
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'dikirim',
        'subtotal' => 100000,
        'total_amount' => 110000,
    ]);

    // Initial shipping record with pending awb
    $order->shipping()->create([
        'shipping_payment_code' => 'EPR-112233',
        'awb' => 'Menunggu...',
        'text' => 'Request pickup dibuat',
    ]);

    $payload = [
        'method' => 'processed_packages',
        'data' => [
            [
                'order_id' => 'ARPL-TEST-PROC-01',
                'awb' => 'KAJ-JNE-99881122',
                'sorting_code' => 'JOG-SUB-101',
                'date' => '2026-10-25T14:30:00Z',
            ],
        ],
    ];

    $response = $this->withHeaders([
        'Authorization' => 'Bearer test_secret_api_key',
    ])->postJson('/webhook/kiriminaja', $payload);

    $response->assertOk()
        ->assertJson(['status' => true]);

    $shipping = Shipping::where('order_id', $order->id)->first();
    expect($shipping)->not->toBeNull()
        ->and($shipping->awb)->toBe('KAJ-JNE-99881122')
        ->and($shipping->text)->toContain('diproses')
        ->and($shipping->histories)->toHaveCount(1)
        ->and($shipping->histories[0]['sorting_code'])->toBe('JOG-SUB-101');
});

test('kiriminaja webhook updates status to selesai on finished_packages event', function () {
    $user = User::factory()->create();
    $order = Order::create([
        'order_number' => 'ARPL-TEST-FIN-02',
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Siti',
        'recipient_phone' => '081299998888',
        'address' => 'Jl. Thamrin No. 2',
        'courier_service' => 'sicepat',
        'courier_service_type' => 'SIUNT',
        'shipping_cost' => 12000,
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'dikirim',
        'subtotal' => 200000,
        'total_amount' => 212000,
    ]);

    $order->shipping()->create([
        'awb' => '004123456789',
        'text' => 'Paket sedang dikirim',
    ]);

    $payload = [
        'method' => 'finished_packages',
        'data' => [
            [
                'order_id' => 'ARPL-TEST-FIN-02',
                'awb' => '004123456789',
                'finished_at' => '2026-10-25T16:00:00Z',
            ],
        ],
        'packages' => [
            [
                'order_id' => 'ARPL-TEST-FIN-02',
                'awb' => '004123456789',
                'service' => 'sicepat',
                'service_type' => 'SIUNT',
                'status' => 200,
            ],
        ],
    ];

    $response = $this->withHeaders([
        'Authorization' => 'Bearer test_secret_api_key',
    ])->postJson('/webhook/kiriminaja', $payload);

    $response->assertOk()
        ->assertJson(['status' => true]);

    $order->refresh();
    expect($order->status)->toBe('selesai');

    $shipping = $order->shipping;
    expect($shipping->text)->toContain('diterima');
});

test('kiriminaja webhook rejects invalid bearer token', function () {
    $payload = [
        'method' => 'processed_packages',
        'data' => [
            ['order_id' => 'ARPL-TEST-XYZ', 'awb' => '123456'],
        ],
    ];

    $response = $this->withHeaders([
        'Authorization' => 'Bearer wrong_key',
    ])->postJson('/webhook/kiriminaja', $payload);

    $response->assertStatus(401);
});
