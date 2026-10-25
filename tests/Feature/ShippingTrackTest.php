<?php

use App\Models\Order;
use App\Models\Shipping;
use App\Models\User;

test('api can track shipment by awb from shipping table', function () {
    $user = User::factory()->create();
    $order = Order::create([
        'order_number' => 'ARPL-20261025-TRK1',
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Tugimin',
        'recipient_phone' => '089529591732',
        'address' => 'Klepu, Ceper, Kabupaten Klaten, Jawa Tengah',
        'courier_service' => 'Lion Parcel',
        'courier_service_type' => 'REGPACK',
        'shipping_cost' => 18000,
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'dikirim',
        'subtotal' => 350000,
        'total_amount' => 368000,
    ]);

    Shipping::create([
        'order_id' => $order->id,
        'awb' => 'C2EJPUQM',
        'text' => 'Paketmu telah sampai di tujuan & diterima oleh Tugimin (YBS)',
        'image' => ['https://cdn.kiriminaja.com/pod/lion_123.jpg'],
        'origin' => [
            'name' => 'oknatshop',
            'phone' => '08123456789',
            'address' => 'Gudang Aroma Palace',
        ],
        'destination' => [
            'name' => 'Tugimin',
            'phone' => '089529591732',
            'address' => 'Klepu, Ceper, Kabupaten Klaten, Jawa Tengah',
        ],
        'histories' => [
            [
                'time' => '2026-08-07 07:48',
                'status' => 'shipped_packages',
                'note' => 'Paketmu telah sampai dengan truk di Kota KLATEN, KLATEN TENGAH, KLATEN',
            ],
            [
                'time' => '2026-08-07 08:14',
                'status' => 'shipped_packages',
                'note' => 'Paketmu sampai di Gudang Lion Parcel KLATEN, KLATEN TENGAH, KLATEN',
            ],
            [
                'time' => '2026-08-07 08:34',
                'status' => 'shipped_packages',
                'note' => 'Paketmu diantar ke alamat penerima oleh kurir Wahyudi. Pastikan nomor penerima dapat dihubungi oleh kurir',
            ],
            [
                'time' => '2026-08-07 13:49',
                'status' => 'finished_packages',
                'note' => 'Paketmu telah sampai di tujuan & diterima oleh Tugimin (YBS)',
                'image' => 'https://cdn.kiriminaja.com/pod/lion_123.jpg',
            ],
        ],
    ]);

    $response = $this->getJson('/api/shipping/track/C2EJPUQM');

    $response->assertOk()
        ->assertJson([
            'status' => true,
            'data' => [
                'awb' => 'C2EJPUQM',
                'courier' => 'Lion Parcel REGPACK',
                'sender' => [
                    'name' => 'oknatshop',
                ],
                'recipient' => [
                    'name' => 'Tugimin',
                    'phone' => '089529591732',
                    'address' => 'Klepu, Ceper, Kabupaten Klaten, Jawa Tengah',
                ],
            ],
        ]);

    $data = $response->json('data');
    expect($data['histories'])->toHaveCount(4)
        // Ensure sorted descending (latest 13:49 on top)
        ->and($data['histories'][0]['note'])->toContain('Tugimin (YBS)')
        ->and($data['images'])->toContain('https://cdn.kiriminaja.com/pod/lion_123.jpg');
});

test('api returns 404 for non-existent awb', function () {
    $response = $this->getJson('/api/shipping/track/NONEXISTENT999');

    $response->assertStatus(404)
        ->assertJson(['status' => false]);
});
