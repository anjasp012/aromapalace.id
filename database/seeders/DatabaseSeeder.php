<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            CategorySeeder::class,
            BrandSeeder::class,
            ProductSeeder::class,
            VoucherSeeder::class,
            ArticleSeeder::class,
            StoreSeeder::class,
            PaymentMethodSeeder::class,
            LoyaltyRewardSeeder::class,
            SliderPromoSeeder::class,
        ]);
    }
}
