<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PreventAdminMiddleware;
use App\Http\Middleware\SetLocaleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));

            // Subdomain routes for admin (e.g. admin.aromapalace.id)
            Route::domain($adminDomain)
                ->middleware(['web', 'auth', 'admin'])
                ->group(function () {
                    // Primary routes on subdomain (e.g. /dashboard, /orders, /products)
                    Route::name('admin.')->group(base_path('routes/admin.php'));

                    // Compatibility alias with /admin prefix on the subdomain (/admin/dashboard, etc.)
                    Route::prefix('admin')->group(base_path('routes/admin.php'));
                });

            // Local development fallback: allow /admin on localhost without custom hosts
            if (app()->environment('local')) {
                Route::middleware(['web', 'auth', 'admin'])
                    ->prefix('admin')
                    ->group(base_path('routes/admin.php'));
            }
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'customer' => PreventAdminMiddleware::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'webhook/pakasir',
            'api/webhooks/*',
        ]);

        $middleware->web(append: [
            SetLocaleMiddleware::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
