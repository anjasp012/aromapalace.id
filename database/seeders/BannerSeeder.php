<?php

namespace Database\Seeders;

use App\Models\Banner;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Banner::updateOrCreate(
            ['title' => 'Promo Spesial Hari Ini!'],
            [
                'subtitle' => 'Penawaran Eksklusif',
                'subtitle_en' => 'Exclusive Offer',
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
            ]
        );
    }
}
