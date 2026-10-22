import React, { useState, type ReactNode } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Store,
    LogOut,
    Menu,
    X,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Tags,
    Sparkles,
    Ticket,
    FileText,
    CreditCard,
    MapPin,
    Users,
    SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAdminOrderNotifier } from '@/lib/use-admin-notifications';

interface AdminLayoutProps {
    title: string;
    children: ReactNode;
    subtitle?: string;
}

interface SharedPageProps {
    auth?: {
        user?: {
            id?: number;
            name: string;
            email: string;
            role?: string;
        };
    };
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: unknown;
}

export default function AdminLayout({ title, subtitle, children }: AdminLayoutProps) {
    const { url, props } = usePage<SharedPageProps>();
    const user = props.auth?.user;
    const flash = props.flash;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dismissFlash, setDismissFlash] = useState(false);

    // Real-time Order Notification Poller (plays chime and shows desktop banner)
    useAdminOrderNotifier(Boolean(user && user.role === 'admin'));

    const isDashboard = url === '/' || url === '/dashboard' || url === '/admin' || url.startsWith('/admin/dashboard') || url.startsWith('/dashboard');
    const isOrders = url.startsWith('/manajemen-pesanan');
    const isUsers = url.startsWith('/manajemen-pengguna');
    const isProducts = url.startsWith('/manajemen-produk');
    const isCategories = url.startsWith('/manajemen-kategori');
    const isBrands = url.startsWith('/manajemen-brand');
    const isVouchers = url.startsWith('/manajemen-voucher');
    const isArticles = url.startsWith('/manajemen-artikel');
    const isSliderPromos = url.startsWith('/manajemen-slider-promo');
    const isStores = url.startsWith('/manajemen-butik');
    const isPaymentMethods = url.startsWith('/manajemen-pembayaran');

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[260px_1fr] bg-muted/40 text-foreground antialiased">
            <Head title={`${title} - Admin CMS`} />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar (Desktop + Mobile Drawer) - Standard Default shadcn sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-background border-r flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Brand Header */}
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 justify-between pt-[env(safe-area-inset-top,0px)] box-content">
                    <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-foreground">
                        <img
                            src="/images/logo.png"
                            alt="Aroma Palace"
                            className="size-7 object-contain rounded-full border shrink-0"
                        />
                        <div className="flex flex-col leading-none">
                            <span className="text-sm font-semibold tracking-tight">Aroma Palace</span>
                            <span className="text-[11px] text-muted-foreground font-normal">Admin CMS</span>
                        </div>
                    </Link>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden size-8"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                        <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Menu Utama
                        </div>

                        <Link
                            href="/dashboard"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isDashboard
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <LayoutDashboard className="size-4" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            href="/manajemen-pesanan"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isOrders
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <ShoppingBag className="size-4" />
                            <span>Pesanan</span>
                        </Link>

                        <Link
                            href="/manajemen-pengguna"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isUsers
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <Users className="size-4" />
                            <span>Pengguna</span>
                        </Link>

                        <Separator className="my-2" />

                        <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Katalog
                        </div>

                        <Link
                            href="/manajemen-produk"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isProducts
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <Package className="size-4" />
                            <span>Produk &amp; Varian</span>
                        </Link>

                        <Link
                            href="/manajemen-kategori"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isCategories
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <Tags className="size-4" />
                            <span>Kategori</span>
                        </Link>

                        <Link
                            href="/manajemen-brand"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isBrands
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <Sparkles className="size-4" />
                            <span>Brand</span>
                        </Link>

                        <Separator className="my-2" />

                        <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Promosi &amp; Konten
                        </div>

                        <Link
                            href="/manajemen-voucher"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isVouchers
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <Ticket className="size-4" />
                            <span>Voucher</span>
                        </Link>

                        <Link
                            href="/manajemen-artikel"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isArticles
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <FileText className="size-4" />
                            <span>Artikel</span>
                        </Link>

                        <Link
                            href="/manajemen-slider-promo"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isSliderPromos
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <SlidersHorizontal className="size-4" />
                            <span>Slider Promo</span>
                        </Link>

                        <Separator className="my-2" />

                        <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Outlet &amp; Pengaturan
                        </div>

                        <Link
                            href="/manajemen-butik"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isStores
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <MapPin className="size-4" />
                            <span>Lokasi Butik</span>
                        </Link>

                        <Link
                            href="/manajemen-pembayaran"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                                isPaymentMethods
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <CreditCard className="size-4" />
                            <span>Metode Pembayaran</span>
                        </Link>

                        <Separator className="my-2" />

                        <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Navigasi
                        </div>

                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Store className="size-4" />
                                <span>Buka Toko</span>
                            </div>
                            <ExternalLink className="size-3.5" />
                        </a>
                    </nav>
                </div>

                {/* Footer User Profile & Logout - Beside Name */}
                <div className="border-t p-3 lg:p-4 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="size-9 rounded-full bg-muted border flex items-center justify-center font-medium text-xs text-muted-foreground shrink-0">
                                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium leading-none truncate text-foreground">
                                    {user?.name || 'Administrator'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate mt-1">
                                    {user?.email || 'admin@aromapalace.com'}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            title="Keluar (Logout)"
                            aria-label="Keluar (Logout)"
                        >
                            <LogOut className="size-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col min-w-0 min-h-screen">
                {/* Header Topbar */}
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 justify-between pt-[env(safe-area-inset-top,0px)] box-content">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden size-8"
                            aria-label="Buka Menu"
                        >
                            <Menu className="size-4" />
                        </Button>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Admin</span>
                            <ChevronRight className="size-3.5" />
                            <span className="font-medium text-foreground">{title}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a href="/" target="_blank" rel="noopener noreferrer">
                                <Store className="size-3.5 mr-1.5" />
                                <span className="hidden sm:inline">Lihat Toko</span>
                            </a>
                        </Button>

                        <Button size="sm" asChild>
                            <Link href="/admin/orders">
                                <ShoppingBag className="size-3.5 mr-1.5" />
                                <span>Kelola Pesanan</span>
                            </Link>
                        </Button>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && !dismissFlash && (
                    <div className="px-4 lg:px-6 pt-4">
                        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                <span>{flash.success}</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDismissFlash(true)}
                                className="size-6 text-emerald-700 hover:bg-emerald-100"
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {flash?.error && !dismissFlash && (
                    <div className="px-4 lg:px-6 pt-4">
                        <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{flash.error}</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDismissFlash(true)}
                                className="size-6"
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Subtitle if provided */}
                {subtitle && (
                    <div className="px-4 lg:px-6 pt-4">
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    </div>
                )}

                {/* Page Content Container */}
                <main className="flex-1 p-4 lg:p-6 space-y-6">{children}</main>

                {/* Footer */}
                <footer className="hidden md:block border-t py-4 px-4 lg:px-6 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} Aroma Palace &bull; Admin CMS
                </footer>
            </div>
        </div>
    );
}
