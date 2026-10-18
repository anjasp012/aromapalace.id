<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    /**
     * Register or update an FCM device token.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'device_type' => ['nullable', 'string', 'in:web,android,ios'],
            'browser' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();
        $deviceType = $validated['device_type'] ?? 'web';
        $role = $user ? ($user->isAdmin() ? 'admin' : 'customer') : 'customer';

        $deviceToken = DeviceToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $user?->id,
                'device_type' => $deviceType,
                'role' => $role,
                'browser' => $validated['browser'] ?? $request->header('User-Agent'),
                'last_used_at' => now(),
            ]
        );

        if ($user) {
            // Remove older duplicate tokens for this user on the same device_type
            DeviceToken::where('user_id', $user->id)
                ->where('token', '!=', $validated['token'])
                ->where('device_type', $deviceType)
                ->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Token perangkat berhasil didaftarkan.',
            'data' => [
                'id' => $deviceToken->id,
                'role' => $deviceToken->role,
                'device_type' => $deviceToken->device_type,
            ],
        ]);
    }

    /**
     * Remove an FCM device token (e.g. on logout or revoke).
     */
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        DeviceToken::where('token', $validated['token'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Token perangkat berhasil dihapus.',
        ]);
    }
}
