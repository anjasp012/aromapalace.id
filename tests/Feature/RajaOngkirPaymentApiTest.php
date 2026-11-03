<?php

use Illuminate\Support\Facades\Http;

test('create payment returns 422 validation error when payment_type is not provided', function () {
    $response = $this->postJson('/rajaongkir/createpayment', [
        'order_id' => 'ARPL-20261103-TEST1',
        'amount' => 450000,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['payment_type']);
});

test('create payment returns 422 validation error when order_id is not provided', function () {
    $response = $this->postJson('/rajaongkir/createpayment', [
        'payment_type' => 'echannel',
        'amount' => 450000,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['order_id']);
});

test('create payment returns 422 validation error when amount is not provided', function () {
    $response = $this->postJson('/rajaongkir/createpayment', [
        'order_id' => 'ARPL-20261103-TEST1',
        'payment_type' => 'echannel',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

test('create payment validates all required fields simultaneously on empty payload', function () {
    $response = $this->postJson('/rajaongkir/createpayment', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['order_id', 'payment_type', 'amount']);
});

test('create payment validates all required fields even without accept application json header', function () {
    $response = $this->post('/rajaongkir/createpayment', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['order_id', 'payment_type', 'amount']);
});

test('create payment succeeds with valid required fields', function () {
    Http::fake([
        'https://api-sandbox.collaborator.komerce.id/*' => Http::response([
            'status' => 'success',
            'data' => [
                'payment_id' => 'PAY-12345',
                'order_id' => 'ARPL-20261103-TEST1',
                'va_number' => '1234567890',
            ],
        ], 200),
    ]);

    $response = $this->postJson('/rajaongkir/createpayment', [
        'order_id' => 'ARPL-20261103-TEST1',
        'payment_type' => 'echannel',
        'channel_code' => 'mandiri',
        'amount' => 450000,
    ]);

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
            'data' => [
                'payment_id' => 'PAY-12345',
                'order_id' => 'ARPL-20261103-TEST1',
            ],
        ]);
});
