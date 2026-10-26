<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Parfum Pria',
                'slug' => 'parfum-pria',
                'thumbnail' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80',
                'description' => 'Koleksi wewangian maskulin dengan karakter tegas, mewah, dan berwibawa.',
            ],
            [
                'name' => 'Parfum Wanita',
                'slug' => 'parfum-wanita',
                'thumbnail' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=400&q=80',
                'description' => 'Wewangian feminin yang anggun, sensual, dan memikat dari sari bunga langka.',
            ],
            [
                'name' => 'Unisex Fragrance',
                'slug' => 'unisex-fragrance',
                'thumbnail' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
                'description' => 'Harmoni aroma netral nan memikat yang cocok untuk pria maupun wanita berkelas.',
            ],
            [
                'name' => 'Discovery Sets & Vials',
                'slug' => 'discovery-sets-vials',
                'thumbnail' => 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=400&q=80',
                'description' => 'Kurasi sampel eksklusif produk mini untuk menjelajahi spektrum aroma atelier.',
            ],
            [
                'name' => 'Artisanal Attar',
                'slug' => 'artisanal-attar',
                'thumbnail' => 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=400&q=80',
                'description' => 'Konsentrasi minyak wangi murni bebas alkohol dengan metode ekstraksi kuno.',
            ],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['slug' => $cat['slug']],
                $cat
            );
        }
    }
}
