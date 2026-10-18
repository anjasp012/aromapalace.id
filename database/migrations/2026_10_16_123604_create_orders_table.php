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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('recipient_name');
            $table->string('recipient_phone');
            $table->text('shipping_address');
            $table->string('city');
            $table->string('postal_code')->nullable();
            $table->string('courier')->default('JNE Express VIP (Bebas Ongkir)');
            $table->unsignedBigInteger('shipping_cost')->default(0);
            $table->string('payment_method');
            $table->string('payment_channel')->nullable();
            $table->string('payment_code')->nullable();
            $table->string('payment_status')->default('pending');
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->string('voucher_code')->nullable();
            $table->unsignedBigInteger('total_amount');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
