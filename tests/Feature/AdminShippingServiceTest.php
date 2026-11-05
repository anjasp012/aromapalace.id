<?php

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Http;

test('guest cannot access admin shipping service routes and is redirected', function () {
    $this->get(route('admin.shipping-services.index'))
        ->assertRedirect(route('admin.login'));
});

test('admin can view shipping services index page with balance', function () {
    $admin = User::factory()->admin()->create();

    Http::fake([
        'https://use.api.co.id/courier/v1/balance' => Http::response([
            'is_success' => true,
            'message' => 'Success',
            'data' => [
                'balance' => 750000,
                'currency' => 'IDR',
            ],
        ], 200),
        'https://use.api.co.id/courier/v1/provinces*' => Http::response([
            'is_success' => true,
            'data' => [
                ['code' => 31, 'name' => 'DKI Jakarta'],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.shipping-services.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/shipping-services/index')
            ->has('balance')
            ->has('settings')
        );
});

test('admin can update shipping origin settings', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.shipping-services.update'), [
            'kurirapi_key' => 'test-api-key-12345',
            'shipping_sender_name' => 'Gudang Utama Aroma Palace',
            'shipping_sender_phone' => '081234567890',
            'shipping_address' => 'Jl. Senopati No. 45',
            'shipping_province_id' => 31,
            'shipping_province_name' => 'DKI Jakarta',
            'shipping_city_id' => 3174,
            'shipping_city_name' => 'Kota Jakarta Selatan',
            'shipping_district_id' => 317407,
            'shipping_district_name' => 'Kebayoran Baru',
            'shipping_subdistrict_name' => 'Senayan',
            'shipping_postal_code' => '12190',
            'shipping_latitude' => -6.229746,
            'shipping_longitude' => 106.807493,
        ]);

    $response->assertRedirect()
        ->assertSessionHas('success');

    expect(Setting::get('shipping_sender_name'))->toBe('Gudang Utama Aroma Palace');
    expect(Setting::get('shipping_district_id'))->toBe('317407');
    expect(Setting::get('kurirapi_key'))->toBe('test-api-key-12345');
});
