<?php

use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
});

test('provinces endpoint returns list from KurirAPIService', function () {
    $response = $this->getJson('/api/coverage/provinces');

    $response->assertOk()
        ->assertJson(['status' => true])
        ->assertJsonFragment(['name' => 'DKI Jakarta']);
});

test('cities endpoint validates province_id and returns list from KurirAPIService', function () {
    $this->getJson('/api/coverage/cities')
        ->assertStatus(422)
        ->assertJson(['status' => false]);

    $response = $this->getJson('/api/coverage/cities?province_id=31');

    $response->assertOk()
        ->assertJson(['status' => true])
        ->assertJsonFragment(['name' => 'Kota Jakarta Selatan', 'type' => 'Kota']);
});

test('districts endpoint validates city_id and returns list from KurirAPIService', function () {
    $this->getJson('/api/coverage/districts')
        ->assertStatus(422)
        ->assertJson(['status' => false]);

    $response = $this->getJson('/api/coverage/districts?city_id=3174');

    $response->assertOk()
        ->assertJson(['status' => true])
        ->assertJsonFragment(['name' => 'Kebayoran Baru']);
});

test('subdistricts endpoint gracefully responds without crashing', function () {
    $response = $this->getJson('/api/coverage/subdistricts?district_id=317407');

    $response->assertOk()
        ->assertJson([
            'status' => true,
            'data' => [],
        ]);
});
