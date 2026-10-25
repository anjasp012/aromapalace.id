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
        // 1. Sanitize and convert existing string volume to integer in product_variants
        if (Schema::hasTable('product_variants')) {
            $variants = DB::table('product_variants')->get();
            foreach ($variants as $pv) {
                $raw = strtolower(trim((string) $pv->volume));
                if (str_contains($raw, 'liter') || (str_contains($raw, 'l') && ! str_contains($raw, 'ml'))) {
                    $num = (float) filter_var($raw, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
                    $vol = (int) ($num * 1000);
                } else {
                    $vol = (int) filter_var($raw, FILTER_SANITIZE_NUMBER_INT);
                }
                if ($vol <= 0) {
                    $vol = 50;
                }
                DB::table('product_variants')->where('id', $pv->id)->update(['volume' => (string) $vol]);
            }

            // Alter column to unsigned integer
            DB::statement('ALTER TABLE product_variants MODIFY volume INT UNSIGNED NOT NULL');
        }

        // 2. Sanitize and convert existing string volume to integer in order_items
        if (Schema::hasTable('order_items')) {
            $orderItems = DB::table('order_items')->whereNotNull('volume')->get();
            foreach ($orderItems as $item) {
                $raw = strtolower(trim((string) $item->volume));
                if (str_contains($raw, 'liter') || (str_contains($raw, 'l') && ! str_contains($raw, 'ml'))) {
                    $num = (float) filter_var($raw, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
                    $vol = (int) ($num * 1000);
                } else {
                    $vol = (int) filter_var($raw, FILTER_SANITIZE_NUMBER_INT);
                }
                if ($vol <= 0) {
                    $vol = null;
                }
                DB::table('order_items')->where('id', $item->id)->update(['volume' => $vol !== null ? (string) $vol : null]);
            }

            // Alter column to unsigned integer nullable
            DB::statement('ALTER TABLE order_items MODIFY volume INT UNSIGNED NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('product_variants')) {
            DB::statement('ALTER TABLE product_variants MODIFY volume VARCHAR(255) NOT NULL');
        }

        if (Schema::hasTable('order_items')) {
            DB::statement('ALTER TABLE order_items MODIFY volume VARCHAR(255) NULL');
        }
    }
};
