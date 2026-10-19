<?php

namespace Database\Seeders;

use App\Models\LoyaltyReward;
use Illuminate\Database\Seeder;

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
                'description' => 'Potongan langsung Rp 25.000 untuk pembelian parfum pilihan tanpa syarat ribet.',
                'points_required' => 100,
                'reward_type' => 'fixed',
                'reward_value' => 25000,
                'min_order_amount' => 200000,
                'max_discount_amount' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Bebas Ongkir VIP Ekspedisi',
                'description' => 'Bebas biaya ongkos kirim ke seluruh kota di Indonesia dengan kurir VIP kilat.',
                'points_required' => 150,
                'reward_type' => 'free_shipping',
                'reward_value' => 30000,
                'min_order_amount' => 0,
                'max_discount_amount' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Potongan Rp 50.000',
                'description' => 'Diskon istimewa Rp 50.000 berlaku untuk seluruh varian parfum Dubai di Aroma Palace.',
                'points_required' => 200,
                'reward_type' => 'fixed',
                'reward_value' => 50000,
                'min_order_amount' => 400000,
                'max_discount_amount' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Potongan Rp 100.000',
                'description' => 'Potongan eksklusif Rp 100.000 untuk koleksi wewangian artisanal premium pilihan Anda.',
                'points_required' => 350,
                'reward_type' => 'fixed',
                'reward_value' => 100000,
                'min_order_amount' => 750000,
                'max_discount_amount' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Diskon Spesial 20%',
                'description' => 'Diskon 20% tanpa batas kategori produk untuk transaksi wewangian berikutnya.',
                'points_required' => 500,
                'reward_type' => 'percentage',
                'reward_value' => 20,
                'min_order_amount' => 500000,
                'max_discount_amount' => 500000,
                'is_active' => true,
            ],
            [
                'name' => 'Voucher Royale Privilege 35%',
                'description' => 'Voucher kasta tertinggi Royale Privilege 35% untuk kolektor setia wewangian langka Dubai.',
                'points_required' => 1000,
                'reward_type' => 'percentage',
                'reward_value' => 35,
                'min_order_amount' => 1000000,
                'max_discount_amount' => 1500000,
                'is_active' => true,
            ],
        ];

        foreach ($rewards as $reward) {
            LoyaltyReward::updateOrCreate(
                ['name' => $reward['name']],
                $reward
            );
        }
    }
}
