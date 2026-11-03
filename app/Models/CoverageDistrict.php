<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $city_id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class CoverageDistrict extends Model
{
    public $incrementing = false;

    protected $fillable = [
        'id',
        'city_id',
        'name',
    ];

    /**
     * @return BelongsTo<CoverageCity, $this>
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(CoverageCity::class, 'city_id');
    }

    /**
     * @return HasMany<CoverageSubdistrict, $this>
     */
    public function subdistricts(): HasMany
    {
        return $this->hasMany(CoverageSubdistrict::class, 'district_id');
    }
}
