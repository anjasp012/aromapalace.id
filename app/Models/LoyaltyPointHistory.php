<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int $membership_id
 * @property string $type
 * @property int $points
 * @property int $balance_after
 * @property string $description
 * @property string|null $reference_id
 * @property Carbon|null $created_at
 * @property-read User $user
 * @property-read Membership $membership
 */
#[Fillable([
    'user_id',
    'membership_id',
    'type',
    'points',
    'balance_after',
    'description',
    'reference_id',
    'created_at',
])]
class LoyaltyPointHistory extends Model
{
    use HasFactory;

    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'balance_after' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Determine if this mutation is positive (Poin Masuk).
     */
    public function isPositive(): bool
    {
        return $this->points > 0;
    }

    /**
     * Get transaction category ('masuk' or 'berkurang').
     */
    public function getCategoryAttribute(): string
    {
        return $this->points >= 0 ? 'masuk' : 'berkurang';
    }

    /**
     * @return BelongsTo<Membership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(Membership::class);
    }
}
