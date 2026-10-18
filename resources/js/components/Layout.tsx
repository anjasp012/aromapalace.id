import { Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, type ReactNode } from 'react';
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
} from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
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

interface SharedProps {
    auth?: {
        user?: {
            id?: number;
            name: string;
            email: string;
            role?: string;
        };
        is_admin?: boolean;
        wishlist_ids?: number[];
        wishlist_count?: number;
        cart_count?: number;
        search_history?: string[];
    };
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: unknown;
}

declare global {
    interface Window {
        openPromoModal?: () => void;
        openSpotlight?: () => void;
        openInfoModal?: (tab?: string) => void;
        openStoreModal?: () => void;
        openContactModal?: () => void;
        showWishlistToast?: (message: string, isAdded?: boolean) => void;
        showCartToast?: (message: string) => void;
        showPromoToast?: (message: string) => void;
        copyPromoCode?: (code: string) => void;
    }
}

export default function Layout({ children }: LayoutProps) {
    const { url, props } = usePage<SharedProps>();
    const user = props?.auth?.user;
    const isAdmin = Boolean(props?.auth?.is_admin || user?.role === 'admin');

    // Header & Mobile Nav State
    const [slidRight, setSlidRight] = useState(false);
    const navTrackRef = useRef<HTMLDivElement>(null);

    // Modals State using shadcn Dialog
    const [promoModalOpen, setPromoModalOpen] = useState(false);
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

    // Toast States
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Wishlist & Cart Counts from DB / shared props
    const wishlistCount = props?.auth?.wishlist_count ?? 0;
    const cartCount = props?.auth?.cart_count ?? 0;

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
            }).catch(() => {});
        } else {
            try {
                localStorage.setItem('aromapalace_search_history', JSON.stringify(updated));
            } catch {}
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
            }).catch(() => {});
        } else {
            try {
                localStorage.setItem('aromapalace_search_history', JSON.stringify(updated));
            } catch {}
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
            }).catch(() => {});
        } else {
            try {
                localStorage.removeItem('aromapalace_search_history');
            } catch {}
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

    // Toasts logic
    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const copyPromoCode = (code: string) => {
        if (!code) return;
        navigator.clipboard?.writeText(code);
        triggerToast(`Kode promo "${code}" berhasil disalin!`);
    };

    // Global Window bindings
    useEffect(() => {
        window.openPromoModal = () => setPromoModalOpen(true);
        window.openSpotlight = () => {
            setSpotlightOpen(true);
            setTimeout(() => spotlightInputRef.current?.focus(), 50);
        };
        window.openInfoModal = (tab = 'faq') => {
            setInfoActiveTab(tab);
            setInfoModalOpen(true);
        };
        window.openStoreModal = () => setStoreModalOpen(true);
        window.openContactModal = () => setContactModalOpen(true);
        window.showWishlistToast = (msg) => triggerToast(msg);
        window.showCartToast = (msg) => triggerToast(msg);
        window.showPromoToast = (msg) => triggerToast(msg);
        window.copyPromoCode = copyPromoCode;
    }, []);

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

    return (
        <div className="bg-background text-foreground flex flex-col min-h-screen">
            {/* Top Announcement Bar */}
            <div className="bg-[#360407] text-white text-xs py-2 relative z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => window.openPromoModal?.()}
                        className="flex items-center gap-1.5 text-xs text-white/95 hover:text-white transition cursor-pointer text-left group"
                    >
                        <span className="text-[#E5A844] text-xs">✦</span>
                        <span className="font-normal text-[11px] sm:text-xs tracking-tight">
                            Promo Spesial &ndash; Diskon hingga 40%! Klaim Voucher &rarr;
                        </span>
                    </button>

                    <div className="hidden md:flex items-center gap-4 lg:gap-5 text-[11px]">
                        {/* Gratis Ongkir */}
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#E5A844] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a2 2 0 114 0m-4 0h2m-6 0H9m-4 0a2 2 0 114 0m6-6h3.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-5v5" />
                            </svg>
                            <div className="flex flex-col text-left leading-tight">
                                <span className="font-bold text-white text-[10px] tracking-wider uppercase">GRATIS ONGKIR</span>
                                <span className="text-[8.5px] text-[#E5A844] font-medium tracking-tight">SELURUH INDONESIA</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <span className="text-white/25 select-none font-light">|</span>

                        {/* 100% Produk Asli */}
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#E5A844] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <div className="flex flex-col text-left leading-tight">
                                <span className="font-bold text-white text-[10px] tracking-wider uppercase">100% PRODUK ASLI</span>
                                <span className="text-[8.5px] text-[#E5A844] font-medium tracking-tight">LANGSUNG DARI DUBAI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation Bar */}
            <header className="bg-background border-b border-[#4A070B]/20 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Upper Row: Search | Centered Logo | User Actions */}
                    <div className="relative flex items-center justify-between py-3.5 sm:py-4 min-h-[84px]">
                        {/* Left: Search Trigger (Underlined input style matching mockup) */}
                        <div className="flex items-center w-1/3 max-w-[170px] sm:max-w-[240px] md:max-w-[280px] z-10">
                            <button
                                type="button"
                                onClick={() => window.openSpotlight?.()}
                                className="w-full flex items-center gap-2 pb-1 border-b border-[#4A070B]/25 hover:border-[#4A070B] text-[#4A070B]/70 hover:text-[#4A070B] text-xs transition cursor-pointer text-left group"
                            >
                                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#4A070B] group-hover:text-[#360407] transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-[#4A070B]/75 group-hover:text-[#4A070B] transition truncate font-light text-[11px] sm:text-xs">
                                    <span className="hidden sm:inline">Cari parfum mewah...</span>
                                    <span className="sm:hidden">Cari parfum...</span>
                                </span>
                            </button>
                        </div>

                        {/* Center: Luxury Brand Logo (Matching demo-aromapalace.gagasan.tech) */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-10">
                            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 group">
                                <img
                                    src="/images/logo.png"
                                    alt="Aroma Palace"
                                    className="w-9 h-9 sm:w-11 sm:h-11 lg:w-13 lg:h-13 object-contain rounded-full shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                                />
                                <div className="flex flex-col items-center text-center">
                                    <span className="font-sans text-base sm:text-xl lg:text-2xl font-bold tracking-[0.14em] lg:tracking-[0.18em] text-[#704828] group-hover:text-[#360407] transition uppercase leading-none whitespace-nowrap text-center">
                                        Aroma Palace
                                    </span>
                                    <span className="font-sans text-[7px] sm:text-[8.5px] lg:text-[9.5px] uppercase tracking-[0.2em] lg:tracking-[0.25em] text-[#B88E58] font-semibold mt-0.5 sm:mt-1 whitespace-nowrap text-center">
                                        Dubai&apos;s Signature Perfumes
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {/* Right: Actions (Akun, Wishlist, Keranjang) with stacked icon & label matching #4A070B */}
                        <div className="flex items-center justify-end gap-2.5 sm:gap-4 md:gap-5 w-1/3 z-10">
                            {/* Akun */}
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
                                            Akun
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
                                                    <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] cursor-pointer">
                                                        <LayoutDashboard className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                        <span>Dashboard Admin</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem asChild>
                                                    <Link href="/account/orders" className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer">
                                                        <Package className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                        <span>Pesanan Saya</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuSeparator className="my-1 bg-border/60" />

                                            <DropdownMenuItem asChild variant="destructive">
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-destructive cursor-pointer hover:bg-destructive/10"
                                                >
                                                    <LogOut className="w-4 h-4 shrink-0 text-destructive" />
                                                    <span>Keluar</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <>
                                            <div className="px-2.5 py-2 border-b border-border/60 mb-1">
                                                <div className="text-xs font-bold text-foreground">
                                                    Selamat Datang
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    Masuk untuk kemudahan belanja
                                                </div>
                                            </div>

                                            <DropdownMenuItem asChild>
                                                <Link href="/login" className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer">
                                                    <LogIn className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                    <span>Masuk ke Akun</span>
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild>
                                                <Link href="/register" className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer">
                                                    <UserPlus className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                    <span>Daftar Akun Baru</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Wishlist & Keranjang: Disembunyikan untuk User Role Admin */}
                            {!isAdmin && (
                                <>
                                    {/* Wishlist */}
                                    <Link
                                        href={user ? '/wishlist' : '/login?notice=' + encodeURIComponent('Silakan masuk untuk mengakses halaman wishlist Anda.')}
                                        className="flex flex-col items-center justify-center gap-0.5 text-[#4A070B] hover:text-[#360407] transition cursor-pointer px-1 py-0.5 group relative"
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

                                    {/* Keranjang */}
                                    <Link
                                        href={user ? '/cart' : '/login?notice=' + encodeURIComponent('Silakan masuk untuk melihat keranjang belanja Anda.')}
                                        className="flex flex-col items-center justify-center gap-0.5 text-[#4A070B] hover:text-[#360407] transition cursor-pointer px-1 py-0.5 group relative"
                                    >
                                        <div className="relative">
                                            <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#4A070B] group-hover:text-[#360407] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            {cartCount > 0 && (
                                                <Badge className="absolute -top-1.5 -right-2 h-3.5 w-3.5 p-0 flex items-center justify-center text-[9px] bg-[#4A070B] text-white border-0">
                                                    {cartCount}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] font-medium text-[#4A070B] group-hover:text-[#360407] leading-none mt-0.5">
                                            Keranjang
                                        </span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Lower Row: Navigation Bar */}
                    <nav className="relative border-t border-[#4A070B]/15 -mb-px">
                        <div
                            ref={navTrackRef}
                            className="flex items-center justify-center gap-6 sm:gap-7 md:gap-8 lg:gap-10 overflow-x-auto text-xs font-semibold uppercase tracking-[0.08em] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            <Link
                                href="/"
                                className={`inline-flex items-center py-3 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url === '/'
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                BERANDA
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={`inline-flex items-center gap-1 py-3 sm:py-3.5 border-b-2 -mb-px transition cursor-pointer outline-none whitespace-nowrap ${url.startsWith('/products') && !url.includes('popular') && !url.includes('discount')
                                        ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                        : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                        }`}
                                >
                                    <span>KATALOG</span>
                                    <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuItem asChild>
                                        <Link href="/products">Semua Katalog</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/products?category=parfum-wanita">Parfum Wanita</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/products?category=parfum-pria">Parfum Pria</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/products?category=unisex-fragrance">Unisex Fragrance</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/products?category=discovery-sets">Discovery Sets &amp; Vials</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/products?category=body-and-hair-mist">Body &amp; Hair Mist</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Link
                                href="/products?sort=popular"
                                className={`inline-flex items-center py-3 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.includes('popular')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                TERLARIS
                            </Link>

                            <Link
                                href="/products?discount=1"
                                className={`inline-flex items-center py-3 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.includes('discount')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                PROMO SPESIAL
                            </Link>

                            <Link
                                href="/articles"
                                className={`inline-flex items-center py-3 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.startsWith('/articles')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                ARTIKEL
                            </Link>

                            <Link
                                href="/stores"
                                className={`inline-flex items-center py-3 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url.startsWith('/stores')
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                LOKASI TOKO
                            </Link>

                            <Link
                                href="/about"
                                className={`inline-flex items-center py-3 sm:py-3.5 border-b-2 -mb-px transition whitespace-nowrap ${url === '/about'
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                TENTANG KAMI
                            </Link>

                            <button
                                type="button"
                                onClick={() => setContactModalOpen(true)}
                                className={`inline-flex items-center py-3 sm:py-3.5 border-b-2 -mb-px transition cursor-pointer uppercase whitespace-nowrap ${contactModalOpen
                                    ? 'text-[#4A070B] font-bold border-[#4A070B]'
                                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-[#4A070B]/30'
                                    }`}
                            >
                                HUBUNGI KAMI
                            </button>
                        </div>

                        {/* Mobile Slide Arrow Toggle Button */}
                        <div className="lg:hidden absolute right-0 top-0 bottom-0 flex items-center pr-1.5 pl-6 bg-gradient-to-l from-background to-transparent pointer-events-none">
                            <button
                                onClick={handleSlideToggle}
                                type="button"
                                className="pointer-events-auto p-1.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                                aria-label="Slide Navigation"
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform duration-300 ${slidRight ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1">
                {children}
            </main>

            {/* Modern Clean Footer with Rich Burgundy Gradient matching Produk Diskon */}
            <footer className="bg-gradient-to-br from-[#4A070B] via-[#52090F] to-[#360407] text-white/80 border-t border-[#360407] mt-12 sm:mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-white/10">
                        {/* Col 1: Brand Info */}
                        <div className="lg:col-span-4 space-y-3">
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
                                Koleksi wewangian mewah dunia dan parfum artisanal berkualitas tinggi. Dirancang untuk keanggunan sejati dalam setiap semprotan.
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

                        {/* Col 2: Katalog */}
                        <div className="lg:col-span-2 space-y-3">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Katalog</h5>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/products" className="text-white/70 hover:text-white transition">Semua Koleksi</Link></li>
                                <li><Link href="/products?sort=popular" className="text-white/70 hover:text-white transition">Produk Terlaris</Link></li>
                                <li><Link href="/products?sort=newest" className="text-white/70 hover:text-white transition">Produk Terbaru</Link></li>
                                <li><Link href="/products?discount=1" className="text-white/70 hover:text-white transition">Promo Diskon</Link></li>
                                <li><Link href="/articles" className="text-white/70 hover:text-white transition">Artikel &amp; Jurnal</Link></li>
                                <li><Link href="/stores" className="text-white/70 hover:text-white transition">Lokasi Butik &amp; Toko</Link></li>
                            </ul>
                        </div>

                        {/* Col 3: Layanan Pelanggan */}
                        <div className="lg:col-span-3 space-y-3">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Bantuan &amp; Kebijakan</h5>
                            <ul className="space-y-2 text-xs">
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => window.openInfoModal?.('faq')}
                                        className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                    >
                                        Tanya Jawab (FAQ)
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => window.openInfoModal?.('shipping')}
                                        className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                    >
                                        Pengiriman &amp; Ekspedisi
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => window.openInfoModal?.('returns')}
                                        className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                    >
                                        Garansi &amp; Pengembalian
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => window.openInfoModal?.('privacy')}
                                        className="text-white/70 hover:text-white transition text-left cursor-pointer"
                                    >
                                        Kebijakan Privasi
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Col 4: Unduh Aplikasi */}
                        <div className="lg:col-span-3 space-y-3">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Unduh Aplikasi</h5>
                            <p className="text-xs leading-relaxed text-white/70">
                                Unduh aplikasi kami untuk akses eksklusif katalog parfum Dubai.
                            </p>
                            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => triggerToast('Aplikasi Aroma Palace untuk iOS akan segera tersedia di App Store!')}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition text-left cursor-pointer group shadow-none"
                                >
                                    <svg className="w-5 h-5 shrink-0 fill-current text-white group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 1.01-2.88-.93.04-2.07.62-2.73 1.39-.58.67-.99 1.74-.93 2.79 1.05.08 2.03-.55 2.65-1.3" />
                                    </svg>
                                    <div className="leading-tight">
                                        <span className="text-[9px] uppercase tracking-wider block text-white/60">Unduh di</span>
                                        <span className="text-xs font-semibold text-white">App Store</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => triggerToast('Aplikasi Aroma Palace untuk Android akan segera tersedia di Google Play Store!')}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition text-left cursor-pointer group shadow-none"
                                >
                                    <svg className="w-5 h-5 shrink-0 fill-current text-white group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                                        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.5 1.5 0 0 1-.61-.986V2.8a1.5 1.5 0 0 1 .609-.986zm11.242 11.245l2.454 2.454-11.836 6.833 9.382-9.287zm0-2.118L5.469 1.654l11.836 6.833-2.454 2.454zm1.06 1.059l3.523 2.034a1.2 1.2 0 0 0 0-2.08l-3.523-2.034 1.06 2.08z" />
                                    </svg>
                                    <div className="leading-tight">
                                        <span className="text-[9px] uppercase tracking-wider block text-white/60">Temukan di</span>
                                        <span className="text-xs font-semibold text-white">Google Play</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
                        <p>© 2026 Aroma Palace. All rights reserved.</p>
                        <div className="flex items-center gap-4 text-white/60">
                            <button
                                type="button"
                                onClick={() => window.openInfoModal?.('privacy')}
                                className="hover:text-white transition cursor-pointer"
                            >
                                Privasi
                            </button>
                            <span className="text-white/30">&bull;</span>
                            <button
                                type="button"
                                onClick={() => window.openInfoModal?.('terms')}
                                className="hover:text-white transition cursor-pointer"
                            >
                                Syarat &amp; Ketentuan
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Notification Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-border bg-card text-card-foreground px-4 py-3 text-xs shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <span className="text-primary font-bold">✓</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* POPUP 1: WELCOME PROMOTION MODAL (shadcn Dialog) */}
            <Dialog open={promoModalOpen} onOpenChange={setPromoModalOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader className="text-left space-y-2">
                        <Badge variant="secondary" className="w-fit">Penawaran Eksklusif</Badge>
                        <DialogTitle className="text-xl font-bold">Selamat Datang di Aroma Palace</DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            Gunakan kode voucher di bawah ini untuk mendapatkan potongan harga langsung sebesar 20% pada pesanan pertama Anda.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-4 p-4 rounded-lg bg-muted border border-border flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Kode Promo</span>
                            <span className="text-sm font-mono font-bold text-foreground">AROMA20</span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                                copyPromoCode('AROMA20');
                                setPromoModalOpen(false);
                            }}
                        >
                            Salin Voucher
                        </Button>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPromoModalOpen(false)}>
                            Nanti Saja
                        </Button>
                    </div>
                </DialogContent>
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
                <DialogContent className="max-w-2xl p-0 overflow-hidden shadow-2xl border-border/80">
                    {/* Search Input Bar */}
                    <div className="p-4 border-b border-border/80 flex items-center gap-3 bg-card">
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
                            placeholder="Cari nama parfum atau brand..."
                            className="border-none shadow-none focus-visible:ring-0 text-sm h-9 px-0 bg-transparent placeholder:text-muted-foreground/70"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Bersihkan
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={() => executeSearch(searchQuery)}
                            className="h-8 px-3 text-xs bg-[#4A070B] hover:bg-[#360407] text-white shrink-0 font-medium"
                        >
                            Cari
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
                                                Pencarian Terakhir
                                            </span>
                                            <button
                                                type="button"
                                                onClick={clearAllSearchHistory}
                                                className="text-xs text-muted-foreground hover:text-destructive transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Hapus Semua
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
                                                        title="Hapus riwayat"
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
                                        <p className="text-sm font-semibold text-foreground">Mulai Pencarian</p>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                            Ketik nama parfum atau brand untuk melihat saran dan hasil pencarian.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {isLoadingSuggestions && (
                                    <div className="py-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin text-[#4A070B]" />
                                        <span>Mencari saran wewangian...</span>
                                    </div>
                                )}

                                {/* Matching Brands */}
                                {suggestions.brands.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Brand Terkait ({suggestions.brands.length})
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
                                                        ({b.products_count} Koleksi)
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
                                            Produk ({suggestions.products.length})
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
                                            Lihat semua hasil pencarian untuk <strong className="text-[#4A070B]">"{searchQuery}"</strong>
                                        </span>
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                </button>

                                {/* Empty suggestions state */}
                                {!isLoadingSuggestions && suggestions.products.length === 0 && suggestions.brands.length === 0 && (
                                    <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                                        <p className="font-semibold text-foreground">Tidak Ditemukan Hasil</p>
                                        <p>Tidak ada produk atau brand yang sesuai dengan "{searchQuery}".</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dialog Footer with shortcuts */}
                    <div className="px-4 py-2.5 bg-muted/30 border-t border-border/80 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Tekan <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">↵ Enter</kbd> untuk mencari</span>
                        <span>Tekan <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded font-mono">Esc</kbd> untuk menutup</span>
                    </div>
                </DialogContent>
            </Dialog>

            {/* POPUP 3: CUSTOMER SERVICE & POLICIES MODAL (shadcn Dialog + Tabs + Accordion) */}
            <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
                <DialogContent className="max-w-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Layanan Pelanggan &amp; Bantuan</DialogTitle>
                        <DialogDescription className="text-xs">
                            Informasi lengkap seputar pembelian, pengiriman, dan garansi wewangian kami.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={infoActiveTab} onValueChange={setInfoActiveTab} className="mt-2">
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="faq" className="text-xs">FAQ</TabsTrigger>
                            <TabsTrigger value="shipping" className="text-xs">Pengiriman</TabsTrigger>
                            <TabsTrigger value="returns" className="text-xs">Garansi</TabsTrigger>
                            <TabsTrigger value="privacy" className="text-xs">Privasi</TabsTrigger>
                        </TabsList>

                        <TabsContent value="faq" className="mt-4">
                            <Accordion type="single" collapsible defaultValue="faq-1">
                                <AccordionItem value="faq-1">
                                    <AccordionTrigger className="text-xs font-medium">Berapa lama daya tahan Extrait de Parfum?</AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                                        Konsentrasi Extrait de Parfum kami berkisar antara 28% hingga 35%, mampu bertahan 12-16 jam pada kulit dan beberapa hari pada pakaian.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="faq-2">
                                    <AccordionTrigger className="text-xs font-medium">Apakah seluruh produk dijamin asli?</AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                                        100% dijamin original. Kami memiliki jaminan uang kembali bila produk terbukti tidak authentic.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="faq-3">
                                    <AccordionTrigger className="text-xs font-medium">Apakah tersedia tester / vial kit?</AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                                        Ya, kami menyediakan Discovery Set 5 x 5ml dengan voucher potongan untuk pembelian produk ukuran penuh.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="shipping" className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Kebijakan Pengiriman:</p>
                            <p>Pesanan sebelum pukul 15.00 WIB dikirim pada hari yang sama menggunakan bubble wrap tebal dan kotak kayu bersegel.</p>
                            <p>Gratis ongkos kirim berlaku untuk pesanan di atas Rp 500.000 ke seluruh kota di Indonesia.</p>
                        </TabsContent>

                        <TabsContent value="returns" className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Garansi &amp; Retur:</p>
                            <p>Barang dapat ditukar jika kemasan pecah atau mengalami kebocoran saat pengiriman dengan menyertakan video unboxing resmi.</p>
                        </TabsContent>

                        <TabsContent value="privacy" className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">Privasi Pelanggan:</p>
                            <p>Data pribadi Anda aman dan dilindungi dengan enkripsi SSL 256-bit standar industri perbankan.</p>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* POPUP 4: STORE LOCATOR MODAL (shadcn Dialog) */}
            <Dialog open={storeModalOpen} onOpenChange={setStoreModalOpen}>
                <DialogContent className="max-w-lg p-6">
                    <DialogHeader className="text-left space-y-1">
                        <Badge variant="secondary" className="w-fit">Boutique &amp; Store Locator</Badge>
                        <DialogTitle className="text-lg font-bold">Lokasi Butik Aroma Palace</DialogTitle>
                        <DialogDescription className="text-xs">
                            Kunjungi butik fisik kami untuk merasakan pengalaman olfaktori eksklusif dan konsultasi aroma privat bersama master perfumer.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 my-2">
                        {/* Jakarta */}
                        <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground">Flagship Boutique Jakarta</h4>
                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Buka Hari Ini</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Senayan City Mall, Ground Floor Unit G-12, Jl. Asia Afrika Lot 19, Jakarta Pusat 10270
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                                <span>Jam Buka: 10:00 &ndash; 22:00 WIB</span>
                                <span className="font-medium text-foreground">Tel: (021) 7278-1234</span>
                            </div>
                        </div>

                        {/* Surabaya */}
                        <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground">Boutique Surabaya</h4>
                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Buka Hari Ini</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Tunjungan Plaza 5, Level UG Unit 08-09, Jl. Basuki Rahmat, Surabaya 60261
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                                <span>Jam Buka: 10:00 &ndash; 22:00 WIB</span>
                                <span className="font-medium text-foreground">Tel: (031) 531-9988</span>
                            </div>
                        </div>

                        {/* Dubai Atelier */}
                        <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground">Flagship Atelier Dubai</h4>
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Headquarters</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                The Dubai Mall, Fashion Avenue Level 2, Downtown Dubai, United Arab Emirates
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                                <span>Jam Buka: 10:00 &ndash; 23:00 GST</span>
                                <span className="font-medium text-foreground">+971 4 362 7500</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-1">
                        <Button variant="outline" size="sm" onClick={() => setStoreModalOpen(false)}>
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* POPUP 5: CONTACT CONCIERGE MODAL (shadcn Dialog) */}
            <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader className="text-left space-y-1">
                        <Badge variant="secondary" className="w-fit">Concierge Service</Badge>
                        <DialogTitle className="text-lg font-bold">Hubungi Tim Aroma Palace</DialogTitle>
                        <DialogDescription className="text-xs">
                            Konsultan parfum kami siap membantu Anda memilih aroma terbaik atau memeriksa status pesanan Anda.
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
                                <span className="text-[11px] text-muted-foreground">+62 812-3456-7890 (Layanan 24 Jam)</span>
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
                                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition block">Konsultasi Aroma Personal</span>
                                <span className="text-[11px] text-muted-foreground">Kirim brief wewangian di halaman Tentang Atelier</span>
                            </div>
                        </Link>
                    </div>

                    <div className="flex justify-end pt-1">
                        <Button variant="outline" size="sm" onClick={() => setContactModalOpen(false)}>
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
