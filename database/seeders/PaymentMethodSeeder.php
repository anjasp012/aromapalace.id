<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $methods = [
            [
                'code' => 'bca_va',
                'name' => 'Bank Central Asia (BCA VA)',
                'icon' => 'https://storage.googleapis.com/komerce/assets/logo/bca.png',
                'type' => 'automatic',
                'is_active' => true,
            ],
            [
                'code' => 'mandiri_va',
                'name' => 'Bank Mandiri (Mandiri VA)',
                'icon' => 'https://storage.googleapis.com/komerce/assets/logo/mandiri.png',
                'type' => 'automatic',
                'is_active' => true,
            ],
            [
                'code' => 'bni_va',
                'name' => 'Bank Negara Indonesia (BNI VA)',
                'icon' => 'https://storage.googleapis.com/komerce/assets/logo/bni.png',
                'type' => 'automatic',
                'is_active' => true,
            ],
            [
                'code' => 'bri_va',
                'name' => 'Bank Rakyat Indonesia (BRI VA)',
                'icon' => 'https://storage.googleapis.com/komerce/assets/logo/bri.png',
                'type' => 'automatic',
                'is_active' => true,
            ],
            [
                'code' => 'permata_va',
                'name' => 'Bank Permata (Permata VA)',
                'icon' => 'https://storage.googleapis.com/komerce/assets/logo/permata.png',
                'type' => 'automatic',
                'is_active' => true,
            ],
            [
                'code' => 'cimb_va',
                'name' => 'Bank CIMB Niaga (CIMB VA)',
                'icon' => 'https://storage.googleapis.com/komerce/assets/logo/cimb.png',
                'type' => 'automatic',
                'is_active' => true,
            ],
            [
                'code' => 'qris',
                'name' => 'QRIS (Gopay, OVO, Dana, ShopeePay)',
                'icon' => 'https://storage.googleapis.com/komerce/assets/logo/QRIS.png',
                'type' => 'automatic',
                'is_active' => true,
            ],
            [
                'code' => 'manual_bca',
                'name' => 'BCA (Transfer Manual)',
                'icon' => 'bca',
                'type' => 'manual',
                'account_number' => '8720-1234-5678',
                'account_name' => 'PT Aroma Palace Indonesia',
                'is_active' => true,
            ],
            [
                'code' => 'manual_mandiri',
                'name' => 'Mandiri (Transfer Manual)',
                'icon' => 'mandiri',
                'type' => 'manual',
                'account_number' => '1370-0098-7654',
                'account_name' => 'PT Aroma Palace Indonesia',
                'is_active' => true,
            ],
        ];

        foreach ($methods as $item) {
            PaymentMethod::updateOrCreate(
                ['code' => $item['code']],
                $item
            );
        }
    }
}
