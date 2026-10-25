<?php

use App\Models\Setting;
use App\Models\User;

test('guest cannot access admin settings', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));

    $this->get("http://{$adminDomain}/pengaturan")
        ->assertRedirect("http://{$adminDomain}/login");
});

test('regular customer cannot access admin settings', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get("http://{$adminDomain}/pengaturan")
        ->assertRedirect("http://{$adminDomain}/login");
});

test('admin can access settings page with initial settings', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get("http://{$adminDomain}/pengaturan");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings/index')
            ->has('settings')
        );
});

test('admin can update store contact and kiriminaja origin settings', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post("http://{$adminDomain}/pengaturan", [
            'store_name' => 'Aroma Palace Flagship Boutique',
            'store_email' => 'contact@aromapalace.id',
            'store_phone' => '081199998888',
            'store_whatsapp' => '6281199998888',
            'store_description' => 'Parfum mewah berkelas dunia dengan aroma tahan lama.',
            'shipping_sender_name' => 'Gudang Pusat Aroma Palace',
            'shipping_sender_phone' => '081199997777',
            'shipping_address' => 'Jl. Senopati No. 88, Kebayoran Baru',
            'shipping_province_id' => 31,
            'shipping_province_name' => 'DKI Jakarta',
            'shipping_city_id' => 3174,
            'shipping_city_name' => 'Jakarta Selatan',
            'shipping_district_id' => 4715,
            'shipping_district_name' => 'Kebayoran Baru',
            'shipping_subdistrict_id' => 54300,
            'shipping_subdistrict_name' => 'Senayan',
            'shipping_postal_code' => '12190',
            'shipping_latitude' => -6.223845,
            'shipping_longitude' => 106.805523,
            'kiriminaja_mode' => 'staging',
            'kiriminaja_api_key' => 'v4.local.test_key_sample',
            'kiriminaja_prefix' => 'ARPL',
            'kiriminaja_pin' => '123456',
        ]);

    $response->assertRedirect();

    // Verify settings updated in DB and cache
    expect(Setting::get('store_name'))->toBe('Aroma Palace Flagship Boutique');
    expect(Setting::get('store_email'))->toBe('contact@aromapalace.id');
    expect(Setting::get('shipping_sender_name'))->toBe('Gudang Pusat Aroma Palace');
    expect((int) Setting::get('shipping_district_id'))->toBe(4715);
    expect(Setting::get('shipping_postal_code'))->toBe('12190');
    expect((float) Setting::get('shipping_latitude'))->toBe(-6.223845);
    expect((float) Setting::get('shipping_longitude'))->toBe(106.805523);
    expect((float) Setting::get('latitude'))->toBe(-6.223845);
    expect(Setting::get('kiriminaja_mode'))->toBe('staging');
    expect(Setting::get('kiriminaja_api_key'))->toBe('v4.local.test_key_sample');
    expect(Setting::get('kiriminaja_prefix'))->toBe('ARPL');
    expect(Setting::get('kiriminaja_pin'))->toBe('123456');
});

test('admin can test kiriminaja connection via endpoint', function () {
    $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->postJson("http://{$adminDomain}/pengaturan/test-kiriminaja", [
            'mode' => 'staging',
            'api_key' => '',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => false,
            'mode' => 'staging',
        ]);
});
