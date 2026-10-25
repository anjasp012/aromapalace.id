<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property string|null $awb
 * @property string|null $text
 * @property array|null $image
 * @property array|null $origin
 * @property array|null $destination
 * @property array|null $histories
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Order $order
 */
class Shipping extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'shipping';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'order_id',
        'awb',
        'text',
        'image',
        'origin',
        'destination',
        'histories',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_id' => 'integer',
            'image' => 'array',
            'origin' => 'array',
            'destination' => 'array',
            'histories' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
