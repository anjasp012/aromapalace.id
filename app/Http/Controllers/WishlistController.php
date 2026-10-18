<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use App\Services\CatalogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    /**
     * Display the authenticated user's wishlist page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $wishlistRecords = $user->wishlists()
            ->latest()
            ->get();

        $items = $wishlistRecords->map(function (Wishlist $record): ?array {
            $product = CatalogService::find($record->product_id);
            if (! $product) {
                return null;
            }

            return [
                'id' => $record->id,
                'product_id' => $record->product_id,
                'created_at' => $record->created_at?->toISOString(),
                'product' => $product,
            ];
        })->filter()->values()->all();

        return Inertia::render('wishlist', [
            'items' => $items,
        ]);
    }

    /**
     * Toggle a fragrance in the user's wishlist.
     */
    public function toggle(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
        ]);

        $productId = (int) $validated['product_id'];
        $product = CatalogService::find($productId);

        if (! $product) {
            return back()->with('error', 'Produk wewangian tidak ditemukan.');
        }

        $userId = $request->user()->id;
        $existing = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            $existing->delete();

            return back()->with('success', "“{$product['name']}” berhasil dihapus dari wishlist.");
        }

        Wishlist::create([
            'user_id' => $userId,
            'product_id' => $productId,
        ]);

        return back()->with('success', "“{$product['name']}” berhasil ditambahkan ke wishlist.");
    }

    /**
     * Remove a fragrance from the wishlist.
     */
    public function destroy(Request $request, int $productId): RedirectResponse
    {
        $deleted = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        if ($deleted) {
            return back()->with('success', 'Wewangian berhasil dihapus dari wishlist.');
        }

        return back()->with('error', 'Wewangian tidak ditemukan di wishlist Anda.');
    }
}
