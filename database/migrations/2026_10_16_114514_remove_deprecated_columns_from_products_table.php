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
            $table->dropIndex(['brand']);
            $table->dropIndex(['category']);

            $table->dropColumn([
                'brand',
                'category',
                'concentration',
                'rating',
                'reviews_count',
                'in_stock',
                'is_new',
                'image',
                'gallery',
                'tag',
                'mood',
                'longevity',
                'sillage',
                'season',
                'maceration',
                'notes',
                'reviews',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('brand')->nullable();
            $table->string('category')->nullable();
            $table->string('concentration')->nullable();
            $table->decimal('rating', 3, 2)->default(5.0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->boolean('in_stock')->default(true);
            $table->boolean('is_new')->default(false);
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            $table->string('tag')->nullable();
            $table->string('mood')->nullable();
            $table->string('longevity')->nullable();
            $table->string('sillage')->nullable();
            $table->string('season')->nullable();
            $table->string('maceration')->nullable();
            $table->json('notes')->nullable();
            $table->json('reviews')->nullable();
        });
    }
};
