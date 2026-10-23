<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property string $key
 * @property string|null $value
 * @property string $group
 * @property string $type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'key',
    'value',
    'group',
    'type',
])]
class Setting extends Model
{
    use HasFactory;

    protected const CACHE_KEY = 'app_settings_all';

    protected const CACHE_TTL_SECONDS = 86400; // 24 hours

    /**
     * Get a setting value by key with optional default.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $all = static::getAll();

        if (array_key_exists($key, $all)) {
            $val = $all[$key];

            return ($val !== null && $val !== '') ? $val : $default;
        }

        return $default;
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, mixed $value, string $group = 'general', string $type = 'string'): static
    {
        $setting = static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value !== null ? (string) $value : null,
                'group' => $group,
                'type' => $type,
            ]
        );

        static::clearCache();

        return $setting;
    }

    /**
     * Get all settings as key => value array from cache or DB.
     *
     * @return array<string, mixed>
     */
    public static function getAll(): array
    {
        return Cache::remember(static::CACHE_KEY, static::CACHE_TTL_SECONDS, function () {
            return static::query()
                ->pluck('value', 'key')
                ->all();
        });
    }

    /**
     * Clear settings cache.
     */
    public static function clearCache(): void
    {
        Cache::forget(static::CACHE_KEY);
    }
}
