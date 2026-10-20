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
            $table->text('description_en')->nullable()->after('description');
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->string('title_en')->nullable()->after('title');
            $table->text('excerpt_en')->nullable()->after('excerpt');
            $table->longText('content_en')->nullable()->after('content');
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
            $table->text('description_en')->nullable()->after('description');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
            $table->text('description_en')->nullable()->after('description');
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->text('description_en')->nullable()->after('description');
        });

        Schema::table('loyalty_rewards', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
            $table->text('description_en')->nullable()->after('description');
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->text('description_en')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('description_en');
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'excerpt_en', 'content_en']);
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['name_en', 'description_en']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['name_en', 'description_en']);
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->dropColumn('description_en');
        });

        Schema::table('loyalty_rewards', function (Blueprint $table) {
            $table->dropColumn(['name_en', 'description_en']);
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('description_en');
        });
    }
};
