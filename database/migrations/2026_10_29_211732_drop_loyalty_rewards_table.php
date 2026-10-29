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
        Schema::dropIfExists('loyalty_rewards');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->text('description')->nullable();
            $table->text('description_en')->nullable();
            $table->unsignedInteger('points_required');
            $table->string('reward_type');
            $table->unsignedBigInteger('reward_value');
            $table->unsignedBigInteger('min_order_amount')->default(0);
            $table->unsignedBigInteger('max_discount_amount')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
};
