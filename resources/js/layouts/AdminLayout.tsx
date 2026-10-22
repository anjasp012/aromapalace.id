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
    Bell,
    CheckCheck,
    Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { useAdminOrderNotifier } from '@/lib/use-admin-notifications';

interface AdminLayoutProps {
    title: string;
    children: ReactNode;
    subtitle?: string;
}

export interface AdminNotificationItem {
    id: number;
    type: string;
    title: string;
    body: string;
    url?: string | null;
    is_read: boolean;
    created_at?: string | null;
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
    admin_notifications?: AdminNotificationItem[];
    admin_unread_notifications_count?: number;
    [key: string]: unknown;
}

export default function AdminLayout({ title, subtitle, children }: AdminLayoutProps) {
    const { url, props } = usePage<SharedPageProps>();
    const user = props.auth?.user;
    const flash = props.flash;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dismissFlash, setDismissFlash] = useState(false);

    const notifications = props.admin_notifications ?? [];
    const unreadCount = props.admin_unread_notifications_count ?? 0;

    const handleMarkAllAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.post('/api/notifications/mark-all-read', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleNotificationClick = (notif: AdminNotificationItem) => {
        router.visit(`/manajemen-notifikasi/${notif.id}/go`);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_order':
                return (
                    <div className="size-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <ShoppingBag className="size-4" />
                    </div>
                );
            case 'payment_success':
            case 'admin_payment_received':
                return (
                    <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CreditCard className="size-4" />
                    </div>
                );
            case 'order_shipped':
                return (
                    <div className="size-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Truck className="size-4" />
                    </div>
                );
            case 'store_pickup_ready':
                return (
                    <div className="size-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Store className="size-4" />
                    </div>
                );
            case 'voucher_reward':
                return (
                    <div className="size-8 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                        <Ticket className="size-4" />
                    </div>
                );
            default:
                return (
                    <div className="size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                        <Bell className="size-4" />
                    </div>
                );
        }
    };

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
    const isNotifications = url.startsWith('/manajemen-notifikasi');

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

                        <Link
                            href="/manajemen-notifikasi"
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all ${
                                isNotifications
                                    ? 'bg-muted text-primary font-semibold'
                                    : 'text-muted-foreground hover:text-primary hover:bg-muted'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Bell className="size-4" />
                                <span>Notifikasi</span>
                            </div>
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4 font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Badge>
                            )}
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
                        {/* Notification Bell Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="relative size-8 cursor-pointer"
                                    title="Notifikasi"
                                    aria-label="Notifikasi"
                                >
                                    <Bell className="size-4 text-foreground/80" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-xs animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-xl shadow-lg border">
                                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-foreground">Notifikasi</span>
                                        {unreadCount > 0 && (
                                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                                                {unreadCount} baru
                                            </Badge>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleMarkAllAsRead}
                                            className="text-[11px] text-primary hover:underline font-medium cursor-pointer flex items-center gap-1"
                                        >
                                            <CheckCheck className="size-3" />
                                            <span>Tandai Semua Dibaca</span>
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground space-y-1.5">
                                            <Bell className="size-8 mx-auto opacity-30" />
                                            <p className="text-xs font-medium text-foreground">Tidak ada notifikasi</p>
                                            <p className="text-[11px]">Pemberitahuan transaksi atau pesanan baru akan muncul di sini.</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-muted/50 ${
                                                    !notif.is_read ? 'bg-primary/5' : ''
                                                }`}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {getNotificationIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-0.5">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <p className={`text-xs truncate ${!notif.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                                                            {notif.title}
                                                        </p>
                                                        {!notif.is_read && (
                                                            <span className="size-2 rounded-full bg-primary shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {notif.body}
                                                    </p>
                                                    {notif.created_at && (
                                                        <p className="text-[10px] text-muted-foreground/75 font-mono pt-0.5">
                                                            {notif.created_at}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="border-t p-2 bg-muted/20 text-center">
                                    <Link
                                        href="/manajemen-notifikasi"
                                        className="text-xs font-medium text-primary hover:underline block py-1"
                                    >
                                        Lihat Semua Notifikasi &rarr;
                                    </Link>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" size="sm" asChild>
                            <a href="/" target="_blank" rel="noopener noreferrer">
                                <Store className="size-3.5 mr-1.5" />
                                <span className="hidden sm:inline">Lihat Toko</span>
                            </a>
                        </Button>

                        <Button size="sm" asChild>
                            <Link href="/manajemen-pesanan">
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
