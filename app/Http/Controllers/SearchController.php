<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Product;
use App\Services\CatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Get live search suggestions for products and brands based on user query.
     */
    public function suggestions(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q', $request->input('query', '')));

        if ($q === '') {
            return response()->json([
                'products' => [],
                'brands' => [],
            ]);
        }

        $products = Product::with([
            'variants',
            'categories',
            'brandRelation',
            'galleries',
            'primaryImage',
            'reviews',
        ])
            ->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhereHas('brandRelation', function ($b) use ($q) {
                        $b->where('name', 'like', "%{$q}%");
                    })
                    ->orWhereHas('categories', function ($c) use ($q) {
                        $c->where('name', 'like', "%{$q}%");
                    });
            })
            ->take(6)
            ->get()
            ->map(function (Product $p) {
                return CatalogService::formatProduct($p);
            });

        $brands = Brand::withCount('products')
            ->where('name', 'like', "%{$q}%")
            ->take(4)
            ->get(['id', 'name', 'slug'])
            ->map(function (Brand $b) {
                return [
                    'id' => $b->id,
                    'name' => $b->name,
                    'slug' => $b->slug,
                    'products_count' => $b->products_count,
                ];
            });

        return response()->json([
            'products' => $products,
            'brands' => $brands,
        ]);
    }

    /**
     * Get current user's search history.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['history' => []]);
        }

        $history = $user->searchHistories()
            ->latest('updated_at')
            ->take(10)
            ->pluck('query')
            ->all();

        return response()->json(['history' => $history]);
    }

    /**
     * Store a search query into history.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|max:100',
        ]);

        $query = trim($validated['query']);
        if ($query === '') {
            return response()->json(['history' => []]);
        }

        $user = $request->user();
        if ($user) {
            $user->searchHistories()->updateOrCreate(
                ['query' => $query],
                ['updated_at' => now()]
            );

            // Keep only latest 15 records per user
            $keepIds = $user->searchHistories()->latest('updated_at')->take(15)->pluck('id');
            $user->searchHistories()->whereNotIn('id', $keepIds)->delete();

            $history = $user->searchHistories()->latest('updated_at')->take(10)->pluck('query')->all();

            return response()->json(['history' => $history]);
        }

        return response()->json(['history' => []]);
    }

    /**
     * Delete an item or all items from search history.
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $query = $request->input('query');
            if ($query) {
                $user->searchHistories()->where('query', $query)->delete();
            } else {
                $user->searchHistories()->delete();
            }

            $history = $user->searchHistories()->latest('updated_at')->take(10)->pluck('query')->all();

            return response()->json(['history' => $history]);
        }

        return response()->json(['history' => []]);
    }

    /**
     * Sync local search history to database after login.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'queries' => 'required|array',
            'queries.*' => 'string|max:100',
        ]);

        $user = $request->user();
        if ($user) {
            foreach ($validated['queries'] as $item) {
                $clean = trim((string) $item);
                if ($clean !== '') {
                    $user->searchHistories()->updateOrCreate(
                        ['query' => $clean],
                        ['updated_at' => now()]
                    );
                }
            }

            // Prune excess
            $keepIds = $user->searchHistories()->latest('updated_at')->take(15)->pluck('id');
            $user->searchHistories()->whereNotIn('id', $keepIds)->delete();

            $history = $user->searchHistories()->latest('updated_at')->take(10)->pluck('query')->all();

            return response()->json(['history' => $history]);
        }

        return response()->json(['history' => []]);
    }
}
