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
        Schema::table('shipping', function (Blueprint $table) {
            $table->timestamp('delivered_at')->nullable()->after('histories');
            $table->timestamp('auto_completes_at')->nullable()->after('delivered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipping', function (Blueprint $table) {
            $table->dropColumn(['delivered_at', 'auto_completes_at']);
        });
    }
};
