<?php

namespace Database\Seeders;

use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vouchers = [
            [
                'code' => 'AROMA40',
                'name' => 'Aroma Royale Special 40%',
                'description' => 'Nikmati diskon istimewa sebesar 40% untuk seluruh koleksi wewangian artisanal pilihan Aroma Palace.',
                'terms' => [
                    'Berlaku untuk semua produk wewangian tanpa terkecuali.',
                    'Tidak ada batasan minimum nilai transaksi belanja.',
                    'Dapat digunakan untuk 1 kali checkout per akun.',
                    'Tidak dapat diuangkan atau ditukar dengan produk lain secara terpisah.',
                ],
                'type' => 'percentage',
                'value' => 40,
                'min_order_amount' => 0,
                'max_discount_amount' => null,
                'usage_limit' => 1000,
                'used_count' => 0,
                'starts_at' => now()->subDay(),
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ],
            [
                'code' => 'DUBAI25',
                'name' => 'Dubai Oud Collection 25%',
                'description' => 'Potongan 25% eksklusif untuk koleksi wewangian mewah bernuansa Oriental dan Oud khas Dubai.',
                'terms' => [
                    'Berlaku untuk seluruh koleksi parfum extrait dan niche pilihan.',
                    'Minimal nilai transaksi belanja Rp 500.000.',
                    'Berlaku untuk semua opsi pengiriman dan metode pembayaran.',
                    'Masa berlaku aktif sepanjang tahun promosi berlangsung.',
                ],
                'type' => 'percentage',
                'value' => 25,
                'min_order_amount' => 500000,
                'max_discount_amount' => 1500000,
                'usage_limit' => 500,
                'used_count' => 0,
                'starts_at' => now()->subDay(),
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ],
            [
                'code' => 'ROYALE10',
                'name' => 'Royale Welcome Treat 10%',
                'description' => 'Voucher apresiasi 10% untuk pelanggan setia dan pendatang baru di butik Aroma Palace.',
                'terms' => [
                    'Berlaku untuk seluruh katalog produk Aroma Palace.',
                    'Minimal transaksi belanja sebesar Rp 200.000.',
                    'Berlaku tanpa batas maksimal nominal potongan diskon.',
                ],
                'type' => 'percentage',
                'value' => 10,
                'min_order_amount' => 200000,
                'max_discount_amount' => null,
                'usage_limit' => 2000,
                'used_count' => 0,
                'starts_at' => now()->subDay(),
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ],
            [
                'code' => 'MEMBERVIP',
                'name' => 'Exclusive Member VIP Rp100.000',
                'description' => 'Spesial voucher potongan flat Rp 100.000 untuk anggota istimewa klub Aroma Palace.',
                'terms' => [
                    'Khusus anggota loyalty terdaftar di Aroma Palace.',
                    'Minimal transaksi belanja sebesar Rp 1.000.000.',
                    'Potongan langsung dipotong dari subtotal belanja saat checkout.',
                ],
                'type' => 'fixed',
                'value' => 100000,
                'min_order_amount' => 1000000,
                'max_discount_amount' => null,
                'usage_limit' => 300,
                'used_count' => 0,
                'starts_at' => now()->subDay(),
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ],
        ];

        foreach ($vouchers as $voucherData) {
            Voucher::updateOrCreate(
                ['code' => $voucherData['code']],
                $voucherData
            );
        }
    }
}
