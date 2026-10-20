<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Versioned cache for public catalog data (home, product list, product detail).
 *
 * Every cached key embeds the current catalog version. Any change to a catalog
 * model bumps the version, so stale entries are simply never read again and
 * expire on their own. Works with every cache driver (redis, database, file,
 * array) because it does not rely on cache tags.
 */
class CatalogCache
{
    /**
     * Default lifetime for catalog entries, in seconds.
     */
    public const TTL = 600;

    protected const VERSION_KEY = 'catalog:version';

    /**
     * Get an item from the catalog cache, or store the default value.
     *
     * @template TValue
     *
     * @param  Closure(): TValue  $callback
     * @return TValue
     */
    public static function remember(string $key, Closure $callback, ?int $ttl = null): mixed
    {
        return Cache::remember(static::key($key), $ttl ?? static::TTL, $callback);
    }

    /**
     * Invalidate every catalog entry by moving to a new version.
     */
    public static function flush(): void
    {
        Cache::forever(static::VERSION_KEY, static::version() + 1);
    }

    /**
     * Build a stable key from an array of request filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public static function hash(array $filters): string
    {
        ksort($filters);

        return md5((string) json_encode($filters));
    }

    protected static function version(): int
    {
        return (int) Cache::get(static::VERSION_KEY, 1);
    }

    protected static function key(string $key): string
    {
        return 'catalog:v'.static::version().':'.$key;
    }
}
