<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Services\FirebaseNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();
        $status = $request->string('status')->value() ?: 'all';

        $vouchersQuery = Voucher::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', function ($query) {
                $query->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                            ->orWhere('expires_at', '>=', now());
                    });
            })
            ->when($status === 'expired', function ($query) {
                $query->whereNotNull('expires_at')
                    ->where('expires_at', '<', now());
            })
            ->latest('id');

        $vouchers = $vouchersQuery->paginate(15)->withQueryString();

        $metrics = [
            'total_vouchers' => Voucher::count(),
            'active_vouchers' => Voucher::where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>=', now());
                })->count(),
            'expired_vouchers' => Voucher::whereNotNull('expires_at')
                ->where('expires_at', '<', now())
                ->count(),
            'total_used' => (int) Voucher::sum('used_count'),
        ];

        return Inertia::render('admin/vouchers/index', [
            'vouchers' => $vouchers,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'metrics' => $metrics,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:vouchers,code'],
            'name' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'type' => ['required', 'string', 'in:percentage,fixed'],
            'value' => ['required', 'integer', 'min:1'],
            'min_order_amount' => ['nullable', 'integer', 'min:0'],
            'max_discount_amount' => ['nullable', 'integer', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['code'] = Str::upper($validated['code']);
        $validated['min_order_amount'] = $validated['min_order_amount'] ?? 0;
        $validated['is_active'] = $request->boolean('is_active', true);

        $voucher = Voucher::create($validated);

        // Broadcast notification to all customers for new voucher
        app(FirebaseNotificationService::class)->notifyNewVoucher($voucher);

        return redirect()->route('admin.vouchers.index')
            ->with('success', "Voucher '{$validated['code']}' berhasil ditambahkan.");
    }

    public function update(Request $request, Voucher $voucher): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('vouchers', 'code')->ignore($voucher->id)],
            'name' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'type' => ['required', 'string', 'in:percentage,fixed'],
            'value' => ['required', 'integer', 'min:1'],
            'min_order_amount' => ['nullable', 'integer', 'min:0'],
            'max_discount_amount' => ['nullable', 'integer', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['code'] = Str::upper($validated['code']);
        $validated['min_order_amount'] = $validated['min_order_amount'] ?? 0;
        $validated['is_active'] = $request->boolean('is_active', true);

        $voucher->update($validated);

        return redirect()->route('admin.vouchers.index')
            ->with('success', "Voucher '{$voucher->code}' berhasil diperbarui.");
    }

    public function toggle(Voucher $voucher): RedirectResponse
    {
        $voucher->update([
            'is_active' => ! $voucher->is_active,
        ]);

        $statusLabel = $voucher->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->route('admin.vouchers.index')
            ->with('success', "Status voucher '{$voucher->code}' berhasil {$statusLabel}.");
    }

    public function destroy(Voucher $voucher): RedirectResponse
    {
        $code = $voucher->code;
        $voucher->delete();

        return redirect()->route('admin.vouchers.index')
            ->with('success', "Voucher '{$code}' berhasil dihapus.");
    }
}
