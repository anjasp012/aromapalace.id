import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import ProductCard, { type ProductItem, ProductCardSkeleton } from '@/components/ProductCard';
import ProductQuickViewModal from '@/components/ProductQuickViewModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslation, formatCategoryName } from '@/lib/i18n';

export interface Fragrance {
    id: number;
    name: string;
    slug?: string;
    brand?: string;
    category?: string;
    family: string;
    volume: string;
    concentration: string;
    price: string;
    originalPrice?: string;
    discountBadge?: string;
    isNew?: boolean;
    isPopular?: boolean;
    raw_price: number;
    rating: number;
    reviews_count: number;
    in_stock: boolean;
    tag: string;
    mood: string;
    image?: string;
    description?: string;
    description_en?: string;
    notes: {
        top: string;
        heart: string;
        base: string;
    };
}

interface ProductsProps {
    fragrances: Fragrance[];
    categories: string[];
    brands?: string[];
    selectedCategory?: string;
    selectedBrand?: string;
    filters?: {
        searchQuery?: string;
        activeCategory?: string;
        activeBrand?: string;
        priceTier?: string;
        customMin?: string;
        customMax?: string;
        minRating?: number;
        onlyDiscount?: boolean;
        sortBy?: 'featured' | 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'discount';
    };
    totalCount?: number;
}

const PRICE_TIERS = [
    { label: 'Semua Harga', labelEn: 'All Prices', value: 'all' },
    { label: '< Rp 1.500.000', labelEn: '< IDR 1,500,000', value: 'under-1500' },
    { label: 'Rp 1.5jt - Rp 2.5jt', labelEn: 'IDR 1.5M - 2.5M', value: '1500-2500' },
    { label: '> Rp 2.500.000', labelEn: '> IDR 2,500,000', value: 'above-2500' },
];

interface ParsedFilters {
    searchQuery: string;
    activeCategory: string;
    activeBrand: string;
    priceTier: string;
    customMin: string;
    customMax: string;
    minRating: number;
    onlyDiscount: boolean;
    sortBy: 'featured' | 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'discount';
}

function parseFiltersFromUrl(
    searchString: string,
    categories: string[] = [],
    brands: string[] = [],
    defaultCategory = 'All',
    defaultBrand = 'All'
): ParsedFilters {
    const searchParams = new URLSearchParams(
        searchString.startsWith('?') ? searchString.slice(1) : searchString
    );

    // 1. Text Search Query
    const search = searchParams.get('search') || searchParams.get('q') || '';
    let searchQuery = search;

    // 2. Brand
    let activeBrand = defaultBrand;
    const rawBrand = searchParams.get('brand');
    const safeBrands = brands || [];
    if (rawBrand) {
        const matched = safeBrands.find(
            (b) => b.toLowerCase() === rawBrand.toLowerCase() || b.toLowerCase().replace(/\s+/g, '-') === rawBrand.toLowerCase()
        );
        activeBrand = matched || rawBrand;
    }

    // 3. Category
    let activeCategory = defaultCategory;
    const rawCategory = searchParams.get('category') || searchParams.get('family') || searchParams.get('scent') || searchParams.get('collection');
    const safeCats = categories || [];
    if (rawCategory) {
        const matched = safeCats.find(
            (c) => c.toLowerCase() === rawCategory.toLowerCase() || c.toLowerCase().replace(/\s+/g, '-') === rawCategory.toLowerCase()
        );
        if (matched) {
            activeCategory = matched;
        } else if (!searchQuery) {
            // Gracefully map legacy collection or gender slugs to search query
            const norm = rawCategory.toLowerCase();
            if (norm.includes('wanita')) searchQuery = 'Parfum Wanita';
            else if (norm.includes('pria')) searchQuery = 'Parfum Pria';
            else if (norm.includes('unisex')) searchQuery = 'Unisex';
            else if (norm.includes('discovery')) searchQuery = 'Discovery';
            else searchQuery = rawCategory.replace(/-/g, ' ');
        }
    }

    // 4. Price Tier & Custom Min/Max
    let priceTier = 'all';
    const rawPrice = searchParams.get('price') || searchParams.get('tier');
    if (rawPrice && ['under-1500', '1500-2500', 'above-2500', 'custom'].includes(rawPrice)) {
        priceTier = rawPrice;
    }

    const customMin = searchParams.get('min_price') || searchParams.get('min') || '';
    const customMax = searchParams.get('max_price') || searchParams.get('max') || '';
    if ((customMin || customMax) && priceTier === 'all') {
        priceTier = 'custom';
    }

    // 5. Min Rating
    const rawRating = searchParams.get('rating') || searchParams.get('min_rating');
    let minRating = 0;
    if (rawRating) {
        const parsed = parseFloat(rawRating);
        if (!isNaN(parsed) && parsed > 0) minRating = parsed;
    }

    // 6. Discount / Promo Filter
    const onlyDiscount = searchParams.get('discount') === '1' || searchParams.get('discount') === 'true' || searchParams.get('promo') === '1';

    // 7. Sort By
    let sortBy: 'featured' | 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'discount' = 'featured';
    const rawSort = searchParams.get('sort') || searchParams.get('sortBy');
    if (rawSort && ['featured', 'popular', 'price-asc', 'price-desc', 'rating', 'discount'].includes(rawSort)) {
        sortBy = rawSort as any;
    }

    return {
        searchQuery,
        activeCategory,
        activeBrand,
        priceTier,
        customMin,
        customMax,
        minRating,
        onlyDiscount,
        sortBy,
    };
}

function buildQueryString(filters: {
    searchQuery: string;
    activeCategory: string;
    activeBrand: string;
    priceTier: string;
    customMin: string;
    customMax: string;
    minRating: number;
    onlyDiscount: boolean;
    sortBy: string;
}): string {
    const params = new URLSearchParams();

    if (filters.searchQuery.trim()) {
        params.set('search', filters.searchQuery.trim());
    }
    if (filters.activeCategory && filters.activeCategory !== 'All') {
        params.set('category', filters.activeCategory);
    }
    if (filters.activeBrand && filters.activeBrand !== 'All') {
        params.set('brand', filters.activeBrand);
    }
    if (filters.priceTier && filters.priceTier !== 'all' && filters.priceTier !== 'custom') {
        params.set('price', filters.priceTier);
    }
    if (filters.customMin.trim()) {
        params.set('min_price', filters.customMin.trim());
    }
    if (filters.customMax.trim()) {
        params.set('max_price', filters.customMax.trim());
    }
    if (filters.minRating > 0) {
        params.set('rating', filters.minRating.toString());
    }
    if (filters.onlyDiscount) {
        params.set('discount', '1');
    }
    if (filters.sortBy && filters.sortBy !== 'featured') {
        params.set('sort', filters.sortBy);
    }

    return params.toString();
}

export default function Products({
    fragrances = [],
    categories = [],
    brands: serverBrands = [],
    selectedCategory = 'All',
    selectedBrand = 'All',
    filters: serverFilters,
    totalCount,
}: Partial<ProductsProps>) {
    const { t, isEn, pickText } = useTranslation();
    const { url, props } = usePage<any>();
    const user = props?.auth?.user;
    const isAdmin = Boolean(props?.auth?.is_admin || user?.role === 'admin');

    const availableBrands = useMemo(() => {
        if (serverBrands && serverBrands.length > 0) return serverBrands;
        const safeFragrances = fragrances || [];
        const unique = Array.from(new Set(safeFragrances.map((f) => f.brand).filter(Boolean) as string[])).sort();
        return ['All', ...unique];
    }, [serverBrands, fragrances]);

    // 1. Initialize Filter States from serverFilters or URL Query
    const initialFilters = useMemo(() => {
        if (serverFilters) {
            return {
                searchQuery: serverFilters.searchQuery || '',
                activeCategory: serverFilters.activeCategory || selectedCategory,
                activeBrand: serverFilters.activeBrand || selectedBrand,
                priceTier: serverFilters.priceTier || 'all',
                customMin: serverFilters.customMin || '',
                customMax: serverFilters.customMax || '',
                minRating: serverFilters.minRating || 0,
                onlyDiscount: serverFilters.onlyDiscount ?? false,
                sortBy: serverFilters.sortBy || 'featured',
            };
        }
        const searchStr = typeof window !== 'undefined'
            ? window.location.search
            : (url && url.includes('?') ? url.slice(url.indexOf('?')) : '');
        return parseFiltersFromUrl(searchStr, categories, availableBrands, selectedCategory, selectedBrand);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
    const [activeCategory, setActiveCategory] = useState(initialFilters.activeCategory);
    const [activeBrand, setActiveBrand] = useState(initialFilters.activeBrand);
    const [priceTier, setPriceTier] = useState(initialFilters.priceTier);
    const [customMin, setCustomMin] = useState(initialFilters.customMin);
    const [customMax, setCustomMax] = useState(initialFilters.customMax);
    const [minRating, setMinRating] = useState<number>(initialFilters.minRating);
    const [onlyDiscount, setOnlyDiscount] = useState<boolean>(initialFilters.onlyDiscount);
    const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'discount'>(initialFilters.sortBy);
    const [isServerFiltering, setIsServerFiltering] = useState(false);

    // Derived Brands Partitioning (Primary Pills + Dropdown for Other Brands)
    const nonAllBrands = useMemo(() => availableBrands.filter((b) => b !== 'All'), [availableBrands]);

    const primaryBrands = useMemo(() => {
        const preferred = ['Aroma Royale', 'Maison Floral', 'Capri Fragranze', 'Artisanal Niche'];
        const matched = preferred.filter((p) => nonAllBrands.includes(p));
        const remaining = nonAllBrands.filter((b) => !matched.includes(b));
        return [...matched, ...remaining].slice(0, 4);
    }, [nonAllBrands]);

    const otherBrands = useMemo(() => {
        return nonAllBrands.filter((b) => !primaryBrands.includes(b));
    }, [nonAllBrands, primaryBrands]);

    const isOtherBrandSelected = Boolean(activeBrand !== 'All' && otherBrands.includes(activeBrand));

    // 2. Mobile Drawer State
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // 3. Modals, Wishlist & Copy State
    const [selectedBottle, setSelectedBottle] = useState<Fragrance | null>(null);
    const [wishlist, setWishlist] = useState<number[]>(props?.auth?.wishlist_ids ?? []);
    const [copiedUrl, setCopiedUrl] = useState(false);

    useEffect(() => {
        if (props?.auth?.wishlist_ids) {
            setWishlist(props.auth.wishlist_ids);
        }
    }, [props?.auth?.wishlist_ids]);

    // Refs to control initial mount and track applied params to avoid redundant fetches
    const isFirstMountRef = useRef(true);
    const lastAppliedParamsRef = useRef<string>('');
    const pendingTimerRef = useRef<number | null>(null);

    // Send server-side filter request when filter/sort state changes (debounced 150ms)
    useEffect(() => {
        const params: Record<string, string> = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (activeCategory && activeCategory !== 'All') params.category = activeCategory;
        if (activeBrand && activeBrand !== 'All') params.brand = activeBrand;
        if (priceTier && priceTier !== 'all' && priceTier !== 'custom') params.price = priceTier;
        if (customMin.trim()) params.min_price = customMin.trim();
        if (customMax.trim()) params.max_price = customMax.trim();
        if (minRating > 0) params.rating = minRating.toString();
        if (onlyDiscount) params.discount = '1';
        if (sortBy && sortBy !== 'featured') params.sort = sortBy;

        const paramsStr = JSON.stringify(params);

        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            lastAppliedParamsRef.current = paramsStr;
            return;
        }

        if (paramsStr === lastAppliedParamsRef.current) {
            return;
        }

        if (pendingTimerRef.current) {
            window.clearTimeout(pendingTimerRef.current);
        }

        pendingTimerRef.current = window.setTimeout(() => {
            lastAppliedParamsRef.current = paramsStr;
            setIsServerFiltering(true);
            router.get('/products', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['fragrances', 'filters', 'selectedCategory', 'selectedBrand'],
                onFinish: () => setIsServerFiltering(false),
            });
        }, 150);

        return () => {
            if (pendingTimerRef.current) {
                window.clearTimeout(pendingTimerRef.current);
            }
        };
    }, [
        searchQuery,
        activeCategory,
        activeBrand,
        priceTier,
        customMin,
        customMax,
        minRating,
        onlyDiscount,
        sortBy,
    ]);

    const toggleWishlist = (id: number, name: string) => {
        if (isAdmin) return;
        if (!user) {
            const noticeText = isEn
                ? 'Please log in to save fragrances to your wishlist.'
                : 'Silakan masuk untuk menyimpan wewangian ke wishlist Anda.';
            router.visit('/login?notice=' + encodeURIComponent(noticeText));
            return;
        }
        setWishlist((prev) => {
            const isFav = prev.includes(id);
            return isFav ? prev.filter((item) => item !== id) : [...prev, id];
        });
        router.post(
            '/wishlist/toggle',
            { product_id: id },
            {
                preserveScroll: true,
                onError: () => {
                    if (props?.auth?.wishlist_ids) {
                        setWishlist(props.auth.wishlist_ids);
                    }
                },
            }
        );
    };

    const handleAddToBag = (item: Fragrance) => {
        if (isAdmin) return;
        if (!user) {
            const noticeText = isEn
                ? 'Please log in to add products to your shopping bag.'
                : 'Silakan masuk untuk menambahkan produk ke keranjang belanja.';
            router.visit('/login?notice=' + encodeURIComponent(noticeText));
            return;
        }
        router.post(
            '/cart',
            {
                product_id: item.id,
                quantity: 1,
                volume: item.volume || '50ml',
            },
            {
                preserveScroll: true,
            }
        );
    };

    // Share or Copy Filtered URL
    const handleShareOrCopyUrl = async () => {
        if (typeof window === 'undefined') return;
        const currentUrl = window.location.href;

        if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            try {
                await navigator.share({
                    title: isEn ? 'Aroma Palace Catalog' : 'Katalog Aroma Palace',
                    text: isEn
                        ? 'Explore these luxury fragrances at Aroma Palace:'
                        : 'Lihat pilihan wewangian mewah ini di Aroma Palace:',
                    url: currentUrl,
                });
                return;
            } catch {
                // Fallback to clipboard if share cancelled
            }
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(currentUrl);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = currentUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2200);
            window.showPromoToast?.(
                isEn
                    ? 'Filter link successfully copied! Ready to share.'
                    : 'Tautan filter berhasil disalin! Siap dibagikan.'
            );
        } catch {
            window.showPromoToast?.(
                isEn ? 'Failed to copy link.' : 'Gagal menyalin tautan.'
            );
        }
    };

    // Count active filters (Pencarian, Kategori, Brand, Rentang Harga, Rating, Diskon)
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim()) count++;
        if (activeCategory !== 'All') count++;
        if (activeBrand !== 'All') count++;
        if (priceTier !== 'all' || customMin || customMax) count++;
        if (minRating > 0) count++;
        if (onlyDiscount) count++;
        return count;
    }, [
        searchQuery,
        activeCategory,
        activeBrand,
        priceTier,
        customMin,
        customMax,
        minRating,
        onlyDiscount,
    ]);

    // Reset all filters and clear URL query string via server-side reload
    const resetAllFilters = () => {
        setSearchQuery('');
        setActiveCategory('All');
        setActiveBrand('All');
        setPriceTier('all');
        setCustomMin('');
        setCustomMax('');
        setMinRating(0);
        setOnlyDiscount(false);
        setSortBy('featured');

        setIsServerFiltering(true);
        router.get('/products', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['fragrances', 'filters', 'selectedCategory', 'selectedBrand'],
            onFinish: () => setIsServerFiltering(false),
        });
    };

    // Master products are filtered directly on the backend server via SQL
    const filteredFragrances = fragrances;

    // RENDER FILTER SIDEBAR CONTENT (Reused in Desktop Sidebar and Mobile Sheet)
    const renderFilterContent = () => (
        <div className="space-y-6 text-xs">
            {/* Header / Active Filter Counter */}
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2 font-bold tracking-wider uppercase text-foreground text-xs">
                    <svg className="w-4 h-4 text-[#4A070B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>{t('catalog.filter')}</span>
                </div>
                {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#4A070B]/10 text-[#4A070B] border border-[#4A070B]/30 text-[10px] font-bold flex items-center justify-center">
                        {activeFiltersCount}
                    </span>
                )}
            </div>

            {/* 1. Quick Search */}
            <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {isEn ? 'Quick Search' : 'Pencarian Cepat'}
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder={isEn ? 'Fragrance name, notes, brand...' : 'Nama parfum, notes, brand...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-8 pr-7 rounded-md border border-border/80 bg-background/80 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#4A070B] focus:ring-1 focus:ring-[#4A070B]/25 transition shadow-none"
                    />
                    <svg className="w-3.5 h-3.5 text-[#4A070B] absolute left-2.5 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label={isEn ? 'Clear search' : 'Hapus pencarian'}
                            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                        >
                            &times;
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Kategori */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {t('catalog.categories')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => {
                        const isSelected = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${isSelected
                                    ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                                    : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {cat === 'All' ? t('catalog.allCategories') : formatCategoryName(cat, isEn)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Brand */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {t('catalog.brands')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {/* Semua Brand */}
                    <button
                        type="button"
                        onClick={() => setActiveBrand('All')}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${activeBrand === 'All'
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        {t('catalog.allBrands')}
                    </button>

                    {/* Primary Brands */}
                    {primaryBrands.map((b) => {
                        const isSelected = activeBrand === b;
                        return (
                            <button
                                key={b}
                                type="button"
                                onClick={() => setActiveBrand(b)}
                                className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${isSelected
                                    ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                                    : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {b}
                            </button>
                        );
                    })}

                    {/* Brand Lainnya Dropdown */}
                    {otherBrands.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                type="button"
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none outline-none ${isOtherBrandSelected
                                    ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                                    : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                                    }`}
                            >
                                <span className="truncate max-w-[120px]">
                                    {isOtherBrandSelected ? activeBrand : (isEn ? 'Other Brands' : 'Brand Lainnya')}
                                </span>
                                <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52 max-h-56 overflow-y-auto p-1 text-xs z-[70] shadow-md border-border/80 bg-background">
                                {isOtherBrandSelected && (
                                    <DropdownMenuItem
                                        onClick={() => setActiveBrand('All')}
                                        className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer rounded-md text-[11px] text-muted-foreground hover:bg-muted/80 border-b border-border/50 mb-1"
                                    >
                                        <span>{t('catalog.allBrands')}</span>
                                    </DropdownMenuItem>
                                )}
                                {otherBrands.map((b) => {
                                    const isSelected = activeBrand === b;
                                    return (
                                        <DropdownMenuItem
                                            key={b}
                                            onClick={() => setActiveBrand(b)}
                                            className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer rounded-md text-[11px] ${isSelected
                                                ? 'bg-[#4A070B]/10 text-[#4A070B] font-bold'
                                                : 'text-foreground hover:bg-muted/80'
                                                }`}
                                        >
                                            <span className="truncate">{b}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-[#4A070B] shrink-0 ml-1.5" />}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* 4. Rentang Harga */}
            <div className="space-y-2.5 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {t('catalog.priceRange')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                    {PRICE_TIERS.map((tier) => (
                        <button
                            key={tier.value}
                            type="button"
                            onClick={() => {
                                setPriceTier(tier.value);
                                setCustomMin('');
                                setCustomMax('');
                            }}
                            className={`px-2 py-1.5 rounded-md text-[10.5px] transition cursor-pointer border text-center shadow-none ${priceTier === tier.value
                                ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                                : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                                }`}
                        >
                            {isEn && tier.labelEn ? tier.labelEn : tier.label}
                        </button>
                    ))}
                </div>

                {/* Custom Min / Max input */}
                <div className="pt-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1.5">
                        {isEn ? 'Custom Price (IDR)' : 'Kustomisasi Harga (Rp)'}
                    </span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={customMin}
                            onChange={(e) => {
                                setCustomMin(e.target.value);
                                setPriceTier('custom');
                            }}
                            className="w-1/2 h-8 px-2.5 rounded-md border border-border/80 bg-background/80 text-xs text-foreground focus:outline-none focus:border-[#4A070B] shadow-none"
                        />
                        <span className="text-muted-foreground text-xs">-</span>
                        <input
                            type="number"
                            placeholder={isEn ? 'Max' : 'Maks'}
                            value={customMax}
                            onChange={(e) => {
                                setCustomMax(e.target.value);
                                setPriceTier('custom');
                            }}
                            className="w-1/2 h-8 px-2.5 rounded-md border border-border/80 bg-background/80 text-xs text-foreground focus:outline-none focus:border-[#4A070B] shadow-none"
                        />
                    </div>
                </div>
            </div>

            {/* 4. Rating */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'Customer Rating' : 'Rating Pelanggan'}
                </label>
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={() => setMinRating(0)}
                        className={`flex-1 py-1.5 rounded-md text-[10.5px] border transition cursor-pointer text-center shadow-none ${minRating === 0
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        {t('common.all')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMinRating(4.8)}
                        className={`flex-1 py-1.5 rounded-md text-[10.5px] border transition cursor-pointer text-center shadow-none ${minRating === 4.8
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        ★ 4.8+
                    </button>
                    <button
                        type="button"
                        onClick={() => setMinRating(4.9)}
                        className={`flex-1 py-1.5 rounded-md text-[10.5px] border transition cursor-pointer text-center shadow-none ${minRating === 4.9
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        ★ 4.9+
                    </button>
                </div>
            </div>

            {/* 5. Penawaran & Promo */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'Deals & Discounts' : 'Penawaran & Diskon'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        type="button"
                        onClick={() => setOnlyDiscount(false)}
                        className={`py-1.5 rounded-md text-[10.5px] border transition cursor-pointer text-center shadow-none ${!onlyDiscount
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        {isEn ? 'All Products' : 'Semua Produk'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOnlyDiscount(true)}
                        className={`py-1.5 rounded-md text-[10.5px] border transition cursor-pointer text-center shadow-none flex items-center justify-center gap-1 ${onlyDiscount
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        <span>🏷️</span>
                        <span>{isEn ? 'Discount Promo' : 'Promo Diskon'}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <Head title={isEn ? 'Luxury Fragrance Collection Catalog • Aroma Palace' : 'Katalog Koleksi Parfum Mewah • Aroma Palace'} />

            {/* PAGE HEADER */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'Catalog of' : 'Katalog'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Exclusive Fragrances' : 'Wewangian Eksklusif'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isEn
                            ? 'Curated artisanal fragrances and pure extrait concentrations boasting intense longevity and captivating luxury character.'
                            : 'Pilihan parfum artisanal dan konsentrasi extrait murni dengan daya tahan tinggi serta karakter aroma mewah yang memikat setiap indera.'}
                    </p>
                </div>
            </div>

            {/* MAIN TWO-COLUMN CONTAINER: LEFT FILTER, RIGHT PRODUCTS */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ======================================================== */}
                    {/* LEFT SIDEBAR: DESKTOP STICKY FILTER PANEL */}
                    {/* ======================================================== */}
                    <aside className="hidden lg:block w-72 shrink-0 sticky top-28">
                        <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 shadow-none">
                            {renderFilterContent()}
                        </div>
                    </aside>

                    {/* ======================================================== */}
                    {/* RIGHT AREA: CATALOG TOOLBAR & PRODUCT GRID */}
                    {/* ======================================================== */}
                    <main className="flex-1 min-w-0 w-full space-y-6">

                        {/* Top Toolbar (Count on Left, Filter Icon + Sort on Right) */}
                        <div className="flex items-center justify-between gap-2 sm:gap-4 pb-3.5 sm:pb-4 border-b border-border/80">
                            {/* Product Count */}
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
                                    {isEn ? (
                                        <>Showing <strong className="text-foreground font-bold">{filteredFragrances.length}</strong> fragrances</>
                                    ) : (
                                        <>Menampilkan <strong className="text-foreground font-bold">{filteredFragrances.length}</strong> wewangian</>
                                    )}
                                </span>
                                {isServerFiltering && (
                                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4A070B]/10 text-[#4A070B] dark:text-[#E8D0BA] animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#4A070B] dark:bg-[#E8D0BA] animate-ping" />
                                        {isEn ? 'Filtering...' : 'Menyaring...'}
                                    </span>
                                )}
                            </div>

                            {/* Right: Filter Icon Button & Sort Dropdown side by side */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                {/* Mobile Filter Button Trigger: JUST ICON */}
                                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            aria-label={isEn ? 'Filter Fragrances' : 'Filter Wewangian'}
                                            className="lg:hidden relative h-8 w-8 sm:h-8.5 sm:w-8.5 border-[#4A070B]/30 text-[#4A070B] hover:bg-[#4A070B]/10 rounded-md shadow-none cursor-pointer shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                            </svg>
                                            {activeFiltersCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4A070B] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background">
                                                    {activeFiltersCount}
                                                </span>
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" showCloseButton={false} className="w-[300px] sm:w-[360px] px-6 pb-6 pt-12 sm:pt-8 pt-[max(env(safe-area-inset-top),2.75rem)] overflow-y-auto">
                                        {renderFilterContent()}
                                        <div className="pt-6 sticky bottom-0 bg-background pb-2">
                                            <Button
                                                onClick={() => setMobileFilterOpen(false)}
                                                className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-md text-xs font-semibold h-10 shadow-none cursor-pointer"
                                            >
                                                {isEn ? 'Apply Filters' : 'Terapkan Filter'}
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>

                                {/* Sort Selector: Next to Filter Button */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground shrink-0 hidden md:inline">
                                        {isEn ? 'Sort by:' : 'Urutkan:'}
                                    </span>
                                    <Select
                                        value={sortBy}
                                        onValueChange={(val: string) => setSortBy(val as any)}
                                    >
                                        <SelectTrigger className="w-[145px] sm:w-[180px] h-8 sm:h-8.5 text-[11px] sm:text-xs border-border/80 bg-background/80 hover:border-[#4A070B]/40 focus:border-[#4A070B] focus:ring-1 focus:ring-[#4A070B]/25 rounded-md shadow-none">
                                            <SelectValue placeholder={isEn ? 'Select Sort' : 'Pilih Urutan'} />
                                        </SelectTrigger>
                                        <SelectContent align="end" className="rounded-md border-border/80 bg-background shadow-md">
                                            <SelectItem value="featured">{isEn ? 'Featured' : 'Unggulan'}</SelectItem>
                                            <SelectItem value="popular">{isEn ? 'Most Popular' : 'Paling Populer'}</SelectItem>
                                            <SelectItem value="price-asc">{isEn ? 'Price: Low to High' : 'Harga: Rendah ke Tinggi'}</SelectItem>
                                            <SelectItem value="price-desc">{isEn ? 'Price: High to Low' : 'Harga: Tinggi ke Rendah'}</SelectItem>
                                            <SelectItem value="rating">{isEn ? 'Highest Rated' : 'Rating Terbaik'}</SelectItem>
                                            <SelectItem value="discount">{isEn ? 'Biggest Discount' : 'Diskon Terbesar'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Active Filter Badges Strip */}
                        {activeFiltersCount > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] text-muted-foreground mr-1">
                                    {isEn ? 'Active filters:' : 'Filter aktif:'}
                                </span>

                                {activeCategory !== 'All' && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setActiveCategory('All')}
                                    >
                                        <span>{formatCategoryName(activeCategory, isEn)}</span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {activeBrand !== 'All' && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setActiveBrand('All')}
                                    >
                                        <span>Brand: {activeBrand}</span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {priceTier !== 'all' && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => {
                                            setPriceTier('all');
                                            setCustomMin('');
                                            setCustomMax('');
                                        }}
                                    >
                                        <span>
                                            {priceTier === 'under-1500' && (isEn ? '< IDR 1.5M' : '< Rp 1.5jt')}
                                            {priceTier === '1500-2500' && (isEn ? 'IDR 1.5M - 2.5M' : 'Rp 1.5jt - 2.5jt')}
                                            {priceTier === 'above-2500' && (isEn ? '> IDR 2.5M' : '> Rp 2.5jt')}
                                            {priceTier === 'custom' && (isEn ? `IDR ${customMin || 0} - ${customMax || '∞'}` : `Rp ${customMin || 0} - ${customMax || '∞'}`)}
                                        </span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {minRating > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setMinRating(0)}
                                    >
                                        <span>★ {minRating}+</span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {searchQuery && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <span>&ldquo;{searchQuery}&rdquo;</span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {onlyDiscount && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setOnlyDiscount(false)}
                                    >
                                        <span>🏷️ {isEn ? 'Discount Promo' : 'Promo Diskon'}</span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                <button
                                    type="button"
                                    onClick={handleShareOrCopyUrl}
                                    title={isEn ? 'Share or copy current filter URL' : 'Bagikan atau salin URL filter saat ini'}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#4A070B]/10 text-[#4A070B] hover:bg-[#4A070B]/15 border border-[#4A070B]/25 transition cursor-pointer ml-1 shadow-none"
                                >
                                    {copiedUrl ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-emerald-700 font-bold">{isEn ? 'Copied!' : 'Tersalin!'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5 text-[#4A070B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            <span>{isEn ? 'Copy Filter Link' : 'Salin Tautan Filter'}</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetAllFilters}
                                    className="text-[11px] text-muted-foreground hover:text-foreground font-medium ml-1 cursor-pointer"
                                >
                                    {isEn ? 'Clear All' : 'Hapus Semua'}
                                </button>
                            </div>
                        )}

                        {/* ======================================================== */}
                        {/* PRODUCT GRID OR SKELETON OR EMPTY STATE */}
                        {/* ======================================================== */}
                        {(!fragrances || (fragrances.length === 0 && totalCount === undefined)) ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                    <ProductCardSkeleton key={n} />
                                ))}
                            </div>
                        ) : filteredFragrances.length === 0 ? (
                            <div className="py-16 px-6 text-center space-y-4">
                                <div className="w-14 h-14 rounded-full bg-[#4A070B]/10 text-[#4A070B] flex items-center justify-center mx-auto">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold text-foreground">
                                    {isEn ? 'No Matching Fragrances Found' : 'Tidak Ada Wewangian yang Cocok'}
                                </h3>
                                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                                    {isEn
                                        ? 'Your selected filters or search keywords did not match any fragrances. Please adjust your criteria or reset the filters.'
                                        : 'Filter atau kata kunci yang Anda pilih saat ini tidak menghasilkan wewangian yang sesuai. Silakan sesuaikan kriteria atau bersihkan filter.'}
                                </p>
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={resetAllFilters}
                                        className="rounded-md text-xs border-[#4A070B]/40 text-[#4A070B] hover:bg-[#4A070B]/10 shadow-none cursor-pointer"
                                    >
                                        {isEn ? 'Reset All Filters' : 'Reset Semua Filter'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 transition-opacity duration-200 ${isServerFiltering ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                {filteredFragrances.map((perfume) => (
                                    <ProductCard
                                        key={perfume.id}
                                        product={perfume}
                                        isWishlisted={wishlist.includes(perfume.id)}
                                        onToggleWishlist={toggleWishlist}
                                        onQuickView={(p) => setSelectedBottle(perfume)}
                                        onAddToCart={(p) => handleAddToBag(perfume)}
                                        className="transition-all duration-300 hover:-translate-y-1"
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* UNIFIED QUICK VIEW MODAL */}
            <ProductQuickViewModal
                product={selectedBottle}
                open={!!selectedBottle}
                onOpenChange={(open) => !open && setSelectedBottle(null)}
                onAddToCart={(prod, qty) => {
                    if (isAdmin) return;
                    if (!user) {
                        router.visit(
                            '/login?notice=' +
                                encodeURIComponent(
                                    isEn
                                        ? 'Please log in to add products to your shopping bag.'
                                        : 'Silakan masuk untuk menambahkan produk ke keranjang belanja.'
                                )
                        );
                        return;
                    }
                    router.post(
                        '/cart',
                        {
                            product_id: prod.id,
                            quantity: qty,
                            volume: prod.volume || '50ml',
                        },
                        {
                            preserveScroll: true,
                        }
                    );
                }}
            />
        </Layout>
    );
}
