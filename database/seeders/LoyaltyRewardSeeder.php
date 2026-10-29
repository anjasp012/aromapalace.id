<?php

namespace Database\Seeders;

use App\Models\Voucher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LoyaltyRewardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rewards = [
            [
                'name' => 'Voucher Potongan Rp 25.000',
                'name_en' => 'Voucher Rp 25,000 Off',
                'description' => 'Potongan langsung Rp 25.000 untuk pembelian parfum pilihan tanpa syarat ribet.',
                'description_en' => 'Direct Rp 25,000 discount for your fragrance purchase without hassle.',
                'points_required' => 100,
                'reward_type' => 'fixed',
                'reward_value' => 25000,
                'min_order_amount' => 200000,
                'max_discount_amount' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Bebas Ongkir VIP Ekspedisi',
                'name_en' => 'Free Shipping VIP Voucher',
                'description' => 'Bebas biaya ongkos kirim ke seluruh kota di Indonesia dengan kurir VIP kilat.',
                'description_en' => 'Free express shipping across Indonesia with our dedicated VIP courier.',
                'points_required' => 150,
                'reward_type' => 'free_shipping',
                'reward_value' => 30000,
                'min_order_amount' => 0,
                'max_discount_amount' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Potongan Rp 50.000',
                'name_en' => 'Voucher Rp 50,000 Off',
                'description' => 'Diskon istimewa Rp 50.000 berlaku untuk seluruh varian parfum Dubai di Aroma Palace.',
                'description_en' => 'Special Rp 50,000 discount for all Dubai fragrances at Aroma Palace.',
                'points_required' => 200,
                'reward_type' => 'fixed',
                'reward_value' => 50000,
                'min_order_amount' => 400000,
                'max_discount_amount' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Potongan Rp 100.000',
                'name_en' => 'Voucher Rp 100,000 Off',
                'description' => 'Potongan eksklusif Rp 100.000 untuk koleksi wewangian artisanal premium pilihan Anda.',
                'description_en' => 'Exclusive Rp 100,000 off on our artisanal premium fragrance collections.',
                'points_required' => 350,
                'reward_type' => 'fixed',
                'reward_value' => 100000,
                'min_order_amount' => 750000,
                'max_discount_amount' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Diskon Spesial 20%',
                'name_en' => 'Special 20% Discount Voucher',
                'description' => 'Diskon 20% tanpa batas kategori produk untuk transaksi wewangian berikutnya.',
                'description_en' => '20% off across all product categories for your next fragrance purchase.',
                'points_required' => 500,
                'reward_type' => 'percentage',
                'reward_value' => 20,
                'min_order_amount' => 500000,
                'max_discount_amount' => 500000,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Royale Privilege 35%',
                'name_en' => 'Royale Privilege 35% Voucher',
                'description' => 'Voucher kasta tertinggi Royale Privilege 35% untuk kolektor setia wewangian langka Dubai.',
                'description_en' => 'The prestigious Royale Privilege 35% off for true collectors of rare Dubai fragrances.',
                'points_required' => 1000,
                'reward_type' => 'percentage',
                'reward_value' => 35,
                'min_order_amount' => 1000000,
                'max_discount_amount' => 1500000,
                'is_active' => true,
            ],
        ];

        $codes = [
            'Voucher Potongan Rp 25.000' => 'REW-POT25K',
            'Voucher Bebas Ongkir VIP Ekspedisi' => 'REW-VIPONGKIR',
            'Voucher Potongan Rp 50.000' => 'REW-POT50K',
            'Voucher Potongan Rp 100.000' => 'REW-POT100K',
            'Voucher Diskon Spesial 20%' => 'REW-DISKON20',
            'Voucher Royale Privilege 35%' => 'REW-ROYALE35',
        ];

        foreach ($rewards as $reward) {
            $code = $codes[$reward['name']] ?? ('REW-'.strtoupper(Str::random(6)));

            Voucher::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $reward['name'],
                    'name_en' => $reward['name_en'] ?? null,
                    'description' => $reward['description'],
                    'description_en' => $reward['description_en'] ?? null,
                    'type' => $reward['reward_type'] === 'free_shipping' ? 'fixed' : $reward['reward_type'],
                    'value' => $reward['reward_value'],
                    'min_order_amount' => $reward['min_order_amount'] ?? 0,
                    'max_discount_amount' => $reward['max_discount_amount'] ?? null,
                    'voucher_type' => 'reward',
                    'points_required' => $reward['points_required'],
                    'applicable_type' => 'all',
                    'user_id' => null,
                    'is_active' => $reward['is_active'] ?? true,
                ]
            );
        }
    }
}
