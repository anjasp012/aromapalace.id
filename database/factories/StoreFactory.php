<?php

namespace Database\Factories;

use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Store>
 */
class StoreFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $lat = fake()->latitude(-6.3, -6.1);
        $lng = fake()->longitude(106.7, 106.9);

        return [
            'name' => 'Aroma Palace Boutique '.fake()->city(),
            'description' => fake()->paragraph(),
            'thumbnail' => 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80',
            'latitude' => $lat,
            'longitude' => $lng,
            'gmaps_link' => "https://maps.google.com/?q={$lat},{$lng}",
        ];
    }
}
