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
        Schema::table('cart_items', function (Blueprint $table) {
            $table->index('user_id', 'cart_items_temp_user_id_index');
            $table->dropUnique(['user_id', 'product_id', 'volume']);
            $table->dropColumn('volume');
            $table->unique(['user_id', 'product_id', 'variant_id']);
            $table->dropIndex('cart_items_temp_user_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->index('user_id', 'cart_items_temp_user_id_index');
            $table->dropUnique(['user_id', 'product_id', 'variant_id']);
            $table->string('volume')->default('50ml');
            $table->unique(['user_id', 'product_id', 'volume']);
            $table->dropIndex('cart_items_temp_user_id_index');
        });
    }
};
