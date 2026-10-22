<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('province_name', 100)->nullable()->after('shipping_address');
            $table->string('city_name', 100)->nullable()->after('province_name');
            $table->string('district_name', 100)->nullable()->after('city_name');
            $table->string('subdistrict_name', 100)->nullable()->after('district_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'province_name',
                'city_name',
                'district_name',
                'subdistrict_name',
            ]);
        });
    }
};
