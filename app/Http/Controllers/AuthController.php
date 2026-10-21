<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Display the login page.
     */
    public function login(Request $request): Response|RedirectResponse
    {
        if (Auth::check()) {
            if ($request->user()?->isAdmin()) {
                return redirect()->route('admin.dashboard');
            }

            return redirect()->intended(route('products.index'));
        }

        return Inertia::render('login', [
            'status' => $request->session()->get('status'),
            'notice' => $request->query('notice'),
        ]);
    }

    /**
     * Display the registration page.
     */
    public function registerView(Request $request): Response|RedirectResponse
    {
        if (Auth::check()) {
            if ($request->user()?->isAdmin()) {
                return redirect()->route('admin.dashboard');
            }

            return redirect()->intended(route('products.index'));
        }

        return Inertia::render('register', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function authenticate(Request $request): RedirectResponse
    {
        // Support one-click demo login for rapid showcase and testing
        if ($request->boolean('demo')) {
            $user = User::firstOrCreate(
                ['email' => 'connoisseur@aromapalace.com'],
                [
                    'name' => 'Bangsawan Wangi',
                    'password' => Hash::make('secret123'),
                    'role' => 'customer',
                ]
            );

            Auth::login($user, true);
            $request->session()->regenerate();

            return redirect()->intended(route('products.index'));
        }

        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->has('remember') ? $request->boolean('remember') : true;

        if (Auth::attempt($credentials, $remember)) {
            $user = Auth::user();

            // Strict boundary: Administrator accounts must use the dedicated Admin Portal
            if ($user && $user->isAdmin()) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                $adminLoginUrl = (config('app.admin_url') ?: 'https://'.config('app.admin_domain', 'admin.aromapalace.id')).'/login';

                return back()->withErrors([
                    'email' => "Akun ini adalah akun Administrator. Silakan login melalui portal khusus Admin di {$adminLoginUrl}",
                ])->onlyInput('email');
            }

            $request->session()->regenerate();

            return redirect()->intended(route('products.index'));
        }

        return back()->withErrors([
            'email' => __('auth.failed'),
        ])->onlyInput('email');
    }

    /**
     * Handle an incoming registration request.
     */
    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'customer',
        ]);

        Auth::login($user, true);
        $request->session()->regenerate();

        $statusMessage = app()->getLocale() === 'en'
            ? "Welcome to Aroma Palace, {$user->name}!"
            : "Selamat datang di Aroma Palace, {$user->name}!";

        return redirect()->intended(route('products.index'))->with('status', $statusMessage);
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
