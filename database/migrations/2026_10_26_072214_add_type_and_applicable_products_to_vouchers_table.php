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
            if (! Schema::hasColumn('vouchers', 'voucher_type')) {
                $table->string('voucher_type')->default('biasa')->after('terms');
            }
            if (! Schema::hasColumn('vouchers', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('voucher_type')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('vouchers', 'applicable_type')) {
                $table->string('applicable_type')->default('all')->after('user_id');
            }
            if (! Schema::hasColumn('vouchers', 'applicable_product_ids')) {
                $table->json('applicable_product_ids')->nullable()->after('applicable_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            if (Schema::hasColumn('vouchers', 'user_id')) {
                $table->dropForeign(['user_id']);
            }
            $columns = [];
            foreach (['voucher_type', 'user_id', 'applicable_type', 'applicable_product_ids'] as $col) {
                if (Schema::hasColumn('vouchers', $col)) {
                    $columns[] = $col;
                }
            }
            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
