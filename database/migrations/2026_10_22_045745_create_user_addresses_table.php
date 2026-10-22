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
        Schema::create('user_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label', 50)->default('Rumah');
            $table->string('recipient_name', 120);
            $table->string('recipient_phone', 25);
            $table->unsignedBigInteger('province_id')->nullable();
            $table->string('province_name', 100)->nullable();
            $table->unsignedBigInteger('city_id')->nullable();
            $table->string('city_name', 100);
            $table->unsignedBigInteger('district_id')->nullable();
            $table->string('district_name', 100);
            $table->unsignedBigInteger('subdistrict_id')->nullable();
            $table->string('subdistrict_name', 100);
            $table->string('postal_code', 15);
            $table->text('address');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_addresses');
    }
};
