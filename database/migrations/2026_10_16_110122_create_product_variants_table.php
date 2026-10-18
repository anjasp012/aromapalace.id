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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('volume');
            $table->string('price');
            $table->unsignedBigInteger('raw_price');
            $table->string('original_price')->nullable();
            $table->string('sku')->nullable();
            $table->integer('stock')->default(20);
            $table->boolean('in_stock')->default(true);
            $table->timestamps();

            $table->unique(['product_id', 'volume']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
