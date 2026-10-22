<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\Voucher;
use App\Services\CatalogService;
use App\Services\FirebaseNotificationService;
use App\Services\KiriminAjaService;
use App\Services\MembershipService;
use App\Services\PakasirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected PakasirService $pakasirService,
        protected FirebaseNotificationService $notificationService,
        protected KiriminAjaService $kiriminAjaService,
    ) {}

    /**
     * Display the checkout and payment configuration page.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        $cartRecords = $user->cartItems()
            ->with(['variant'])
            ->latest()
            ->get();

        if ($cartRecords->isEmpty()) {
            return redirect()->route('cart.index')->with('error', 'Keranjang belanja Anda masih kosong. Silakan pilih wewangian terlebih dahulu.');
        }

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
                'product' => $product,
            ];
        }

        // Voucher handling from query or session
        if ($request->has('remove_voucher')) {
            session()->forget('applied_voucher');
            $initialVoucher = '';
        } else {
            $initialVoucher = strtoupper(trim((string) ($request->query('voucher') ?: session('applied_voucher', ''))));
            if ($initialVoucher !== '') {
                session(['applied_voucher' => $initialVoucher]);
            }
        }
        $discountAmount = $this->calculateDiscount($initialVoucher, $subtotal);
        $total = max(0, $subtotal - $discountAmount);

        $availableVouchers = Voucher::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->get()
            ->map(function (Voucher $v) {
                return [
                    'id' => $v->id,
                    'code' => $v->code,
                    'name' => $v->name,
                    'description' => $v->description,
                    'terms' => $v->terms ?? [],
                    'type' => $v->type,
                    'value' => (int) $v->value,
                    'min_order_amount' => (int) $v->min_order_amount,
                    'min_order_amount_formatted' => 'Rp '.number_format($v->min_order_amount, 0, ',', '.'),
                    'max_discount_amount' => $v->max_discount_amount ? (int) $v->max_discount_amount : null,
                    'formatted_discount' => $v->type === 'percentage' ? $v->value.'%' : 'Rp '.number_format($v->value, 0, ',', '.'),
                ];
            });

        $stores = Store::query()->orderBy('id')->get()->map(fn (Store $s) => [
            'id' => $s->id,
            'name' => $s->name,
            'description' => $s->description,
            'thumbnail' => $s->thumbnail,
            'latitude' => (float) $s->latitude,
            'longitude' => (float) $s->longitude,
            'gmaps_link' => $s->gmaps_link,
        ])->values()->all();

        $paymentMethods = PaymentMethod::all()
            ->map(fn (PaymentMethod $pm) => [
                'id' => $pm->code,
                'code' => $pm->code,
                'name' => $pm->name,
                'icon' => $pm->icon,
            ])
            ->values()
            ->all();

        $primaryAddress = $user->primaryAddress ?: $user->addresses()->where('is_primary', true)->first() ?: $user->addresses()->first();
        if ($primaryAddress && ! $primaryAddress->is_primary && ! $user->addresses()->where('is_primary', true)->exists()) {
            $primaryAddress->update(['is_primary' => true]);
        }

        // Load couriers from KiriminAja SDK (cached 1 day)
        $couriers = $this->kiriminAjaService->getCouriers();

        return Inertia::render('checkout', [
            'items' => $items,
            'subtotal' => $subtotal,
            'subtotal_formatted' => 'Rp '.number_format($subtotal, 0, ',', '.'),
            'shipping_fee' => 0,
            'shipping_fee_formatted' => 'Ongkos kirim dihitung saat pemilihan kurir',
            'discount_amount' => $discountAmount,
            'discount_amount_formatted' => 'Rp '.number_format($discountAmount, 0, ',', '.'),
            'total' => $total,
            'total_formatted' => 'Rp '.number_format($total, 0, ',', '.'),
            'initial_voucher' => $initialVoucher,
            'available_vouchers' => $availableVouchers,
            'stores' => $stores,
            'payment_methods' => $paymentMethods,
            'couriers' => $couriers,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?: ($primaryAddress?->recipient_phone ?? ''),
                'address' => $primaryAddress?->formatted_address ?: ($primaryAddress?->address ?? ''),
                'city' => $primaryAddress?->city_name ?? '',
                'postal_code' => $primaryAddress?->postal_code ?? '',
            ],
            'addresses' => $user->addresses()->get(),
            'primary_address' => $primaryAddress,
        ]);
    }

    /**
     * Return live shipping rates from KiriminAja for a given destination subdistrict.
     * Called via AJAX from the checkout page when the user selects an address.
     */
    public function shippingRates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'destination_subdistrict_id' => ['required', 'integer', 'min:1'],
            'weight' => ['nullable', 'integer', 'min:100', 'max:50000'],
        ]);

        $destinationId = (int) $validated['destination_subdistrict_id'];
        $weight = (int) ($validated['weight'] ?? 500);

        // Origin district ID from config, default to 4712 (Jakarta Selatan area)
        $originId = (int) config('services.kiriminaja.origin_district_id', 4712);

        $rates = $this->kiriminAjaService->getShippingRates($originId, $destinationId, $weight);

        return response()->json([
            'status' => true,
            'rates' => $rates,
        ]);
    }

    /**
     * Store a newly created order and clear the user's cart.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'delivery_type' => ['nullable', 'string', 'in:delivery,pickup'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'address_id' => ['nullable', 'integer', 'exists:user_addresses,id'],
            'recipient_name' => ['required', 'string', 'max:120'],
            'recipient_phone' => ['required', 'string', 'max:25'],
            'shipping_address' => ['required_if:delivery_type,delivery', 'nullable', 'string', 'max:500'],
            'province_name' => ['nullable', 'string', 'max:100'],
            'city_name' => ['nullable', 'string', 'max:100'],
            'district_name' => ['nullable', 'string', 'max:100'],
            'subdistrict_name' => ['nullable', 'string', 'max:100'],
            'city' => ['required_if:delivery_type,delivery', 'nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:15'],
            'courier' => ['nullable', 'string', 'max:100'],
            'payment_method' => [
                'required',
                'string',
                Rule::exists('payment_methods', 'code'),
            ],
            'voucher_code' => ['nullable', 'string', 'max:50'],
            'insurance' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
            'device_token' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();

        // 1. Race condition guard: Concurrency lock per user to prevent duplicate checkout submissions
        $lock = Cache::lock("checkout_submission_lock_user_{$user->id}", 15);
        if (! $lock->get()) {
            return redirect()->route('cart.index')
                ->with('error', 'Pesanan Anda sedang diproses. Mohon tunggu sejenak dan jangan mengirim transaksi berulang.');
        }

        try {
            $cartRecords = $user->cartItems()
                ->with(['variant'])
                ->get();

            if ($cartRecords->isEmpty()) {
                return redirect()->route('cart.index')->with('error', 'Keranjang belanja Anda kosong.');
            }

            $orderItemsData = [];
            $subtotal = 0;

            foreach ($cartRecords as $record) {
                $product = CatalogService::find($record->product_id);
                if (! $product) {
                    continue;
                }

                $variant = $record->variant;
                $unitPrice = $variant ? (int) $variant->price : (int) ($product['raw_price'] ?? 0);
                $volume = $variant?->volume ?? ($product['volume'] ?? '50ml');
                $itemTotal = $unitPrice * $record->quantity;
                $subtotal += $itemTotal;

                $orderItemsData[] = [
                    'product_id' => $record->product_id,
                    'variant_id' => $record->variant_id,
                    'product_name' => $product['name'],
                    'variant_name' => $variant?->name,
                    'volume' => $volume,
                    'price' => $unitPrice,
                    'quantity' => $record->quantity,
                    'total_price' => $itemTotal,
                ];
            }

            $voucherCode = strtoupper(trim((string) ($validated['voucher_code'] ?? '')));
            $voucher = $voucherCode !== '' ? Voucher::where('code', $voucherCode)->first() : null;
            $discountAmount = $voucher ? $voucher->calculateDiscount($subtotal) : $this->calculateDiscount($voucherCode, $subtotal);
            $voucherId = ($voucher && $discountAmount > 0) ? $voucher->id : null;
            $insuranceCost = $request->boolean('insurance') ? 9000 : 0;
            $totalAmount = max(0, $subtotal - $discountAmount + $insuranceCost);

            $paymentMethod = $validated['payment_method'];
            $pm = PaymentMethod::where('code', $paymentMethod)->first();

            $channelName = $pm ? $pm->name : 'Virtual Account';
            $paymentChannel = match ($paymentMethod) {
                'qris' => 'QRIS Instant (Pakasir)',
                'payment_link' => 'Payment Link (Pakasir)',
                default => "{$channelName} Virtual Account (Pakasir)",
            };

            $paymentStatus = 'pending';
            $orderNumber = 'AP-'.date('Ymd').'-'.strtoupper(Str::random(5));

            // Call Pakasir API to create real payment transaction
            if ($totalAmount > 0) {
                $pakasirRes = $this->pakasirService->createTransaction($orderNumber, $totalAmount, $paymentMethod);

                if (! $pakasirRes['success'] || empty($pakasirRes['data'])) {
                    $errorMsg = $pakasirRes['error'] ?? 'Layanan pembayaran sedang mengalami kendala teknis.';
                    Log::error('Pakasir checkout error: Transaction creation failed', [
                        'order' => $orderNumber,
                        'error' => $errorMsg,
                        'user_id' => $user->id,
                    ]);

                    return redirect()->route('checkout.index')
                        ->withInput()
                        ->with('error', "Gagal memproses pembayaran melalui Pakasir: {$errorMsg}. Silakan coba beberapa saat lagi atau pilih metode pembayaran lain.");
                }

                $pData = $pakasirRes['data'];
                $paymentCode = ($pData['va_number'] ?? null)
                    ?: (($pData['qr_string'] ?? null)
                    ?: (($pData['payment_link'] ?? null)
                    ?: ($pData['txn_id'] ?? null)));

                if (! $paymentCode) {
                    return redirect()->route('checkout.index')
                        ->withInput()
                        ->with('error', 'Gerbang pembayaran Pakasir tidak mengembalikan kode pembayaran yang valid. Silakan coba kembali.');
                }
            } else {
                $paymentCode = 'FREE-VOUCHER';
                $paymentStatus = 'paid';
            }

            $deliveryType = $validated['delivery_type'] ?? 'delivery';
            $storeId = null;

            $address = null;
            if (! empty($validated['address_id'])) {
                $address = $user->addresses()->find($validated['address_id']);
            }
            if (! $address && $deliveryType === 'delivery') {
                $address = $user->primaryAddress ?: $user->addresses()->first();
            }

            if ($deliveryType === 'pickup') {
                $store = ! empty($validated['store_id']) ? Store::find($validated['store_id']) : Store::first();
                $storeId = $store?->id;
                $storeName = $store ? $store->name : 'Butik Resmi Aroma Palace';
                $shippingAddress = 'Ambil di butik: '.($store ? $store->name.' - '.$store->description : 'Butik Resmi Aroma Palace');
                $provinceName = null;
                $cityName = null;
                $districtName = null;
                $subdistrictName = null;
                $courier = 'Ambil Mandiri di Butik ('.$storeName.')';
                $shippingCost = 0;
            } else {
                $shippingAddress = $validated['shipping_address'] ?? ($address?->formatted_address ?: ($address?->address ?? '-'));
                $provinceName = $validated['province_name'] ?? ($address?->province_name ?? null);
                $cityName = $validated['city_name'] ?? ($address?->city_name ?? ($validated['city'] ?? null));
                $districtName = $validated['district_name'] ?? ($address?->district_name ?? null);
                $subdistrictName = $validated['subdistrict_name'] ?? ($address?->subdistrict_name ?? null);
                $courier = $validated['courier'] ?? 'JNE Express VIP (Bebas Ongkir)';
                $shippingCost = 0;
            }

            $order = DB::transaction(function () use (
                $user,
                $orderNumber,
                $deliveryType,
                $storeId,
                $validated,
                $shippingAddress,
                $provinceName,
                $cityName,
                $districtName,
                $subdistrictName,
                $address,
                $courier,
                $shippingCost,
                $paymentMethod,
                $paymentChannel,
                $paymentCode,
                $paymentStatus,
                $subtotal,
                $discountAmount,
                $voucherCode,
                $voucherId,
                $totalAmount,
                $orderItemsData
            ) {
                // 2. Race condition guard: Lock Cart Items and verify cart is still available
                $lockedCartItems = $user->cartItems()->lockForUpdate()->get();
                if ($lockedCartItems->isEmpty()) {
                    throw new \Exception('Keranjang belanja Anda kosong atau telah diproses di jendela lain.');
                }

                // 3. Race condition guard: Lock Product Variants & verify/deduct stock atomically
                foreach ($orderItemsData as $itemData) {
                    if (! empty($itemData['variant_id'])) {
                        $variant = ProductVariant::where('id', $itemData['variant_id'])->lockForUpdate()->first();
                        if (! $variant) {
                            throw new \Exception("Varian wewangian '{$itemData['product_name']}' tidak ditemukan.");
                        }
                        if ($variant->stock < $itemData['quantity']) {
                            throw new \Exception("Mohon maaf, stok untuk '{$itemData['product_name']} ({$itemData['variant_name']})' tersisa {$variant->stock} unit.");
                        }
                        $variant->decrement('stock', $itemData['quantity']);
                    }
                }

                // 4. Race condition guard: Lock Voucher & verify quota atomically
                if ($voucherId) {
                    $lockedVoucher = Voucher::where('id', $voucherId)->lockForUpdate()->first();
                    if ($lockedVoucher) {
                        if (! $lockedVoucher->is_active) {
                            throw new \Exception("Voucher '{$lockedVoucher->code}' sudah tidak aktif.");
                        }
                        if ($lockedVoucher->starts_at && now()->lt($lockedVoucher->starts_at)) {
                            throw new \Exception("Voucher '{$lockedVoucher->code}' belum dapat digunakan.");
                        }
                        if ($lockedVoucher->expires_at && now()->gt($lockedVoucher->expires_at)) {
                            throw new \Exception("Voucher '{$lockedVoucher->code}' telah kedaluwarsa.");
                        }
                        if ($lockedVoucher->usage_limit !== null && $lockedVoucher->used_count >= $lockedVoucher->usage_limit) {
                            throw new \Exception("Voucher '{$lockedVoucher->code}' telah mencapai batas kuota penggunaan.");
                        }
                        $lockedVoucher->increment('used_count');
                    }
                }

                $order = Order::create([
                    'order_number' => $orderNumber,
                    'user_id' => $user->id,
                    'delivery_type' => $deliveryType,
                    'store_id' => $storeId,
                    'recipient_name' => $validated['recipient_name'],
                    'recipient_phone' => $validated['recipient_phone'],
                    'shipping_address' => $shippingAddress,
                    'province_name' => $provinceName,
                    'city_name' => $cityName,
                    'district_name' => $districtName,
                    'subdistrict_name' => $subdistrictName,
                    'postal_code' => $validated['postal_code'] ?? ($address?->postal_code ?? null),
                    'courier' => $courier,
                    'shipping_cost' => $shippingCost,
                    'payment_method' => $paymentMethod,
                    'payment_channel' => $paymentChannel,
                    'payment_code' => $paymentCode,
                    'payment_status' => $paymentStatus,
                    'status' => $paymentStatus === 'paid' ? 'diproses' : 'menunggu_pembayaran',
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'voucher_code' => $voucherCode ?: null,
                    'voucher_id' => $voucherId,
                    'total_amount' => $totalAmount,
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($orderItemsData as $itemData) {
                    $order->items()->create($itemData);
                }

                // Save user's contact to profile if empty
                if (! empty($validated['recipient_phone']) && empty($user->phone)) {
                    $user->update(['phone' => $validated['recipient_phone']]);
                }

                // Clear the user's cart & applied voucher
                $user->cartItems()->delete();
                session()->forget('applied_voucher');

                return $order;
            });

            // Ensure customer's browser device token is linked to user_id
            if ($request->filled('device_token')) {
                DeviceToken::updateOrCreate(
                    ['token' => $request->input('device_token')],
                    [
                        'user_id' => $user->id,
                        'device_type' => 'web',
                        'role' => $user->isAdmin() ? 'admin' : 'customer',
                        'last_used_at' => now(),
                    ]
                );
            }

            // Trigger push notification to Admins & Customer asynchronously after response
            defer(function () use ($order) {
                try {
                    $this->notificationService->notifyNewOrder($order);
                } catch (\Throwable $e) {
                    Log::warning('Deferred notifyNewOrder failed: '.$e->getMessage());
                }
            });

            if ($order->payment_status === 'paid') {
                app(MembershipService::class)->awardOrderPoints($order);
            }

            return redirect()->route('payment.show', ['order' => $order->order_number])
                ->with('success', 'Pesanan wewangian mewah Anda berhasil dibuat!');
        } catch (\Throwable $e) {
            Log::error('Checkout process error: '.$e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('checkout.index')
                ->withInput()
                ->with('error', $e->getMessage() ?: 'Terjadi kesalahan saat memproses pesanan. Silakan periksa kembali keranjang Anda.');
        } finally {
            $lock->release();
        }
    }

    /**
     * Display the payment page with countdown and instructions.
     * Delegates to PaymentController.
     */
    public function payment(Request $request, int|string $order): Response|RedirectResponse
    {
        return app(PaymentController::class)->show($request, $order);
    }

    /**
     * Display the authenticated user's orders history.
     * Delegates to OrderController.
     */
    public function orders(Request $request): Response
    {
        return app(OrderController::class)->index($request);
    }

    /**
     * Calculate discount amount from a promo code.
     */
    private function calculateDiscount(string $code, int $subtotal): int
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return 0;
        }

        $voucher = Voucher::where('code', $code)->where('is_active', true)->first();
        if ($voucher) {
            return $voucher->calculateDiscount($subtotal);
        }

        return 0;
    }
}
