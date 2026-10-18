<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventAdminMiddleware
{
    /**
     * Handle an incoming request.
     * Ensure administrators cannot access customer-only cart and wishlist features.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isAdmin()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Akun administrator tidak diizinkan menggunakan fitur wishlist dan keranjang belanja.',
                ], 403);
            }

            return redirect()->route('admin.dashboard')
                ->with('error', 'Akun administrator tidak dapat mengakses fitur wishlist atau keranjang belanja.');
        }

        return $next($request);
    }
}
