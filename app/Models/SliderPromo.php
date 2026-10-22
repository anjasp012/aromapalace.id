<?php

namespace App\Models;

use App\Models\Concerns\FlushesCatalogCache;
use Database\Factories\SliderPromoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string|null $title_en
 * @property string|null $description
 * @property string|null $description_en
 * @property string|null $link
 * @property string $thumbnail
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['title', 'title_en', 'description', 'description_en', 'link', 'thumbnail'])]
class SliderPromo extends Model
{
    /** @use HasFactory<SliderPromoFactory> */
    use FlushesCatalogCache, HasFactory;
}
