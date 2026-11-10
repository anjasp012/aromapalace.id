<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to remove any remaining placeholder unsplash images from product galleries.
     */
    public function up(): void
    {
        if (Schema::hasTable('product_galleries')) {
            DB::table('product_galleries')
                ->where('image', 'like', '%unsplash.com%')
                ->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed for removed placeholder images
    }
};

