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
        Schema::table('product_variants', function (Blueprint $table) {
            // Add index on product_id first so foreign key constraint has an index
            $table->index('product_id', 'product_variants_product_id_index');

            if (DB::getDriverName() !== 'sqlite') {
                $table->dropUnique('product_variants_product_id_volume_unique');
            } else {
                try {
                    $table->dropUnique(['product_id', 'volume']);
                } catch (Throwable) {
                    // Ignore on sqlite
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->unique(['product_id', 'volume'], 'product_variants_product_id_volume_unique');
            $table->dropIndex('product_variants_product_id_index');
        });
    }
};
