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
