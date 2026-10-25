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
            $afterCol = Schema::hasColumn('orders', 'address') ? 'address' : (Schema::hasColumn('orders', 'shipping_address') ? 'shipping_address' : 'recipient_phone');

            if (! Schema::hasColumn('orders', 'province_id')) {
                $table->unsignedBigInteger('province_id')->nullable()->after($afterCol);
            }
            if (! Schema::hasColumn('orders', 'city_id')) {
                $table->unsignedBigInteger('city_id')->nullable()->after('province_name');
            }
            if (! Schema::hasColumn('orders', 'district_id')) {
                $table->unsignedBigInteger('district_id')->nullable()->after('city_name');
            }
            if (! Schema::hasColumn('orders', 'subdistrict_id')) {
                $table->unsignedBigInteger('subdistrict_id')->nullable()->after('district_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['province_id', 'city_id', 'district_id', 'subdistrict_id'] as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $columnsToDrop[] = $col;
                }
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
