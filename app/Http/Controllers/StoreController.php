<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    /**
     * Display a listing of store boutique locations.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', $request->input('q', '')));
        $city = trim((string) $request->input('city', 'all'));

        $query = Store::query()->orderBy('id');

        if ($city !== '' && strtolower($city) !== 'all') {
            $query->where(function ($q) use ($city) {
                $q->where('name', 'like', "%{$city}%")
                    ->orWhere('description', 'like', "%{$city}%");
            });
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $stores = $query->get()->map(fn (Store $store) => [
            'id' => $store->id,
            'name' => $store->name,
            'description' => $store->description,
            'description_en' => $store->description_en,
            'thumbnail' => $store->thumbnail,
            'latitude' => (float) $store->latitude,
            'longitude' => (float) $store->longitude,
            'gmaps_link' => $store->gmaps_link,
        ])->values()->all();

        return Inertia::render('stores', [
            'stores' => $stores,
            'searchQuery' => $search,
            'selectedCity' => $city,
        ]);
    }
}
