<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'query',
    ];

    /**
     * Get the user that owns the search history record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
