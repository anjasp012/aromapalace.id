<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        $defaults = [
            // RajaOngkir Shipping API
            ['key' => 'rajaongkir_shipping_key', 'value' => env('RAJAONGKIR_API_SPIPPING_KEY', ''), 'group' => 'payment_gateway', 'type' => 'string'],
            ['key' => 'rajaongkir_shipping_origin', 'value' => '291', 'group' => 'payment_gateway', 'type' => 'integer'],

            // RajaOngkir Payment API
            ['key' => 'rajaongkir_payment_mode', 'value' => 'sandbox', 'group' => 'payment_gateway', 'type' => 'string'],
            ['key' => 'rajaongkir_payment_key', 'value' => env('RAJAONGKIR_API_PAYMENT_KEY', ''), 'group' => 'payment_gateway', 'type' => 'string'],
            ['key' => 'rajaongkir_callback_url', 'value' => env('RAJAONGKIR_API_CALLBACK_URL', 'https://aromapalace.id/rajaongkir/callbackpayment'), 'group' => 'payment_gateway', 'type' => 'string'],
            ['key' => 'rajaongkir_callback_api_key', 'value' => env('RAJAONGKIR_API_CALLBACK_API_KEY', ''), 'group' => 'payment_gateway', 'type' => 'string'],
        ];

        foreach ($defaults as $item) {
            DB::table('settings')->insertOrIgnore([
                'key' => $item['key'],
                'value' => $item['value'],
                'group' => $item['group'],
                'type' => $item['type'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Clean up obsolete KiriminAja settings
        DB::table('settings')->whereIn('key', [
            'kiriminaja_mode',
            'kiriminaja_api_key',
            'kiriminaja_prefix',
            'kiriminaja_pin',
        ])->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'rajaongkir_shipping_key',
            'rajaongkir_shipping_origin',
            'rajaongkir_payment_mode',
            'rajaongkir_payment_key',
            'rajaongkir_callback_url',
            'rajaongkir_callback_api_key',
        ])->delete();
    }
};
