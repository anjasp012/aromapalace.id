<?php

use App\Http\Controllers\Admin\ArticleController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\PaymentMethodController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SliderPromoController;
use App\Http\Controllers\Admin\StoreController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VoucherController;
use App\Http\Controllers\CoverageAreaController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\ShippingController;
use Illuminate\Support\Facades\Route;

// Dedicated Admin Guest Authentication
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/login', [AuthController::class, 'authenticate'])->name('login.post');
});

// Protected Administrator CMS Routes
Route::middleware(['auth', 'admin'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Admin Real-time Notifications & Management
    Route::get('/manajemen-notifikasi', [NotificationController::class, 'page'])->name('notifications.page');
    Route::get('/manajemen-notifikasi/{notification}/go', [NotificationController::class, 'goToNotification'])->name('notifications.go');
    Route::delete('/manajemen-notifikasi/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::get('/api/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/api/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/api/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    Route::post('/api/device-tokens', [DeviceTokenController::class, 'store'])->name('device-tokens.store');
    Route::delete('/api/device-tokens', [DeviceTokenController::class, 'destroy'])->name('device-tokens.destroy');

    Route::get('/manajemen-pesanan', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/manajemen-pesanan/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('/manajemen-pesanan/{order}/shipping-label', [OrderController::class, 'shippingLabel'])->name('orders.shipping-label');
    Route::patch('/manajemen-pesanan/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');
    Route::post('/manajemen-pesanan/{order}/pulihkan', [OrderController::class, 'restore'])->name('orders.restore');
    Route::delete('/manajemen-pesanan/{order}/hapus-permanen', [OrderController::class, 'forceDelete'])->name('orders.force-delete');
    Route::delete('/manajemen-pesanan/{order}', [OrderController::class, 'destroy'])->name('orders.destroy');
    Route::post('/manajemen-pesanan/{order}/sync-resi', [OrderController::class, 'syncResi'])->name('orders.sync-resi');
    Route::post('/manajemen-pesanan/{order}/acc-bukti', [OrderController::class, 'approveManualPayment'])->name('orders.approve-manual-payment');
    Route::post('/manajemen-pesanan/{order}/tolak-bukti', [OrderController::class, 'rejectManualPayment'])->name('orders.reject-manual-payment');
    Route::get('/api/shipping/track/{awb}', [ShippingController::class, 'track'])->name('admin.shipping.track');
    Route::get('/api/coverage/provinces', [CoverageAreaController::class, 'provinces'])->name('coverage.provinces');
    Route::get('/api/coverage/cities', [CoverageAreaController::class, 'cities'])->name('coverage.cities');
    Route::get('/api/coverage/districts', [CoverageAreaController::class, 'districts'])->name('coverage.districts');
    Route::get('/api/coverage/subdistricts', [CoverageAreaController::class, 'subdistricts'])->name('coverage.subdistricts');
    Route::get('/api/coverage/geocode', [CoverageAreaController::class, 'geocode'])->name('coverage.geocode');

    // Product & Variant Management
    Route::get('/manajemen-produk', [ProductController::class, 'index'])->name('products.index');
    Route::get('/manajemen-produk/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('/manajemen-produk', [ProductController::class, 'store'])->name('products.store');
    Route::get('/manajemen-produk/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::match(['put', 'patch', 'post'], '/manajemen-produk/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::post('/manajemen-produk/{id}/pulihkan', [ProductController::class, 'restore'])->name('products.restore');
    Route::delete('/manajemen-produk/{id}/hapus-permanen', [ProductController::class, 'forceDelete'])->name('products.force-delete');
    Route::delete('/manajemen-produk/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::patch('/manajemen-produk/{product}/variants/{variant}/stock', [ProductController::class, 'updateVariantStock'])->name('products.variants.update-stock');
    Route::delete('/manajemen-produk/{product}/variants/{variant}', [ProductController::class, 'destroyVariant'])->name('products.variants.destroy');

    // Category Management
    Route::get('/manajemen-kategori', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/manajemen-kategori/create', [CategoryController::class, 'create'])->name('categories.create');
    Route::post('/manajemen-kategori', [CategoryController::class, 'store'])->name('categories.store');
    Route::get('/manajemen-kategori/{category}/edit', [CategoryController::class, 'edit'])->name('categories.edit');
    Route::match(['put', 'patch', 'post'], '/manajemen-kategori/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/manajemen-kategori/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    // Brand Management
    Route::get('/manajemen-brand', [BrandController::class, 'index'])->name('brands.index');
    Route::get('/manajemen-brand/create', [BrandController::class, 'create'])->name('brands.create');
    Route::post('/manajemen-brand', [BrandController::class, 'store'])->name('brands.store');
    Route::get('/manajemen-brand/{brand}/edit', [BrandController::class, 'edit'])->name('brands.edit');
    Route::match(['put', 'patch', 'post'], '/manajemen-brand/{brand}', [BrandController::class, 'update'])->name('brands.update');
    Route::delete('/manajemen-brand/{brand}', [BrandController::class, 'destroy'])->name('brands.destroy');

    // Voucher Management
    Route::get('/manajemen-voucher', [VoucherController::class, 'index'])->name('vouchers.index');
    Route::get('/manajemen-voucher/create', [VoucherController::class, 'create'])->name('vouchers.create');
    Route::post('/manajemen-voucher', [VoucherController::class, 'store'])->name('vouchers.store');
    Route::get('/manajemen-voucher/{voucher}/edit', [VoucherController::class, 'edit'])->name('vouchers.edit');
    Route::match(['put', 'patch'], '/manajemen-voucher/{voucher}', [VoucherController::class, 'update'])->name('vouchers.update');
    Route::patch('/manajemen-voucher/{voucher}/toggle', [VoucherController::class, 'toggle'])->name('vouchers.toggle');
    Route::delete('/manajemen-voucher/{voucher}', [VoucherController::class, 'destroy'])->name('vouchers.destroy');

    // Article Management
    Route::get('/manajemen-artikel', [ArticleController::class, 'index'])->name('articles.index');
    Route::get('/manajemen-artikel/create', [ArticleController::class, 'create'])->name('articles.create');
    Route::post('/manajemen-artikel', [ArticleController::class, 'store'])->name('articles.store');
    Route::get('/manajemen-artikel/{article}/edit', [ArticleController::class, 'edit'])->name('articles.edit');
    Route::match(['put', 'patch', 'post'], '/manajemen-artikel/{article}', [ArticleController::class, 'update'])->name('articles.update');
    Route::delete('/manajemen-artikel/{article}', [ArticleController::class, 'destroy'])->name('articles.destroy');

    // Slider Promo Management
    Route::get('/manajemen-slider-promo', [SliderPromoController::class, 'index'])->name('slider-promos.index');
    Route::get('/manajemen-slider-promo/create', [SliderPromoController::class, 'create'])->name('slider-promos.create');
    Route::post('/manajemen-slider-promo', [SliderPromoController::class, 'store'])->name('slider-promos.store');
    Route::get('/manajemen-slider-promo/{slider_promo}/edit', [SliderPromoController::class, 'edit'])->name('slider-promos.edit');
    Route::match(['put', 'patch', 'post'], '/manajemen-slider-promo/{slider_promo}', [SliderPromoController::class, 'update'])->name('slider-promos.update');
    Route::delete('/manajemen-slider-promo/{slider_promo}', [SliderPromoController::class, 'destroy'])->name('slider-promos.destroy');

    // Payment Method Management
    Route::get('/manajemen-pembayaran', [PaymentMethodController::class, 'index'])->name('payment-methods.index');
    Route::get('/manajemen-pembayaran/create', [PaymentMethodController::class, 'create'])->name('payment-methods.create');
    Route::post('/manajemen-pembayaran', [PaymentMethodController::class, 'store'])->name('payment-methods.store');
    Route::get('/manajemen-pembayaran/{payment_method}/edit', [PaymentMethodController::class, 'edit'])->name('payment-methods.edit');
    Route::patch('/manajemen-pembayaran/{payment_method}/toggle', [PaymentMethodController::class, 'toggleStatus'])->name('payment-methods.toggle');
    Route::match(['put', 'patch', 'post'], '/manajemen-pembayaran/{payment_method}', [PaymentMethodController::class, 'update'])->name('payment-methods.update');
    Route::delete('/manajemen-pembayaran/{payment_method}', [PaymentMethodController::class, 'destroy'])->name('payment-methods.destroy');

    // Store Location Management
    Route::get('/manajemen-butik', [StoreController::class, 'index'])->name('stores.index');
    Route::get('/manajemen-butik/create', [StoreController::class, 'create'])->name('stores.create');
    Route::post('/manajemen-butik', [StoreController::class, 'store'])->name('stores.store');
    Route::get('/manajemen-butik/{store}/edit', [StoreController::class, 'edit'])->name('stores.edit');
    Route::match(['put', 'patch', 'post'], '/manajemen-butik/{store}', [StoreController::class, 'update'])->name('stores.update');
    Route::delete('/manajemen-butik/{store}', [StoreController::class, 'destroy'])->name('stores.destroy');

    // User Management
    Route::get('/manajemen-pengguna', [UserController::class, 'index'])->name('users.index');
    Route::get('/manajemen-pengguna/create', [UserController::class, 'create'])->name('users.create');
    Route::post('/manajemen-pengguna', [UserController::class, 'store'])->name('users.store');
    Route::get('/manajemen-pengguna/{user}', [UserController::class, 'show'])->name('users.show');
    Route::get('/manajemen-pengguna/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::match(['put', 'patch'], '/manajemen-pengguna/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('/manajemen-pengguna/{user}/role', [UserController::class, 'updateRole'])->name('users.update-role');
    Route::post('/manajemen-pengguna/{user}/points/add', [UserController::class, 'addPoints'])->name('users.points.add');
    Route::post('/manajemen-pengguna/{user}/points/deduct', [UserController::class, 'deductPoints'])->name('users.points.deduct');
    Route::post('/manajemen-pengguna/{id}/pulihkan', [UserController::class, 'restore'])->name('users.restore');
    Route::delete('/manajemen-pengguna/{id}/hapus-permanen', [UserController::class, 'forceDelete'])->name('users.force-delete');
    Route::delete('/manajemen-pengguna/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Store & Origin Shipping Settings
    Route::get('/pengaturan', [SettingController::class, 'index'])->name('settings.index');
    Route::post('/pengaturan', [SettingController::class, 'update'])->name('settings.update');
    Route::post('/pengaturan/test-kiriminaja', [SettingController::class, 'testKiriminAja'])->name('settings.test-kiriminaja');

    // Convenient Aliases
    Route::get('/admin', fn () => redirect()->route('admin.dashboard'));
    Route::get('/admin/dashboard', fn () => redirect()->route('admin.dashboard'));
    Route::get('/manajemen-pelanggan', fn () => redirect()->route('admin.users.index'));
    Route::get('/manajemen-pelanggan/{user}', fn ($user) => redirect()->route('admin.users.show', $user));
    Route::get('/manajemen-membership', fn () => redirect()->route('admin.users.index'));
    Route::get('/products/{product}/edit', fn ($product) => redirect()->route('admin.products.edit', $product));
    Route::get('/categories/{category}/edit', fn ($category) => redirect()->route('admin.categories.edit', $category));
    Route::get('/brands/{brand}/edit', fn ($brand) => redirect()->route('admin.brands.edit', $brand));
    Route::get('/articles/{article}/edit', fn ($article) => redirect()->route('admin.articles.edit', $article));
});
