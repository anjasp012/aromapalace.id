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
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'courier_service')) {
                $afterCol = Schema::hasColumn('orders', 'longitude') ? 'longitude' : (Schema::hasColumn('orders', 'postal_code') ? 'postal_code' : 'address');
                $table->string('courier_service', 100)->nullable()->after($afterCol);
            }
            if (! Schema::hasColumn('orders', 'courier_service_type')) {
                $table->string('courier_service_type', 100)->nullable()->after('courier_service');
            }
        });

        if (Schema::hasColumn('orders', 'courier')) {
            DB::table('orders')
                ->whereNull('courier_service')
                ->whereNotNull('courier')
                ->update([
                    'courier_service' => DB::raw('courier'),
                ]);

            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('courier');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'courier')) {
                $table->string('courier', 255)->nullable()->after('longitude');
            }
        });

        if (Schema::hasColumn('orders', 'courier_service')) {
            DB::table('orders')
                ->whereNull('courier')
                ->whereNotNull('courier_service')
                ->update([
                    'courier' => DB::raw('courier_service'),
                ]);

            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn(['courier_service', 'courier_service_type']);
            });
        }
    }
};
