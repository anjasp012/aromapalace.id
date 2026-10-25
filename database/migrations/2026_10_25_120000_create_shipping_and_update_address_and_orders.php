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
            $table->double('latitude')->nullable()->after('postal_code');
            $table->double('longitude')->nullable()->after('latitude');
            $table->dropColumn('tracking_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Restore orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->string('tracking_number', 100)->nullable()->after('courier');
            $table->dropColumn(['latitude', 'longitude']);
            $table->renameColumn('address', 'shipping_address');
        });

        // 2. Drop shipping table
        Schema::dropIfExists('shipping');

        // 3. Drop latitude and longitude from user_addresses
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
