<?php

use App\Models\CoverageCity;
use App\Models\CoverageDistrict;
use App\Models\CoverageProvince;
use App\Models\CoverageSubdistrict;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
    CoverageSubdistrict::query()->delete();
    CoverageDistrict::query()->delete();
    CoverageCity::query()->delete();
    CoverageProvince::query()->delete();
});

test('provinces endpoint returns from database without calling RajaOngkir API when database has records', function () {
    CoverageProvince::create(['id' => 10, 'name' => 'Jawa Barat']);
    CoverageProvince::create(['id' => 11, 'name' => 'DKI Jakarta']);

    Http::fake();

    $response = $this->getJson('/api/coverage/provinces');

    $response->assertOk()
        ->assertJson([
            'status' => true,
            'data' => [
                ['id' => 11, 'name' => 'DKI Jakarta'],
                ['id' => 10, 'name' => 'Jawa Barat'],
            ],
        ]);

    // Zero API requests made!
    Http::assertNothingSent();
});

test('provinces endpoint fetches once and persists to database when empty', function () {
    expect(CoverageProvince::count())->toBe(0);

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

    // Verify stored in database
    expect(CoverageProvince::count())->toBe(2);
    expect(CoverageProvince::find(1)->name)->toBe('Bali');

    // Second request: zero API calls because DB now has data
    Http::fake();
    $this->getJson('/api/coverage/provinces')->assertOk();
    Http::assertNothingSent();
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

test('cities endpoint validates province_id, reads from database, and persists to DB on fetch', function () {
    $this->getJson('/api/coverage/cities')
        ->assertStatus(422)
        ->assertJson(['status' => false]);

    // 1. Fetch once and save to DB
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

    expect(CoverageCity::where('province_id', 31)->count())->toBe(1);

    // 2. Second call reads from database without hitting RajaOngkir API
    Http::fake();
    $secondResponse = $this->getJson('/api/coverage/cities?province_id=31');
    $secondResponse->assertOk();
    Http::assertNothingSent();
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

test('districts endpoint validates city_id, persists, and reads from DB without API calls', function () {
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

    expect(CoverageDistrict::where('city_id', 3174)->count())->toBe(1);

    // Next request: 0 API calls!
    Http::fake();
    $this->getJson('/api/coverage/districts?city_id=3174')->assertOk();
    Http::assertNothingSent();
});

test('subdistricts endpoint validates district_id, persists, and reads from DB without API calls', function () {
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

    expect(CoverageSubdistrict::where('district_id', 4715)->count())->toBe(1);

    // Next request: 0 API calls!
    Http::fake();
    $this->getJson('/api/coverage/subdistricts?district_id=4715')->assertOk();
    Http::assertNothingSent();
});
