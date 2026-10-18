<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Services\CatalogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    /**
     * Display the authenticated user's shopping cart page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $cartRecords = $user->cartItems()
            ->with(['variant'])
            ->latest()
            ->get();

        $items = [];
        $subtotal = 0;

        foreach ($cartRecords as $record) {
            $product = CatalogService::find($record->product_id);
            if (! $product) {
                continue;
            }

            $variant = $record->variant;
            $unitPrice = $variant ? (int) $variant->price : (int) ($product['raw_price'] ?? 0);
            $volume = $variant?->volume ?? ($product['volume'] ?? '50ml');
            $volumeLabel = $variant ? "{$variant->volume} ({$variant->name})" : $volume;

            $itemTotal = $unitPrice * $record->quantity;
            $subtotal += $itemTotal;

            $items[] = [
                'id' => $record->id,
                'product_id' => $record->product_id,
                'variant_id' => $record->variant_id,
                'quantity' => $record->quantity,
                'volume' => $volume,
                'variant_name' => $variant?->name,
                'unit_price' => $unitPrice,
                'unit_price_formatted' => 'Rp '.number_format($unitPrice, 0, ',', '.'),
                'total_price' => $itemTotal,
                'total_price_formatted' => 'Rp '.number_format($itemTotal, 0, ',', '.'),
                'created_at' => $record->created_at?->toISOString(),
                'product' => $product,
            ];
        }

        $formattedSubtotal = 'Rp '.number_format($subtotal, 0, ',', '.');

        return Inertia::render('cart', [
            'items' => $items,
            'subtotal' => $subtotal,
            'subtotal_formatted' => $formattedSubtotal,
            'shipping_fee' => 0,
            'shipping_fee_formatted' => 'Gratis',
            'total' => $subtotal,
            'total_formatted' => $formattedSubtotal,
        ]);
    }

    /**
     * Add a product to the user's cart or increment quantity if already present.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
            'variant_id' => ['nullable', 'integer'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'volume' => ['nullable', 'string', 'max:30'],
        ]);

        $productId = (int) $validated['product_id'];
        $product = CatalogService::find($productId);

        if (! $product) {
            return back()->with('error', 'Produk wewangian tidak ditemukan.');
        }

        $quantity = isset($validated['quantity']) ? (int) $validated['quantity'] : 1;

        // Determine variant if specified or matched by volume
        $variant = null;
        if (! empty($validated['variant_id'])) {
            $variant = ProductVariant::where('product_id', $productId)->find($validated['variant_id']);
        } elseif (! empty($validated['volume'])) {
            $variant = ProductVariant::where('product_id', $productId)->where('volume', $validated['volume'])->first();
        }

        $variantId = $variant?->id;
        $volume = $variant ? $variant->volume : ($product['volume'] ?? '50ml');
        $userId = $request->user()->id;

        $existing = CartItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->first();

        if ($existing) {
            $newQuantity = min(20, $existing->quantity + $quantity);
            $existing->update([
                'quantity' => $newQuantity,
            ]);
        } else {
            CartItem::create([
                'user_id' => $userId,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity' => $quantity,
            ]);
        }

        return back()->with('success', "{$quantity}x “{$product['name']}” ({$volume}) berhasil ditambahkan ke keranjang.");
    }

    /**
     * Update an item's quantity in the cart.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $item = $request->user()->cartItems()->findOrFail($id);
        $item->update([
            'quantity' => (int) $validated['quantity'],
        ]);

        return back()->with('success', 'Jumlah produk berhasil diperbarui.');
    }

    /**
     * Remove an item from the cart.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $item = $request->user()->cartItems()->findOrFail($id);
        $item->delete();

        return back()->with('success', 'Produk berhasil dihapus dari keranjang.');
    }

    /**
     * Clear all items from the cart.
     */
    public function clear(Request $request): RedirectResponse
    {
        $request->user()->cartItems()->delete();

        return back()->with('success', 'Seluruh isi keranjang belanja Anda telah dikosongkan.');
    }
}
