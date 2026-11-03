<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $district_id
 * @property string $name
 * @property string|null $postal_code
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class CoverageSubdistrict extends Model
{
    public $incrementing = false;

    protected $fillable = [
        'id',
        'district_id',
        'name',
        'postal_code',
    ];

    /**
     * @return BelongsTo<CoverageDistrict, $this>
     */
    public function district(): BelongsTo
    {
        return $this->belongsTo(CoverageDistrict::class, 'district_id');
    }
}
