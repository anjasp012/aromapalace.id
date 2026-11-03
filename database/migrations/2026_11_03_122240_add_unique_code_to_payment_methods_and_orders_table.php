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
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->boolean('use_unique_code')->default(true)->after('is_active');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedSmallInteger('unique_code')->nullable()->after('shipping_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn('use_unique_code');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('unique_code');
        });
    }
};
