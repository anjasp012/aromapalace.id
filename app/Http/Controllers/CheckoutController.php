<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Store;
use App\Models\Voucher;
use App\Services\CatalogService;
use App\Services\FirebaseNotificationService;
use App\Services\PakasirService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        protected FirebaseNotificationService $notificationService
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
        $initialVoucher = (string) $request->query('voucher', '');
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
                    'value' => $v->value,
                    'min_order_amount' => $v->min_order_amount,
                    'min_order_amount_formatted' => 'Rp '.number_format($v->min_order_amount, 0, ',', '.'),
                    'max_discount_amount' => $v->max_discount_amount,
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

        return Inertia::render('checkout', [
            'items' => $items,
            'subtotal' => $subtotal,
            'subtotal_formatted' => 'Rp '.number_format($subtotal, 0, ',', '.'),
            'shipping_fee' => 0,
            'shipping_fee_formatted' => 'Gratis (VIP Courier)',
            'discount_amount' => $discountAmount,
            'discount_amount_formatted' => 'Rp '.number_format($discountAmount, 0, ',', '.'),
            'total' => $total,
            'total_formatted' => 'Rp '.number_format($total, 0, ',', '.'),
            'initial_voucher' => $initialVoucher,
            'available_vouchers' => $availableVouchers,
            'stores' => $stores,
            'payment_methods' => $paymentMethods,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
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
            'recipient_name' => ['required', 'string', 'max:120'],
            'recipient_phone' => ['required', 'string', 'max:25'],
            'shipping_address' => ['required_if:delivery_type,delivery', 'nullable', 'string', 'max:500'],
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
        ]);

        $user = $request->user();

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

        $cleanPhone = preg_replace('/[^0-9]/', '', $validated['recipient_phone']) ?: '12345678';
        $phoneSuffix = substr($cleanPhone, -8);

        $channelName = $pm ? $pm->name : 'Virtual Account';
        $paymentChannel = match ($paymentMethod) {
            'qris' => 'QRIS Instant (Pakasir)',
            'payment_link' => 'Payment Link (Pakasir)',
            default => "{$channelName} Virtual Account (Pakasir)",
        };

        $prefix = match ($paymentMethod) {
            'bri_va' => '12800',
            'bni_va' => '82771',
            'bsi_va' => '90012',
            'cimb_niaga_va' => '11880',
            'danamon_va' => '85220',
            'maybank_va' => '78000',
            'bnc_va' => '99001',
            'muamalat_va' => '14700',
            'ocbc_va' => '20010',
            default => '88000',
        };

        $defaultPaymentCode = match ($paymentMethod) {
            'qris' => 'QRIS-AP-'.strtoupper(Str::random(8)),
            'payment_link' => 'PL-'.strtoupper(Str::random(8)),
            default => $prefix.$phoneSuffix,
        };

        $paymentStatus = 'pending';

        $orderNumber = 'AP-'.date('Ymd').'-'.strtoupper(Str::random(5));

        // Call Pakasir API to create real payment transaction
        if ($totalAmount > 0) {
            $pakasirRes = $this->pakasirService->createTransaction($orderNumber, $totalAmount, $paymentMethod);
            if ($pakasirRes['success'] && ! empty($pakasirRes['data'])) {
                $pData = $pakasirRes['data'];
                $paymentCode = ($pData['va_number'] ?? null)
                    ?: (($pData['qr_string'] ?? null)
                    ?: (($pData['payment_link'] ?? null)
                    ?: ($pData['txn_id'] ?? $defaultPaymentCode)));
            } else {
                Log::warning('Pakasir transaction creation fallback', [
                    'order' => $orderNumber,
                    'error' => $pakasirRes['error'] ?? 'Unknown error',
                ]);
                $paymentCode = $defaultPaymentCode;
            }
        } else {
            $paymentCode = $defaultPaymentCode;
        }

        $deliveryType = $validated['delivery_type'] ?? 'delivery';
        $storeId = null;

        if ($deliveryType === 'pickup') {
            $store = ! empty($validated['store_id']) ? Store::find($validated['store_id']) : Store::first();
            $storeId = $store?->id;
            $storeName = $store ? $store->name : 'Butik Resmi Aroma Palace';
            $shippingAddress = 'Ambil di butik: '.($store ? $store->name.' - '.$store->description : 'Butik Resmi Aroma Palace');
            $city = 'Ambil di Butik';
            $courier = 'Ambil Mandiri di Butik ('.$storeName.')';
            $shippingCost = 0;
        } else {
            $shippingAddress = $validated['shipping_address'] ?? '-';
            $city = $validated['city'] ?? '-';
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
            $city,
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
            $voucher,
            $totalAmount,
            $orderItemsData
        ) {
            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $user->id,
                'delivery_type' => $deliveryType,
                'store_id' => $storeId,
                'recipient_name' => $validated['recipient_name'],
                'recipient_phone' => $validated['recipient_phone'],
                'shipping_address' => $shippingAddress,
                'city' => $city,
                'postal_code' => $validated['postal_code'] ?? null,
                'courier' => $courier,
                'shipping_cost' => $shippingCost,
                'payment_method' => $paymentMethod,
                'payment_channel' => $paymentChannel,
                'payment_code' => $paymentCode,
                'payment_status' => $paymentStatus,
                'status' => $paymentStatus === 'paid' ? 'menunggu_konfirmasi' : 'menunggu_pembayaran',
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'voucher_code' => $voucherCode ?: null,
                'voucher_id' => $voucherId,
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'] ?? null,
            ]);

            if ($voucher && $discountAmount > 0) {
                $voucher->increment('used_count');
            }

            foreach ($orderItemsData as $itemData) {
                $order->items()->create($itemData);
            }

            // Clear the user's cart
            $user->cartItems()->delete();

            return $order;
        });

        // Trigger push notification to Admins (pesanan masuk) & Customer (order dibuat)
        $this->notificationService->notifyNewOrder($order);

        return redirect()->route('payment.show', ['order' => $order->order_number])
            ->with('success', 'Pesanan wewangian mewah Anda berhasil dibuat!');
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

        $voucher = Voucher::where('code', $code)->first();
        if ($voucher) {
            return $voucher->calculateDiscount($subtotal);
        }

        return match ($code) {
            'AROMA40' => (int) round($subtotal * 0.40),
            'DUBAI25' => (int) round($subtotal * 0.25),
            'ROYALE10' => (int) round($subtotal * 0.10),
            default => 0,
        };
    }
}
