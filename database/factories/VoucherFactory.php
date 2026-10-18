<?php

namespace Database\Factories;

use App\Models\Voucher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Voucher>
 */
class VoucherFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('PROMO-###??')),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'terms' => [
                'Berlaku untuk semua pengguna terdaftar.',
                'Minimal transaksi sesuai ketentuan voucher.',
                'Tidak dapat diuangkan.',
            ],
            'type' => 'percentage',
            'value' => fake()->randomElement([10, 15, 20, 25, 40]),
            'min_order_amount' => 500000,
            'max_discount_amount' => 1000000,
            'usage_limit' => 100,
            'used_count' => 0,
            'starts_at' => now()->subDay(),
            'expires_at' => now()->addMonth(),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the voucher is fixed amount.
     */
    public function fixed(int $amount = 100000): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'fixed',
            'value' => $amount,
            'max_discount_amount' => null,
        ]);
    }

    /**
     * Indicate that the voucher is expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDays(2),
        ]);
    }

    /**
     * Indicate that the voucher is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
