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
            if (! Schema::hasColumn('shipping', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('histories');
            }
            if (! Schema::hasColumn('shipping', 'auto_completes_at')) {
                $table->timestamp('auto_completes_at')->nullable()->after('delivered_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipping', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('shipping', 'delivered_at')) {
                $columnsToDrop[] = 'delivered_at';
            }
            if (Schema::hasColumn('shipping', 'auto_completes_at')) {
                $columnsToDrop[] = 'auto_completes_at';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
