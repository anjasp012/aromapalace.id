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
        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('voucher_type')->default('biasa')->after('terms');
            $table->foreignId('user_id')->nullable()->after('voucher_type')->constrained('users')->nullOnDelete();
            $table->string('applicable_type')->default('all')->after('user_id');
            $table->json('applicable_product_ids')->nullable()->after('applicable_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['voucher_type', 'user_id', 'applicable_type', 'applicable_product_ids']);
        });
    }
};
