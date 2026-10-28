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
        // 1. Add type column to categories table
        Schema::table('categories', function (Blueprint $table) {
            if (! Schema::hasColumn('categories', 'type')) {
                $table->string('type', 50)->default('genders')->after('name')->index();
            }
        });

        // 2. Create categories_product pivot table with cascade on delete
        if (! Schema::hasTable('categories_product')) {
            Schema::create('categories_product', function (Blueprint $table) {
                $table->id();
                $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['category_id', 'product_id']);
            });
        }

        // 3. Migrate existing category_id relations from products into categories_product pivot
        if (Schema::hasColumn('products', 'category_id')) {
            $existingProducts = DB::table('products')
                ->whereNotNull('category_id')
                ->select('id as product_id', 'category_id')
                ->get();

            $now = now();
            foreach ($existingProducts as $item) {
                DB::table('categories_product')->updateOrInsert(
                    [
                        'category_id' => $item->category_id,
                        'product_id' => $item->product_id,
                    ],
                    [
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }

            // 4. Drop category_id from products table
            if (DB::getDriverName() !== 'sqlite') {
                Schema::table('products', function (Blueprint $table) {
                    $table->dropForeign(['category_id']);
                    $table->dropColumn('category_id');
                });
            } else {
                Schema::table('products', function (Blueprint $table) {
                    $table->dropColumn('category_id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Re-add category_id to products table
        if (! Schema::hasColumn('products', 'category_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('category_id')->nullable()->after('slug')->constrained('categories')->nullOnDelete();
            });

            // Restore category_id from categories_product
            if (Schema::hasTable('categories_product')) {
                $pivots = DB::table('categories_product')
                    ->select('product_id', 'category_id')
                    ->orderBy('id', 'asc')
                    ->get();

                foreach ($pivots as $row) {
                    DB::table('products')
                        ->where('id', $row->product_id)
                        ->whereNull('category_id')
                        ->update(['category_id' => $row->category_id]);
                }
            }
        }

        // 2. Drop categories_product pivot table
        Schema::dropIfExists('categories_product');

        // 3. Drop type column from categories table
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'type')) {
                $table->dropColumn('type');
            }
        });
    }
};
