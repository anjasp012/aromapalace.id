import { Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@/components/ui/tabs';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Package,
    Heart,
    ShoppingCart,
    LogOut,
    LogIn,
    UserPlus,
    Search,
    History,
    Trash2,
    X,
    ArrowRight,
    Loader2,
    LayoutDashboard,
    Home,
    Compass,
    User,
    BookOpen,
    Crown,
    Globe,
    ChevronDown,
    Check,
    Download,
    Smartphone,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { autoRequestNotificationPermission, initFirebaseForegroundListener } from '@/lib/push-notification';
import { clearUserClientCache } from '@/lib/cache-cleanup';
import { playMenuTapSound } from '@/lib/sound-effects';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { getAdminUrl } from '@/lib/route-resolver';
import { isRunningInNativeApp, isAdminContext } from '@/lib/app-redirect';
import PullToRefresh from '@/components/PullToRefresh';
import AppUpdateModal from '@/components/AppUpdateModal';
import { FlagIndonesiaIcon, FlagEnglishIcon, FlagLocaleIcon } from '@/components/FlagIcons';

import { App as CapApp } from '@capacitor/app';

const limitWords = (text: string, maxWords: number = 6): string => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    const sliced = words.slice(0, maxWords).join(' ').replace(/[!→,.-]+$/, '').trim();
    return `${sliced}....`;
};

interface LayoutProps {
    children: ReactNode;
    showFooter?: boolean;
    showBottomNav?: boolean;
    disablePullToRefresh?: boolean;
}

interface SuggestionProduct {
    id: number;
    name: string;
    slug: string;
    brand: string;
    category?: string;
    family?: string;
    price: string;
    image: string;
}

interface SuggestionBrand {
    id: number;
    name: string;
    slug: string;
    products_count: number;
}

export interface HeaderVoucher {
    id: number;
    code: string;
    name: string;
    description: string | null;
    terms?: string[] | null;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
}

interface SharedProps {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            role?: string;
        };
        is_admin?: boolean;
        wishlist_ids?: number[];
        wishlist_count?: number;
        cart_count?: number;
        membership?: {
            membership_number: string;
            tier: string;
            tier_label: string;
            points: number;
            points_formatted: string;
        } | null;
        search_history?: string[];
    };
    header_vouchers?: HeaderVoucher[];
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: unknown;
}

declare global {
    interface Window {
        openPromoModal?: (voucher?: HeaderVoucher) => void;
        openSpotlight?: () => void;
        openInfoModal?: (tab?: string) => void;
        openStoreModal?: () => void;
        openContactModal?: () => void;
        openAndroidApkModal?: () => void;
        showWishlistToast?: (message: string, isAdded?: boolean) => void;
        showCartToast?: (message: string) => void;
        showPromoToast?: (message: string) => void;
        copyPromoCode?: (code: string) => void;
    }
}

export default function Layout({ children, showFooter = true, showBottomNav, disablePullToRefresh = false }: LayoutProps) {
    const { url, props } = usePage<SharedProps>();
    const user = props?.auth?.user;
    const isAdmin = Boolean(props?.auth?.is_admin || user?.role === 'admin');
    const { locale, isEn, isId, t, pickText, setLanguage } = useTranslation();

    const adminBaseUrl = (props as any)?.admin_url;
    const adminDashboardUrl = getAdminUrl('/dashboard', adminBaseUrl);

    // Header & Mobile Nav State
    const [slidRight, setSlidRight] = useState(false);
    const navTrackRef = useRef<HTMLDivElement>(null);

    // Modals State using shadcn Dialog
    const [promoModalOpen, setPromoModalOpen] = useState(false);

    // Header Vouchers from Inertia shared props (cached with rememberForever)
    const headerVouchers: HeaderVoucher[] = props.header_vouchers || [];

    const [currentVoucherIndex, setCurrentVoucherIndex] = useState(0);
    const [isVoucherFading, setIsVoucherFading] = useState(false);
    const [selectedHeaderVoucher, setSelectedHeaderVoucher] = useState<HeaderVoucher | null>(headerVouchers[0] || null);
    const [isScrolledPastTopbar, setIsScrolledPastTopbar] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolledPastTopbar(window.scrollY > 32);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Sequential rotating announcement every 3.5 seconds across active database vouchers
    useEffect(() => {
        if (headerVouchers.length <= 1) return;
        const timer = setInterval(() => {
            setIsVoucherFading(true);
            setTimeout(() => {
                setCurrentVoucherIndex((prev) => (prev + 1) % headerVouchers.length);
                setIsVoucherFading(false);
            }, 250);
        }, 3500);

        return () => clearInterval(timer);
    }, [headerVouchers.length]);

    const activeHeaderVoucher = headerVouchers[currentVoucherIndex] || headerVouchers[0] || null;

    const handleOpenVoucherModal = (voucherToOpen?: HeaderVoucher | null) => {
        const target = voucherToOpen || activeHeaderVoucher;
        if (!target) return;
        setSelectedHeaderVoucher(target);
        setPromoModalOpen(true);
    };

    const [spotlightOpen, setSpotlightOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<{ products: SuggestionProduct[]; brands: SuggestionBrand[] }>({
        products: [],
        brands: [],
    });
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const spotlightInputRef = useRef<HTMLInputElement>(null);

    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [infoActiveTab, setInfoActiveTab] = useState<string>('faq');
    const [storeModalOpen, setStoreModalOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [androidApkModalOpen, setAndroidApkModalOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    const handleDownloadApk = () => {
        try {
            sessionStorage.setItem('android_apk_download_prompt_dismissed', '1');
        } catch {
            // ignore
        }
        setAndroidApkModalOpen(false);

        const link = document.createElement('a');
        link.href = '/app-release.apk';
        link.download = 'Aroma-Palace.apk';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.showPromoToast) {
            window.showPromoToast(
                isEn
                    ? 'Downloading Aroma Palace APK...'
                    : 'Mengunduh aplikasi Aroma Palace APK...'
            );
        }
    };

    const handleDismissApkModal = () => {
        try {
            sessionStorage.setItem('android_apk_download_prompt_dismissed', '1');
        } catch {
            // ignore
        }
        setAndroidApkModalOpen(false);
    };

    const [isAndroidBrowser, setIsAndroidBrowser] = useState(false);

    // Auto-prompt download confirmation popup on Android browsers
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const ua = navigator.userAgent || navigator.vendor || '';
        const isAndroid = /Android/i.test(ua);
        const isAndroidInBrowser = isAndroid && !isRunningInNativeApp();
        setIsAndroidBrowser(isAndroidInBrowser);

        if (!isAndroidInBrowser) return;

        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin') || isAdminContext()) return;

        const SESSION_KEY = 'android_apk_download_prompt_dismissed';
        try {
            if (sessionStorage.getItem(SESSION_KEY)) return;
        } catch {
            // ignore
        }

        const timer = setTimeout(() => {
            setAndroidApkModalOpen(true);
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    // Toast States
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Wishlist & Cart Counts from DB / shared props
    const wishlistCount = props?.auth?.wishlist_count ?? 0;
    const cartCount = props?.auth?.cart_count ?? 0;

    const pathname = (typeof window !== 'undefined' ? window.location.pathname : url) || '';
    const isCartOrCheckout =
        url.startsWith('/cart') ||
        url.startsWith('/checkout') ||
        url.includes('/cart') ||
        url.includes('/checkout') ||
        pathname.includes('/cart') ||
        pathname.includes('/checkout');

    const shouldShowBottomNav = (showBottomNav ?? !isCartOrCheckout) && !url.startsWith('/admin') && !url.includes('/admin') && !pathname.includes('/admin');

    const mobileNavItems = useMemo(() => [
        {
            label: isEn ? 'Home' : 'Beranda',
            href: '/',
            component: 'home',
            active: url === '/',
            renderIcon: (active: boolean) => (
                <Home className="w-5 h-5 transition-transform duration-200" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.3 : 1.8} />
            ),
            activeColor: 'text-[#4A070B] dark:text-[#E8D0BA]',
            activeBg: 'bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15',
        },
        {
            label: isEn ? 'Articles' : 'Artikel',
            href: '/articles',
            component: 'articles',
            active: url.startsWith('/articles'),
            renderIcon: (active: boolean) => (
                <BookOpen className="w-5 h-5 transition-transform duration-200" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.3 : 1.8} />
            ),
            activeColor: 'text-[#4A070B] dark:text-[#E8D0BA]',
            activeBg: 'bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15',
        },
        {
            label: isEn ? 'Wishlist' : 'Favorit',
            href: user ? '/wishlist' : '/login?notice=' + encodeURIComponent(isEn ? 'Please sign in to view your wishlist.' : 'Silakan masuk untuk melihat daftar favorit Anda.'),
            component: user ? 'wishlist' : 'login',
            active: url.startsWith('/wishlist'),
            badge: wishlistCount,
            renderIcon: (active: boolean) => (
                <Heart className={`w-5 h-5 transition-transform duration-200 ${active ? 'text-rose-600 dark:text-rose-400' : ''}`} fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.3 : 1.8} />
            ),
            activeColor: 'text-rose-600 dark:text-rose-400',
            activeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
        },
        {
            label: isEn ? 'Transactions' : 'Transaksi',
            href: user ? '/account/orders' : '/login?notice=' + encodeURIComponent(isEn ? 'Please sign in to view your orders.' : 'Silakan masuk untuk melihat transaksi Anda.'),
            component: user ? 'orders' : 'login',
            active: url.startsWith('/account/orders') || url.startsWith('/orders') || url.startsWith('/payment'),
            renderIcon: (active: boolean) => (
                <Package className="w-5 h-5 transition-transform duration-200" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.3 : 1.8} />
            ),
            activeColor: 'text-[#4A070B] dark:text-[#E8D0BA]',
            activeBg: 'bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15',
        },
        {
            label: user ? (isAdmin ? 'Admin' : (isEn ? 'Account' : 'Akun')) : (isEn ? 'Account' : 'Akun'),
            href: user ? (isAdmin ? adminDashboardUrl : '/account') : '/login',
            component: user ? (isAdmin ? undefined : 'account') : 'login',
            isExternal: Boolean(user && isAdmin),
            active: (url === '/account' || url.startsWith('/membership') || url.startsWith('/loyalty') || url.startsWith('/login') || url.startsWith('/register') || (isAdmin && url.startsWith('/admin'))) && !url.startsWith('/account/orders') && !url.startsWith('/orders') && !url.startsWith('/payment'),
            renderIcon: (active: boolean) => (
                isAdmin ? (
                    <LayoutDashboard className="w-5 h-5 transition-transform duration-200" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.3 : 1.8} />
                ) : (
                    <User className="w-5 h-5 transition-transform duration-200" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 2.3 : 1.8} />
                )
            ),
            activeColor: 'text-[#4A070B] dark:text-[#E8D0BA]',
            activeBg: 'bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15',
        },
    ], [url, user, isAdmin, adminDashboardUrl, wishlistCount, isEn]);

    const getCsrfToken = () => {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    // Load / sync search history between localStorage and DB
    useEffect(() => {
        if (user) {
            try {
                const local = localStorage.getItem('aromapalace_search_history');
                if (local) {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        fetch('/search-history/sync', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                                'X-CSRF-TOKEN': getCsrfToken(),
                            },
                            body: JSON.stringify({ queries: parsed }),
                        })
                            .then((res) => res.json())
                            .then((data) => {
                                if (Array.isArray(data.history)) {
                                    setSearchHistory(data.history);
                                }
                                localStorage.removeItem('aromapalace_search_history');
                            })
                            .catch(() => {
                                localStorage.removeItem('aromapalace_search_history');
                            });
                        return;
                    }
                    localStorage.removeItem('aromapalace_search_history');
                }
            } catch {
                localStorage.removeItem('aromapalace_search_history');
            }

            if (props?.auth?.search_history) {
                setSearchHistory(props.auth.search_history);
            }
        } else {
            // Guest mode
            try {
                const saved = localStorage.getItem('aromapalace_search_history');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        setSearchHistory(parsed);
                    }
                }
            } catch {
                setSearchHistory([]);
            }
        }
    }, [user?.id, props?.auth?.search_history]);

    // Live suggestion fetcher
    useEffect(() => {
        const clean = searchQuery.trim();
        if (!clean) {
            setSuggestions({ products: [], brands: [] });
            setIsLoadingSuggestions(false);
            return;
        }

        setIsLoadingSuggestions(true);
        const timer = setTimeout(() => {
            fetch(`/api/search/suggestions?q=${encodeURIComponent(clean)}`, {
                headers: {
                    Accept: 'application/json',
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    setSuggestions({
                        products: data.products || [],
                        brands: data.brands || [],
                    });
                })
                .catch(() => {
                    setSuggestions({ products: [], brands: [] });
                })
                .finally(() => {
                    setIsLoadingSuggestions(false);
                });
        }, 200);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const saveSearchHistory = (term: string) => {
        const clean = term.trim();
        if (!clean) return;

        const filtered = searchHistory.filter((item) => item.toLowerCase() !== clean.toLowerCase());
        const updated = [clean, ...filtered].slice(0, 10);
        setSearchHistory(updated);

        if (user) {
            fetch('/search-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ query: clean }),
            }).catch(() => { });
        } else {
            try {
                localStorage.setItem('aromapalace_search_history', JSON.stringify(updated));
            } catch { }
        }
    };

    const removeSearchHistory = (term: string) => {
        const updated = searchHistory.filter((item) => item.toLowerCase() !== term.toLowerCase());
        setSearchHistory(updated);

        if (user) {
            fetch('/search-history', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ query: term }),
            }).catch(() => { });
        } else {
            try {
                localStorage.setItem('aromapalace_search_history', JSON.stringify(updated));
            } catch { }
        }
    };

    const clearAllSearchHistory = () => {
        setSearchHistory([]);

        if (user) {
            fetch('/search-history', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ all: true }),
            }).catch(() => { });
        } else {
            try {
                localStorage.removeItem('aromapalace_search_history');
            } catch { }
        }
    };

    const executeSearch = (term: string) => {
        const clean = term.trim();
        if (!clean) return;
        saveSearchHistory(clean);
        setSpotlightOpen(false);
        router.get('/products', { search: clean });
    };

    const executeBrandSearch = (brandName: string) => {
        const clean = brandName.trim();
        if (!clean) return;
        saveSearchHistory(clean);
        setSpotlightOpen(false);
        router.get('/products', { brand: clean });
    };

    const handleProductSelect = (productName: string) => {
        saveSearchHistory(productName);
        setSpotlightOpen(false);
    };

    // Translate toast message to English when isEn is active
    const translateToast = (msg: string, enMode: boolean): string => {
        if (!enMode || !msg) return msg;

        const exactMap: Record<string, string> = {
            'Berhasil ditambahkan ke keranjang.': 'Added to cart.',
            'Jumlah produk diperbarui.': 'Cart item quantity updated.',
            'Produk dihapus.': 'Item removed from cart.',
            'Keranjang dikosongkan.': 'Cart cleared.',
            'Dihapus dari wishlist.': 'Removed from wishlist.',
            'Ditambahkan ke wishlist.': 'Added to wishlist.',
            'Wewangian tidak ditemukan di wishlist Anda.': 'Fragrance not found in your wishlist.',
            'Produk wewangian tidak ditemukan.': 'Fragrance product not found.',
            'Kode voucher tidak valid atau sudah tidak berlaku.': 'Invalid or expired voucher code.',
            'Voucher dilepas.': 'Voucher removed.',
            'Alamat pengiriman berhasil disimpan.': 'Shipping address saved successfully.',
            'Alamat pengiriman berhasil diperbarui.': 'Shipping address updated successfully.',
            'Alamat berhasil dihapus.': 'Address removed successfully.',
            'Alamat utama berhasil diubah.': 'Primary address updated.',
            'Notifikasi berhasil diaktifkan.': 'Notifications enabled successfully.',
            'Notifikasi dinonaktifkan.': 'Notifications disabled.',
            'Terima kasih! Pesanan Anda telah berhasil diselesaikan.': 'Thank you! Your order has been completed.',
            'Pesanan wewangian mewah Anda berhasil dibuat!': 'Your luxury fragrance order has been placed successfully!',
            'Selamat! Anda resmi menjadi anggota Royale Club dan mendapatkan 100 Poin Sambutan.': 'Congratulations! You are officially a Royale Club member with 100 Welcome Points.',
            'Tautan filter berhasil disalin! Siap dibagikan.': 'Filter link copied! Ready to share.',
            'Gagal menyalin tautan.': 'Failed to copy link.',
            'Tautan wewangian berhasil disalin ke clipboard.': 'Fragrance link copied to clipboard.',
            'Terima kasih! Ulasan wewangian Anda berhasil diterbitkan.': 'Thank you! Your fragrance review has been submitted.',
            'Poin Anda tidak mencukupi untuk menukar reward ini.': 'Insufficient points to redeem this reward.',
            'Reward tidak ditemukan atau sudah tidak aktif.': 'Reward not found or no longer active.',
            'Reward voucher berhasil ditukarkan! Cek menu Akun / Voucher Anda.': 'Reward voucher successfully redeemed! Check your Account / Vouchers.',
            'Silakan masuk terlebih dahulu untuk menukarkan poin reward.': 'Please sign in first to redeem reward points.',
            'Silakan masuk terlebih dahulu untuk bergabung ke Royale Club.': 'Please sign in first to join Royale Club.',
            'Anda belum terdaftar sebagai anggota Royale Club. Silakan aktifkan keanggotaan terlebih dahulu.': 'You are not yet registered as a Royale Club member. Please activate your membership first.',
            'Pesanan ini sudah selesai.': 'This order is already completed.',
            'Pesanan yang telah dibatalkan tidak dapat diselesaikan.': 'Cancelled orders cannot be completed.',
            'Terjadi kesalahan saat memproses pesanan. Silakan periksa kembali keranjang Anda.': 'An error occurred while processing your order. Please check your cart.',
            'Browser tidak mendukung pendeteksian lokasi GPS.': 'Your browser does not support GPS location detection.',
            'Tidak dapat mendeteksi lokasi. Pastikan izin GPS diizinkan pada browser Anda.': 'Unable to detect location. Please ensure GPS permission is granted in your browser.',
        };

        if (exactMap[msg]) {
            return exactMap[msg];
        }

        if (/^Kode\s+"([^"]+)"\s+disalin!$/i.test(msg)) {
            return msg.replace(/^Kode\s+"([^"]+)"\s+disalin!$/i, 'Code "$1" copied!');
        }
        if (/^Kode\s+"([^"]+)"\s+berhasil\s+disalin!$/i.test(msg)) {
            return msg.replace(/^Kode\s+"([^"]+)"\s+berhasil\s+disalin!$/i, 'Code "$1" copied successfully!');
        }
        if (/^Voucher\s+([A-Z0-9_-]+)\s+diterapkan\.$/i.test(msg)) {
            return msg.replace(/^Voucher\s+([A-Z0-9_-]+)\s+diterapkan\.$/i, 'Voucher $1 applied.');
        }
        if (/^Voucher\s+'([^']+)'\s+berhasil\s+ditambahkan\.$/i.test(msg)) {
            return msg.replace(/^Voucher\s+'([^']+)'\s+berhasil\s+ditambahkan\.$/i, 'Voucher \'$1\' added successfully.');
        }
        if (/hanya dapat digunakan 1 kali per akun dan sudah pernah Anda gunakan/i.test(msg)) {
            return msg.replace(/Voucher\s+([A-Z0-9_-]+)\s+hanya dapat digunakan 1 kali per akun dan sudah pernah Anda gunakan\./i, 'Voucher $1 can only be used once per account and has already been redeemed.');
        }
        if (/merupakan voucher khusus reward milik akun lain/i.test(msg)) {
            return msg.replace(/Voucher\s+'([^']+)'\s+merupakan voucher khusus reward milik akun lain\./i, 'Voucher \'$1\' is an exclusive reward voucher belonging to another account.');
        }
        if (/hanya berlaku untuk produk tertentu/i.test(msg)) {
            return msg.replace(/Voucher\s+'([^']+)'\s+hanya berlaku untuk produk tertentu\./i, 'Voucher \'$1\' is only valid for specific products.');
        }
        if (/^Selamat!\s+Voucher\s+(.+?)\s+berhasil\s+diklaim\s+dengan\s+kode:\s*(.+)$/i.test(msg)) {
            return msg.replace(/^Selamat!\s+Voucher\s+(.+?)\s+berhasil\s+diklaim\s+dengan\s+kode:\s*(.+)$/i, 'Congratulations! Voucher $1 claimed successfully with code: $2');
        }
        if (/kurang\s+(\d+)\s+poin\s+lagi/i.test(msg)) {
            return msg.replace(/Poin Anda tidak mencukupi untuk reward ini\s+\(kurang\s+(\d+)\s+poin\s+lagi\)\./i, 'You do not have enough points for this reward ($1 more points needed).');
        }

        return msg;
    };

    // Toasts logic
    const triggerToast = (msg: string) => {
        if (!msg) return;
        const localizedMsg = translateToast(msg, isEn);
        setToastMessage(localizedMsg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const copyPromoCode = (code: string) => {
        if (!code) return;
        navigator.clipboard?.writeText(code);
        triggerToast(isEn ? `Code "${code}" copied!` : `Kode "${code}" disalin!`);
    };

    // Global Window bindings
    useEffect(() => {
        window.openPromoModal = (v) => handleOpenVoucherModal(v);
        window.openSpotlight = () => {
            setSpotlightOpen(true);
        };
        window.openInfoModal = (tab = 'faq') => {
            setInfoActiveTab(tab);
            setInfoModalOpen(true);
        };
        window.openStoreModal = () => setStoreModalOpen(true);
        window.openContactModal = () => setContactModalOpen(true);
        window.openAndroidApkModal = () => setAndroidApkModalOpen(true);
        window.showWishlistToast = (msg) => triggerToast(msg);
        window.showCartToast = (msg) => triggerToast(msg);
        window.showPromoToast = (msg) => triggerToast(msg);
        window.copyPromoCode = copyPromoCode;
    }, [isEn]);

    // Customer Realtime Push Notification & Foreground Listener
    useEffect(() => {
        // Auto request push notification permission on new browser or sync token
        autoRequestNotificationPermission().catch(() => { });

        let cleanupFn: (() => void) | null = null;

        initFirebaseForegroundListener((payload) => {
            // Auto reload if user is on payment or orders page
            if (
                window.location.pathname.startsWith('/payment') ||
                window.location.pathname.startsWith('/account/orders')
            ) {
                router.reload({ preserveScroll: true, preserveState: true });
            }
        }).then((unsubscribe) => {
            if (unsubscribe) {
                cleanupFn = unsubscribe;
            }
        });

        return () => {
            if (cleanupFn) {
                cleanupFn();
            }
        };
    }, [user?.id]);

    // Clear stale user client cache if user session switches
    const prevUserIdRef = useRef<number | undefined>(user?.id);
    useEffect(() => {
        if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== user?.id) {
            clearUserClientCache();
        }
        prevUserIdRef.current = user?.id;
    }, [user?.id]);

    // Watch for backend flash messages
    useEffect(() => {
        if (props?.flash?.success) {
            triggerToast(props.flash.success);
        } else if (props?.flash?.error) {
            triggerToast(props.flash.error);
        }
    }, [props?.flash?.success, props?.flash?.error]);

    // Keyboard shortcut for search (⌘K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                window.openSpotlight?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Sync header offsetHeight to --main-header-height CSS variable
    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                const h = headerRef.current.offsetHeight;
                if (h > 0) {
                    document.documentElement.style.setProperty('--main-header-height', `${h}px`);
                }
            }
        };
        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        window.addEventListener('scroll', updateHeaderHeight, { passive: true });
        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            window.removeEventListener('scroll', updateHeaderHeight);
        };
    }, []);

    // Keep slide toggle arrow orientation in sync with touch/drag scroll
    useEffect(() => {
        const el = navTrackRef.current;
        if (!el) return;
        const handleScroll = () => {
            const isScrolled = el.scrollLeft > 30;
            setSlidRight(isScrolled);
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSlideToggle = () => {
        const el = navTrackRef.current;
        if (!el) return;
        if (slidRight) {
            el.scrollTo({ left: 0, behavior: 'smooth' });
            setSlidRight(false);
        } else {
            el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
            setSlidRight(true);
        }
    };

    useEffect(() => {
        // Listener tombol fisik / gesture Back di HP Android
        const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
            // 1. Jika ada popup/modal terbuka, tutup modal dulu
            if (spotlightOpen) {
                setSpotlightOpen(false);
                return;
            }
            if (infoModalOpen) {
                setInfoModalOpen(false);
                return;
            }
            if (promoModalOpen) {
                setPromoModalOpen(false);
                return;
            }
            // 2. Jika di riwayat web ada halaman sebelumnya, mundur (history back)
            if (window.location.pathname !== '/') {
                window.history.back();
            } else {
                // 3. Jika sudah di halaman utama (/), baru keluar aplikasi
                CapApp.exitApp();
            }
        });
        return () => {
            backListener.then(l => l.remove());
        };
    }, [spotlightOpen, infoModalOpen, promoModalOpen]);

    return (
        <div className="bg-background text-foreground flex flex-col min-h-screen" suppressHydrationWarning>
            {/* Top Announcement Bar (Scrolls normally with page, NOT sticky on mobile) */}
            <div className="bg-[#360407] text-white text-xs pt-[env(safe-area-inset-top,0px)]" suppressHydrationWarning>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-1.5 sm:py-2 gap-2">
                    {activeHeaderVoucher ? (
                        <button
                            type="button"
                            onClick={() => handleOpenVoucherModal(activeHeaderVoucher)}
                            className="max-w-[210px] sm:max-w-[340px] md:max-w-[420px] lg:max-w-lg min-w-0 flex items-center justify-start gap-1.5 sm:gap-2 text-xs text-white/95 hover:text-white transition cursor-pointer text-left group overflow-hidden"
                            title={isEn ? "Click to view voucher details" : "Klik untuk melihat detail voucher"}
                        >
                            <span className="text-[#E5A844] text-xs shrink-0 animate-pulse select-none">✦</span>
                            <span className={cn(
                                "font-medium text-[10.5px] sm:text-xs tracking-tight transition-all duration-300 truncate",
                                isVoucherFading ? "opacity-0 -translate-y-1 scale-95" : "opacity-100 translate-y-0 scale-100"
                            )}>
                                <span>
                                    {activeHeaderVoucher.type === 'percentage'
                                        ? (isEn ? `Up to ${activeHeaderVoucher.value}% off! Claim →` : `Diskon hingga ${activeHeaderVoucher.value}%! Klaim →`)
                                        : (isEn
                                            ? `Rp ${new Intl.NumberFormat('id-ID').format(activeHeaderVoucher.value)} off! Claim →`
                                            : `Potongan Rp ${new Intl.NumberFormat('id-ID').format(activeHeaderVoucher.value)}! Klaim →`)}
                                </span>
                            </span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-white/80 select-none">
                            <span className="text-[#E5A844] text-xs shrink-0 select-none">✦</span>
                            <span className="truncate">{isEn ? 'Official Luxury Fragrance Boutique' : 'Butik Parfum Mewah & Eksklusif'}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 text-[11px] shrink-0">
                        {/* Gratis Ongkir */}
                        <div className="hidden md:flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#E5A844] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a2 2 0 114 0m-4 0h2m-6 0H9m-4 0a2 2 0 114 0m6-6h3.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-5v5" />
                            </svg>
                            <div className="flex flex-col text-left leading-tight">
                                <span className="font-bold text-white text-[10px] tracking-wider uppercase">{t('topbar.free_shipping')}</span>
                                <span className="text-[8.5px] text-[#E5A844] font-medium tracking-tight">{t('topbar.free_shipping_sub')}</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <span className="hidden md:inline text-white/25 select-none font-light">|</span>

                        {/* 100% Produk Asli */}
                        <div className="hidden md:flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#E5A844] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <div className="flex flex-col text-left leading-tight">
                                <span className="font-bold text-white text-[10px] tracking-wider uppercase">{t('topbar.authentic')}</span>
                                <span className="text-[8.5px] text-[#E5A844] font-medium tracking-tight">{t('topbar.authentic_sub')}</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <span className="hidden md:inline text-white/25 select-none font-light">|</span>

                        {/* Language Switcher Dropdown in Maroon Topbar */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 hover:bg-black/55 border border-white/20 hover:border-[#E5A844]/60 text-white text-[11px] font-medium tracking-wide transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-[#E5A844]/50 select-none group"
                                    aria-label={isEn ? 'Switch Language' : 'Ganti Bahasa'}
                                >
                                    <FlagLocaleIcon locale={locale} className="w-4 h-2.5 shrink-0 shadow-2xs" />
                                    <span className="font-semibold text-[10.5px] tracking-wider uppercase">
                                        {isEn ? 'EN' : 'ID'}
                                    </span>
                                    <ChevronDown className="w-2.5 h-2.5 text-white/60 group-hover:text-white transition-transform duration-200" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={6}
                                className="w-52 p-1.5 rounded-xl bg-[#2A0306] border border-[#E5A844]/30 shadow-2xl text-white z-[60]"
                            >
                                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E5A844] border-b border-white/10 mb-1 flex items-center justify-between">
                                    <span>{isEn ? 'Select Language' : 'Pilih Bahasa'}</span>
                                    <Globe className="w-3 h-3 text-[#E5A844]/70" />
                                </div>
                                <DropdownMenuItem
                                    onClick={() => setLanguage('id')}
                                    className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-colors ${isId
                                        ? 'bg-[#E5A844]/20 text-[#E5A844] font-semibold'
                                        : 'text-white/90 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 text-left">
                                        <FlagIndonesiaIcon className="w-4.5 h-3 shrink-0 shadow-xs ring-1 ring-white/10" />
                                        <div className="flex flex-col">
                                            <span className="leading-tight font-medium">Bahasa Indonesia</span>
                                            <span className="text-[10px] text-white/60 font-normal">Indonesia</span>
                                        </div>
                                    </div>
                                    {isId && <Check className="w-4 h-4 text-[#E5A844] shrink-0 ml-2" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setLanguage('en')}
                                    className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-colors ${isEn
                                        ? 'bg-[#E5A844]/20 text-[#E5A844] font-semibold'
                                        : 'text-white/90 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 text-left">
                                        <FlagEnglishIcon className="w-4.5 h-3 shrink-0 shadow-xs ring-1 ring-white/10" />
                                        <div className="flex flex-col">
                                            <span className="leading-tight font-medium">English</span>
                                            <span className="text-[10px] text-white/60 font-normal">International</span>
                                        </div>
                                    </div>
                                    {isEn && <Check className="w-4 h-4 text-[#E5A844] shrink-0 ml-2" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Main Navigation Bar (Sticky with safe-area support when scrolled) */}
            <header
                ref={headerRef}
                className={cn(
                    "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-[#4A070B]/20 shadow-xs transition-[padding,background-color] duration-150",
                    isScrolledPastTopbar ? "pt-[env(safe-area-inset-top,0px)]" : ""
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Upper Row: Search | Centered Logo | User Actions */}
                    <div className="relative flex items-center justify-between py-2 sm:py-4 min-h-[60px] sm:min-h-[84px]">
                        {/* Left: Search Trigger (Mobile: icon button; Desktop: underlined input) */}
                        <div className="flex items-center w-auto sm:w-1/3 max-w-[40px] sm:max-w-[240px] md:max-w-[280px] z-10">
                            {/* Mobile: Just Search Icon Button */}
                            <button
                                type="button"
                                onClick={() => window.openSpotlight?.()}
                                className="sm:hidden flex items-center justify-center w-9 h-9 text-[#4A070B] hover:text-[#360407] transition cursor-pointer rounded-full hover:bg-[#4A070B]/5 active:scale-95 shrink-0 -ml-1"
                                aria-label={isEn ? "Search Perfumes" : "Cari Parfum"}
                            >
                                <svg className="w-5 h-5 text-[#4A070B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            {/* Desktop (sm+): Underlined Search Bar */}
                            <button
                                type="button"
                                onClick={() => window.openSpotlight?.()}
                                className="hidden sm:flex w-full items-center gap-2 pb-1 border-b border-[#4A070B]/25 hover:border-[#4A070B] text-[#4A070B]/70 hover:text-[#4A070B] text-xs transition cursor-pointer text-left group"
                            >
                                <svg className="w-[18px] h-[18px] text-[#4A070B] group-hover:text-[#360407] transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-[#4A070B]/75 group-hover:text-[#4A070B] transition truncate font-light text-xs">
                                    {isEn ? 'Search luxury perfumes...' : 'Cari parfum mewah...'}
                                </span>
                            </button>
                        </div>

                        {/* Center: Luxury Brand Logo (Matching demo-aromapalace.gagasan.tech) */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-10">
                            <Link
                                href="/"
                                prefetch="hover"
                                cacheFor={['30s', '2m']}
                                className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 group"
                            >
                                <img
                                    src="/images/logo.png"
                                    alt="Aroma Palace"
                                    className="w-8 h-8 sm:w-11 sm:h-11 lg:w-13 lg:h-13 object-contain rounded-full shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                                />
                                <div className="flex flex-col items-center text-center">
                                    <span className="font-sans text-sm sm:text-xl lg:text-2xl font-bold tracking-[0.12em] sm:tracking-[0.14em] lg:tracking-[0.18em] text-[#704828] group-hover:text-[#360407] transition uppercase leading-none whitespace-nowrap text-center">
                                        Aroma Palace
                                    </span>
                                    <span className="font-sans text-[6.5px] sm:text-[8.5px] lg:text-[9.5px] uppercase tracking-[0.18em] sm:tracking-[0.2em] lg:tracking-[0.25em] text-[#B88E58] font-semibold mt-0.5 sm:mt-1 whitespace-nowrap text-center">
                                        Dubai&apos;s Signature Perfumes
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {/* Right: Actions (Akun & Wishlist on desktop; Cart only on mobile) */}
                        <div className="flex items-center justify-end gap-1.5 sm:gap-4 md:gap-5 w-auto sm:w-1/3 z-10">
                            {/* Akun: Hidden on mobile, visible on desktop sm:flex */}
                            <div className="hidden sm:flex">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex flex-col items-center justify-center gap-0.5 text-[#4A070B] hover:text-[#360407] transition cursor-pointer px-1 py-0.5 group outline-none"
                                        >
                                            <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#4A070B] group-hover:text-[#360407] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="text-[10px] sm:text-[11px] font-medium text-[#4A070B] group-hover:text-[#360407] leading-none mt-0.5">
                                                {isAdmin ? 'Admin' : (isEn ? 'Account' : 'Akun')}
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg border border-border/80">
                                        {user ? (
                                            <>
                                                <div className="px-2.5 py-2 border-b border-border/60 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15 text-[#4A070B] dark:text-[#E8D0BA] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-bold text-foreground truncate">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground truncate">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isAdmin ? (
                                                    <DropdownMenuItem asChild>
                                                        <a href={adminDashboardUrl} className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] cursor-pointer">
                                                            <LayoutDashboard className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                            <span>{isEn ? 'Admin Dashboard' : 'Dashboard Admin'}</span>
                                                        </a>
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <>
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/membership" className="flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer group">
                                                                <div className="flex items-center gap-2.5">
                                                                    <Crown className="w-4 h-4 text-[#E5A844] shrink-0" />
                                                                    <span>Royale Membership</span>
                                                                </div>
                                                                {props?.auth?.membership ? (
                                                                    <span className="text-[10px] font-bold text-[#E5A844] bg-[#E5A844]/10 px-1.5 py-0.5 rounded">
                                                                        {props.auth.membership.points_formatted} {isEn ? 'Points' : 'Poin'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                                                        +100 {isEn ? 'Pts' : 'Poin'}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem asChild>
                                                            <Link href="/account" className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer">
                                                                <User className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                                <span>{isEn ? 'Account Settings' : 'Pengaturan Akun'}</span>
                                                            </Link>
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem asChild>
                                                            <Link href="/account/orders" className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer">
                                                                <Package className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                                <span>{isEn ? 'My Orders' : 'Pesanan Saya'}</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                <DropdownMenuSeparator className="my-1 bg-border/60" />

                                                <DropdownMenuItem asChild variant="destructive">
                                                    <Link
                                                        href="/logout"
                                                        method="post"
                                                        data={{
                                                            device_token: typeof localStorage !== 'undefined' ? (localStorage.getItem('aromapalace_fcm_token') || '') : '',
                                                        }}
                                                        onClick={() => clearUserClientCache()}
                                                        as="button"
                                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-destructive cursor-pointer hover:bg-destructive/10"
                                                    >
                                                        <LogOut className="w-4 h-4 shrink-0 text-destructive" />
                                                        <span>{isEn ? 'Sign Out' : 'Keluar'}</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <>
                                                <div className="px-2.5 py-2 border-b border-border/60 mb-1">
                                                    <div className="text-xs font-bold text-foreground">
                                                        {isEn ? 'Welcome' : 'Selamat Datang'}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {isEn ? 'Sign in for convenient shopping' : 'Masuk untuk kemudahan belanja'}
                                                    </div>
                                                </div>

                                                <DropdownMenuItem asChild>
                                                    <Link href="/login" className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer">
                                                        <LogIn className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                        <span>{isEn ? 'Sign In' : 'Masuk ke Akun'}</span>
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem asChild>
                                                    <Link href="/register" className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer">
                                                        <UserPlus className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                        <span>{isEn ? 'Register New Account' : 'Daftar Akun Baru'}</span>
                                                    </Link>
                                                </DropdownMenuItem>

                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Wishlist: Disembunyikan untuk Admin, terlihat untuk Customer di desktop */}
                            {!isAdmin && (
                                <Link
                                    href={user ? '/wishlist' : '/login?notice=' + encodeURIComponent(isEn ? 'Please sign in to access your wishlist.' : 'Silakan masuk untuk mengakses halaman wishlist Anda.')}
                                    prefetch="hover"
                                    cacheFor={['30s', '1m']}
                                    className="hidden sm:flex flex-col items-center justify-center gap-0.5 text-[#4A070B] hover:text-[#360407] transition cursor-pointer px-1 py-0.5 group relative"
                                >
                                    <div className="relative">
                                        <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#4A070B] group-hover:text-[#360407] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        {wishlistCount > 0 && (
                                            <Badge className="absolute -top-1.5 -right-2 h-3.5 w-3.5 p-0 flex items-center justify-center text-[9px] bg-[#4A070B] text-white border-0">
                                                {wishlistCount}
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-medium text-[#4A070B] group-hover:text-[#360407] leading-none mt-0.5">
                                        Wishlist
                                    </span>
                                </Link>
                            )}

                            {/* Tombol Kanan: Jika Admin -> Cukup di mobile icon saja, di desktop sudah ada di dropdown Akun. Jika Customer/Guest -> Keranjang */}
                            {isAdmin ? (
                                <a
                                    href={adminDashboardUrl}
                                    className="sm:hidden flex items-center justify-center text-[#4A070B] hover:text-[#360407] transition cursor-pointer w-9 h-9 group relative rounded-full hover:bg-[#4A070B]/5 active:scale-95 shrink-0 -mr-1"
                                    aria-label={isEn ? "Admin Dashboard" : "Dashboard Admin"}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <LayoutDashboard className="w-5 h-5 text-[#4A070B] group-hover:text-[#360407] transition" />
                                    </div>
                                </a>
                            ) : (
                                <Link
                                    href={user ? '/cart' : '/login?notice=' + encodeURIComponent(isEn ? 'Please sign in to view your shopping cart.' : 'Silakan masuk untuk melihat keranjang belanja Anda.')}
                                    className="flex items-center justify-center sm:flex-col sm:gap-0.5 text-[#4A070B] hover:text-[#360407] transition cursor-pointer w-9 h-9 sm:w-auto sm:h-auto sm:px-1 sm:py-0.5 group relative rounded-full sm:rounded-none hover:bg-[#4A070B]/5 sm:hover:bg-transparent active:scale-95 shrink-0 -mr-1"
                                    aria-label={isEn ? "Shopping Cart" : "Keranjang Belanja"}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <svg className="w-5 h-5 sm:w-[18px] sm:h-[18px] text-[#4A070B] group-hover:text-[#360407] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        {cartCount > 0 && (
                                            <Badge className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-2 h-4 min-w-[16px] sm:h-3.5 sm:min-w-[14px] px-1 sm:p-0 flex items-center justify-center text-[9px] font-bold bg-[#4A070B] text-white border-0 shadow-xs ring-2 ring-background rounded-full">
                                                {cartCount}
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="hidden sm:inline text-[10px] sm:text-[11px] font-medium text-[#4A070B] group-hover:text-[#360407] leading-none mt-0.5">
                                        {isEn ? 'Cart' : 'Keranjang'}
                                    </span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Lower Row: Navigation Bar */}
                    <nav className="relative border-t border-[#4A070B]/15 -mb-px overflow-hidden">
                        <div
                            ref={navTrackRef}
                            className="flex items-center justify-start sm:justify-center gap-5 sm:gap-7 md:gap-8 lg:gap-10 overflow-x-auto overflow-y-hidden touch-pan-x select-none overscroll-x-contain text-[11px] sm:text-xs font-semibold uppercase tracking-[0.05em] sm:tracking-[0.08em] px-3 sm:px-0 pr-9 lg:pr-0 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            <Link
                                href="/"
                                prefetch="hover"
                                cacheFor={['30s', '2m']}
                                className={`inline-flex items-center py-2.5 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url === '/'
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn ? 'HOME' : 'BERANDA'}
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={`inline-flex items-center gap-1 py-2.5 sm:py-3.5 border-b-2 -mb-px transition cursor-pointer outline-none whitespace-nowrap ${(url.startsWith('/products') && !url.includes('new-arrivals') && !url.includes('new_arrivals') && !url.includes('best-sellers') && !url.includes('best_sellers') && !url.includes('special-offers') && !url.includes('special_offers') && !url.includes('popular') && !url.includes('discount')) || url.startsWith('/categories') || url.startsWith('/brands')
                                        ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                        : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                        }`}
                                >
                                    <span>{isEn ? 'SHOP' : 'BELANJA'}</span>
                                    <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuItem asChild>
                                        <Link href="/products" prefetch="hover" cacheFor={['30s', '2m']}>{isEn ? 'All Products' : 'Semua Produk'}</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/categories" prefetch="hover" cacheFor={['30s', '2m']}>{isEn ? 'Category' : 'Kategori'}</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/brands" prefetch="hover" cacheFor={['30s', '2m']}>{isEn ? 'Brands' : 'Brand'}</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Link
                                href="/products?tag=new-arrivals"
                                prefetch="hover"
                                cacheFor={['30s', '2m']}
                                className={`inline-flex items-center py-2.5 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.includes('new-arrivals') || url.includes('new_arrivals')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn ? 'NEW ARRIVALS' : 'PRODUK BARU'}
                            </Link>

                            <Link
                                href="/products?tag=best-sellers"
                                prefetch="hover"
                                cacheFor={['30s', '2m']}
                                className={`inline-flex items-center py-2.5 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.includes('best-sellers') || url.includes('best_sellers') || url.includes('popular')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn ? 'BEST SELLERS' : 'TERLARIS'}
                            </Link>

                            <Link
                                href="/products?tag=special-offers"
                                prefetch="hover"
                                cacheFor={['30s', '2m']}
                                className={`inline-flex items-center py-2.5 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.includes('special-offers') || url.includes('special_offers') || url.includes('discount')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn ? 'SPECIAL OFFERS' : 'PROMO SPESIAL'}
                            </Link>

                            {/* <Link
                                href="/articles"
                                prefetch="hover"
                                cacheFor={['30s', '2m']}
                                className={`inline-flex items-center py-2.5 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.startsWith('/articles')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn ? 'ARTICLES' : 'ARTIKEL'}
                            </Link> */}

                            <Link
                                href="/stores"
                                prefetch="hover"
                                cacheFor={['30s', '2m']}
                                className={`inline-flex items-center py-2.5 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.startsWith('/stores')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn ? 'STORE LOCATOR' : 'LOKASI TOKO'}
                            </Link>

                            <Link
                                href="/about"
                                prefetch="hover"
                                cacheFor={['30s', '2m']}
                                className={`inline-flex items-center py-2.5 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url === '/about'
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn ? 'ABOUT US' : 'TENTANG KAMI'}
                            </Link>

                            <button
                                type="button"
                                onClick={() => setContactModalOpen(true)}
                                className={`inline-flex items-center py-2.5 sm:py-3.5 border-b-2 -mb-px transition cursor-pointer uppercase whitespace-nowrap ${contactModalOpen
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn ? 'CONTACT US' : 'HUBUNGI KAMI'}
                            </button>
                        </div>

                        {/* Mobile Slide Arrow Toggle Button */}
                        <div className="lg:hidden absolute right-0 top-0 bottom-0 flex items-center pr-1 pl-4 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none my-1">
                            <button
                                onClick={handleSlideToggle}
                                type="button"
                                className="pointer-events-auto p-1.5 text-[#4A070B]/60 hover:text-[#4A070B] transition cursor-pointer"
                                aria-label="Slide Navigation"
                            >
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-300 ${slidRight ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main Content Area with Pull-To-Refresh (Header/Navbar stays fixed at the top) */}
            <PullToRefresh disabled={disablePullToRefresh}>
                <main className={`flex-1 ${shouldShowBottomNav ? 'pb-20 md:pb-0' : ''}`}>
                    {children}
                </main>
            </PullToRefresh>

            {/* Modern Clean Footer with Rich Burgundy Gradient matching Produk Diskon */}
            {(showFooter || (isAndroidBrowser && !url.includes('/checkout'))) && (
                <footer
                    className={cn(
                        "bg-gradient-to-br from-[#4A070B] via-[#52090F] to-[#360407] text-white/80 border-t border-[#360407] mt-12 sm:mt-16",
                        isAndroidBrowser ? "block" : "hidden md:block",
                        shouldShowBottomNav && isAndroidBrowser ? "pb-20 md:pb-0" : ""
                    )}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
                        <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 pb-8 sm:pb-10 border-b border-white/10">
                            {/* Baris 1 di Mobile / Col 1 di Desktop: Brand Info */}
                            <div className="col-span-2 lg:col-span-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/images/logo.png"
                                        alt="Aroma Palace"
                                        className="w-7 h-7 object-contain rounded-full shadow-2xs"
                                    />
                                    <span className="font-bold text-white text-sm tracking-wider uppercase">
                                        AROMA PALACE
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed max-w-sm text-white/70">
                                    {isEn
                                        ? 'World luxury fragrance collection and high-end artisanal perfumes. Crafted for true elegance in every spray.'
                                        : 'Koleksi wewangian mewah dunia dan parfum artisanal berkualitas tinggi. Dirancang untuk keanggunan sejati dalam setiap semprotan.'}
                                </p>
                                <div className="pt-2 flex items-center gap-2.5">
                                    <a
                                        href="https://instagram.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Instagram"
                                        className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer shadow-2xs group"
                                    >
                                        <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>

                                    <a
                                        href="https://tiktok.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="TikTok"
                                        className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer shadow-2xs group"
                                    >
                                        <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.5 6.3 6.3 0 0 0 1.96-4.49V8.62a8.28 8.28 0 0 0 4.81 1.52v-3.45z" />
                                        </svg>
                                    </a>

                                    <a
                                        href="https://wa.me"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="WhatsApp"
                                        className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer shadow-2xs group"
                                    >
                                        <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19.53-1.11 1.04-1.54 1.1-.38.07-.88.1-2.58-.6a9.47 9.47 0 0 1-3.61-3.19c-.43-.58-.93-1.55-.93-2.37 0-.83.43-1.24.58-1.4.15-.17.33-.21.44-.21.11 0 .22 0 .32.01.1.01.24-.04.38.29.14.33.48 1.17.52 1.25.04.09.07.19.01.3-.06.12-.09.19-.18.29-.09.1-.19.23-.27.31-.09.09-.19.19-.08.38.11.19.49.8 1.05 1.3 1.03.92 1.54.98 1.74 1.08.19.09.31.08.43-.05.12-.13.51-.59.65-.79.14-.2.28-.17.47-.1.19.07 1.2.57 1.41.67.2.1.34.15.39.24.05.09.05.53-.14 1.06z" />
                                        </svg>
                                    </a>

                                    <a
                                        href="https://youtube.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="YouTube"
                                        className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer shadow-2xs group"
                                    >
                                        <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* Baris 2 di Mobile / Col 2 di Desktop: Katalog */}
                            <div className="col-span-1 lg:col-span-2 space-y-3">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-white">{isEn ? 'Catalog' : 'Katalog'}</h5>
                                <ul className="space-y-2 text-xs">
                                    <li><Link href="/products" className="text-white/70 hover:text-white transition">{isEn ? 'All Collections' : 'Semua Koleksi'}</Link></li>
                                    <li><Link href="/products?sort=popular" className="text-white/70 hover:text-white transition">{isEn ? 'Bestsellers' : 'Produk Terlaris'}</Link></li>
                                    <li><Link href="/products?sort=newest" className="text-white/70 hover:text-white transition">{isEn ? 'New Arrivals' : 'Produk Terbaru'}</Link></li>
                                    <li><Link href="/products?discount=1" className="text-white/70 hover:text-white transition">{isEn ? 'Special Offers' : 'Promo Diskon'}</Link></li>
                                    <li><Link href="/articles" className="text-white/70 hover:text-white transition">{isEn ? 'Articles & Journal' : 'Artikel & Jurnal'}</Link></li>
                                    <li><Link href="/stores" className="text-white/70 hover:text-white transition">{isEn ? 'Boutique & Stores' : 'Lokasi Butik & Toko'}</Link></li>
                                    <li><Link href="/about" className="text-white/70 hover:text-white transition">{isEn ? 'About Atelier' : 'Tentang Atelier'}</Link></li>
                                </ul>
                            </div>

                            {/* Baris 2 di Mobile / Col 3 di Desktop: Layanan Pelanggan */}
                            <div className="col-span-1 lg:col-span-3 space-y-3">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-white">{isEn ? 'Customer Care' : 'Layanan Pelanggan'}</h5>
                                <ul className="space-y-2 text-xs">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => window.openInfoModal?.('faq')}
                                            className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                        >
                                            {isEn ? 'Frequently Asked Questions (FAQ)' : 'Tanya Jawab (FAQ)'}
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => window.openInfoModal?.('shipping')}
                                            className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                        >
                                            {isEn ? 'Shipping & Delivery' : 'Pengiriman & Ekspedisi'}
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => window.openInfoModal?.('returns')}
                                            className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                        >
                                            {isEn ? 'Warranty & Returns' : 'Garansi & Pengembalian'}
                                        </button>
                                    </li>
                                    <li>
                                        <Link
                                            href="/support"
                                            className="text-white/70 hover:text-white transition text-left block"
                                        >
                                            {isEn ? 'Customer Support & Help' : 'Pusat Bantuan & Layanan'}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/privacy-policy"
                                            className="text-white/70 hover:text-white transition text-left block"
                                        >
                                            {isEn ? 'Privacy Policy' : 'Kebijakan Privasi'}
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => window.openInfoModal?.('terms')}
                                            className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                        >
                                            {isEn ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => window.openContactModal?.()}
                                            className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                        >
                                            {isEn ? 'Contact Concierge' : 'Hubungi Concierge'}
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* Unduh Aplikasi */}
                            <div className="col-span-2 sm:col-span-2 lg:col-span-3 space-y-3">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-white">{isEn ? 'Download App' : 'Unduh Aplikasi'}</h5>
                                <p className="text-xs leading-relaxed text-white/70">
                                    {isEn ? 'Download our application for exclusive access to the Dubai perfume catalog.' : 'Unduh aplikasi kami untuk akses eksklusif katalog parfum Dubai.'}
                                </p>
                                <div className="flex flex-row sm:flex-row lg:flex-col xl:flex-row items-center gap-3 pt-1">
                                    <a
                                        href="https://apps.apple.com/id/app/aroma-palace/id6825154655"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex focus:outline-none focus:ring-2 focus:ring-[#E5A844]/50 rounded-lg group"
                                        aria-label="Download on the App Store"
                                    >
                                        <img
                                            src="/images/download-apple-store.png"
                                            alt="Download on the App Store"
                                            className="h-9.5 sm:h-10 w-auto object-contain transition-transform"
                                        />
                                    </a>

                                    <a
                                        href="/app-release.apk"
                                        download="Aroma-Palace.apk"
                                        className="transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex focus:outline-none focus:ring-2 focus:ring-[#E5A844]/50 rounded-lg group"
                                        aria-label="Download Android APK"
                                    >
                                        <img
                                            src="/images/download-google-play.png"
                                            alt="Get it on Google Play"
                                            className="h-9.5 sm:h-10 w-auto object-contain transition-transform"
                                        />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-white/60 text-center sm:text-left">
                            <p>{isEn ? '© 2026 Aroma Palace. All rights reserved.' : '© 2026 Aroma Palace. Hak cipta dilindungi undang-undang.'}</p>
                            <div className="flex items-center gap-4 text-white/60">
                                <Link
                                    href="/privacy-policy"
                                    className="hover:text-white transition"
                                >
                                    {isEn ? 'Privacy Policy' : 'Kebijakan Privasi'}
                                </Link>
                                <span className="text-white/30">&bull;</span>
                                <button
                                    type="button"
                                    onClick={() => window.openInfoModal?.('terms')}
                                    className="hover:text-white transition cursor-pointer"
                                >
                                    {isEn ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </footer>
            )}

            {/* Notification Toast (Top Center on Mobile, Bottom Right on Desktop) */}
            {toastMessage && (
                <div className="fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] left-1/2 -translate-x-1/2 md:top-auto md:left-auto md:translate-x-0 md:bottom-6 md:right-6 z-[100] max-w-[calc(100vw-32px)] sm:max-w-md w-max rounded-xl border border-border/80 bg-card/95 backdrop-blur-md text-card-foreground px-4 py-3 text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 md:slide-in-from-bottom-3 duration-200 pointer-events-auto">
                    <span className="text-primary font-bold shrink-0">✓</span>
                    <span className="truncate sm:whitespace-normal font-medium">{toastMessage}</span>
                </div>
            )}

            {/* POPUP 1: VOUCHER CLAIM (shadcn Dialog) - Identik dengan Home */}
            <Dialog open={promoModalOpen} onOpenChange={setPromoModalOpen}>
                {selectedHeaderVoucher && (
                    <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-md p-5 sm:p-6 rounded-2xl">
                        <DialogHeader className="text-left space-y-2">
                            <Badge variant="secondary" className="w-fit">
                                {selectedHeaderVoucher.type === 'percentage'
                                    ? (isEn ? `Discount ${selectedHeaderVoucher.value}%` : `Diskon ${selectedHeaderVoucher.value}%`)
                                    : (isEn ? `Save Rp ${new Intl.NumberFormat('id-ID').format(selectedHeaderVoucher.value)}` : `Potongan Rp ${new Intl.NumberFormat('id-ID').format(selectedHeaderVoucher.value)}`)}
                            </Badge>
                            <DialogTitle className="text-lg font-bold">
                                {isEn && selectedHeaderVoucher.name_en ? selectedHeaderVoucher.name_en : selectedHeaderVoucher.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed">
                                {(isEn && selectedHeaderVoucher.description_en) ? selectedHeaderVoucher.description_en : (selectedHeaderVoucher.description || (isEn ? `Use promo code ${selectedHeaderVoucher.code} for an exclusive discount.` : `Gunakan kode promo ${selectedHeaderVoucher.code} untuk mendapatkan diskon istimewa.`))}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-3 p-3.5 rounded-lg bg-muted border border-border text-xs space-y-2">
                            <p className="font-semibold text-foreground">{isEn ? 'Terms & Conditions:' : 'Syarat & Ketentuan:'}</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {(selectedHeaderVoucher.terms && selectedHeaderVoucher.terms.length > 0
                                    ? selectedHeaderVoucher.terms
                                    : [
                                        isEn ? `Use promo code ${selectedHeaderVoucher.code} at checkout.` : `Gunakan kode promo ${selectedHeaderVoucher.code} saat checkout.`,
                                        selectedHeaderVoucher.min_order_amount > 0
                                            ? (isEn ? `Minimum spend Rp ${new Intl.NumberFormat('id-ID').format(selectedHeaderVoucher.min_order_amount)}.` : `Minimal belanja Rp ${new Intl.NumberFormat('id-ID').format(selectedHeaderVoucher.min_order_amount)}.`)
                                            : (isEn ? 'No minimum spend required.' : 'Tanpa minimal belanja.'),
                                        isEn ? 'Valid during the active promotional period.' : 'Berlaku selama periode promosi aktif.',
                                    ]
                                ).map((t, i) => (
                                    <li key={i}>{t}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    copyPromoCode(selectedHeaderVoucher.code);
                                    setPromoModalOpen(false);
                                }}
                                className="flex-1 cursor-pointer"
                                size="sm"
                            >
                                {isEn ? 'Copy Code' : 'Salin Kode'} ({selectedHeaderVoucher.code})
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPromoModalOpen(false)} className="cursor-pointer">
                                {isEn ? 'Close' : 'Tutup'}
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {/* POPUP 2: SPOTLIGHT SEARCH MODAL (shadcn Dialog) */}
            <Dialog
                open={spotlightOpen}
                onOpenChange={(open) => {
                    setSpotlightOpen(open);
                    if (!open) {
                        setSearchQuery('');
                        setSuggestions({ products: [], brands: [] });
                    }
                }}
            >
                <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-2xl p-0 overflow-hidden shadow-2xl border-border/80 rounded-2xl">
                    {/* Search Input Bar */}
                    <div className="p-3.5 sm:p-4 px-4 border-b border-border/80 flex items-center gap-2.5 sm:gap-3 bg-card">
                        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                        <Input
                            ref={spotlightInputRef}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    executeSearch(searchQuery);
                                }
                            }}
                            placeholder={isEn ? "Search perfume name or brand..." : "Cari nama parfum atau brand..."}
                            className="border-none shadow-none focus-visible:ring-0 text-sm h-9 px-2 bg-transparent placeholder:text-muted-foreground/70"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                {isEn ? 'Clear' : 'Bersihkan'}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={() => executeSearch(searchQuery)}
                            className="h-8 px-3 text-xs bg-[#4A070B] hover:bg-[#360407] text-white shrink-0 font-medium"
                        >
                            {isEn ? 'Search' : 'Cari'}
                        </Button>
                    </div>

                    {/* Search Content Area */}
                    <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
                        {searchQuery.trim() === '' ? (
                            <div>
                                {searchHistory.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                                <History className="w-3.5 h-3.5 text-muted-foreground" />
                                                {isEn ? 'Recent Searches' : 'Pencarian Terakhir'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={clearAllSearchHistory}
                                                className="text-xs text-muted-foreground hover:text-destructive transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                {isEn ? 'Clear All' : 'Hapus Semua'}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {searchHistory.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-muted/70 hover:bg-muted text-foreground border border-border/70 transition cursor-pointer"
                                                    onClick={() => executeSearch(item)}
                                                >
                                                    <History className="w-3 h-3 text-muted-foreground/60" />
                                                    <span>{item}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeSearchHistory(item);
                                                        }}
                                                        className="text-muted-foreground hover:text-destructive transition p-0.5 rounded-full hover:bg-background/80 ml-0.5"
                                                        title={isEn ? "Delete history" : "Hapus riwayat"}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 px-4 text-center">
                                        <div className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                                            <Search className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">{isEn ? 'Start Searching' : 'Mulai Pencarian'}</p>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                            {isEn ? 'Type perfume or brand name to view suggestions and search results.' : 'Ketik nama parfum atau brand untuk melihat saran dan hasil pencarian.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {isLoadingSuggestions && (
                                    <div className="py-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin text-[#4A070B]" />
                                        <span>{isEn ? 'Searching fragrance suggestions...' : 'Mencari saran wewangian...'}</span>
                                    </div>
                                )}

                                {/* Matching Brands */}
                                {suggestions.brands.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            {isEn ? 'Related Brands' : 'Brand Terkait'} ({suggestions.brands.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.brands.map((b) => (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => executeBrandSearch(b.name)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-[#704828] border border-amber-500/30 transition cursor-pointer"
                                                >
                                                    <span>{b.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        ({b.products_count} {isEn ? 'Collections' : 'Koleksi'})
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Matching Products */}
                                {suggestions.products.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            {isEn ? 'Products' : 'Produk'} ({suggestions.products.length})
                                        </p>
                                        <div className="divide-y divide-border/60 border border-border/70 rounded-xl overflow-hidden bg-card">
                                            {suggestions.products.map((p) => (
                                                <Link
                                                    key={p.id}
                                                    href={`/products/${p.slug}`}
                                                    onClick={() => handleProductSelect(p.name)}
                                                    className="flex items-center gap-3 p-2.5 hover:bg-muted/50 transition group"
                                                >
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        className="w-11 h-11 object-cover rounded-lg border border-border/80 group-hover:scale-105 transition-transform shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h6 className="text-xs font-semibold text-foreground group-hover:text-[#4A070B] transition truncate">
                                                            {p.name}
                                                        </h6>
                                                        <p className="text-[11px] text-muted-foreground truncate">
                                                            {p.brand} &bull; {p.category || p.family}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-bold text-[#4A070B] shrink-0">
                                                        {p.price}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action to view full catalog filtered by this query */}
                                <button
                                    type="button"
                                    onClick={() => executeSearch(searchQuery)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/80 text-xs font-medium text-foreground transition border border-border/60 cursor-pointer"
                                >
                                    <span className="flex items-center gap-2 truncate">
                                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span className="truncate">
                                            {isEn ? 'View all search results for ' : 'Lihat semua hasil pencarian untuk '}
                                            <strong className="text-[#4A070B]">"{searchQuery}"</strong>
                                        </span>
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                </button>

                                {/* Empty suggestions state */}
                                {!isLoadingSuggestions && suggestions.products.length === 0 && suggestions.brands.length === 0 && (
                                    <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                                        <p className="font-semibold text-foreground">{isEn ? 'No Results Found' : 'Tidak Ditemukan Hasil'}</p>
                                        <p>{isEn ? `No products or brands match "${searchQuery}".` : `Tidak ada produk atau brand yang sesuai dengan "${searchQuery}".`}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dialog Footer with shortcuts (Desktop only, hidden on mobile) */}
                    <div className="hidden sm:flex px-4 py-2.5 bg-muted/30 border-t border-border/80 items-center justify-between text-[11px] text-muted-foreground">
                        <span>{isEn ? <>Press <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">↵ Enter</kbd> to search</> : <>Tekan <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">↵ Enter</kbd> untuk mencari</>}</span>
                        <span>{isEn ? <>Press <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">Esc</kbd> to close</> : <>Tekan <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">Esc</kbd> untuk menutup</>}</span>
                    </div>
                </DialogContent>
            </Dialog>

            {/* POPUP 3: CUSTOMER SERVICE & POLICIES MODAL (shadcn Dialog + Tabs + Accordion) */}
            <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
                <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-xl p-5 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {isEn ? 'Customer Service & Help' : 'Layanan Pelanggan & Bantuan'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {isEn
                                ? 'Comprehensive information regarding orders, delivery, and guarantees for our fine fragrances.'
                                : 'Informasi lengkap seputar pembelian, pengiriman, dan garansi wewangian kami.'}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={infoActiveTab} onValueChange={setInfoActiveTab} className="mt-2">
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="faq" className="text-xs">FAQ</TabsTrigger>
                            <TabsTrigger value="shipping" className="text-xs">{isEn ? 'Shipping' : 'Pengiriman'}</TabsTrigger>
                            <TabsTrigger value="returns" className="text-xs">{isEn ? 'Warranty' : 'Garansi'}</TabsTrigger>
                            <TabsTrigger value="terms" className="text-xs">{isEn ? 'Terms' : 'Ketentuan'}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="faq" className="mt-4">
                            <Accordion type="single" collapsible defaultValue="faq-1">
                                <AccordionItem value="faq-1">
                                    <AccordionTrigger className="text-xs font-medium">
                                        {isEn ? 'How long does Extrait de Parfum last?' : 'Berapa lama daya tahan Extrait de Parfum?'}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                                        {isEn
                                            ? 'Our Extrait de Parfum concentration ranges between 28% and 35%, delivering 12–16 hours of longevity on skin and several days on clothing.'
                                            : 'Konsentrasi Extrait de Parfum kami berkisar antara 28% hingga 35%, mampu bertahan 12-16 jam pada kulit dan beberapa hari pada pakaian.'}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="faq-2">
                                    <AccordionTrigger className="text-xs font-medium">
                                        {isEn ? 'Are all fragrances guaranteed authentic?' : 'Apakah seluruh produk dijamin asli?'}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                                        {isEn
                                            ? '100% guaranteed authentic. We provide a full money-back guarantee should any bottle prove non-authentic.'
                                            : '100% dijamin original. Kami memiliki jaminan uang kembali bila produk terbukti tidak authentic.'}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="faq-3">
                                    <AccordionTrigger className="text-xs font-medium">
                                        {isEn ? 'Are discovery vials or tester sets available?' : 'Apakah tersedia tester / vial kit?'}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                                        {isEn
                                            ? 'Yes, we provide Discovery Sets of 5 x 5ml with voucher credits redeemable towards your full-sized bottle purchase.'
                                            : 'Ya, kami menyediakan Discovery Set 5 x 5ml dengan voucher potongan untuk pembelian produk ukuran penuh.'}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="shipping" className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">{isEn ? 'Shipping Policy:' : 'Kebijakan Pengiriman:'}</p>
                            <p>{isEn ? 'Orders placed before 3:00 PM WIB are dispatched the same day using heavy protective packaging and sealed wooden crates.' : 'Pesanan sebelum pukul 15.00 WIB dikirim pada hari yang sama menggunakan bubble wrap tebal dan kotak kayu bersegel.'}</p>
                            <p>{isEn ? 'Complimentary shipping applies to orders over Rp 500,000 to all cities across Indonesia.' : 'Gratis ongkos kirim berlaku untuk pesanan di atas Rp 500.000 ke seluruh kota di Indonesia.'}</p>
                        </TabsContent>

                        <TabsContent value="returns" className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">{isEn ? 'Warranty & Returns:' : 'Garansi & Retur:'}</p>
                            <p>{isEn ? 'Items can be exchanged promptly if flacons arrive broken or leak during shipment, accompanied by official unboxing video proof.' : 'Barang dapat ditukar jika kemasan pecah atau mengalami kebocoran saat pengiriman dengan menyertakan video unboxing resmi.'}</p>
                        </TabsContent>

                        <TabsContent value="terms" className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">{isEn ? 'Terms & Conditions:' : 'Syarat & Ketentuan:'}</p>
                            <p>{isEn ? 'By accessing and ordering through Aroma Palace, you agree to our terms of service, payment options, and delivery policies.' : 'Dengan mengakses dan bertransaksi di Aroma Palace, Anda menyetujui seluruh ketentuan belanja, sistem pembayaran, dan ekspedisi kami.'}</p>
                            <p>{isEn ? 'All perfume formulations sold are 100% authentic luxury fragrances stored in climate-controlled cellars.' : 'Seluruh varian parfum yang dijual 100% orisinal dan disimpan dalam suhu terkontrol untuk menjaga kestabilan aroma terbaik.'}</p>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* POPUP 4: STORE LOCATOR MODAL (shadcn Dialog) */}
            <Dialog open={storeModalOpen} onOpenChange={setStoreModalOpen}>
                <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-lg p-5 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="text-left space-y-1">
                        <Badge variant="secondary" className="w-fit">{isEn ? 'Boutique & Store Locator' : 'Lokasi Butik & Toko'}</Badge>
                        <DialogTitle className="text-lg font-bold">{isEn ? 'Aroma Palace Boutique Locations' : 'Lokasi Butik Aroma Palace'}</DialogTitle>
                        <DialogDescription className="text-xs">
                            {isEn
                                ? 'Visit our physical boutiques for an exclusive olfactory journey and private scent consultation with master perfumers.'
                                : 'Kunjungi butik fisik kami untuk merasakan pengalaman olfaktori eksklusif dan konsultasi aroma privat bersama master perfumer.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 my-2">
                        {/* Jakarta */}
                        <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground">Flagship Boutique Jakarta</h4>
                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{isEn ? 'Open Today' : 'Buka Hari Ini'}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Senayan City Mall, Ground Floor Unit G-12, Jl. Asia Afrika Lot 19, Jakarta Pusat 10270
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                                <span>{isEn ? 'Hours: 10:00 – 22:00 WIB' : 'Jam Buka: 10:00 – 22:00 WIB'}</span>
                                <span className="font-medium text-foreground">Tel: (021) 7278-1234</span>
                            </div>
                        </div>

                        {/* Surabaya */}
                        <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground">Boutique Surabaya</h4>
                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{isEn ? 'Open Today' : 'Buka Hari Ini'}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Tunjungan Plaza 5, Level UG Unit 08-09, Jl. Basuki Rahmat, Surabaya 60261
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                                <span>{isEn ? 'Hours: 10:00 – 22:00 WIB' : 'Jam Buka: 10:00 – 22:00 WIB'}</span>
                                <span className="font-medium text-foreground">Tel: (031) 531-9988</span>
                            </div>
                        </div>

                        {/* Dubai Atelier */}
                        <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground">Flagship Atelier Dubai</h4>
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">{isEn ? 'Headquarters' : 'Kantor Pusat'}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                The Dubai Mall, Fashion Avenue Level 2, Downtown Dubai, United Arab Emirates
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                                <span>{isEn ? 'Hours: 10:00 – 23:00 GST' : 'Jam Buka: 10:00 – 23:00 GST'}</span>
                                <span className="font-medium text-foreground">+971 4 362 7500</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-1">
                        <Button variant="outline" size="sm" onClick={() => setStoreModalOpen(false)}>
                            {isEn ? 'Close' : 'Tutup'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* POPUP 5: CONTACT CONCIERGE MODAL (shadcn Dialog) */}
            <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
                <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-md p-5 sm:p-6 rounded-2xl">
                    <DialogHeader className="text-left space-y-1">
                        <Badge variant="secondary" className="w-fit">Concierge Service</Badge>
                        <DialogTitle className="text-lg font-bold">{isEn ? 'Contact Aroma Palace Concierge' : 'Hubungi Tim Aroma Palace'}</DialogTitle>
                        <DialogDescription className="text-xs">
                            {isEn
                                ? 'Our fragrance advisors are ready to assist you in selecting your signature scent or checking your order status.'
                                : 'Konsultan parfum kami siap membantu Anda memilih aroma terbaik atau memeriksa status pesanan Anda.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2.5 my-3">
                        <a
                            href="https://wa.me/6281234567890?text=Halo%20Aroma%20Palace,%20saya%20ingin%20konsultasi%20parfum"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition text-left cursor-pointer group"
                        >
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.08l-.29-.17-3.12.82.83-3.04-.19-.3a8.16 8.16 0 0 1-1.25-4.46c0-4.54 3.69-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45s-.56-1.35-.77-1.85c-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.13.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.17-.47-.29" />
                                </svg>
                            </div>
                            <div className="leading-tight flex-1">
                                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition block">WhatsApp VIP Concierge</span>
                                <span className="text-[11px] text-muted-foreground">+62 812-3456-7890 ({isEn ? '24-Hour Service' : 'Layanan 24 Jam'})</span>
                            </div>
                        </a>

                        <a
                            href="mailto:concierge@aromapalace.id"
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition text-left cursor-pointer group"
                        >
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="leading-tight flex-1">
                                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition block">Email Customer Service</span>
                                <span className="text-[11px] text-muted-foreground">concierge@aromapalace.id</span>
                            </div>
                        </a>

                        <Link
                            href="/about"
                            onClick={() => setContactModalOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition text-left cursor-pointer group"
                        >
                            <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <div className="leading-tight flex-1">
                                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition block">{isEn ? 'Personal Scent Consultation' : 'Konsultasi Aroma Personal'}</span>
                                <span className="text-[11px] text-muted-foreground">{isEn ? 'Send your fragrance brief on our About Atelier page' : 'Kirim brief wewangian di halaman Tentang Atelier'}</span>
                            </div>
                        </Link>
                    </div>

                    <div className="flex justify-end pt-1">
                        <Button variant="outline" size="sm" onClick={() => setContactModalOpen(false)}>
                            {isEn ? 'Close' : 'Tutup'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* POPUP 6: ANDROID APK DOWNLOAD CONFIRMATION MODAL (shadcn Dialog) */}
            <Dialog
                open={androidApkModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        handleDismissApkModal();
                    } else {
                        setAndroidApkModalOpen(true);
                    }
                }}
            >
                <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-md p-5 sm:p-6 rounded-2xl">
                    <DialogHeader className="text-left space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A070B] via-[#630B10] to-[#8C1D24] text-white flex items-center justify-center shadow-md shrink-0">
                                <Smartphone className="w-6 h-6 text-[#E5A844]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <Badge variant="outline" className="text-[10px] font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 mb-1">
                                    Android Application
                                </Badge>
                                <DialogTitle className="text-base sm:text-lg font-bold text-foreground leading-snug">
                                    {isEn ? 'Download Aroma Palace App' : 'Unduh Aplikasi Aroma Palace'}
                                </DialogTitle>
                            </div>
                        </div>

                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                            {isEn
                                ? 'Experience lightning-fast browsing, exclusive discount vouchers, and live order tracking with our official Android app.'
                                : 'Nikmati akses belanja lebih cepat, diskon & voucher eksklusif member, serta pelacakan kurir real-time langsung di Android Anda.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-3 space-y-2 bg-[#FDF8EE] dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-3 text-xs">
                        <div className="flex items-center gap-2.5 text-foreground font-medium">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>{isEn ? 'Exclusive member promos & instant updates' : 'Voucher & promo diskon member eksklusif'}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-foreground font-medium">
                            <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{isEn ? 'Live shipping tracking with instant push alerts' : 'Pelacakan kurir & status pesanan langsung'}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-foreground font-medium">
                            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                            <span>{isEn ? 'Official APK file • 100% Safe & Verified' : 'File APK Resmi • 100% Aman & Terverifikasi'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                        <Button
                            onClick={handleDownloadApk}
                            className="w-full bg-[#4A070B] hover:bg-[#360407] text-white font-bold text-xs sm:text-sm h-11 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4 text-[#E5A844]" />
                            <span>{isEn ? 'Download APK Now' : 'Download APK Sekarang'}</span>
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleDismissApkModal}
                            className="w-full text-xs text-muted-foreground hover:text-foreground h-9 cursor-pointer"
                        >
                            {isEn ? 'Continue in Web Browser' : 'Lanjutkan di Web Browser'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MOBILE FLOATING BOTTOM MENUBAR (Hanya muncul di mode mobile md:hidden) */}
            {shouldShowBottomNav && (
                <nav
                    aria-label={isEn ? "Mobile Bottom Navigation" : "Navigasi Bawah Mobile"}
                    className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom),0px)]"
                >
                    <div className="grid grid-cols-5 h-14 items-stretch">
                        {mobileNavItems.map((item) => {
                            const isActive = item.active;
                            if (item.isExternal) {
                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        onPointerDown={playMenuTapSound}
                                        onClick={playMenuTapSound}
                                        className={`h-full flex flex-col items-center justify-center gap-0.5 px-1 transition relative select-none active:scale-95 duration-150 ${isActive
                                            ? `${item.activeColor} font-bold`
                                            : 'text-muted-foreground hover:text-foreground font-medium'
                                            }`}
                                    >
                                        {isActive && (
                                            <span className="absolute -top-px left-2.5 right-2.5 h-0.5 rounded-full bg-[#4A070B] dark:bg-[#E8D0BA]" />
                                        )}
                                        <div className={`relative flex items-center justify-center p-1 rounded-full transition-all duration-200 ${isActive ? `${item.activeBg} scale-105` : ''}`}>
                                            {item.renderIcon(isActive)}
                                        </div>
                                        <span className="text-[10px] tracking-tight truncate max-w-full">
                                            {item.label}
                                        </span>
                                    </a>
                                );
                            }
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    component={item.component}
                                    prefetch={['mount', 'hover']}
                                    cacheFor="2m"
                                    onPointerDown={playMenuTapSound}
                                    onClick={playMenuTapSound}
                                    className={`h-full flex flex-col items-center justify-center gap-0.5 px-1 transition relative select-none active:scale-95 duration-150 ${isActive
                                        ? `${item.activeColor} font-bold`
                                        : 'text-muted-foreground hover:text-foreground font-medium'
                                        }`}
                                >
                                    {isActive && (
                                        <span className="absolute -top-px left-2.5 right-2.5 h-0.5 rounded-full bg-[#4A070B] dark:bg-[#E8D0BA]" />
                                    )}
                                    <div className={`relative flex items-center justify-center p-1 rounded-full transition-all duration-200 ${isActive ? `${item.activeBg} scale-105` : ''}`}>
                                        {item.renderIcon(isActive)}
                                        {Boolean(item.badge && item.badge > 0) && (
                                            <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] px-1 flex items-center justify-center text-[9px] font-bold bg-[#4A070B] dark:bg-[#E8D0BA] text-white dark:text-[#4A070B] rounded-full ring-2 ring-background">
                                                {item.badge! > 99 ? '99+' : item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] tracking-tight truncate max-w-full">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* Mobile App Update Notification & Mandatory Force Update Dialog */}
            <AppUpdateModal />
        </div>
    );
}
