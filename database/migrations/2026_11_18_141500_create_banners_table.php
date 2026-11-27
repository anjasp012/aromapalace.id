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
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('subtitle')->nullable();
            $table->string('subtitle_en')->nullable();
            $table->string('title');
            $table->string('title_en')->nullable();
            $table->text('description')->nullable();
            $table->text('description_en')->nullable();
            $table->string('image');
            $table->string('button_text')->nullable()->default('Belanja Promo');
            $table->string('button_text_en')->nullable()->default('Shop Promo');
            $table->string('button_link')->nullable()->default('/products?discount=1');
            $table->string('secondary_button_text')->nullable()->default('Cek Keranjang');
            $table->string('secondary_button_text_en')->nullable()->default('View Cart');
            $table->string('secondary_button_link')->nullable()->default('/cart');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default initial banner data
        DB::table('banners')->insert([
            'subtitle' => 'Penawaran Eksklusif',
            'subtitle_en' => 'Exclusive Offer',
            'title' => 'Promo Spesial Hari Ini!',
            'title_en' => "Today's Special Deals!",
            'description' => 'Dapatkan diskon istimewa untuk berbagai koleksi wewangian terpilih dengan menggunakan kode voucher resmi Aroma Palace.',
            'description_en' => 'Get special discounts for selected luxury fragrance collections with official Aroma Palace voucher codes.',
            'image' => '/images/logo.png',
            'button_text' => 'Belanja Promo',
            'button_text_en' => 'Shop Promo',
            'button_link' => '/products?discount=1',
            'secondary_button_text' => 'Cek Keranjang',
            'secondary_button_text_en' => 'View Cart',
            'secondary_button_link' => '/cart',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
