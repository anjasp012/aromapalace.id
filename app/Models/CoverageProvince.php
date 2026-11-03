<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class CoverageProvince extends Model
{
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
    ];

    /**
     * @return HasMany<CoverageCity, $this>
     */
    public function cities(): HasMany
    {
        return $this->hasMany(CoverageCity::class, 'province_id');
    }
}
