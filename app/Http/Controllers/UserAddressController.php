<?php

namespace App\Http\Controllers;

use App\Models\UserAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserAddressController extends Controller
{
    /**
     * List all addresses of authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $addresses = $user->addresses()->get();

        return response()->json([
            'status' => true,
            'data' => $addresses,
        ]);
    }

    /**
     * Store a newly created address.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        if ($request->has('recipient_phone')) {
            $request->merge([
                'recipient_phone' => preg_replace('/[\s\-\.]/', '', (string) $request->input('recipient_phone')),
            ]);
        }

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:50'],
            'recipient_name' => ['required', 'string', 'max:120'],
            'recipient_phone' => [
                'required',
                'string',
                'max:25',
                'regex:/^(\+628|628|08|02)[0-9]{6,13}$/',
            ],
            'province_id' => ['nullable', 'integer'],
            'province_name' => ['nullable', 'string', 'max:100'],
            'city_id' => ['nullable', 'integer'],
            'city_name' => ['required', 'string', 'max:100'],
            'district_id' => ['nullable', 'integer'],
            'district_name' => ['required', 'string', 'max:100'],
            'subdistrict_id' => ['nullable', 'integer'],
            'subdistrict_name' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:15'],
            'address' => ['required', 'string', 'max:1000'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'is_primary' => ['nullable', 'boolean'],
        ], [
            'recipient_phone.regex' => 'Nomor telepon harus dimulai dengan 08, 628, +628, atau 02 dan hanya berisi angka.',
        ]);

        $hasExistingAddresses = $user->addresses()->exists();
        $isPrimary = ! $hasExistingAddresses || ! empty($validated['is_primary']);

        $address = DB::transaction(function () use ($user, $validated, $isPrimary) {
            if ($isPrimary) {
                $user->addresses()->update(['is_primary' => false]);
            }

            $addr = $user->addresses()->create([
                'label' => $validated['label'],
                'recipient_name' => $validated['recipient_name'],
                'recipient_phone' => $validated['recipient_phone'],
                'province_id' => $validated['province_id'] ?? null,
                'province_name' => $validated['province_name'] ?? null,
                'city_id' => $validated['city_id'] ?? null,
                'city_name' => $validated['city_name'],
                'district_id' => $validated['district_id'] ?? null,
                'district_name' => $validated['district_name'],
                'subdistrict_id' => $validated['subdistrict_id'] ?? null,
                'subdistrict_name' => $validated['subdistrict_name'],
                'postal_code' => $validated['postal_code'],
                'address' => $validated['address'],
                'latitude' => isset($validated['latitude']) && $validated['latitude'] !== '' ? (float) $validated['latitude'] : null,
                'longitude' => isset($validated['longitude']) && $validated['longitude'] !== '' ? (float) $validated['longitude'] : null,
                'is_primary' => $isPrimary,
            ]);

            if ($isPrimary && empty($user->phone)) {
                $user->update(['phone' => $addr->recipient_phone]);
            }

            return $addr;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'status' => true,
                'message' => 'Alamat pengiriman berhasil disimpan.',
                'data' => $address,
            ]);
        }

        return back()->with('success', 'Alamat pengiriman berhasil disimpan.');
    }

    /**
     * Update an existing address.
     */
    public function update(Request $request, UserAddress $address): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        if ($address->user_id !== $user->id) {
            abort(403, 'Akses tidak diizinkan.');
        }

        if ($request->has('recipient_phone')) {
            $request->merge([
                'recipient_phone' => preg_replace('/[\s\-\.]/', '', (string) $request->input('recipient_phone')),
            ]);
        }

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:50'],
            'recipient_name' => ['required', 'string', 'max:120'],
            'recipient_phone' => [
                'required',
                'string',
                'max:25',
                'regex:/^(\+628|628|08|02)[0-9]{6,13}$/',
            ],
            'province_id' => ['nullable', 'integer'],
            'province_name' => ['nullable', 'string', 'max:100'],
            'city_id' => ['nullable', 'integer'],
            'city_name' => ['required', 'string', 'max:100'],
            'district_id' => ['nullable', 'integer'],
            'district_name' => ['required', 'string', 'max:100'],
            'subdistrict_id' => ['nullable', 'integer'],
            'subdistrict_name' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:15'],
            'address' => ['required', 'string', 'max:1000'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'is_primary' => ['nullable', 'boolean'],
        ], [
            'recipient_phone.regex' => 'Nomor telepon harus dimulai dengan 08, 628, +628, atau 02 dan hanya berisi angka.',
        ]);

        $isPrimary = ! empty($validated['is_primary']);

        DB::transaction(function () use ($user, $address, $validated, $isPrimary) {
            if ($isPrimary) {
                $user->addresses()->where('id', '!=', $address->id)->update(['is_primary' => false]);
            }

            $updateData = [
                'label' => $validated['label'],
                'recipient_name' => $validated['recipient_name'],
                'recipient_phone' => $validated['recipient_phone'],
                'province_id' => $validated['province_id'] ?? $address->province_id,
                'province_name' => $validated['province_name'] ?? $address->province_name,
                'city_id' => $validated['city_id'] ?? $address->city_id,
                'city_name' => $validated['city_name'],
                'district_id' => $validated['district_id'] ?? $address->district_id,
                'district_name' => $validated['district_name'],
                'subdistrict_id' => $validated['subdistrict_id'] ?? $address->subdistrict_id,
                'subdistrict_name' => $validated['subdistrict_name'],
                'postal_code' => $validated['postal_code'],
                'address' => $validated['address'],
                'is_primary' => $isPrimary || $address->is_primary,
            ];

            if (array_key_exists('latitude', $validated)) {
                $updateData['latitude'] = $validated['latitude'] !== null && $validated['latitude'] !== '' ? (float) $validated['latitude'] : null;
            }
            if (array_key_exists('longitude', $validated)) {
                $updateData['longitude'] = $validated['longitude'] !== null && $validated['longitude'] !== '' ? (float) $validated['longitude'] : null;
            }

            $address->update($updateData);

            if ($address->is_primary && empty($user->phone)) {
                $user->update(['phone' => $address->recipient_phone]);
            }
        });

        if ($request->wantsJson()) {
            return response()->json([
                'status' => true,
                'message' => 'Alamat pengiriman berhasil diperbarui.',
                'data' => $address->fresh(),
            ]);
        }

        return back()->with('success', 'Alamat pengiriman berhasil diperbarui.');
    }

    /**
     * Delete an address.
     */
    public function destroy(Request $request, UserAddress $address): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        if ($address->user_id !== $user->id) {
            abort(403, 'Akses tidak diizinkan.');
        }

        $wasPrimary = $address->is_primary;

        DB::transaction(function () use ($user, $address, $wasPrimary) {
            $address->delete();

            if ($wasPrimary) {
                $next = $user->addresses()->latest()->first();
                if ($next) {
                    $next->update(['is_primary' => true]);
                }
            }
        });

        if ($request->wantsJson()) {
            return response()->json([
                'status' => true,
                'message' => 'Alamat berhasil dihapus.',
            ]);
        }

        return back()->with('success', 'Alamat berhasil dihapus.');
    }

    /**
     * Set an address as primary.
     */
    public function setPrimary(Request $request, UserAddress $address): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        if ($address->user_id !== $user->id) {
            abort(403, 'Akses tidak diizinkan.');
        }

        DB::transaction(function () use ($user, $address) {
            $user->addresses()->where('id', '!=', $address->id)->update(['is_primary' => false]);
            $address->update(['is_primary' => true]);

            if (empty($user->phone)) {
                $user->update(['phone' => $address->recipient_phone]);
            }
        });

        if ($request->wantsJson()) {
            return response()->json([
                'status' => true,
                'message' => 'Alamat utama berhasil diubah.',
                'data' => $address->fresh(),
            ]);
        }

        return back()->with('success', 'Alamat utama berhasil diubah.');
    }
}
