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
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['price', 'raw_price', 'original_price']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->unsignedBigInteger('price')->default(0)->index()->after('volume');
            $table->unsignedBigInteger('original_price')->nullable()->after('price');
            $table->unsignedTinyInteger('discount_percent')->nullable()->after('original_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex(['price']);
            $table->dropColumn(['price', 'original_price', 'discount_percent']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('price')->default('')->after('volume');
            $table->unsignedBigInteger('raw_price')->default(0)->after('price');
            $table->string('original_price')->nullable()->after('raw_price');
        });
    }
};
