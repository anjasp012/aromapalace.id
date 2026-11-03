<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $province_id
 * @property string $name
 * @property string|null $type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class CoverageCity extends Model
{
    public $incrementing = false;

    protected $fillable = [
        'id',
        'province_id',
        'name',
        'type',
    ];

    /**
     * @return BelongsTo<CoverageProvince, $this>
     */
    public function province(): BelongsTo
    {
        return $this->belongsTo(CoverageProvince::class, 'province_id');
    }

    /**
     * @return HasMany<CoverageDistrict, $this>
     */
    public function districts(): HasMany
    {
        return $this->hasMany(CoverageDistrict::class, 'city_id');
    }
}
