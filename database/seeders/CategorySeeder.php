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
                'description' => 'Koleksi wewangian maskulin dengan karakter tegas, mewah, dan berwibawa.',
            ],
            [
                'name' => 'Parfum Wanita',
                'slug' => 'parfum-wanita',
                'description' => 'Wewangian feminin yang anggun, sensual, dan memikat dari sari bunga langka.',
            ],
            [
                'name' => 'Unisex Fragrance',
                'slug' => 'unisex-fragrance',
                'description' => 'Harmoni aroma netral nan memikat yang cocok untuk pria maupun wanita berkelas.',
            ],
            [
                'name' => 'Discovery Sets & Vials',
                'slug' => 'discovery-sets-vials',
                'description' => 'Kurasi sampel eksklusif produk mini untuk menjelajahi spektrum aroma atelier.',
            ],
            [
                'name' => 'Artisanal Attar',
                'slug' => 'artisanal-attar',
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
