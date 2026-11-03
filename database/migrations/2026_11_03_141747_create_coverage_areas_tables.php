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
        Schema::create('coverage_provinces', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name');
            $table->timestamps();

            $table->index('name');
        });

        Schema::create('coverage_cities', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('province_id');
            $table->string('name');
            $table->string('type')->nullable();
            $table->timestamps();

            $table->index('province_id');
            $table->index('name');
        });

        Schema::create('coverage_districts', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('city_id');
            $table->string('name');
            $table->timestamps();

            $table->index('city_id');
            $table->index('name');
        });

        Schema::create('coverage_subdistricts', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('district_id');
            $table->string('name');
            $table->string('postal_code')->nullable();
            $table->timestamps();

            $table->index('district_id');
            $table->index('name');
            $table->index('postal_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coverage_subdistricts');
        Schema::dropIfExists('coverage_districts');
        Schema::dropIfExists('coverage_cities');
        Schema::dropIfExists('coverage_provinces');
    }
};
