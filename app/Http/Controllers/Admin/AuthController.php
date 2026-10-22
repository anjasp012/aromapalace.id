<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Display the dedicated admin login view.
     */
    public function login(Request $request): Response|RedirectResponse
    {
        if (Auth::check()) {
            if ($request->user()?->isAdmin()) {
                return redirect()->route('admin.dashboard');
            }

            // If logged in as customer, log out so admin can log in
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return Inertia::render('admin/login', [
            'status' => $request->session()->get('status'),
            'storefront_url' => config('app.url', 'https://aromapalace.id'),
        ]);
    }

    /**
     * Authenticate an administrator session.
     */
    public function authenticate(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $throttleKey = Str::transliterate(Str::lower($request->input('email')).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'email' => "Terlalu banyak percobaan login admin. Silakan coba lagi dalam {$seconds} detik.",
            ]);
        }

        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey, 300);

            return back()->withErrors([
                'email' => __('auth.failed'),
            ])->onlyInput('email');
        }

        RateLimiter::clear($throttleKey);

        $user = Auth::user();

        // Strict verification: only admins can access this subdomain
        if (! $user || ! $user->isAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'email' => 'Akses ditolak. Akun ini tidak memiliki hak akses administrator Aroma Palace.',
            ])->onlyInput('email');
        }

        $request->session()->regenerate();

        return redirect()->route('admin.dashboard');
    }

    /**
     * Terminate the administrator session.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')->with('status', 'Anda telah berhasil keluar dari sesi panel admin.');
    }
}
