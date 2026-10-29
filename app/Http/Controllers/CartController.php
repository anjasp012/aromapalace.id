<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\LoyaltyPointHistory;
use App\Models\Order;
use App\Models\Product;
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
            ->with([
                'variant',
                'product' => fn ($q) => $q->with(CatalogService::$eagerRelations),
            ])
            ->latest()
            ->get();

        $items = [];
        $subtotal = 0;
        $hasUnavailableItems = false;
        $removedCount = 0;

        foreach ($cartRecords as $record) {
            $productModel = $record->product;
            if (! $productModel) {
                $record->delete();
                $removedCount++;
                $hasUnavailableItems = true;

                continue;
            }

            $product = CatalogService::formatProduct($productModel);
            $variant = $record->variant;
            $unitPrice = $variant ? (int) $variant->price : (int) ($product['raw_price'] ?? 0);
            $volume = $variant?->volume ?? ($product['volume'] ?? 50);
            $volumeLabel = $variant ? "{$variant->volume}ml ({$variant->name})" : "{$volume}ml";

            $isDraft = (bool) $productModel->is_draft;
            $isOutOfStock = false;
            $stockExceeded = false;
            $availableStock = $variant ? (int) $variant->stock : 0;
            $unavailableReason = null;

            if ($isDraft) {
                $hasUnavailableItems = true;
                $unavailableReason = 'Produk wewangian ini sedang berstatus draft (belum dipublikasikan).';
            } elseif (! $variant) {
                $hasUnavailableItems = true;
                $unavailableReason = 'Varian wewangian tidak ditemukan atau telah dihapus.';
            } elseif ($availableStock <= 0) {
                $isOutOfStock = true;
                $hasUnavailableItems = true;
                $unavailableReason = 'Stok untuk varian wewangian ini telah habis.';
            } elseif ($record->quantity > $availableStock) {
                $stockExceeded = true;
                $hasUnavailableItems = true;
                $unavailableReason = "Stok tersisa {$availableStock} unit. Silakan kurangi jumlah pesanan.";
            }

            $isValidForCheckout = ! $isDraft && ! $isOutOfStock && ! $stockExceeded && $variant !== null;

            $itemTotal = $unitPrice * $record->quantity;
            if ($isValidForCheckout) {
                $subtotal += $itemTotal;
            }

            $items[] = [
                'id' => $record->id,
                'product_id' => $record->product_id,
                'variant_id' => $record->variant_id,
                'quantity' => $record->quantity,
                'volume' => $volume,
                'volume_label' => $volumeLabel,
                'variant_name' => $variant?->name,
                'unit_price' => $unitPrice,
                'unit_price_formatted' => 'Rp '.number_format($unitPrice, 0, ',', '.'),
                'total_price' => $itemTotal,
                'total_price_formatted' => 'Rp '.number_format($itemTotal, 0, ',', '.'),
                'created_at' => $record->created_at?->toISOString(),
                'product' => $product,
                'is_draft' => $isDraft,
                'is_out_of_stock' => $isOutOfStock,
                'stock_exceeded' => $stockExceeded,
                'available_stock' => $availableStock,
                'is_valid_for_checkout' => $isValidForCheckout,
                'unavailable_reason' => $unavailableReason,
            ];
        }

        if ($removedCount > 0) {
            session()->flash('error', "Sebanyak {$removedCount} produk di keranjang belanja Anda telah dihapus atau sudah tidak tersedia lagi.");
        }

        $formattedSubtotal = 'Rp '.number_format($subtotal, 0, ',', '.');

        $usedVoucherIds = [];
        $usedVoucherCodes = [];
        $userRedeemedCodes = [];
        if ($user) {
            $usedOrders = Order::where('user_id', $user->id)
                ->where('status', '!=', 'dibatalkan')
                ->whereNotIn('payment_status', ['cancelled', 'canceled', 'failed', 'expired'])
                ->get(['voucher_id', 'voucher_code']);

            $usedVoucherIds = $usedOrders->pluck('voucher_id')->filter()->all();
            $usedVoucherCodes = $usedOrders->pluck('voucher_code')->filter()->map(fn ($c) => strtoupper(trim((string) $c)))->all();

            if ($user->membership) {
                $userRedeemedCodes = LoyaltyPointHistory::where('membership_id', $user->membership->id)
                    ->where('type', 'redeemed')
                    ->whereNotNull('reference_id')
                    ->pluck('reference_id')
                    ->map(fn ($c) => strtoupper(trim((string) $c)))
                    ->all();
            }
        }

        $vouchers = Voucher::query()
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
            ->where(function ($q) use ($user, $userRedeemedCodes) {
                $q->where(function ($sq) {
                    $sq->where('voucher_type', 'biasa')
                        ->where('code', 'not like', 'REW-%')
                        ->whereNull('user_id');
                });
                if ($user) {
                    $q->orWhere(function ($sq) use ($user, $userRedeemedCodes) {
                        $sq->where(function ($rw) {
                            $rw->where('voucher_type', 'reward')
                                ->orWhere('code', 'like', 'REW-%');
                        })->where(function ($rw) use ($user, $userRedeemedCodes) {
                            $rw->where('user_id', $user->id);
                            if (! empty($userRedeemedCodes)) {
                                $rw->orWhereIn('code', $userRedeemedCodes);
                            }
                        });
                    });
                }
            })
            ->get()
            ->filter(fn (Voucher $v) => ! in_array($v->id, $usedVoucherIds, true) && ! in_array(strtoupper(trim($v->code)), $usedVoucherCodes, true));

        $allProductIds = $vouchers->pluck('applicable_product_ids')
            ->filter()
            ->flatten()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->all();

        $productNames = ! empty($allProductIds)
            ? Product::whereIn('id', $allProductIds)->pluck('name', 'id')->all()
            : [];

        $availableVouchers = $vouchers->map(function (Voucher $v) use ($userRedeemedCodes, $subtotal, $items, $productNames) {
            $isReward = $v->voucher_type === 'reward' || in_array(strtoupper(trim($v->code)), $userRedeemedCodes, true) || str_starts_with($v->code, 'REW-');
            $applicableIds = ! empty($v->applicable_product_ids) ? array_map('intval', (array) $v->applicable_product_ids) : [];

            $applicableProductNames = [];
            foreach ($applicableIds as $pid) {
                if (isset($productNames[$pid])) {
                    $applicableProductNames[] = $productNames[$pid];
                }
            }

            $hasApplicableItems = true;
            $applicableSubtotal = $subtotal;
            if ($v->applicable_type === 'specific' && ! empty($applicableIds)) {
                $matchingItems = array_filter($items, fn ($it) => in_array((int) $it['product_id'], $applicableIds, true));
                $hasApplicableItems = ! empty($matchingItems);
                $applicableSubtotal = array_sum(array_column($matchingItems, 'total_price'));
            }

            $meetsMinOrder = $applicableSubtotal >= $v->min_order_amount;
            $isEligible = $hasApplicableItems && $meetsMinOrder;
            $shortageAmount = max(0, $v->min_order_amount - $applicableSubtotal);

            $reasonIneligible = null;
            if (! $hasApplicableItems) {
                $reasonIneligible = 'Khusus produk: '.implode(', ', $applicableProductNames);
            } elseif (! $meetsMinOrder) {
                $reasonIneligible = 'Kurang Rp '.number_format($shortageAmount, 0, ',', '.').' lagi';
            }

            return [
                'id' => $v->id,
                'code' => $v->code,
                'name' => $v->name,
                'description' => $v->description,
                'terms' => $v->terms ?? [],
                'type' => $v->type,
                'value' => (int) $v->value,
                'min_order_amount' => (int) $v->min_order_amount,
                'min_order_amount_formatted' => $v->min_order_amount > 0 ? 'Rp '.number_format($v->min_order_amount, 0, ',', '.') : 'Tanpa Min. Belanja',
                'max_discount_amount' => $v->max_discount_amount ? (int) $v->max_discount_amount : null,
                'formatted_discount' => $v->type === 'percentage' ? $v->value.'%' : 'Rp '.number_format($v->value, 0, ',', '.'),
                'expires_at' => $v->expires_at?->format('d M Y'),
                'voucher_type' => $isReward ? 'reward' : 'biasa',
                'category' => $isReward ? 'hanya_untuk_anda' : 'voucher_biasa',
                'category_label' => $isReward ? 'Hanya Untuk Anda' : 'Voucher Biasa',
                'applicable_type' => $v->applicable_type ?? 'all',
                'applicable_product_ids' => $applicableIds,
                'applicable_product_names' => $applicableProductNames,
                'is_eligible' => $isEligible,
                'shortage_amount' => $shortageAmount,
                'reason_ineligible' => $reasonIneligible,
            ];
        })->values()->all();

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
            'has_unavailable_items' => $hasUnavailableItems,
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
        $product = Product::find($productId);

        $isEn = app()->getLocale() === 'en';

        if (! $product) {
            return back()->with('error', $isEn ? 'Fragrance product not found or has been removed.' : 'Produk wewangian tidak ditemukan atau telah dihapus.');
        }

        if ($product->is_draft) {
            return back()->with('error', $isEn ? 'This fragrance product is currently in draft and not available for purchase.' : 'Produk wewangian ini sedang dalam status draft dan belum tersedia untuk dibeli.');
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

        if (! $variant) {
            $variant = ProductVariant::where('product_id', $productId)->first();
        }

        if ($variant && $variant->stock <= 0) {
            return back()->with('error', $isEn ? 'Sorry, this fragrance variant is out of stock.' : 'Mohon maaf, stok untuk varian wewangian ini sedang habis.');
        }

        $variantId = $variant?->id;
        $userId = $request->user()->id;

        $existing = CartItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->first();

        $currentCartQty = $existing ? $existing->quantity : 0;
        if ($variant && ($currentCartQty + $quantity > $variant->stock)) {
            $remainingCanAdd = max(0, $variant->stock - $currentCartQty);
            if ($remainingCanAdd === 0) {
                return back()->with('error', $isEn ? "You already have {$currentCartQty} items in your cart (maximum available stock: {$variant->stock})." : "Anda sudah memiliki {$currentCartQty} unit di keranjang (seluruh stok yang tersedia: {$variant->stock}).");
            }

            return back()->with('error', $isEn ? "Only {$remainingCanAdd} more units can be added to your cart. Total stock remaining is {$variant->stock}." : "Hanya dapat menambahkan {$remainingCanAdd} unit lagi ke keranjang. Total stok tersisa {$variant->stock} unit.");
        }

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

        return back()->with('success', $isEn ? 'Added to cart.' : 'Berhasil ditambahkan ke keranjang.');
    }

    /**
     * Update an item's quantity in the cart.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $item = $request->user()->cartItems()->with(['product', 'variant'])->findOrFail($id);
        $isEn = app()->getLocale() === 'en';

        if (! $item->product) {
            $item->delete();

            return back()->with('error', $isEn ? 'This fragrance product is no longer available and has been removed from your cart.' : 'Produk wewangian ini sudah dihapus atau tidak tersedia lagi, dan telah disingkirkan dari keranjang.');
        }

        if ($item->product->is_draft) {
            return back()->with('error', $isEn ? 'This fragrance product is currently in draft and cannot be ordered.' : 'Produk wewangian ini sedang dalam status draft dan tidak dapat dipesan.');
        }

        $newQuantity = (int) $validated['quantity'];
        if ($item->variant) {
            if ($item->variant->stock <= 0) {
                return back()->with('error', $isEn ? 'Stock for this fragrance variant is out of stock.' : 'Stok untuk varian wewangian ini telah habis.');
            }
            if ($newQuantity > $item->variant->stock) {
                return back()->with('error', $isEn ? "Stock is insufficient. Only {$item->variant->stock} units available." : "Stok tidak mencukupi. Hanya tersedia {$item->variant->stock} unit.");
            }
        }

        $item->update([
            'quantity' => $newQuantity,
        ]);

        $isEn = app()->getLocale() === 'en';

        return back()->with('success', $isEn ? 'Product quantity updated.' : 'Jumlah produk diperbarui.');
    }

    /**
     * Remove an item from the cart.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $item = $request->user()->cartItems()->findOrFail($id);
        $item->delete();

        $isEn = app()->getLocale() === 'en';

        return back()->with('success', $isEn ? 'Product removed.' : 'Produk dihapus.');
    }

    /**
     * Clear all items from the cart.
     */
    public function clear(Request $request): RedirectResponse
    {
        $request->user()->cartItems()->delete();

        $isEn = app()->getLocale() === 'en';

        return back()->with('success', $isEn ? 'Cart cleared.' : 'Keranjang dikosongkan.');
    }

    /**
     * Store applied voucher into user session.
     */
    public function applyVoucher(Request $request): RedirectResponse
    {
        $isEn = app()->getLocale() === 'en';
        $code = strtoupper(trim((string) $request->input('code', '')));
        if ($code !== '') {
            $voucher = Voucher::where('code', $code)->where('is_active', true)->first();
            if ($voucher) {
                if ($request->user() && $voucher->hasBeenUsedBy($request->user())) {
                    return back()->with('error', $isEn ? "Voucher {$voucher->code} can only be used once per account and has already been used." : "Voucher {$voucher->code} hanya dapat digunakan 1 kali per akun dan sudah pernah Anda gunakan.");
                }

                if ($voucher->voucher_type === 'reward' || str_starts_with($voucher->code, 'REW-')) {
                    $userId = $request->user()?->id;
                    $isOwner = false;
                    if ($userId) {
                        if ($voucher->user_id && (int) $voucher->user_id === (int) $userId) {
                            $isOwner = true;
                        } else {
                            $isOwner = LoyaltyPointHistory::where('user_id', $userId)
                                ->where('type', 'redeemed')
                                ->where('reference_id', $voucher->code)
                                ->exists();
                        }
                    }

                    if (! $isOwner) {
                        return back()->with('error', $isEn ? "Voucher '{$voucher->code}' is a reward voucher belonging to another account." : "Voucher '{$voucher->code}' merupakan voucher khusus reward milik akun lain.");
                    }
                }

                if ($voucher->applicable_type === 'specific' && ! empty($voucher->applicable_product_ids)) {
                    $user = $request->user();
                    $cartProductIds = $user ? $user->cartItems()->pluck('product_id')->map(fn ($id) => (int) $id)->all() : [];
                    $allowedIds = array_map('intval', (array) $voucher->applicable_product_ids);
                    if (empty(array_intersect($cartProductIds, $allowedIds))) {
                        return back()->with('error', $isEn ? "Voucher '{$voucher->code}' is only valid for specific products." : "Voucher '{$voucher->code}' hanya berlaku untuk produk tertentu.");
                    }
                }

                session(['applied_voucher' => $voucher->code]);

                return back()->with('success', $isEn ? "Voucher {$voucher->code} applied." : "Voucher {$voucher->code} diterapkan.");
            }
        }

        return back()->with('error', $isEn ? 'Invalid or expired voucher code.' : 'Kode voucher tidak valid atau sudah tidak berlaku.');
    }

    /**
     * Remove the applied voucher from user session.
     */
    public function removeVoucher(Request $request): RedirectResponse
    {
        $request->session()->forget('applied_voucher');

        $isEn = app()->getLocale() === 'en';

        return back()->with('success', $isEn ? 'Voucher removed.' : 'Voucher dilepas.');
    }
}
