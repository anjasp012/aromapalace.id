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
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('membership_number', 50)->unique();
            $table->unsignedInteger('points')->default(0);
            $table->unsignedInteger('lifetime_points')->default(0);
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('loyalty_point_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('membership_id')->constrained('memberships')->cascadeOnDelete();
            $table->string('type', 30);
            $table->integer('points');
            $table->unsignedInteger('balance_after');
            $table->string('description');
            $table->string('reference_id', 100)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('points_required');
            $table->string('reward_type', 30);
            $table->unsignedBigInteger('reward_value');
            $table->unsignedBigInteger('min_order_amount')->default(0);
            $table->unsignedBigInteger('max_discount_amount')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_rewards');
        Schema::dropIfExists('loyalty_point_histories');
        Schema::dropIfExists('memberships');
    }
};
