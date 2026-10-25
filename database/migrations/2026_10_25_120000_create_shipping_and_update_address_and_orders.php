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
        // 1. Add latitude and longitude to user_addresses
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->double('latitude')->nullable()->after('address');
            $table->double('longitude')->nullable()->after('latitude');
        });

        // 2. Create shipping table for KiriminAja callback/response
        Schema::create('shipping', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('shipping_payment_code')->nullable()->index();
            $table->string('awb')->nullable()->index();
            $table->text('text')->nullable();
            $table->json('image')->nullable();
            $table->json('origin')->nullable();
            $table->json('destination')->nullable();
            $table->json('histories')->nullable();
            $table->timestamps();
        });

        // 3. Update orders table: rename shipping_address to address (nullable), add latitude & longitude, drop tracking_number
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'shipping_address') && ! Schema::hasColumn('orders', 'address')) {
                $table->renameColumn('shipping_address', 'address');
            } elseif (! Schema::hasColumn('orders', 'address')) {
                $table->text('address')->nullable()->after('recipient_phone');
            }

            if (! Schema::hasColumn('orders', 'latitude')) {
                $table->double('latitude')->nullable()->after('postal_code');
            }

            if (! Schema::hasColumn('orders', 'longitude')) {
                $table->double('longitude')->nullable()->after('latitude');
            }

            if (Schema::hasColumn('orders', 'tracking_number')) {
                $table->dropColumn('tracking_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Restore orders table
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'address') && ! Schema::hasColumn('orders', 'shipping_address')) {
                $table->renameColumn('address', 'shipping_address');
            }

            if (! Schema::hasColumn('orders', 'tracking_number')) {
                $table->string('tracking_number', 100)->nullable()->after('courier');
            }

            $columnsToDrop = [];
            if (Schema::hasColumn('orders', 'latitude')) {
                $columnsToDrop[] = 'latitude';
            }
            if (Schema::hasColumn('orders', 'longitude')) {
                $columnsToDrop[] = 'longitude';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        // 2. Drop shipping table
        Schema::dropIfExists('shipping');

        // 3. Drop latitude and longitude from user_addresses
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
