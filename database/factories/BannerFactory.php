<?php

namespace Database\Factories;

use App\Models\Banner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Banner>
 */
class BannerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subtitle' => 'Penawaran Eksklusif',
            'subtitle_en' => 'Exclusive Offer',
            'title' => fake()->sentence(3),
            'title_en' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'description_en' => fake()->paragraph(),
            'image' => '/images/logo.png',
            'button_text' => 'Belanja Promo',
            'button_text_en' => 'Shop Promo',
            'button_link' => '/products?discount=1',
            'secondary_button_text' => 'Cek Keranjang',
            'secondary_button_text_en' => 'View Cart',
            'secondary_button_link' => '/cart',
            'is_active' => true,
        ];
    }
}

