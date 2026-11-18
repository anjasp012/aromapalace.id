<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
use Database\Factories\BannerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $subtitle
 * @property string|null $subtitle_en
 * @property string $title
 * @property string|null $title_en
 * @property string|null $description
 * @property string|null $description_en
 * @property string $image
 * @property string|null $button_text
 * @property string|null $button_text_en
 * @property string|null $button_link
 * @property string|null $secondary_button_text
 * @property string|null $secondary_button_text_en
 * @property string|null $secondary_button_link
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'subtitle',
    'subtitle_en',
    'title',
    'title_en',
    'description',
    'description_en',
    'image',
    'button_text',
    'button_text_en',
    'button_link',
    'secondary_button_text',
    'secondary_button_text_en',
    'secondary_button_link',
    'is_active',
])]
class Banner extends Model
{
    /** @use HasFactory<BannerFactory> */
    use FlushesCatalogCache, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}

