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

        $query = Category::query()
            ->withCount(['products' => fn ($q) => $q->published()])
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('description_en', 'like', "%{$search}%");
            });
        }

        $allCategories = $query->get()->map(function (Category $c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'name_en' => $c->name_en,
                'slug' => $c->slug,
                'type' => $c->type,
                'description' => $c->description ?? '',
                'description_en' => $c->description_en ?? '',
                'productsCount' => (int) $c->products_count,
                'image' => $c->thumbnail ?: null,
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
