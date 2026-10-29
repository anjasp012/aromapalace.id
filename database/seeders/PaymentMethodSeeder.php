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
                'code' => 'payment_link',
                'name' => 'Payment Link',
                'icon' => 'pakasir',
            ],
            [
                'code' => 'qris',
                'name' => 'QRIS',
                'icon' => 'qris',
            ],
            [
                'code' => 'bri_va',
                'name' => 'BRI',
                'icon' => 'bri',
            ],
            [
                'code' => 'bni_va',
                'name' => 'BNI',
                'icon' => 'bni',
            ],
            [
                'code' => 'cimb_niaga_va',
                'name' => 'CIMB Niaga',
                'icon' => 'cimb',
            ],
            [
                'code' => 'maybank_va',
                'name' => 'Maybank',
                'icon' => 'maybank',
            ],
            [
                'code' => 'danamon_va',
                'name' => 'Danamon',
                'icon' => 'danamon',
            ],
            [
                'code' => 'bnc_va',
                'name' => 'Bank Neo Commerce',
                'icon' => 'bnc',
            ],
            [
                'code' => 'bsi_va',
                'name' => 'BSI',
                'icon' => 'bsi',
            ],
            [
                'code' => 'muamalat_va',
                'name' => 'Muamalat',
                'icon' => 'muamalat',
            ],
            [
                'code' => 'ocbc_va',
                'name' => 'OCBC',
                'icon' => 'ocbc',
                'type' => 'automatic',
            ],
            [
                'code' => 'manual_bca',
                'name' => 'BCA (Transfer Manual)',
                'icon' => 'bca',
                'type' => 'manual',
                'account_number' => '8720-1234-5678',
                'account_name' => 'PT Aroma Palace Indonesia',
            ],
            [
                'code' => 'manual_mandiri',
                'name' => 'Mandiri (Transfer Manual)',
                'icon' => 'mandiri',
                'type' => 'manual',
                'account_number' => '1370-0098-7654',
                'account_name' => 'PT Aroma Palace Indonesia',
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
