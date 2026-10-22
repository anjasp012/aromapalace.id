<?php

use App\Models\User;
use App\Models\UserAddress;

test('guest cannot manage user addresses', function () {
    $this->getJson(route('account.addresses.index'))
        ->assertUnauthorized();

    $this->postJson(route('account.addresses.store'), [
        'label' => 'Rumah',
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567890',
        'city_name' => 'Jakarta Selatan',
        'district_name' => 'Kebayoran Baru',
        'subdistrict_name' => 'Senayan',
        'postal_code' => '12190',
        'address' => 'Jl. Jenderal Sudirman Kav. 52-53',
    ])->assertUnauthorized();
});

test('authenticated user can create a new address and first address is set to primary', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('account.addresses.store'), [
        'label' => 'Rumah',
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567890',
        'province_name' => 'DKI Jakarta',
        'city_name' => 'Kota Jakarta Selatan',
        'district_name' => 'Kebayoran Baru',
        'subdistrict_name' => 'Senayan',
        'postal_code' => '12190',
        'address' => 'Jl. Senopati No. 10 RT 01/RW 02',
    ]);

    $response->assertOk()
        ->assertJson([
            'status' => true,
            'message' => 'Alamat pengiriman berhasil disimpan.',
        ]);

    $this->assertDatabaseHas('user_addresses', [
        'user_id' => $user->id,
        'label' => 'Rumah',
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567890',
        'city_name' => 'Kota Jakarta Selatan',
        'district_name' => 'Kebayoran Baru',
        'subdistrict_name' => 'Senayan',
        'postal_code' => '12190',
        'is_primary' => true,
    ]);

    expect($user->fresh()->phone)->toBe('081234567890');
});

test('user can update their saved address', function () {
    $user = User::factory()->create();
    $address = UserAddress::create([
        'user_id' => $user->id,
        'label' => 'Rumah',
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081234567890',
        'province_name' => 'DKI Jakarta',
        'city_name' => 'Kota Jakarta Selatan',
        'district_name' => 'Kebayoran Baru',
        'subdistrict_name' => 'Senayan',
        'postal_code' => '12190',
        'address' => 'Alamat lama',
        'is_primary' => true,
    ]);

    $response = $this->actingAs($user)->putJson(route('account.addresses.update', $address), [
        'label' => 'Kantor',
        'recipient_name' => 'Budi Office',
        'recipient_phone' => '089876543210',
        'province_name' => 'DKI Jakarta',
        'city_name' => 'Kota Jakarta Pusat',
        'district_name' => 'Gambir',
        'subdistrict_name' => 'Gambir',
        'postal_code' => '10110',
        'address' => 'Gedung Wisma 46 Lantai 12',
    ]);

    $response->assertOk()
        ->assertJson(['status' => true]);

    $this->assertDatabaseHas('user_addresses', [
        'id' => $address->id,
        'label' => 'Kantor',
        'recipient_name' => 'Budi Office',
        'recipient_phone' => '089876543210',
        'city_name' => 'Kota Jakarta Pusat',
    ]);
});

test('user can set another address as primary', function () {
    $user = User::factory()->create();

    $addr1 = UserAddress::create([
        'user_id' => $user->id,
        'label' => 'Rumah',
        'recipient_name' => 'Budi 1',
        'recipient_phone' => '08111111111',
        'city_name' => 'Jakarta Selatan',
        'district_name' => 'Kebayoran Baru',
        'subdistrict_name' => 'Senayan',
        'postal_code' => '12190',
        'address' => 'Rumah 1',
        'is_primary' => true,
    ]);

    $addr2 = UserAddress::create([
        'user_id' => $user->id,
        'label' => 'Kantor',
        'recipient_name' => 'Budi 2',
        'recipient_phone' => '08222222222',
        'city_name' => 'Jakarta Pusat',
        'district_name' => 'Gambir',
        'subdistrict_name' => 'Gambir',
        'postal_code' => '10110',
        'address' => 'Kantor 2',
        'is_primary' => false,
    ]);

    $response = $this->actingAs($user)->postJson(route('account.addresses.primary', $addr2));

    $response->assertOk();

    expect($addr1->fresh()->is_primary)->toBeFalse()
        ->and($addr2->fresh()->is_primary)->toBeTrue();
});

test('user can delete their saved address', function () {
    $user = User::factory()->create();

    $addr = UserAddress::create([
        'user_id' => $user->id,
        'label' => 'Apartemen',
        'recipient_name' => 'Budi Apartment',
        'recipient_phone' => '08333333333',
        'city_name' => 'Surabaya',
        'district_name' => 'Gubeng',
        'subdistrict_name' => 'Gubeng',
        'postal_code' => '60281',
        'address' => 'Jl. Sumatera No. 5',
        'is_primary' => true,
    ]);

    $response = $this->actingAs($user)->deleteJson(route('account.addresses.destroy', $addr));

    $response->assertOk();

    $this->assertDatabaseMissing('user_addresses', [
        'id' => $addr->id,
    ]);
});

test('coverage area endpoints return valid lists', function () {
    $provResponse = $this->getJson(route('coverage.provinces'));
    $provResponse->assertOk()
        ->assertJsonStructure([
            'status',
            'data' => [
                '*' => ['id', 'name'],
            ],
        ]);

    $cityResponse = $this->getJson(route('coverage.cities', ['province_id' => 1]));
    $cityResponse->assertOk()
        ->assertJsonStructure([
            'status',
            'data' => [
                '*' => ['id', 'name'],
            ],
        ]);
});
