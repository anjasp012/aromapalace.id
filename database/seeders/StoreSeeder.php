<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Seeder;

class StoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stores = [
            [
                'name' => 'Flagship Boutique Senayan City Jakarta',
                'description' => 'Senayan City Mall, Ground Floor Unit G-12, Jl. Asia Afrika Lot 19, Gelora, Tanah Abang, Jakarta Pusat 10270. Menghadirkan private scent lounge, layanan olfaktori eksklusif, serta konsultasi racikan parfum personal bersama master perfumer.',
                'thumbnail' => 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80',
                'latitude' => -6.227244,
                'longitude' => 106.797282,
                'gmaps_link' => 'https://maps.google.com/?q=-6.227244,106.797282',
            ],
            [
                'name' => 'Boutique Grand Indonesia Jakarta',
                'description' => 'Grand Indonesia Shopping Town, East Mall Level 1 Unit EM-18, Jl. M.H. Thamrin No. 1, Menteng, Jakarta Pusat 10310. Menyediakan seluruh koleksi extrait de parfum langka, discovery vial bar, dan gift engraving studio.',
                'thumbnail' => 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
                'latitude' => -6.195328,
                'longitude' => 106.821731,
                'gmaps_link' => 'https://maps.google.com/?q=-6.195328,106.821731',
            ],
            [
                'name' => 'Boutique Tunjungan Plaza 5 Surabaya',
                'description' => 'Tunjungan Plaza 5, Level UG Unit 08-09, Jl. Basuki Rahmat No. 8-12, Tegalsari, Surabaya 60261. Destinasi wewangian mewah utama di Jawa Timur dengan koleksi oud Timur Tengah dan artisanal attar terlengkap.',
                'thumbnail' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
                'latitude' => -7.262529,
                'longitude' => 112.739772,
                'gmaps_link' => 'https://maps.google.com/?q=-7.262529,112.739772',
            ],
            [
                'name' => 'Atelier Paris Van Java Bandung',
                'description' => 'Paris Van Java Resort Lifestyle Place, Resort Level Unit RL-22, Jl. Sukajadi No. 131-139, Cipedes, Bandung 40162. Suasana butik semi-outdoor bertema botanical garden dengan koleksi wewangian floral dan fresh citrus terbaik.',
                'thumbnail' => 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
                'latitude' => -6.889312,
                'longitude' => 107.596041,
                'gmaps_link' => 'https://maps.google.com/?q=-6.889312,107.596041',
            ],
            [
                'name' => 'Sanctuary Seminyak Bali',
                'description' => 'Jl. Kayu Aya No. 88, Seminyak, Kuta, Kabupaten Badung, Bali 80361. Butik bergaya resor tropis mewah yang menyajikan parfum niche musim panas, aromatherapy mist, dan custom fragrance blending.',
                'thumbnail' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
                'latitude' => -8.685324,
                'longitude' => 115.155416,
                'gmaps_link' => 'https://maps.google.com/?q=-8.685324,115.155416',
            ],
        ];

        foreach ($stores as $storeData) {
            Store::updateOrCreate(
                ['name' => $storeData['name']],
                $storeData
            );
        }
    }
}
