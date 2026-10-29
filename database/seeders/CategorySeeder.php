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
            // Genders
            [
                'name' => 'Men',
                'name_en' => 'Men',
                'type' => 'genders',
                'slug' => 'parfum-pria',
                'thumbnail' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80',
                'description' => 'Koleksi wewangian maskulin dengan karakter tegas, mewah, dan berwibawa.',
                'description_en' => 'Masculine fragrance collection with bold, luxurious, and authoritative character.',
            ],
            [
                'name' => 'Women',
                'name_en' => 'Women',
                'type' => 'genders',
                'slug' => 'parfum-wanita',
                'thumbnail' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=400&q=80',
                'description' => 'Wewangian feminin yang anggun, sensual, dan memikat dari sari bunga langka.',
                'description_en' => 'Feminine fragrance of elegance, sensuality, and allure crafted from rare florals.',
            ],
            [
                'name' => 'Unisex',
                'name_en' => 'Unisex',
                'type' => 'genders',
                'slug' => 'unisex-fragrance',
                'thumbnail' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
                'description' => 'Harmoni aroma netral nan memikat yang cocok untuk pria maupun wanita berkelas.',
                'description_en' => 'Harmonious neutral scent allure designed for sophisticated men and women alike.',
            ],

            // Concentrates
            [
                'name' => 'Extrait de Parfum',
                'name_en' => 'Extrait de Parfum',
                'type' => 'concentrates',
                'slug' => 'extrait-de-parfum',
                'thumbnail' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80',
                'description' => 'Konsentrasi minyak wangi tertinggi (30-40%) dengan ketahanan superior hingga 24 jam.',
                'description_en' => 'Highest perfume oil concentration (30-40%) with superior longevity up to 24 hours.',
            ],
            [
                'name' => 'Eau de Parfum',
                'name_en' => 'Eau de Parfum',
                'type' => 'concentrates',
                'slug' => 'eau-de-parfum',
                'thumbnail' => 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=400&q=80',
                'description' => 'Konsentrasi kaya 15-20% ideal untuk pemakaian harian berkarakter tahan 8-12 jam.',
                'description_en' => 'Rich 15-20% concentration ideal for daily distinctive wear lasting 8-12 hours.',
            ],
            [
                'name' => 'Eau de Toilette',
                'name_en' => 'Eau de Toilette',
                'type' => 'concentrates',
                'slug' => 'eau-de-toilette',
                'thumbnail' => 'https://images.unsplash.com/photo-1583445013765-46c20c4a6772?auto=format&fit=crop&w=400&q=80',
                'description' => 'Aroma segar dan ringan dengan proyeksi tajam untuk kesegaran aktif sehari-hari.',
                'description_en' => 'Fresh and light aromatic projection for active everyday elegance.',
            ],
            [
                'name' => 'Artisanal Attar',
                'name_en' => 'Artisanal Attar',
                'type' => 'concentrates',
                'slug' => 'artisanal-attar',
                'thumbnail' => 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=400&q=80',
                'description' => 'Konsentrasi minyak murni bebas alkohol dengan metode distilasi tradisional berabad-abad.',
                'description_en' => 'Alcohol-free pure oil concentrate extracted through centuries-old artisanal distillation.',
            ],

            // Scents
            [
                'name' => 'Woody & Smoky',
                'name_en' => 'Woody & Smoky',
                'type' => 'scents',
                'slug' => 'woody-smoky',
                'thumbnail' => null,
                'description' => 'Nuansa kayu oudh, cedarwood, dan asap dupa yang mendalam dan misterius.',
                'description_en' => 'Deep mysterious notes of agarwood oudh, cedar, and smoky frankincense.',
            ],
            [
                'name' => 'Floral Oriental',
                'name_en' => 'Floral Oriental',
                'type' => 'scents',
                'slug' => 'floral-oriental',
                'thumbnail' => null,
                'description' => 'Kelopak mawar damaskus, melati sambac, dan rempah manis nan eksotis.',
                'description_en' => 'Damask rose petals, royal jasmine sambac, and warm exotic spices.',
            ],
            [
                'name' => 'Citrus Fresh',
                'name_en' => 'Citrus Fresh',
                'type' => 'scents',
                'slug' => 'citrus-fresh',
                'thumbnail' => null,
                'description' => 'Kesegaran bergamot calabria, lemon sicilia, dan percikan aquatic yang membangkitkan energi.',
                'description_en' => 'Crisp energy of calabrian bergamot, sicilian lemon, and refreshing aquatic zest.',
            ],
            [
                'name' => 'Warm Amber & Spice',
                'name_en' => 'Warm Amber & Spice',
                'type' => 'scents',
                'slug' => 'warm-amber-spice',
                'thumbnail' => null,
                'description' => 'Sentuhan hangat amber keemasan, kayu manis, dan vanila madagascar yang mewah.',
                'description_en' => 'Warm luxury of golden amber, royal cinnamon, and madagascar vanilla.',
            ],
            [
                'name' => 'Discovery Sets & Vials',
                'name_en' => 'Discovery Sets & Vials',
                'type' => 'scents',
                'slug' => 'discovery-sets-vials',
                'thumbnail' => null,
                'description' => 'Kurasi sampel eksklusif produk mini untuk menjelajahi spektrum aroma atelier.',
                'description_en' => 'Curated luxury discovery discovery vials exploring the full olfactory spectrum.',
            ],
            [
                'name' => 'Aquatic & Marine',
                'name_en' => 'Aquatic & Marine',
                'type' => 'scents',
                'slug' => 'aquatic-marine',
                'thumbnail' => null,
                'description' => 'Nuansa kesegaran hembusan angin samudra dan mineral garam laut yang jernih.',
                'description_en' => 'Crisp ocean breeze with fresh mineral sea salt and marine notes.',
            ],
            [
                'name' => 'Gourmand & Vanilla',
                'name_en' => 'Gourmand & Vanilla',
                'type' => 'scents',
                'slug' => 'gourmand-vanilla',
                'thumbnail' => null,
                'description' => 'Aroma manis vanila madagascar, kopi panggang, dan karamel mentega yang memikat.',
                'description_en' => 'Rich madagascar vanilla, roasted coffee beans, and warm butter caramel.',
            ],
            [
                'name' => 'Aromatic Fougere',
                'name_en' => 'Aromatic Fougere',
                'type' => 'scents',
                'slug' => 'aromatic-fougere',
                'thumbnail' => null,
                'description' => 'Keharuman lavender prancis, lumut ek oakmoss, dan dedaunan herbal aromatik.',
                'description_en' => 'French lavender, green oakmoss, and fresh aromatic botanical herbs.',
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
