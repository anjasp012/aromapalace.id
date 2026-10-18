<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            [
                'name' => 'Aroma Royale',
                'slug' => 'aroma-royale',
                'thumbnail' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=300&q=80',
                'description' => 'Atelier parfum bangsawan bergaya Timur Tengah dengan oud Kamboja dan saffron Persia.',
            ],
            [
                'name' => 'Maison Floral',
                'slug' => 'maison-floral',
                'thumbnail' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=300&q=80',
                'description' => 'Rumah wewangian Prancis yang memadukan ekstraksi bunga mawar Centifolia Grasse dan vanilla bourbon.',
            ],
            [
                'name' => 'Artisanal Niche',
                'slug' => 'artisanal-niche',
                'thumbnail' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=300&q=80',
                'description' => 'Pencipta aroma niche kontemporer dengan kayu cendana Mysore dan iris Florentina.',
            ],
            [
                'name' => 'Capri Fragranze',
                'slug' => 'capri-fragranze',
                'thumbnail' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80',
                'description' => 'Penyuling aroma citrus Mediterania murni dari perkebunan pesisir Amalfi dan Capri.',
            ],
            [
                'name' => 'Amber & Tonka',
                'slug' => 'amber-tonka',
                'thumbnail' => 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=300&q=80',
                'description' => 'Pakar gourmand oriental dan balsamic resin dari rempah-rempah eksotis Teluk Persia.',
            ],
        ];

        foreach ($brands as $brand) {
            Brand::updateOrCreate(
                ['slug' => $brand['slug']],
                $brand
            );
        }
    }
}
