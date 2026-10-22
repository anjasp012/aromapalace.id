<?php

namespace Database\Factories;

use App\Models\SliderPromo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SliderPromo>
 */
class SliderPromoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'title_en' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'description_en' => fake()->paragraph(),
            'link' => '/products',
            'thumbnail' => '/images/logo.png',
        ];
    }
}
