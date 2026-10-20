<?php

namespace App\Models\Concerns;

use App\Support\CatalogCache;

/**
 * Invalidate the public catalog cache whenever this model changes.
 */
trait FlushesCatalogCache
{
    protected static function bootFlushesCatalogCache(): void
    {
        // "updated" also covers increment()/decrement(), e.g. stock deduction at checkout.
        static::created(fn () => CatalogCache::flush());
        static::updated(fn () => CatalogCache::flush());
        static::deleted(fn () => CatalogCache::flush());
    }
}
