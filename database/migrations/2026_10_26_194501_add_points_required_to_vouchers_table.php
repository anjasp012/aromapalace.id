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
            if (! Schema::hasColumn('vouchers', 'points_required')) {
                $table->unsignedInteger('points_required')->nullable()->after('voucher_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            if (Schema::hasColumn('vouchers', 'points_required')) {
                $table->dropColumn('points_required');
            }
        });
    }
};
