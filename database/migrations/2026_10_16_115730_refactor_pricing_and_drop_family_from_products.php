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
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['family']);
            $table->dropIndex(['raw_price']);

            $table->dropColumn([
                'family',
                'raw_price',
                'price',
                'original_price',
                'discount_badge',
            ]);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('price')->default(0)->index()->after('brand_id');
            $table->unsignedBigInteger('original_price')->nullable()->after('price');
            $table->unsignedTinyInteger('discount_percent')->nullable()->after('original_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['price']);
            $table->dropColumn(['price', 'original_price', 'discount_percent']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('family')->default('Fragrance')->index();
            $table->string('price')->default('');
            $table->unsignedBigInteger('raw_price')->default(0)->index();
            $table->string('original_price')->nullable();
            $table->string('discount_badge')->nullable();
        });
    }
};
