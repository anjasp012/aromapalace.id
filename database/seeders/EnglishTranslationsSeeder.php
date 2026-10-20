<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EnglishTranslationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Products
        $productTranslations = [
            1 => 'A royal oud masterpiece marrying decades-aged Cambodian agarwood with Persian saffron and golden ambergris. Specially blended using traditional maceration techniques in oak casks to produce an unforgettable, majestic sillage.',
            2 => 'Delicate dawn-harvested Centifolia rose petals from the estates of Grasse, draped in Madagascar bourbon vanilla and warm white amber. An olfactory impression of plush velvet silk, undeniably elegant and captivating.',
            3 => 'Pure Mysore sandalwood harmonious with the grace of Florentine iris, ancient Egyptian papyrus, and a calming breeze of Virginian cedarwood, exuding tranquil intellect and refined balance.',
            4 => 'Mediterranean coastal sunshine captured in a bottle. Crisp Capri Cédrat citrus combined with pure sea salt crystals, neroli blossoms, and sun-bleached driftwood radiating eternal optimism.',
            5 => 'Dark smoked Madagascar vanilla intertwined with raw bittersweet cacao, benzoin tears, and rich golden amber. A supreme gourmand indulgence that seductively tempts the senses.',
        ];
        foreach ($productTranslations as $id => $en) {
            DB::table('products')->where('id', $id)->update(['description_en' => $en]);
        }

        // 2. Articles
        $articleTranslations = [
            1 => [
                'title_en' => 'The Art of Maceration: Secrets of Royal Oud Fragrance Depth',
                'excerpt_en' => 'Delving into traditional oak barrel maceration techniques that transform raw oud oils into priceless fragrance symphonies.',
                'content_en' => '<p>Maceration is the cornerstone of luxury perfumery. When raw Cambodian oud oil is aged in charred oak barrels for decades, a magical transformation occurs. Volatile notes soften into velvety resins, unveiling complex layers of dark honey, dried fruits, and smoky woods.</p><p>At Aroma Palace, our master perfumers adhere strictly to traditional Arabian blending techniques, ensuring every bottle delivers unparalleled longevity and opulent projection.</p>',
            ],
            2 => [
                'title_en' => 'Secrets to Make Your Perfume Last All Day Long',
                'excerpt_en' => 'Learn essential layering techniques and optimal pulse points to ensure fragrance longevity exceeding 12 hours in tropical climates.',
                'content_en' => '<p>Longevity begins with skin hydration. Applying an unscented moisturizer or matching perfume oil prior to spraying acts as an anchor for fragrance molecules. Focus on warm pulse points—behind the ears, base of the neck, and inner elbows—while avoiding rubbing your wrists together.</p>',
            ],
            3 => [
                'title_en' => 'Fragrance Trends 2026: The Rise of Elegant Woody & Gourmand Notes',
                'excerpt_en' => 'Exploring how warm woods harmonized with bourbon vanilla, roasted pistachios, and exotic spices dominate world fragrance runways.',
                'content_en' => '<p>The global fragrance landscape in 2026 embraces comforting decadence. Modern niche houses are pairing dark cedar and smoked sandalwood with edible accents of salted caramel, tonka bean, and roasted pistachio, creating addictive olfactory signatures.</p>',
            ],
            4 => [
                'title_en' => 'The Difference Between Eau de Parfum, Eau de Toilette, and Extrait de Parfum',
                'excerpt_en' => 'Understand perfume oil concentrations, alcohol formulation ratios, and longevity expectations for each fragrance category.',
                'content_en' => '<p>Fragrance concentration dictates both projection and staying power. Eau de Toilette typically contains 5-15% perfume oil, Eau de Parfum elevates this to 15-20%, while pure Extrait de Parfum exceeds 25-40% concentration, providing enduring skin scent for over 18 hours.</p>',
            ],
            5 => [
                'title_en' => 'Guide to Selecting Your Signature Scent to Match Your Personality',
                'excerpt_en' => 'Discover the quintessential fragrance profile that perfectly reflects your personal character and executive presence.',
                'content_en' => '<p>Your signature scent communicates before you even speak. Bold leaders naturally gravitate toward smoky woods and leather accords, creative souls thrive with luminous citrus and minerals, while romantic spirits flourish in nocturnal florals and soft musk.</p>',
            ],
        ];
        foreach ($articleTranslations as $id => $data) {
            DB::table('articles')->where('id', $id)->update($data);
        }

        // 3. Vouchers
        $voucherTranslations = [
            'AROMA40' => [
                'name_en' => 'Aroma Royale Special 40%',
                'description_en' => 'Enjoy an exclusive 40% discount across our entire curated artisanal fragrance collection at Aroma Palace.',
            ],
            'DUBAI25' => [
                'name_en' => 'Dubai Oud Collection 25%',
                'description_en' => 'Exclusive 25% discount on luxurious Oriental and signature Dubai Oud perfume collections.',
            ],
            'ROYALE10' => [
                'name_en' => 'Royale Welcome Treat 10%',
                'description_en' => 'A complimentary 10% appreciation voucher for loyal connoisseurs and newcomers at Aroma Palace.',
            ],
            'MEMBERVIP' => [
                'name_en' => 'Exclusive Member VIP Rp100,000 Off',
                'description_en' => 'Special flat Rp 100,000 discount voucher reserved exclusively for Aroma Palace Royale Club members.',
            ],
        ];
        foreach ($voucherTranslations as $code => $data) {
            DB::table('vouchers')->where('code', $code)->update($data);
        }

        // 4. Categories
        $categoryTranslations = [
            1 => ['name_en' => 'Men\'s Perfume', 'description_en' => 'A masculine fragrance collection exuding authoritative presence, luxury, and magnetic charisma.'],
            2 => ['name_en' => 'Women\'s Perfume', 'description_en' => 'Graceful, sensual, and captivating feminine essences distilled from rare blossoms.'],
            3 => ['name_en' => 'Unisex Fragrance', 'description_en' => 'Exquisite harmonious scents impeccably suited for both distinguished gentlemen and ladies.'],
            4 => ['name_en' => 'Discovery Sets & Vials', 'description_en' => 'Exclusive miniature sample curations designed to explore our atelier\'s aromatic spectrum.'],
            5 => ['name_en' => 'Artisanal Attar', 'description_en' => 'Alcohol-free pure perfume oils extracted using age-old hydro-distillation traditions.'],
        ];
        foreach ($categoryTranslations as $id => $data) {
            DB::table('categories')->where('id', $id)->update($data);
        }

        // 5. Brands
        $brandTranslations = [
            1 => 'Middle Eastern royal perfume atelier featuring decades-aged Cambodian oud and Persian saffron.',
            2 => 'French haute perfumery house blending Grasse Centifolia rose extractions with Madagascar bourbon vanilla.',
            3 => 'Contemporary niche creator celebrating pure Mysore sandalwood and precious Florentine iris.',
            4 => 'Distiller of vibrant Mediterranean coastal citrus harvested from Amalfi and Capri sun-drenched cliffs.',
            5 => 'Master of Oriental gourmands and balsamic resins infused with exotic Arabian Gulf spices.',
        ];
        foreach ($brandTranslations as $id => $en) {
            DB::table('brands')->where('id', $id)->update(['description_en' => $en]);
        }

        // 6. Loyalty Rewards
        $rewardTranslations = [
            1 => ['name_en' => 'Rp 25,000 Discount Voucher', 'description_en' => 'Instant Rp 25,000 price deduction on your preferred perfume with no complicated conditions.'],
            2 => ['name_en' => 'Free Express VIP Shipping Voucher', 'description_en' => 'Complimentary expedited delivery to any city across Indonesia via VIP courier.'],
            3 => ['name_en' => 'Rp 50,000 Discount Voucher', 'description_en' => 'Special Rp 50,000 privilege valid for all Dubai perfume variants at Aroma Palace.'],
            4 => ['name_en' => 'Rp 100,000 Discount Voucher', 'description_en' => 'Exclusive Rp 100,000 price deduction on our luxury artisanal collection.'],
            5 => ['name_en' => 'Special 20% Off Voucher', 'description_en' => '20% discount across all product categories on your upcoming fragrance order.'],
            6 => ['name_en' => 'Royale Privilege 35% Off Voucher', 'description_en' => 'Top-tier Royale Privilege 35% discount for dedicated collectors of rare Dubai fragrances.'],
        ];
        foreach ($rewardTranslations as $id => $data) {
            DB::table('loyalty_rewards')->where('id', $id)->update($data);
        }

        // 7. Stores
        DB::table('stores')->where('id', 1)->update([
            'description_en' => 'Grand luxury boutique situated on the Ground Floor, showcasing our complete Dubai perfume collection with private VIP scent consultation rooms.',
        ]);
        DB::table('stores')->where('id', 2)->update([
            'description_en' => 'Flagship atelier at Senayan City featuring artisanal custom attar blending and sensory fragrance discovery bars.',
        ]);
    }
}
