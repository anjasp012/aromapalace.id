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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('brand')->index();
            $table->string('family')->index();
            $table->string('category')->index();
            $table->string('volume')->default('50ml');
            $table->string('concentration')->nullable();
            $table->string('price');
            $table->unsignedBigInteger('raw_price')->index();
            $table->string('original_price')->nullable();
            $table->string('discount_badge')->nullable();
            $table->decimal('rating', 3, 2)->default(5.0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->boolean('in_stock')->default(true);
            $table->boolean('is_new')->default(false);
            $table->string('image');
            $table->json('gallery')->nullable();
            $table->string('tag')->nullable();
            $table->string('mood')->nullable();
            $table->text('description')->nullable();
            $table->string('longevity')->nullable();
            $table->string('sillage')->nullable();
            $table->string('season')->nullable();
            $table->string('maceration')->nullable();
            $table->json('notes')->nullable();
            $table->json('reviews')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
