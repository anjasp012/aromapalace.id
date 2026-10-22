<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $user_id
 * @property bool $for_admin
 * @property string $type
 * @property string $title
 * @property string $body
 * @property string|null $url
 * @property array<string, mixed>|null $data
 * @property bool $is_read
 * @property Carbon|null $read_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Notification extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'for_admin',
        'type',
        'title',
        'body',
        'url',
        'data',
        'is_read',
        'read_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'for_admin' => 'boolean',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
            'data' => 'array',
        ];
    }

    /**
     * Relationship to the targeted customer (if any).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
