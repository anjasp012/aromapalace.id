<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Display a listing of fragrance categories and families.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', $request->input('q', '')));

        $categoryImages = [
            'parfum-pria' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
            'men' => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
            'parfum-wanita' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80',
            'women' => 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80',
            'unisex-fragrance' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
            'unisex' => 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
            'discovery-sets-vials' => 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=600&q=80',
            'artisanal-attar' => 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80',
        ];

        $query = Category::query()
            ->withCount(['products' => fn ($q) => $q->published()])
            ->orderBy('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('description_en', 'like', "%{$search}%");
            });
        }

        $allCategories = $query->get()->map(function (Category $c) use ($categoryImages) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'name_en' => $c->name_en,
                'slug' => $c->slug,
                'type' => $c->type,
                'description' => $c->description ?? '',
                'description_en' => $c->description_en ?? '',
                'productsCount' => (int) $c->products_count,
                'image' => $c->thumbnail ?: ($categoryImages[$c->slug] ?? null),
            ];
        });

        $genders = $allCategories->where('type', 'genders')->values()->all();
        $concentrates = $allCategories->where('type', 'concentrates')->values()->all();
        $scents = $allCategories->where('type', 'scents')->values()->all();

        return Inertia::render('categories', [
            'genders' => $genders,
            'concentrates' => $concentrates,
            'scents' => $scents,
            'categories' => $allCategories->values()->all(),
            'searchQuery' => $search,
        ]);
    }
}
