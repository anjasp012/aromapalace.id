<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PakasirWebhookController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('/articles', [ArticleController::class, 'index'])->name('articles.index');
Route::get('/articles/{slug}', [ArticleController::class, 'show'])->name('articles.show');
Route::get('/stores', [StoreController::class, 'index'])->name('stores.index');
Route::get('/about', [AboutController::class, 'index'])->name('about');
Route::post('/consultation', [AboutController::class, 'consultation'])->name('consultation.store');
Route::get('/membership', [MembershipController::class, 'index'])->name('membership.index');
Route::get('/loyalty', fn () => redirect()->route('membership.index'));
Route::get('/orders', fn () => redirect()->route('account.orders'));

Route::get('/api/search/suggestions', [SearchController::class, 'suggestions'])->name('search.suggestions');
Route::get('/search-history', [SearchController::class, 'index'])->name('search.history.index');
Route::post('/search-history', [SearchController::class, 'store'])->name('search.history.store');
Route::delete('/search-history', [SearchController::class, 'destroy'])->name('search.history.destroy');
Route::post('/search-history/sync', [SearchController::class, 'sync'])->name('search.history.sync');

Route::post('/webhook/pakasir', [PakasirWebhookController::class, 'handle'])->name('webhook.pakasir');

Route::post('/api/device-tokens', [DeviceTokenController::class, 'store'])->name('device-tokens.store');
Route::delete('/api/device-tokens', [DeviceTokenController::class, 'destroy'])->name('device-tokens.destroy');

Route::get('/login', [AuthController::class, 'login'])->name('login');
Route::post('/login', [AuthController::class, 'authenticate'])->name('login.post');
Route::get('/register', [AuthController::class, 'registerView'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->name('register.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::get('/account/login', fn () => redirect()->route('login'));
Route::get('/account/register', fn () => redirect()->route('register'));

Route::middleware('auth')->group(function () {
    Route::middleware('customer')->group(function () {
        Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
        Route::post('/wishlist/toggle', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
        Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy'])->name('wishlist.destroy');

        Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
        Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
        Route::patch('/cart/{id}', [CartController::class, 'update'])->name('cart.update');
        Route::delete('/cart/{id}', [CartController::class, 'destroy'])->name('cart.destroy');
        Route::delete('/cart', [CartController::class, 'clear'])->name('cart.clear');

        Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
        Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');

        Route::get('/account', [AccountController::class, 'index'])->name('account.index');
        Route::patch('/account/profile', [AccountController::class, 'updateProfile'])->name('account.profile.update');
        Route::patch('/account/password', [AccountController::class, 'updatePassword'])->name('account.password.update');
        Route::get('/account/orders', [OrderController::class, 'index'])->name('account.orders');
        Route::post('/membership/join', [MembershipController::class, 'join'])->name('membership.join');
        Route::post('/membership/redeem/{reward}', [MembershipController::class, 'redeem'])->name('membership.redeem');
    });

    Route::get('/payment/{order}', [PaymentController::class, 'show'])->name('payment.show');
    Route::post('/payment/{order}/check', [PaymentController::class, 'checkStatus'])->name('payment.check');
    Route::get('/payment', fn () => redirect()->route('checkout.index'));
    Route::get('/orders/{order}/invoice', [OrderController::class, 'invoice'])->name('orders.invoice');
    Route::get('/invoice/{order}', [OrderController::class, 'invoice'])->name('invoice.show');
});
