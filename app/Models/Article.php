<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
use Database\Factories\ArticleFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string|null $title_en
 * @property string $slug
 * @property string|null $thumbnail
 * @property string $read_time
 * @property string $excerpt
 * @property string|null $excerpt_en
 * @property string $content
 * @property string|null $content_en
 * @property bool $is_draft
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Article extends Model
{
    /** @use HasFactory<ArticleFactory> */
    use FlushesCatalogCache, HasFactory;

    protected $guarded = ['id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_draft' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include published (non-draft) articles.
     *
     * @param  Builder<Article>  $query
     * @return Builder<Article>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_draft', false);
    }

    /**
     * Scope a query to only include draft articles.
     *
     * @param  Builder<Article>  $query
     * @return Builder<Article>
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('is_draft', true);
    }
}
