<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string|null $name_en
 * @property string|null $description
 * @property string|null $description_en
 * @property int $points_required
 * @property string $reward_type
 * @property int $reward_value
 * @property int $min_order_amount
 * @property int|null $max_discount_amount
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'name_en',
    'description',
    'description_en',
    'points_required',
    'reward_type',
    'reward_value',
    'min_order_amount',
    'max_discount_amount',
    'is_active',
])]
class LoyaltyReward extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'points_required' => 'integer',
            'reward_value' => 'integer',
            'min_order_amount' => 'integer',
            'max_discount_amount' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get formatted discount text.
     */
    public function getFormattedDiscount(): string
    {
        if ($this->reward_type === 'percentage') {
            return "{$this->reward_value}%";
        }
        if ($this->reward_type === 'free_shipping') {
            return 'Gratis Ongkir';
        }

        return 'Rp '.number_format($this->reward_value, 0, ',', '.');
    }
}
