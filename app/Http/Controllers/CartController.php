<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Voucher;
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
            $volume = $variant?->volume ?? ($product['volume'] ?? 50);
            $volumeLabel = $variant ? "{$variant->volume}ml ({$variant->name})" : "{$volume}ml";

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

        $usedVoucherIds = [];
        $usedVoucherCodes = [];
        if ($user) {
            $usedOrders = Order::where('user_id', $user->id)
                ->where('status', '!=', 'dibatalkan')
                ->whereNotIn('payment_status', ['cancelled', 'canceled', 'failed', 'expired'])
                ->get(['voucher_id', 'voucher_code']);

            $usedVoucherIds = $usedOrders->pluck('voucher_id')->filter()->all();
            $usedVoucherCodes = $usedOrders->pluck('voucher_code')->filter()->map(fn ($c) => strtoupper(trim((string) $c)))->all();
        }

        $availableVouchers = Voucher::query()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit');
            })
            ->get()
            ->filter(fn (Voucher $v) => ! in_array($v->id, $usedVoucherIds, true) && ! in_array(strtoupper(trim($v->code)), $usedVoucherCodes, true))
            ->map(fn (Voucher $v) => [
                'id' => $v->id,
                'code' => $v->code,
                'name' => $v->name,
                'type' => $v->type,
                'value' => (int) $v->value,
                'min_order_amount' => (int) $v->min_order_amount,
                'min_order_amount_formatted' => 'Rp '.number_format($v->min_order_amount, 0, ',', '.'),
                'max_discount_amount' => $v->max_discount_amount,
            ])
            ->values()
            ->all();

        $appliedVoucher = session('applied_voucher', '');
        if ($request->query('voucher')) {
            $appliedVoucher = strtoupper(trim((string) $request->query('voucher')));
            session(['applied_voucher' => $appliedVoucher]);
        }
        if ($appliedVoucher !== '' && in_array($appliedVoucher, $usedVoucherCodes, true)) {
            session()->forget('applied_voucher');
            $appliedVoucher = '';
        }

        return Inertia::render('cart', [
            'items' => $items,
            'subtotal' => $subtotal,
            'subtotal_formatted' => $formattedSubtotal,
            'total' => $subtotal,
            'total_formatted' => $formattedSubtotal,
            'initial_voucher' => $appliedVoucher,
            'available_vouchers' => $availableVouchers,
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
            'volume' => ['nullable'],
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
            $volInt = is_numeric($validated['volume'])
                ? (int) $validated['volume']
                : (int) filter_var($validated['volume'], FILTER_SANITIZE_NUMBER_INT);
            if ($volInt > 0) {
                $variant = ProductVariant::where('product_id', $productId)->where('volume', $volInt)->first();
            }
        }

        $variantId = $variant?->id;
        $volume = $variant ? $variant->volume : ($product['volume'] ?? 50);
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

        return back()->with('success', 'Berhasil ditambahkan ke keranjang.');
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

        return back()->with('success', 'Jumlah produk diperbarui.');
    }

    /**
     * Remove an item from the cart.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $item = $request->user()->cartItems()->findOrFail($id);
        $item->delete();

        return back()->with('success', 'Produk dihapus.');
    }

    /**
     * Clear all items from the cart.
     */
    public function clear(Request $request): RedirectResponse
    {
        $request->user()->cartItems()->delete();

        return back()->with('success', 'Keranjang dikosongkan.');
    }

    /**
     * Store applied voucher into user session.
     */
    public function applyVoucher(Request $request): RedirectResponse
    {
        $code = strtoupper(trim((string) $request->input('code', '')));
        if ($code !== '') {
            $voucher = Voucher::where('code', $code)->where('is_active', true)->first();
            if ($voucher) {
                if ($request->user() && $voucher->hasBeenUsedBy($request->user())) {
                    return back()->with('error', "Voucher {$voucher->code} hanya dapat digunakan 1 kali per akun dan sudah pernah Anda gunakan.");
                }

                session(['applied_voucher' => $voucher->code]);

                return back()->with('success', "Voucher {$voucher->code} diterapkan.");
            }
        }

        return back()->with('error', 'Kode voucher tidak valid atau sudah tidak berlaku.');
    }

    /**
     * Remove the applied voucher from user session.
     */
    public function removeVoucher(Request $request): RedirectResponse
    {
        $request->session()->forget('applied_voucher');

        return back()->with('success', 'Voucher dilepas.');
    }
}
