<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
});

test('provinces endpoint returns formatted list and caches result', function () {
    Http::fake([
        'https://rajaongkir.komerce.id/api/v1/destination/province' => Http::response([
            'meta' => [
                'code' => 200,
                'status' => 'success',
                'message' => 'Success Get Province',
            ],
            'data' => [
                ['id' => 1, 'name' => 'Bali'],
                ['id' => 2, 'name' => 'Bangka Belitung'],
            ],
        ], 200),
    ]);

    $response = $this->getJson('/api/coverage/provinces');

    $response->assertOk()
        ->assertJson([
            'status' => true,
            'data' => [
                ['id' => 1, 'name' => 'Bali'],
                ['id' => 2, 'name' => 'Bangka Belitung'],
            ],
        ]);

    expect(Cache::has('coverage:provinces'))->toBeTrue();
});

test('provinces endpoint does not crash on daily limit or error response', function () {
    Http::fake([
        'https://rajaongkir.komerce.id/api/v1/destination/province' => Http::response([
            'meta' => [
                'message' => 'Daily limit exceeded',
                'code' => 429,
                'status' => 'error',
            ],
            'data' => null,
        ], 200),
    ]);

    $response = $this->getJson('/api/coverage/provinces');

    $response->assertOk()
        ->assertJson([
            'status' => false,
            'data' => [],
        ]);

    expect($response->json('message'))->toContain('Daily limit exceeded');
});

test('cities endpoint validates province_id and returns formatted list', function () {
    $this->getJson('/api/coverage/cities')
        ->assertStatus(422)
        ->assertJson(['status' => false]);

    Http::fake([
        'https://rajaongkir.komerce.id/api/v1/destination/city/31' => Http::response([
            'meta' => ['code' => 200, 'status' => 'success'],
            'data' => [
                ['id' => 3174, 'name' => 'Kota Jakarta Selatan', 'type' => 'Kota'],
            ],
        ], 200),
    ]);

    $response = $this->getJson('/api/coverage/cities?province_id=31');

    $response->assertOk()
        ->assertJson([
            'status' => true,
            'data' => [
                ['id' => 3174, 'name' => 'Kota Jakarta Selatan', 'type' => 'Kota'],
            ],
        ]);

    expect(Cache::has('coverage:cities:31'))->toBeTrue();
});

test('cities endpoint does not crash on error response', function () {
    Http::fake([
        'https://rajaongkir.komerce.id/api/v1/destination/city/31' => Http::response([
            'meta' => [
                'message' => 'Daily limit exceeded',
                'code' => 429,
                'status' => 'error',
            ],
            'data' => null,
        ], 200),
    ]);

    $response = $this->getJson('/api/coverage/cities?province_id=31');

    $response->assertOk()
        ->assertJson([
            'status' => false,
            'data' => [],
        ]);
});

test('districts endpoint validates city_id and returns formatted list', function () {
    $this->getJson('/api/coverage/districts')
        ->assertStatus(422)
        ->assertJson(['status' => false]);

    Http::fake([
        'https://rajaongkir.komerce.id/api/v1/destination/district/3174' => Http::response([
            'meta' => ['code' => 200, 'status' => 'success'],
            'data' => [
                ['id' => 4715, 'name' => 'Kebayoran Baru'],
            ],
        ], 200),
    ]);

    $response = $this->getJson('/api/coverage/districts?city_id=3174');

    $response->assertOk()
        ->assertJson([
            'status' => true,
            'data' => [
                ['id' => 4715, 'name' => 'Kebayoran Baru'],
            ],
        ]);
});

test('subdistricts endpoint validates district_id and returns formatted list', function () {
    $this->getJson('/api/coverage/subdistricts')
        ->assertStatus(422)
        ->assertJson(['status' => false]);

    Http::fake([
        'https://rajaongkir.komerce.id/api/v1/destination/sub-district/4715' => Http::response([
            'meta' => ['code' => 200, 'status' => 'success'],
            'data' => [
                ['id' => 54300, 'name' => 'Senayan', 'zip_code' => '12190'],
            ],
        ], 200),
    ]);

    $response = $this->getJson('/api/coverage/subdistricts?district_id=4715');

    $response->assertOk()
        ->assertJson([
            'status' => true,
            'data' => [
                ['id' => 54300, 'name' => 'Senayan', 'postal_code' => '12190'],
            ],
        ]);
});
