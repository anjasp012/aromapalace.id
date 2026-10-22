<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentMethod;
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

        $methodsQuery = PaymentMethod::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->latest('id');

        $paymentMethods = $methodsQuery->paginate(15)->withQueryString();

        $metrics = [
            'total_methods' => PaymentMethod::count(),
        ];

        return Inertia::render('admin/payment-methods/index', [
            'paymentMethods' => $paymentMethods,
            'filters' => [
                'search' => $search,
            ],
            'metrics' => $metrics,
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
            'icon' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
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
            'icon' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'remove_icon' => ['nullable', 'boolean'],
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
        ]);

        return redirect()->route('admin.payment-methods.index')
            ->with('success', "Metode pembayaran '{$paymentMethod->name}' berhasil diperbarui.");
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
}
