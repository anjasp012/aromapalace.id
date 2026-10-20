<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        $storesQuery = Store::query()
            ->withCount('orders')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->latest('id');

        $stores = $storesQuery->paginate(15)->withQueryString();

        $allStores = Store::query()
            ->withCount('orders')
            ->orderBy('name')
            ->get();

        $metrics = [
            'total_stores' => Store::count(),
            'total_pickup_orders' => Order::where('delivery_type', 'pickup')->count(),
        ];

        return Inertia::render('admin/stores/index', [
            'stores' => $stores,
            'all_stores' => $allStores,
            'filters' => [
                'search' => $search,
            ],
            'metrics' => $metrics,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'thumbnail' => ['nullable'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'gmaps_link' => ['nullable', 'string', 'max:1000'],
        ]);

        $thumbnail = null;
        if ($request->hasFile('thumbnail')) {
            $file = $request->file('thumbnail');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('stores', 'public');
                $thumbnail = Storage::url($path);
            }
        } elseif (! empty($validated['thumbnail']) && is_string($validated['thumbnail'])) {
            $thumbnail = trim($validated['thumbnail']);
        }

        $lat = ! empty($validated['latitude']) ? (float) $validated['latitude'] : -6.2088;
        $lng = ! empty($validated['longitude']) ? (float) $validated['longitude'] : 106.8456;

        $gmapsLink = ! empty($validated['gmaps_link'])
            ? trim($validated['gmaps_link'])
            : "https://maps.google.com/?q={$lat},{$lng}";

        Store::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? 'Butik resmi Aroma Palace',
            'description_en' => $validated['description_en'] ?? null,
            'thumbnail' => $thumbnail ?: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80',
            'latitude' => $lat,
            'longitude' => $lng,
            'gmaps_link' => $gmapsLink,
        ]);

        return redirect()->route('admin.stores.index')
            ->with('success', "Lokasi butik '{$validated['name']}' berhasil ditambahkan.");
    }

    public function update(Request $request, Store $store): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'thumbnail' => ['nullable'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'gmaps_link' => ['nullable', 'string', 'max:1000'],
        ]);

        $thumbnail = $store->thumbnail;
        if ($request->hasFile('thumbnail')) {
            $file = $request->file('thumbnail');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('stores', 'public');
                $thumbnail = Storage::url($path);
            }
        } elseif ($request->has('thumbnail')) {
            $thumbnail = is_string($validated['thumbnail']) ? trim($validated['thumbnail']) : $store->thumbnail;
        }

        $lat = ! empty($validated['latitude']) ? (float) $validated['latitude'] : ($store->latitude ?? -6.2088);
        $lng = ! empty($validated['longitude']) ? (float) $validated['longitude'] : ($store->longitude ?? 106.8456);

        $gmapsLink = ! empty($validated['gmaps_link'])
            ? trim($validated['gmaps_link'])
            : ($store->gmaps_link ?: "https://maps.google.com/?q={$lat},{$lng}");

        $store->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? $store->description,
            'description_en' => array_key_exists('description_en', $validated) ? $validated['description_en'] : $store->description_en,
            'thumbnail' => $thumbnail,
            'latitude' => $lat,
            'longitude' => $lng,
            'gmaps_link' => $gmapsLink,
        ]);

        return redirect()->route('admin.stores.index')
            ->with('success', "Lokasi butik '{$store->name}' berhasil diperbarui.");
    }

    public function destroy(Store $store): RedirectResponse
    {
        $orderCount = $store->orders()->count();
        if ($orderCount > 0) {
            return redirect()->route('admin.stores.index')
                ->with('error', "Lokasi butik '{$store->name}' tidak dapat dihapus karena tercatat dalam {$orderCount} pesanan pelanggan.");
        }

        $name = $store->name;
        $store->delete();

        return redirect()->route('admin.stores.index')
            ->with('success', "Lokasi butik '{$name}' berhasil dihapus.");
    }
}
