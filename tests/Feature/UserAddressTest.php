<?php

use App\Models\Order;
use App\Models\Shipping;
use App\Models\User;
use App\Models\UserAddress;

test('authenticated user can store address with latitude and longitude', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/account/addresses', [
        'label' => 'Rumah',
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567890',
        'province_id' => 10,
        'province_name' => 'Jawa Barat',
        'city_id' => 150,
        'city_name' => 'Kota Bandung',
        'district_id' => 2000,
        'district_name' => 'Coblong',
        'subdistrict_id' => 30000,
        'subdistrict_name' => 'Dago',
        'postal_code' => '40135',
        'address' => 'Jl. Ir. H. Djuanda No. 123',
        'latitude' => -6.884847,
        'longitude' => 107.615249,
        'is_primary' => true,
    ]);

    $response->assertOk()
        ->assertJson([
            'status' => true,
        ]);

    $address = UserAddress::where('user_id', $user->id)->first();
    expect($address)->not->toBeNull()
        ->and($address->latitude)->toBe(-6.884847)
        ->and($address->longitude)->toBe(107.615249);
});

test('authenticated user can update address with new latitude and longitude', function () {
    $user = User::factory()->create();
    $address = UserAddress::create([
        'user_id' => $user->id,
        'label' => 'Kantor',
        'recipient_name' => 'Budi',
        'recipient_phone' => '081234567890',
        'province_id' => 10,
        'province_name' => 'Jawa Barat',
        'city_id' => 150,
        'city_name' => 'Bandung',
        'district_id' => 2000,
        'district_name' => 'Coblong',
        'subdistrict_id' => 30000,
        'subdistrict_name' => 'Dago',
        'postal_code' => '40135',
        'address' => 'Jl. Dago No. 1',
        'latitude' => -6.88,
        'longitude' => 107.61,
        'is_primary' => true,
    ]);

    $response = $this->actingAs($user)->putJson("/account/addresses/{$address->id}", [
        'label' => 'Kantor Baru',
        'recipient_name' => 'Budi Perkasa',
        'recipient_phone' => '081299998888',
        'province_id' => 10,
        'province_name' => 'Jawa Barat',
        'city_id' => 150,
        'city_name' => 'Bandung',
        'district_id' => 2000,
        'district_name' => 'Coblong',
        'subdistrict_id' => 30000,
        'subdistrict_name' => 'Dago',
        'postal_code' => '40135',
        'address' => 'Jl. Dago Atas No. 88',
        'latitude' => -6.875008,
        'longitude' => 107.615952,
    ]);

    $response->assertOk();

    $address->refresh();
    expect($address->latitude)->toBe(-6.875008)
        ->and($address->longitude)->toBe(107.615952)
        ->and($address->label)->toBe('Kantor Baru');
});

test('kiriminaja webhook populates shipping table', function () {
    $user = User::factory()->create();
    $order = Order::create([
        'order_number' => 'ARPL-20261025-WH01',
        'user_id' => $user->id,
        'delivery_type' => 'delivery',
        'recipient_name' => 'Andi',
        'recipient_phone' => '081234567890',
        'address' => 'Jl. Ir H Djuanda No. 123',
        'courier' => 'JNE Express',
        'shipping_cost' => 15000,
        'payment_method' => 'qris',
        'payment_status' => 'paid',
        'status' => 'dikirim',
        'subtotal' => 250000,
        'total_amount' => 265000,
    ]);

    $callbackPayload = [
        'order_id' => 'ARPL-20261025-WH01',
        'awb' => 'AWB-KIRIMINAJA-998877',
        'text' => 'Paket sedang diantar ke alamat penerima',
        'image' => ['https://cdn.kiriminaja.com/pod/123.jpg'],
        'origin' => [
            'name' => 'Aroma Palace Store',
            'phone' => '081288889999',
            'address' => 'Jl. Kemang Raya No. 10',
        ],
        'destination' => [
            'name' => 'Andi',
            'phone' => '081234567890',
            'address' => 'Jl. Ir H Djuanda No. 123',
            'latitude' => -6.875,
            'longitude' => 107.615,
        ],
        'histories' => [
            ['time' => '2026-10-25 10:00:00', 'status' => 'Pick Up', 'note' => 'Paket telah di-pickup kurir'],
            ['time' => '2026-10-25 11:00:00', 'status' => 'On Delivery', 'note' => 'Paket sedang diantar kurir'],
        ],
    ];

    $response = $this->postJson('/webhook/kiriminaja', $callbackPayload);
    $response->assertOk()
        ->assertJson(['status' => true]);

    $shipping = Shipping::where('order_id', $order->id)->first();
    expect($shipping)->not->toBeNull()
        ->and($shipping->awb)->toBe('AWB-KIRIMINAJA-998877')
        ->and($shipping->text)->toBe('Paket sedang diantar ke alamat penerima')
        ->and($shipping->destination['latitude'])->toBe(-6.875)
        ->and($shipping->histories)->toHaveCount(2);
});

test('user address rejects phone number not starting with 08, 628, +628, or 02', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/account/addresses', [
        'label' => 'Rumah',
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '071234567890', // invalid prefix 07
        'city_name' => 'Kota Bandung',
        'district_name' => 'Coblong',
        'subdistrict_name' => 'Dago',
        'postal_code' => '40135',
        'address' => 'Jl. Dago No. 12',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['recipient_phone']);
});

test('user address sanitizes and accepts valid phone numbers with dashes and prefixes', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/account/addresses', [
        'label' => 'Rumah',
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '+62812-3456-7890',
        'city_name' => 'Kota Bandung',
        'district_name' => 'Coblong',
        'subdistrict_name' => 'Dago',
        'postal_code' => '40135',
        'address' => 'Jl. Dago No. 12',
    ]);

    $response->assertOk();

    $address = UserAddress::where('user_id', $user->id)->first();
    expect($address)->not->toBeNull()
        ->and($address->recipient_phone)->toBe('+6281234567890');
});

