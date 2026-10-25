<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $label
 * @property string $recipient_name
 * @property string $recipient_phone
 * @property int|null $province_id
 * @property string|null $province_name
 * @property int|null $city_id
 * @property string $city_name
 * @property int|null $district_id
 * @property string $district_name
 * @property int|null $subdistrict_id
 * @property string $subdistrict_name
 * @property string $postal_code
 * @property string $address
 * @property float|null $latitude
 * @property float|null $longitude
 * @property bool $is_primary
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read string $formatted_address
 */
#[Fillable([
    'user_id',
    'label',
    'recipient_name',
    'recipient_phone',
    'province_id',
    'province_name',
    'city_id',
    'city_name',
    'district_id',
    'district_name',
    'subdistrict_id',
    'subdistrict_name',
    'postal_code',
    'address',
    'latitude',
    'longitude',
    'is_primary',
])]
class UserAddress extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'user_addresses';

    /**
     * @var array<int, string>
     */
    protected $appends = [
        'formatted_address',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'province_id' => 'integer',
            'city_id' => 'integer',
            'district_id' => 'integer',
            'subdistrict_id' => 'integer',
            'latitude' => 'float',
            'longitude' => 'float',
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
     * Get the human readable full formatted address.
     */
    public function getFormattedAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->subdistrict_name ? "Kel. {$this->subdistrict_name}" : null,
            $this->district_name ? "Kec. {$this->district_name}" : null,
            $this->city_name,
            $this->province_name,
            $this->postal_code,
        ]);

        return implode(', ', $parts);
    }
}
