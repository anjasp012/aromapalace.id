<?php

namespace Database\Seeders;

use App\Models\SliderPromo;
use Illuminate\Database\Seeder;

class SliderPromoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SliderPromo::updateOrCreate(
            ['title' => 'Koleksi Eksklusif Oud & Amber'],
            [
                'title_en' => 'Exclusive Oud & Amber Collection',
                'description' => 'Jelajahi keharuman mewah khas Timur Tengah yang diracik khusus untuk memikat setiap indra.',
                'description_en' => 'Explore the luxurious Middle Eastern scents crafted exclusively to captivate every sense.',
                'link' => '/products',
                'thumbnail' => '/images/logo.png',
            ]
        );

        SliderPromo::updateOrCreate(
            ['title' => 'Sensasi Keanggunan Parisian Floral'],
            [
                'title_en' => 'The Elegance of Parisian Floral',
                'description' => 'Perpaduan kelopak mawar Grasse dan melati murni dengan ketahanan aroma sepanjang hari.',
                'description_en' => 'A delicate fusion of Grasse rose petals and pure jasmine with long-lasting all-day sillage.',
                'link' => '/products',
                'thumbnail' => '/images/logo.png',
            ]
        );
    }
}
