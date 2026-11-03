<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Setting;
use App\Services\RajaOngkirPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();
        $status = $request->string('status')->trim()->value();
        $type = $request->string('type')->trim()->value();

        $methodsQuery = PaymentMethod::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('account_number', 'like', "%{$search}%")
                        ->orWhere('account_name', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($type === 'automatic', fn ($query) => $query->where('type', 'automatic'))
            ->when($type === 'manual', fn ($query) => $query->where('type', 'manual'))
            ->latest('id');

        $paymentMethods = $methodsQuery->paginate(15)->withQueryString();

        $metrics = [
            'total_methods' => PaymentMethod::count(),
            'active_methods' => PaymentMethod::where('is_active', true)->count(),
            'inactive_methods' => PaymentMethod::where('is_active', false)->count(),
            'automatic_methods' => PaymentMethod::where('type', 'automatic')->count(),
            'manual_methods' => PaymentMethod::where('type', 'manual')->count(),
        ];

        $manualUniqueCodeEnabled = Setting::get('manual_payment_unique_code', '1') !== '0';

        return Inertia::render('admin/payment-methods/index', [
            'paymentMethods' => $paymentMethods,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'type' => $type,
            ],
            'metrics' => $metrics,
            'manualUniqueCodeEnabled' => $manualUniqueCodeEnabled,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/payment-methods/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', 'unique:payment_methods,code'],
            'type' => ['nullable', 'string', 'in:automatic,manual'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'is_active' => ['nullable', 'boolean'],
            'use_unique_code' => ['nullable', 'boolean'],
        ]);

        $code = Str::slug($validated['code'], '_');
        $icon = null;

        if ($request->hasFile('icon')) {
            $file = $request->file('icon');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('payment-methods', 'public');
                $icon = Storage::url($path);
            }
        }

        PaymentMethod::create([
            'name' => $validated['name'],
            'code' => $code,
            'icon' => $icon,
            'type' => $validated['type'] ?? 'automatic',
            'account_number' => $validated['account_number'] ?? null,
            'account_name' => $validated['account_name'] ?? null,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
            'use_unique_code' => $request->has('use_unique_code') ? $request->boolean('use_unique_code') : true,
        ]);

        return redirect()->route('admin.payment-methods.index')
            ->with('success', "Metode pembayaran '{$validated['name']}' berhasil ditambahkan.");
    }

    public function edit(PaymentMethod $paymentMethod): Response
    {
        return Inertia::render('admin/payment-methods/edit', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', Rule::unique('payment_methods', 'code')->ignore($paymentMethod->id)],
            'type' => ['nullable', 'string', 'in:automatic,manual'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'remove_icon' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'use_unique_code' => ['nullable', 'boolean'],
        ]);

        $code = Str::slug($validated['code'], '_');
        $icon = $paymentMethod->icon;

        if ($request->boolean('remove_icon')) {
            $icon = null;
        } elseif ($request->hasFile('icon')) {
            $file = $request->file('icon');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('payment-methods', 'public');
                $icon = Storage::url($path);
            }
        }

        $paymentMethod->update([
            'name' => $validated['name'],
            'code' => $code,
            'icon' => $icon,
            'type' => $validated['type'] ?? ($paymentMethod->type ?? 'automatic'),
            'account_number' => $validated['account_number'] ?? null,
            'account_name' => $validated['account_name'] ?? null,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : $paymentMethod->is_active,
            'use_unique_code' => $request->has('use_unique_code') ? $request->boolean('use_unique_code') : $paymentMethod->use_unique_code,
        ]);

        return redirect()->route('admin.payment-methods.index')
            ->with('success', "Metode pembayaran '{$paymentMethod->name}' berhasil diperbarui.");
    }

    public function toggleStatus(PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->update([
            'is_active' => ! $paymentMethod->is_active,
        ]);

        $statusText = $paymentMethod->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Metode pembayaran '{$paymentMethod->name}' berhasil {$statusText}.");
    }

    public function toggleUniqueCode(PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->update([
            'use_unique_code' => ! $paymentMethod->use_unique_code,
        ]);

        $statusText = $paymentMethod->use_unique_code ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Kode unik untuk metode '{$paymentMethod->name}' berhasil {$statusText}.");
    }

    public function toggleUniqueCodeSetting(Request $request): RedirectResponse
    {
        $current = Setting::get('manual_payment_unique_code', '1') !== '0';
        $newValue = $request->has('enabled') ? $request->boolean('enabled') : ! $current;

        Setting::set('manual_payment_unique_code', $newValue ? '1' : '0', 'payment', 'boolean');

        $statusText = $newValue ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Fitur Kode Unik Pembayaran Manual berhasil {$statusText}.");
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        // Check if used in any orders
        $orderCount = Order::where('payment_method', $paymentMethod->code)->count();
        if ($orderCount > 0) {
            return redirect()->route('admin.payment-methods.index')
                ->with('error', "Metode pembayaran '{$paymentMethod->name}' tidak dapat dihapus karena tercatat dalam {$orderCount} pesanan.");
        }

        $name = $paymentMethod->name;
        $paymentMethod->delete();

        return redirect()->route('admin.payment-methods.index')
            ->with('success', "Metode pembayaran '{$name}' berhasil dihapus.");
    }

    /**
     * Preview payment methods from RajaOngkir payment API and inspect status in database.
     */
    public function syncPreview(RajaOngkirPaymentService $paymentService): JsonResponse
    {
        try {
            $res = $paymentService->getPaymentMethods();
            $items = $res['data'] ?? [];

            if (empty($items)) {
                return response()->json([
                    'success' => false,
                    'message' => $res['meta']['message'] ?? 'Tidak ada data metode pembayaran dari gateway RajaOngkir.',
                    'methods' => [],
                    'existing_count' => 0,
                    'new_count' => 0,
                ], 422);
            }

            $existingCodes = PaymentMethod::pluck('code')->all();

            $previewList = [];
            $existingCount = 0;
            $newCount = 0;

            foreach ($items as $item) {
                $paymentType = strtolower($item['payment_type'] ?? '');
                $bankCode = strtoupper($item['bank_code'] ?? '');

                $code = match ($paymentType) {
                    'qris' => 'qris',
                    'va' => strtolower($bankCode).'_va',
                    default => ! empty($bankCode) ? strtolower($bankCode).'_'.$paymentType : $paymentType,
                };

                $exists = in_array($code, $existingCodes, true);
                if ($exists) {
                    $existingCount++;
                } else {
                    $newCount++;
                }

                $previewList[] = [
                    'code' => $code,
                    'name' => $item['display_name'] ?? strtoupper($code),
                    'payment_type' => $paymentType,
                    'bank_code' => $bankCode,
                    'logo_url' => $item['logo_url'] ?? null,
                    'exists' => $exists,
                ];
            }

            return response()->json([
                'success' => true,
                'total' => count($previewList),
                'existing_count' => $existingCount,
                'new_count' => $newCount,
                'methods' => $previewList,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungi server RajaOngkir: '.$e->getMessage(),
                'methods' => [],
                'existing_count' => 0,
                'new_count' => 0,
            ], 500);
        }
    }

    /**
     * Synchronize payment methods from RajaOngkir payment API into database.
     */
    public function sync(Request $request, RajaOngkirPaymentService $paymentService): RedirectResponse|JsonResponse
    {
        $updateExisting = $request->boolean('update_existing', false);

        try {
            $res = $paymentService->getPaymentMethods();
            $items = $res['data'] ?? [];

            if (empty($items)) {
                $errorMsg = $res['meta']['message'] ?? 'Gagal mengambil metode pembayaran dari RajaOngkir.';
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => $errorMsg], 422);
                }

                return back()->with('error', $errorMsg);
            }

            $createdCount = 0;
            $updatedCount = 0;
            $skippedCount = 0;

            foreach ($items as $item) {
                $paymentType = strtolower($item['payment_type'] ?? '');
                $bankCode = strtoupper($item['bank_code'] ?? '');

                $code = match ($paymentType) {
                    'qris' => 'qris',
                    'va' => strtolower($bankCode).'_va',
                    default => ! empty($bankCode) ? strtolower($bankCode).'_'.$paymentType : $paymentType,
                };

                $name = $item['display_name'] ?? strtoupper($code);
                $icon = $item['logo_url'] ?? null;

                $existing = PaymentMethod::where('code', $code)->first();

                if ($existing) {
                    if ($updateExisting) {
                        $existing->update([
                            'name' => $name,
                            'icon' => $icon ?: $existing->icon,
                            'type' => 'automatic',
                        ]);
                        $updatedCount++;
                    } else {
                        $skippedCount++;
                    }
                } else {
                    PaymentMethod::create([
                        'code' => $code,
                        'name' => $name,
                        'icon' => $icon,
                        'type' => 'automatic',
                        'is_active' => true,
                    ]);
                    $createdCount++;
                }
            }

            $messageParts = [];
            if ($createdCount > 0) {
                $messageParts[] = "{$createdCount} metode baru ditambahkan";
            }
            if ($updatedCount > 0) {
                $messageParts[] = "{$updatedCount} metode diperbarui";
            }
            if ($skippedCount > 0) {
                $messageParts[] = "{$skippedCount} metode dilewati (sudah ada)";
            }

            $summary = ! empty($messageParts) ? implode(', ', $messageParts) : 'Tidak ada perubahan';
            $message = "Sinkronisasi Gateway RajaOngkir selesai: {$summary}.";

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'created_count' => $createdCount,
                    'updated_count' => $updatedCount,
                    'skipped_count' => $skippedCount,
                ]);
            }

            return redirect()->route('admin.payment-methods.index')->with('success', $message);
        } catch (\Throwable $e) {
            $errorMsg = 'Gagal sinkronisasi dari RajaOngkir: '.$e->getMessage();
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $errorMsg], 500);
            }

            return back()->with('error', $errorMsg);
        }
    }

    /**
     * Delete all automatic payment methods from database.
     */
    public function deleteAllAutomatic(): RedirectResponse
    {
        $deleted = PaymentMethod::where('type', 'automatic')->delete();

        return redirect()->route('admin.payment-methods.index')
            ->with('success', "Berhasil menghapus {$deleted} metode pembayaran otomatis.");
    }
}
