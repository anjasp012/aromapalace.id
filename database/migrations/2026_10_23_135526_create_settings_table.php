<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->longText('value')->nullable();
            $table->string('group')->default('general')->index();
            $table->string('type')->default('string');
            $table->timestamps();
        });

        // Insert initial default settings
        $now = now();
        $defaults = [
            // Contact & Profile
            ['key' => 'store_name', 'value' => 'Aroma Palace Official', 'group' => 'contact', 'type' => 'string'],
            ['key' => 'store_email', 'value' => 'support@aromapalace.id', 'group' => 'contact', 'type' => 'string'],
            ['key' => 'store_phone', 'value' => '081288889999', 'group' => 'contact', 'type' => 'string'],
            ['key' => 'store_whatsapp', 'value' => '6289529591732', 'group' => 'contact', 'type' => 'string'],
            ['key' => 'store_description', 'value' => 'Official luxury boutique parfum berkarakter mewah khas Dubai di Indonesia.', 'group' => 'contact', 'type' => 'string'],

            // Shipping & KiriminAja Origin
            ['key' => 'shipping_sender_name', 'value' => 'Aroma Palace Official', 'group' => 'shipping', 'type' => 'string'],
            ['key' => 'shipping_sender_phone', 'value' => '081288889999', 'group' => 'shipping', 'type' => 'string'],
            ['key' => 'shipping_address', 'value' => 'Jl. Kemang Raya No. 10', 'group' => 'shipping', 'type' => 'string'],
            ['key' => 'shipping_province_id', 'value' => '6', 'group' => 'shipping', 'type' => 'integer'],
            ['key' => 'shipping_province_name', 'value' => 'DKI Jakarta', 'group' => 'shipping', 'type' => 'string'],
            ['key' => 'shipping_city_id', 'value' => '151', 'group' => 'shipping', 'type' => 'integer'],
            ['key' => 'shipping_city_name', 'value' => 'Kota Administrasi Jakarta Selatan', 'group' => 'shipping', 'type' => 'string'],
            ['key' => 'shipping_district_id', 'value' => '2101', 'group' => 'shipping', 'type' => 'integer'],
            ['key' => 'shipping_district_name', 'value' => 'Kebayoran Baru', 'group' => 'shipping', 'type' => 'string'],
            ['key' => 'shipping_subdistrict_id', 'value' => '1004', 'group' => 'shipping', 'type' => 'integer'],
            ['key' => 'shipping_subdistrict_name', 'value' => 'Kramat Pela', 'group' => 'shipping', 'type' => 'string'],
            ['key' => 'shipping_postal_code', 'value' => '12130', 'group' => 'shipping', 'type' => 'string'],
        ];

        foreach ($defaults as $item) {
            DB::table('settings')->insert([
                'key' => $item['key'],
                'value' => $item['value'],
                'group' => $item['group'],
                'type' => $item['type'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
