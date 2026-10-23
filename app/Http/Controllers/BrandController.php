<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    /**
     * Display a listing of luxury fragrance brands.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', $request->input('q', '')));

        $query = Brand::query()
            ->withCount('products')
            ->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('description_en', 'like', "%{$search}%");
            });
        }

        return Inertia::render('brands', [
            'brands' => Inertia::defer(function () use ($query) {
                return $query->get()->map(function (Brand $b) {
                    return [
                        'id' => $b->id,
                        'name' => $b->name,
                        'slug' => $b->slug,
                        'description' => $b->description ?? '',
                        'description_en' => $b->description_en ?? '',
                        'collectionsCount' => (int) $b->products_count,
                        'image' => $b->thumbnail ?: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
                    ];
                })->values()->all();
            }),
            'searchQuery' => $search,
        ]);
    }
}
