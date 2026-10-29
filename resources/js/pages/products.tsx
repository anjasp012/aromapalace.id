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
    volume: string | number;
    concentration: string;
    price: string;
    originalPrice?: string;
    discountBadge?: string;
    isNew?: boolean;
    isPopular?: boolean;
    is_new_arrivals?: boolean;
    is_best_sellers?: boolean;
    is_special_offers?: boolean;
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

export interface CategoryItem {
    id: number;
    name: string;
    name_en?: string;
    slug: string;
}

export interface BrandItem {
    id: number;
    name: string;
    slug: string;
}

interface ProductsProps {
    fragrances: Fragrance[];
    categories: string[];
    brands?: string[];
    brandItems?: BrandItem[];
    genders?: string[];
    genderItems?: CategoryItem[];
    concentrations?: string[];
    concentrationItems?: CategoryItem[];
    scents?: string[];
    scentItems?: CategoryItem[];
    selectedCategory?: string;
    selectedBrand?: string;
    selectedGender?: string;
    selectedConcentration?: string;
    selectedScent?: string;
    filters?: {
        searchQuery?: string;
        activeCategory?: string;
        activeBrand?: string;
        activeGender?: string;
        activeConcentration?: string;
        activeScent?: string;
        priceTier?: string;
        customMin?: string;
        customMax?: string;
        minRating?: number;
        onlyDiscount?: boolean;
        sortBy?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | string;
        tag?: string;
    };
    totalCount?: number;
}

const PRICE_TIERS = [
    { label: '< 500rb', labelEn: '< 500k', value: 'under-500' },
    { label: '500rb - 1jt', labelEn: '500k - 1M', value: '500-1000' },
    { label: '> 1jt', labelEn: '> 1M', value: 'above-1000' },
    { label: 'Custom', labelEn: 'Custom', value: 'custom' },
];

interface ParsedFilters {
    searchQuery: string;
    activeCategory: string;
    activeBrand: string;
    activeGender: string;
    activeConcentration: string;
    activeScent: string;
    priceTier: string;
    customMin: string;
    customMax: string;
    minRating: number;
    onlyDiscount: boolean;
    sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | string;
}

const normalizeSlug = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function parseFiltersFromUrl(
    searchString: string,
    categories: string[] = [],
    brands: string[] = [],
    genders: (CategoryItem | string)[] = [],
    concentrations: (CategoryItem | string)[] = [],
    scents: (CategoryItem | string)[] = [],
    defaultCategory = 'All',
    defaultBrand = 'All',
    defaultGender = 'All',
    defaultConcentration = 'All',
    defaultScent = 'All'
): ParsedFilters {
    const searchParams = new URLSearchParams(
        searchString.startsWith('?') ? searchString.slice(1) : searchString
    );

    // 1. Text Search Query
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const searchQuery = search;

    const matchOption = (val: string | null, list: (CategoryItem | string)[]): string => {
        if (!val || val === 'All') return 'All';
        const rawSlug = normalizeSlug(val);
        for (const item of list) {
            const name = typeof item === 'string' ? item : item.name;
            const nameEn = typeof item === 'string' ? '' : (item.name_en || '');
            const slug = typeof item === 'string' ? normalizeSlug(item) : item.slug;
            if (
                name.toLowerCase() === val.toLowerCase() ||
                slug === rawSlug ||
                (nameEn && nameEn.toLowerCase() === val.toLowerCase()) ||
                (nameEn && normalizeSlug(nameEn) === rawSlug)
            ) {
                return name;
            }
        }
        return val;
    };

    // 2. Brand
    const rawBrand = searchParams.get('brand');
    const activeBrand = rawBrand ? matchOption(rawBrand, brands) : defaultBrand;

    // 3. Gender
    const rawGender = searchParams.get('gender');
    let activeGender = rawGender ? matchOption(rawGender, genders) : defaultGender;

    // 4. Concentration
    const rawConc = searchParams.get('concentration');
    let activeConcentration = rawConc ? matchOption(rawConc, concentrations) : defaultConcentration;

    // 5. Scent Profile
    const rawScent = searchParams.get('scent') || searchParams.get('scent_profile');
    let activeScent = rawScent ? matchOption(rawScent, scents) : defaultScent;

    // 6. Generic Category (backwards compatibility)
    let activeCategory = defaultCategory;
    const rawCategory = searchParams.get('category') || searchParams.get('family');
    if (rawCategory && rawCategory !== 'All') {
        const matchedGender = matchOption(rawCategory, genders);
        if (matchedGender !== 'All' && activeGender === 'All') {
            activeGender = matchedGender;
        }
        const matchedConc = matchOption(rawCategory, concentrations);
        if (matchedConc !== 'All' && activeConcentration === 'All') {
            activeConcentration = matchedConc;
        }
        const matchedScent = matchOption(rawCategory, scents);
        if (matchedScent !== 'All' && activeScent === 'All') {
            activeScent = matchedScent;
        }
        activeCategory = matchOption(rawCategory, categories);
    }

    // 7. Price Tier & Custom Min/Max
    let priceTier = 'all';
    const rawPrice = searchParams.get('price') || searchParams.get('tier');
    if (rawPrice && ['under-500', '500-1000', 'above-1000', 'under-1500', '1500-2500', 'above-2500', 'custom'].includes(rawPrice)) {
        priceTier = rawPrice;
    }

    const customMin = searchParams.get('min_price') || searchParams.get('min') || '';
    const customMax = searchParams.get('max_price') || searchParams.get('max') || '';
    if ((customMin || customMax) && priceTier === 'all') {
        priceTier = 'custom';
    }

    // 8. Min Rating
    const rawRating = searchParams.get('rating') || searchParams.get('min_rating');
    let minRating = 0;
    if (rawRating) {
        const parsed = parseFloat(rawRating);
        if (!isNaN(parsed) && parsed > 0) minRating = parsed;
    }

    // 9. Discount / Promo Filter
    const onlyDiscount = searchParams.get('discount') === '1' || searchParams.get('discount') === 'true' || searchParams.get('promo') === '1';

    // 10. Sort By (Harga Terendah, Harga Tertinggi, Nama A - Z, Nama Z - A)
    let sortBy: string = 'price-asc';
    const rawSort = searchParams.get('sort') || searchParams.get('sortBy');
    if (rawSort && ['price-asc', 'price-desc', 'name-asc', 'name-desc', 'featured', 'popular', 'rating', 'discount'].includes(rawSort)) {
        sortBy = rawSort === 'featured' ? 'price-asc' : rawSort;
    }

    return {
        searchQuery,
        activeCategory,
        activeBrand,
        activeGender,
        activeConcentration,
        activeScent,
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
    activeGender: string;
    activeConcentration: string;
    activeScent: string;
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
    if (filters.activeBrand && filters.activeBrand !== 'All') {
        params.set('brand', filters.activeBrand);
    }
    if (filters.activeGender && filters.activeGender !== 'All') {
        params.set('gender', filters.activeGender);
    }
    if (filters.activeConcentration && filters.activeConcentration !== 'All') {
        params.set('concentration', filters.activeConcentration);
    }
    if (filters.activeScent && filters.activeScent !== 'All') {
        params.set('scent', filters.activeScent);
    }
    if (filters.activeCategory && filters.activeCategory !== 'All' && filters.activeGender === 'All' && filters.activeConcentration === 'All' && filters.activeScent === 'All') {
        params.set('category', filters.activeCategory);
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
    brandItems: serverBrandItems = [],
    genders: serverGenders = [],
    genderItems: serverGenderItems = [],
    concentrations: serverConcentrations = [],
    concentrationItems: serverConcentrationItems = [],
    scents: serverScents = [],
    scentItems: serverScentItems = [],
    selectedCategory = 'All',
    selectedBrand = 'All',
    selectedGender = 'All',
    selectedConcentration = 'All',
    selectedScent = 'All',
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

    const availableGenders = useMemo<CategoryItem[]>(() => {
        if (serverGenderItems && serverGenderItems.length > 0) return serverGenderItems;
        if (serverGenders && serverGenders.length > 0) {
            return serverGenders.filter((g) => g !== 'All').map((g, i) => ({ id: i + 1, name: g, name_en: g, slug: normalizeSlug(g) }));
        }
        return [
            { id: 1, name: 'Parfum Pria', name_en: "Men's Perfume", slug: 'parfum-pria' },
            { id: 2, name: 'Parfum Wanita', name_en: "Women's Perfume", slug: 'parfum-wanita' },
            { id: 3, name: 'Unisex Fragrance', name_en: 'Unisex Fragrance', slug: 'unisex-fragrance' },
        ];
    }, [serverGenderItems, serverGenders]);

    const availableConcentrations = useMemo<CategoryItem[]>(() => {
        if (serverConcentrationItems && serverConcentrationItems.length > 0) return serverConcentrationItems;
        if (serverConcentrations && serverConcentrations.length > 0) {
            return serverConcentrations.filter((c) => c !== 'All').map((c, i) => ({ id: i + 1, name: c, name_en: c, slug: normalizeSlug(c) }));
        }
        return [
            { id: 1, name: 'Extrait de Parfum', name_en: 'Extrait de Parfum', slug: 'extrait-de-parfum' },
            { id: 2, name: 'Eau de Parfum', name_en: 'Eau de Parfum', slug: 'eau-de-parfum' },
            { id: 3, name: 'Eau de Toilette', name_en: 'Eau de Toilette', slug: 'eau-de-toilette' },
            { id: 4, name: 'Artisanal Attar', name_en: 'Artisanal Attar', slug: 'artisanal-attar' },
        ];
    }, [serverConcentrationItems, serverConcentrations]);

    const availableScents = useMemo<CategoryItem[]>(() => {
        if (serverScentItems && serverScentItems.length > 0) return serverScentItems;
        if (serverScents && serverScents.length > 0) {
            return serverScents.filter((s) => s !== 'All').map((s, i) => ({ id: i + 1, name: s, name_en: s, slug: normalizeSlug(s) }));
        }
        return [
            { id: 1, name: 'Woody & Smoky', name_en: 'Woody & Smoky', slug: 'woody-smoky' },
            { id: 2, name: 'Floral Oriental', name_en: 'Floral Oriental', slug: 'floral-oriental' },
            { id: 3, name: 'Fresh Citrus & Marine', name_en: 'Fresh Citrus & Marine', slug: 'fresh-citrus-marine' },
            { id: 4, name: 'Gourmand & Vanilla', name_en: 'Gourmand & Vanilla', slug: 'gourmand-vanilla' },
        ];
    }, [serverScentItems, serverScents]);

    const getCategoryItemLabel = (item: { name: string; name_en?: string }) => {
        if (isEn && item.name_en && item.name_en.trim() !== '') {
            return item.name_en;
        }
        return formatCategoryName(item.name, isEn);
    };

    // 1. Initialize Filter States from serverFilters or URL Query
    const initialFilters = useMemo(() => {
        if (serverFilters) {
            return {
                searchQuery: serverFilters.searchQuery || '',
                activeCategory: serverFilters.activeCategory || selectedCategory || 'All',
                activeBrand: serverFilters.activeBrand || selectedBrand || 'All',
                activeGender: serverFilters.activeGender || selectedGender || 'All',
                activeConcentration: serverFilters.activeConcentration || selectedConcentration || 'All',
                activeScent: serverFilters.activeScent || selectedScent || 'All',
                priceTier: serverFilters.priceTier || 'all',
                customMin: serverFilters.customMin || '',
                customMax: serverFilters.customMax || '',
                minRating: serverFilters.minRating || 0,
                onlyDiscount: serverFilters.onlyDiscount ?? false,
                sortBy: serverFilters.sortBy && serverFilters.sortBy !== 'featured' ? serverFilters.sortBy : 'price-asc',
            };
        }
        const searchStr = typeof window !== 'undefined'
            ? window.location.search
            : (url && url.includes('?') ? url.slice(url.indexOf('?')) : '');
        return parseFiltersFromUrl(
            searchStr,
            categories,
            availableBrands,
            availableGenders,
            availableConcentrations,
            availableScents,
            selectedCategory,
            selectedBrand,
            selectedGender,
            selectedConcentration,
            selectedScent
        );
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
    const [activeCategory, setActiveCategory] = useState(initialFilters.activeCategory);
    const [activeBrand, setActiveBrand] = useState(initialFilters.activeBrand);
    const [activeGender, setActiveGender] = useState(initialFilters.activeGender);
    const [activeConcentration, setActiveConcentration] = useState(initialFilters.activeConcentration);
    const [activeScent, setActiveScent] = useState(initialFilters.activeScent);
    const [priceTier, setPriceTier] = useState(initialFilters.priceTier);
    const [customMin, setCustomMin] = useState(initialFilters.customMin);
    const [customMax, setCustomMax] = useState(initialFilters.customMax);
    const [minRating, setMinRating] = useState<number>(initialFilters.minRating);
    const [onlyDiscount, setOnlyDiscount] = useState<boolean>(initialFilters.onlyDiscount);
    const [sortBy, setSortBy] = useState<string>(initialFilters.sortBy || 'price-asc');
    const [isServerFiltering, setIsServerFiltering] = useState(false);

    // Derived Brands Partitioning (Primary Pills + Dropdown for Other Brands)
    const nonAllBrands = useMemo(() => availableBrands.filter((b) => b !== 'All'), [availableBrands]);

    const primaryBrands = useMemo(() => {
        const preferred = ['Aroma Royale', 'Maison Floral', 'Capri Fragranze', 'Artisanal Niche'];
        const matched = preferred.filter((p) => nonAllBrands.some((b) => b === p || normalizeSlug(b) === normalizeSlug(p)));
        const remaining = nonAllBrands.filter((b) => !matched.some((p) => p === b || normalizeSlug(p) === normalizeSlug(b)));
        return [...matched, ...remaining].slice(0, 4);
    }, [nonAllBrands]);

    const otherBrands = useMemo(() => {
        return nonAllBrands.filter((b) => !primaryBrands.some((p) => p === b || normalizeSlug(p) === normalizeSlug(b)));
    }, [nonAllBrands, primaryBrands]);

    const isOtherBrandSelected = Boolean(
        activeBrand !== 'All' && otherBrands.some((b) => b === activeBrand || normalizeSlug(b) === normalizeSlug(activeBrand))
    );

    // 2. Mobile Drawer & Desktop Filter Sidebar Visibility State
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [showDesktopFilter, setShowDesktopFilter] = useState(true);

    // 3. Modals, Wishlist & Copy State
    const [selectedBottle, setSelectedBottle] = useState<Fragrance | null>(null);
    const [wishlist, setWishlist] = useState<number[]>(props?.auth?.wishlist_ids ?? []);
    const [copiedUrl, setCopiedUrl] = useState(false);

    useEffect(() => {
        if (props?.auth?.wishlist_ids) {
            setWishlist(props.auth.wishlist_ids);
        }
    }, [props?.auth?.wishlist_ids]);

    // Detect initial active tag / collection from serverFilters or URL query
    const initialTag = useMemo(() => {
        if (serverFilters?.tag) return serverFilters.tag;
        const searchStr = typeof window !== 'undefined'
            ? window.location.search
            : (url && url.includes('?') ? url.slice(url.indexOf('?')) : '');
        const params = new URLSearchParams(searchStr);
        const tagParam = params.get('tag') || params.get('collection');
        if (tagParam) return tagParam;
        if (params.get('new_arrivals') || params.get('is_new_arrivals') || url.includes('new-arrivals') || url.includes('new_arrivals')) return 'new-arrivals';
        if (params.get('best_sellers') || params.get('is_best_sellers') || url.includes('best-sellers') || url.includes('best_sellers')) return 'best-sellers';
        if (params.get('special_offers') || params.get('is_special_offers') || url.includes('special-offers') || url.includes('special_offers')) return 'special-offers';
        return null;
    }, []);

    const [activeTag, setActiveTag] = useState<string | null>(initialTag);

    // Distinct Jumbotron Header Configuration based on tag / collection
    const jumbotronConfig = useMemo(() => {
        if (activeTag === 'new-arrivals' || activeTag === 'new_arrivals') {
            return {
                headTitle: isEn ? 'New Arrivals' : 'Koleksi Terbaru',
                titleClassName: 'font-black text-3xl sm:text-4xl lg:text-5xl tracking-[0.08em]',
                title: isEn ? (
                    <span>
                        <span className="text-[1.22em]">N</span>EW{' '}
                        <span className="text-[1.22em]">A</span>RRIVALS
                    </span>
                ) : (
                    <span>
                        <span className="text-[1.22em]">K</span>OLEKSI{' '}
                        <span className="text-[1.22em]">T</span>ERBARU
                    </span>
                ),
                subtitle1: isEn ? 'DISCOVER OUR LATEST ARRIVALS' : 'JELAJAHI KOLEKSI TERBARU KAMI',
                subtitle2: isEn ? (
                    <>
                        EXCEPTIONAL FRAGRANCES CURATED<br />
                        FOR THE TRUE FRAGRANCE LOVERS
                    </>
                ) : (
                    <>
                        WEWANGIAN ISTIMEWA YANG DIKURASI<br />
                        UNTUK PARA PECINTA PARFUM SEJATI
                    </>
                ),
            };
        }

        if (activeTag === 'best-sellers' || activeTag === 'best_sellers') {
            return {
                headTitle: isEn ? 'Best Sellers' : 'Produk Terlaris',
                titleClassName: 'font-black text-3xl sm:text-4xl lg:text-5xl tracking-[0.08em]',
                title: isEn ? (
                    <span>
                        <span className="text-[1.22em]">B</span>EST{' '}
                        <span className="text-[1.22em]">S</span>ELLERS
                    </span>
                ) : (
                    <span>
                        <span className="text-[1.22em]">P</span>RODUK{' '}
                        <span className="text-[1.22em]">T</span>ERLARIS
                    </span>
                ),
                subtitle1: isEn ? 'DISCOVER OUR MOST LOVED FRAGRANCES' : 'TEMUKAN WEWANGIAN PALING DICINTAI',
                subtitle2: isEn ? (
                    <>
                        HANDPICKED FAVOURITES, CHOSEN BY<br />
                        OUR CUSTOMERS, TIME AND TIME AGAIN.
                    </>
                ) : (
                    <>
                        PILIHAN FAVORIT TERBAIK, DIPILIH OLEH<br />
                        PELANGGAN KAMI, DARI WAKTU KE WAKTU.
                    </>
                ),
            };
        }

        if (activeTag === 'special-offers' || activeTag === 'special_offers' || onlyDiscount) {
            return {
                headTitle: isEn ? 'Special Offers' : 'Penawaran Spesial',
                titleClassName: 'font-black text-3xl sm:text-4xl lg:text-5xl tracking-[0.06em]',
                title: isEn ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-3.5 leading-[0.92] sm:leading-normal">
                        <span className="inline-block">
                            <span className="text-[1.24em]">S</span>PECIAL
                        </span>
                        <span className="inline-block -mt-1 sm:mt-0">
                            <span className="text-[1.24em]">O</span>FFERS
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-3.5 leading-[0.92] sm:leading-normal">
                        <span className="inline-block">
                            <span className="text-[1.24em]">P</span>ENAWARAN
                        </span>
                        <span className="inline-block -mt-1 sm:mt-0">
                            <span className="text-[1.24em]">S</span>PESIAL
                        </span>
                    </div>
                ),
                subtitle1: isEn ? 'EXCLUSIVE DEALS ON YOUR FAVOURITE FRAGRANCES.' : 'PENAWARAN EKSKLUSIF UNTUK WEWANGIAN FAVORIT ANDA.',
                subtitle2: isEn ? (
                    <>
                        LIMITED TIME ONLY,<br />
                        DON'T MISS OUT.
                    </>
                ) : (
                    <>
                        HANYA UNTUK WAKTU TERBATAS,<br />
                        JANGAN SAMPAI KETINGGALAN.
                    </>
                ),
            };
        }

        if (activeBrand && activeBrand !== 'All') {
            return {
                headTitle: activeBrand,
                titleClassName: 'font-black text-3xl sm:text-4xl lg:text-5xl tracking-[0.08em]',
                title: (
                    <span>
                        <span className="text-[1.22em]">{activeBrand.slice(0, 1)}</span>
                        {activeBrand.slice(1).toUpperCase()}
                    </span>
                ),
                subtitle1: isEn ? `EXQUISITE CREATIONS BY ${activeBrand.toUpperCase()}` : `KOLEKSI EKSKLUSIF DARI ${activeBrand.toUpperCase()}`,
                subtitle2: isEn ? (
                    <>
                        SIGNATURE LUXURY SCENTS<br />
                        CRAFTED FOR DISTINGUISHED TASTES
                    </>
                ) : (
                    <>
                        AROMA MEWAH BERKARAKTER TINGGI<br />
                        DIRANCANG DENGAN KESEMPURNAAN KUALITAS
                    </>
                ),
            };
        }

        return {
            headTitle: isEn ? 'Catalog of Exclusive Fragrances' : 'Katalog Wewangian Eksklusif',
            titleClassName: 'font-black text-3xl sm:text-4xl lg:text-5xl tracking-[0.08em]',
            title: isEn ? (
                <span>
                    <span className="text-[1.22em]">O</span>UR{' '}
                    <span className="text-[1.22em]">C</span>OLLECTION
                </span>
            ) : (
                <span>
                    <span className="text-[1.22em]">K</span>OLEKSI{' '}
                    <span className="text-[1.22em]">K</span>AMI
                </span>
            ),
            subtitle1: isEn ? 'CURATED LUXURY PERFUME CATALOG' : 'KATALOG PARFUM MEWAH TERKURASI',
            subtitle2: isEn ? (
                <>
                    EXCEPTIONAL FRAGRANCES CURATED<br />
                    FOR THE TRUE FRAGRANCE LOVERS
                </>
            ) : (
                <>
                    PILIHAN PARFUM ARTISANAL DAN EXTRAIT MURNI<br />
                    DENGAN DAYA TAHAN DAN AROMA MEWAH MEMIKAT
                </>
            ),
        };
    }, [activeTag, activeBrand, onlyDiscount, isEn]);

    // Refs to control initial mount and track applied params to avoid redundant fetches
    const isFirstMountRef = useRef(true);
    const lastAppliedParamsRef = useRef<string>('');
    const pendingTimerRef = useRef<number | null>(null);

    // Sync state when props from Inertia navigation update (e.g. from Home, Categories, or Brands)
    useEffect(() => {
        const nextFilters = serverFilters
            ? {
                searchQuery: serverFilters.searchQuery || '',
                activeCategory: serverFilters.activeCategory || selectedCategory || 'All',
                activeBrand: serverFilters.activeBrand || selectedBrand || 'All',
                activeGender: serverFilters.activeGender || selectedGender || 'All',
                activeConcentration: serverFilters.activeConcentration || selectedConcentration || 'All',
                activeScent: serverFilters.activeScent || selectedScent || 'All',
                priceTier: serverFilters.priceTier || 'all',
                customMin: serverFilters.customMin || '',
                customMax: serverFilters.customMax || '',
                minRating: serverFilters.minRating || 0,
                onlyDiscount: serverFilters.onlyDiscount ?? false,
                sortBy: serverFilters.sortBy && serverFilters.sortBy !== 'featured' ? serverFilters.sortBy : 'price-asc',
            }
            : parseFiltersFromUrl(
                typeof window !== 'undefined' ? window.location.search : (url && url.includes('?') ? url.slice(url.indexOf('?')) : ''),
                categories,
                availableBrands,
                availableGenders,
                availableConcentrations,
                availableScents,
                selectedCategory,
                selectedBrand,
                selectedGender,
                selectedConcentration,
                selectedScent
            );

        setSearchQuery(nextFilters.searchQuery);
        setActiveBrand(nextFilters.activeBrand);
        setActiveGender(nextFilters.activeGender);
        setActiveConcentration(nextFilters.activeConcentration);
        setActiveScent(nextFilters.activeScent);
        setActiveCategory(nextFilters.activeCategory);
        setPriceTier(nextFilters.priceTier);
        setCustomMin(nextFilters.customMin);
        setCustomMax(nextFilters.customMax);
        setMinRating(nextFilters.minRating);
        setOnlyDiscount(nextFilters.onlyDiscount);
        setSortBy(nextFilters.sortBy);

        // Check incoming tag from serverFilters or URL navigation
        const searchStr = typeof window !== 'undefined' ? window.location.search : (url && url.includes('?') ? url.slice(url.indexOf('?')) : '');
        const urlParams = new URLSearchParams(searchStr);
        const incomingTag = serverFilters?.tag || urlParams.get('tag') || urlParams.get('collection') || (
            (urlParams.get('new_arrivals') || urlParams.get('is_new_arrivals') || url.includes('new-arrivals') || url.includes('new_arrivals')) ? 'new-arrivals' :
            (urlParams.get('best_sellers') || urlParams.get('is_best_sellers') || url.includes('best-sellers') || url.includes('best_sellers')) ? 'best-sellers' :
            (urlParams.get('special_offers') || urlParams.get('is_special_offers') || url.includes('special-offers') || url.includes('special_offers')) ? 'special-offers' :
            null
        );

        let resolvedTag = activeTag;
        if (incomingTag) {
            resolvedTag = incomingTag;
            setActiveTag(incomingTag);
        } else if (url === '/products' || url === '/products/') {
            resolvedTag = null;
            setActiveTag(null);
        }

        const currentParams: Record<string, string> = {};
        if (nextFilters.searchQuery.trim()) currentParams.search = nextFilters.searchQuery.trim();
        if (nextFilters.activeBrand && nextFilters.activeBrand !== 'All') currentParams.brand = nextFilters.activeBrand;
        if (nextFilters.activeGender && nextFilters.activeGender !== 'All') currentParams.gender = nextFilters.activeGender;
        if (nextFilters.activeConcentration && nextFilters.activeConcentration !== 'All') currentParams.concentration = nextFilters.activeConcentration;
        if (nextFilters.activeScent && nextFilters.activeScent !== 'All') currentParams.scent = nextFilters.activeScent;
        if (nextFilters.priceTier && nextFilters.priceTier !== 'all' && nextFilters.priceTier !== 'custom') currentParams.price = nextFilters.priceTier;
        if (nextFilters.customMin.trim()) currentParams.min_price = nextFilters.customMin.trim();
        if (nextFilters.customMax.trim()) currentParams.max_price = nextFilters.customMax.trim();
        if (nextFilters.minRating > 0) currentParams.rating = nextFilters.minRating.toString();
        if (nextFilters.onlyDiscount) currentParams.discount = '1';
        if (nextFilters.sortBy) currentParams.sort = nextFilters.sortBy;
        if (resolvedTag) currentParams.tag = resolvedTag;

        lastAppliedParamsRef.current = JSON.stringify(currentParams);
    }, [serverFilters, selectedCategory, selectedBrand, selectedGender, selectedConcentration, selectedScent, url]);

    // Send server-side filter request when filter/sort state changes (debounced 150ms)
    useEffect(() => {
        const params: Record<string, string> = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (activeBrand && activeBrand !== 'All') params.brand = activeBrand;
        if (activeGender && activeGender !== 'All') params.gender = activeGender;
        if (activeConcentration && activeConcentration !== 'All') params.concentration = activeConcentration;
        if (activeScent && activeScent !== 'All') params.scent = activeScent;
        if (priceTier && priceTier !== 'all' && priceTier !== 'custom') params.price = priceTier;
        if (customMin.trim()) params.min_price = customMin.trim();
        if (customMax.trim()) params.max_price = customMax.trim();
        if (minRating > 0) params.rating = minRating.toString();
        if (onlyDiscount) params.discount = '1';
        if (sortBy) params.sort = sortBy;
        if (activeTag) params.tag = activeTag;

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
                only: [
                    'fragrances',
                    'filters',
                    'selectedCategory',
                    'selectedBrand',
                    'selectedGender',
                    'selectedConcentration',
                    'selectedScent',
                ],
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
        activeBrand,
        activeGender,
        activeConcentration,
        activeScent,
        priceTier,
        customMin,
        customMax,
        minRating,
        onlyDiscount,
        sortBy,
        activeTag,
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
                volume: item.volume || 50,
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

    // Count active filters (Pencarian, Brand, Gender, Konsentrasi, Scent Profile, Rentang Harga, Rating, Diskon)
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim()) count++;
        if (activeBrand !== 'All') count++;
        if (activeGender !== 'All') count++;
        if (activeConcentration !== 'All') count++;
        if (activeScent !== 'All') count++;
        if (priceTier !== 'all' || customMin || customMax) count++;
        if (minRating > 0) count++;
        if (onlyDiscount) count++;
        return count;
    }, [
        searchQuery,
        activeBrand,
        activeGender,
        activeConcentration,
        activeScent,
        priceTier,
        customMin,
        customMax,
        minRating,
        onlyDiscount,
    ]);

    // Reset all filters and clear URL query string via server-side reload while preserving activeTag
    const resetAllFilters = () => {
        setSearchQuery('');
        setActiveBrand('All');
        setActiveGender('All');
        setActiveConcentration('All');
        setActiveScent('All');
        setActiveCategory('All');
        setPriceTier('all');
        setCustomMin('');
        setCustomMax('');
        setMinRating(0);
        setOnlyDiscount(false);
        setSortBy('price-asc');

        const resetParams: Record<string, string> = {};
        if (activeTag) {
            resetParams.tag = activeTag;
        }

        lastAppliedParamsRef.current = JSON.stringify(resetParams);
        setIsServerFiltering(true);
        router.get('/products', resetParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: [
                'fragrances',
                'filters',
                'selectedCategory',
                'selectedBrand',
                'selectedGender',
                'selectedConcentration',
                'selectedScent',
            ],
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
                    <span>{isEn ? 'FILTERS' : 'FILTER'}</span>
                </div>
                {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={resetAllFilters}
                            className="text-[11px] text-[#4A070B] dark:text-[#E8D0BA] hover:underline font-medium cursor-pointer"
                        >
                            {isEn ? 'Reset' : 'Reset'}
                        </button>
                        <span className="w-5 h-5 rounded-full bg-[#4A070B]/10 text-[#4A070B] border border-[#4A070B]/30 text-[10px] font-bold flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    </div>
                )}
            </div>

            {/* Quick Search */}
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

            {/* 1. BRANDS */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'BRANDS' : 'BRAND'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {/* All Brands */}
                    <button
                        type="button"
                        onClick={() => setActiveBrand('All')}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${activeBrand === 'All'
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        {isEn ? 'All Brands' : 'Semua Brand'}
                    </button>

                    {/* Primary Brands */}
                    {primaryBrands.map((b) => {
                        const isSelected = activeBrand === b || (b !== 'All' && normalizeSlug(activeBrand) === normalizeSlug(b));
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

                    {/* Other Brands Dropdown */}
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
                                        <span>{isEn ? 'All Brands' : 'Semua Brand'}</span>
                                    </DropdownMenuItem>
                                )}
                                {otherBrands.map((b) => {
                                    const isSelected = activeBrand === b || (b !== 'All' && normalizeSlug(activeBrand) === normalizeSlug(b));
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

            {/* 2. GENDER */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'GENDER' : 'GENDER'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveGender('All')}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${activeGender === 'All'
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        {isEn ? 'All Genders' : 'Semua Gender'}
                    </button>
                    {availableGenders.map((g) => {
                        const isSelected = activeGender === g.slug || activeGender === g.name || normalizeSlug(activeGender) === normalizeSlug(g.slug);
                        return (
                            <button
                                key={g.slug || g.name}
                                type="button"
                                onClick={() => setActiveGender(isSelected ? 'All' : g.slug)}
                                className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${isSelected
                                    ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                                    : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {getCategoryItemLabel(g)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. CONCENTRATION */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'CONCENTRATION' : 'KONSENTRASI'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveConcentration('All')}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${activeConcentration === 'All'
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        {isEn ? 'All Concentrations' : 'Semua Konsentrasi'}
                    </button>
                    {availableConcentrations.map((c) => {
                        const isSelected = activeConcentration === c.slug || activeConcentration === c.name || normalizeSlug(activeConcentration) === normalizeSlug(c.slug);
                        return (
                            <button
                                key={c.slug || c.name}
                                type="button"
                                onClick={() => setActiveConcentration(isSelected ? 'All' : c.slug)}
                                className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${isSelected
                                    ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                                    : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {getCategoryItemLabel(c)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. SCENT PROFILE */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'SCENT PROFILE' : 'PROFIL AROMA'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveScent('All')}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${activeScent === 'All'
                            ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                            : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                            }`}
                    >
                        {isEn ? 'All Scents' : 'Semua Profil'}
                    </button>
                    {availableScents.map((s) => {
                        const isSelected = activeScent === s.slug || activeScent === s.name || normalizeSlug(activeScent) === normalizeSlug(s.slug);
                        return (
                            <button
                                key={s.slug || s.name}
                                type="button"
                                onClick={() => setActiveScent(isSelected ? 'All' : s.slug)}
                                className={`px-2.5 py-1.5 rounded-md text-[11px] transition cursor-pointer border text-center shadow-none ${isSelected
                                    ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                                    : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {getCategoryItemLabel(s)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 5. PRICE RANGE */}
            <div className="space-y-2.5 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'PRICE RANGE' : 'RENTANG HARGA'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                    {PRICE_TIERS.map((tier) => {
                        const isSelected = priceTier === tier.value;
                        return (
                            <button
                                key={tier.value}
                                type="button"
                                onClick={() => {
                                    if (isSelected && tier.value !== 'custom') {
                                        setPriceTier('all');
                                    } else {
                                        setPriceTier(tier.value);
                                        if (tier.value !== 'custom') {
                                            setCustomMin('');
                                            setCustomMax('');
                                        }
                                    }
                                }}
                                className={`px-2 py-1.5 rounded-md text-[10.5px] transition cursor-pointer border text-center shadow-none ${isSelected
                                    ? 'bg-[#4A070B]/10 text-[#4A070B] border-[#4A070B] font-bold ring-1 ring-[#4A070B]/25'
                                    : 'bg-background/80 text-muted-foreground border-border/80 hover:text-foreground hover:border-[#4A070B]/30'
                                    }`}
                            >
                                {isEn && tier.labelEn ? tier.labelEn : tier.label}
                            </button>
                        );
                    })}
                </div>

                {/* Custom Min / Max input */}
                {(priceTier === 'custom' || customMin || customMax) && (
                    <div className="pt-1.5 space-y-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
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
                )}
            </div>

            {/* 6. CUSTOMER RATING */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'CUSTOMER RATING' : 'RATING PELANGGAN'}
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
                        {isEn ? 'All' : 'Semua'}
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

            {/* 7. PROMOS/DISCOUNT */}
            <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block pt-2">
                    {isEn ? 'PROMOS / DISCOUNT' : 'PROMO & DISKON'}
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
            <Head title={`${jumbotronConfig.headTitle} • Aroma Palace`} />

            {/* LUXURY EDITORIAL JUMBOTRON HEADER */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3 sm:space-y-3.5">
                    <h1 className={`font-serif text-[#4A070B] dark:text-[#E8D0BA] uppercase select-none ${jumbotronConfig.titleClassName || 'text-3xl sm:text-4xl lg:text-5xl tracking-[0.08em] font-black'}`}>
                        {jumbotronConfig.title}
                    </h1>

                    {/* Gold Ornamental Divider */}
                    <div className="flex items-center justify-center gap-3 max-w-xs sm:max-w-sm mx-auto px-4 py-0.5">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C5A059]/50 to-[#C5A059]" />
                        <svg
                            className="w-8 h-3.5 text-[#C5A059] shrink-0"
                            viewBox="0 0 54 20"
                            fill="currentColor"
                        >
                            <path d="M27 3 L32 10 L27 17 L22 10 Z" />
                            <path d="M20 10 C17 6 12 7 8 10 C12 13 17 14 20 10 Z" fillOpacity="0.75" />
                            <path d="M34 10 C37 6 42 7 46 10 C42 13 37 14 34 10 Z" fillOpacity="0.75" />
                            <circle cx="14" cy="10" r="1.5" />
                            <circle cx="40" cy="10" r="1.5" />
                        </svg>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C5A059]/50 to-[#C5A059]" />
                    </div>

                    {/* Subtitle 1 (Spaced All-Caps Gold Bronze) */}
                    <p className="font-serif text-xs sm:text-[13px] tracking-[0.24em] font-semibold text-[#A3835B] dark:text-[#C5A059] uppercase">
                        {jumbotronConfig.subtitle1}
                    </p>

                    {/* Subtitle 2 (Curated Subtitle) */}
                    <p className="font-serif text-[11px] sm:text-xs tracking-[0.2em] font-normal text-[#A3835B]/90 dark:text-[#C5A059]/80 uppercase leading-relaxed max-w-xl mx-auto">
                        {jumbotronConfig.subtitle2}
                    </p>
                </div>
            </div>

            {/* MAIN TWO-COLUMN CONTAINER: LEFT FILTER, RIGHT PRODUCTS */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ======================================================== */}
                    {/* LEFT SIDEBAR: DESKTOP STICKY FILTER PANEL */}
                    {/* ======================================================== */}
                    {showDesktopFilter && (
                        <aside className="hidden lg:block w-72 shrink-0 sticky top-28 transition-all duration-300">
                            <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 shadow-none">
                                {renderFilterContent()}
                            </div>
                        </aside>
                    )}

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

                            {/* Right: Filter Buttons (Desktop & Mobile) & Sort Dropdown side by side */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                {/* Desktop Filter Toggle Button: JUST ICON */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowDesktopFilter((prev) => !prev)}
                                    aria-label={showDesktopFilter ? (isEn ? 'Hide Filters' : 'Sembunyikan Filter') : (isEn ? 'Show Filters' : 'Tampilkan Filter')}
                                    className={`hidden lg:flex relative h-8.5 w-8.5 border rounded-md shadow-none cursor-pointer shrink-0 transition-colors ${
                                        showDesktopFilter
                                            ? 'border-[#4A070B]/40 text-[#4A070B] bg-[#4A070B]/10 hover:bg-[#4A070B]/15 dark:text-[#E8D0BA]'
                                            : 'border-border/80 text-muted-foreground hover:border-[#4A070B]/40 hover:text-[#4A070B]'
                                    }`}
                                    title={showDesktopFilter ? (isEn ? 'Hide filter sidebar' : 'Sembunyikan filter') : (isEn ? 'Show filter sidebar' : 'Tampilkan filter')}
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
                                            <SelectItem value="price-asc">{isEn ? 'Price: Low to High' : 'Harga Terendah'}</SelectItem>
                                            <SelectItem value="price-desc">{isEn ? 'Price: High to Low' : 'Harga Tertinggi'}</SelectItem>
                                            <SelectItem value="name-asc">{isEn ? 'Name: A - Z' : 'Nama A - Z'}</SelectItem>
                                            <SelectItem value="name-desc">{isEn ? 'Name: Z - A' : 'Nama Z - A'}</SelectItem>
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

                                {activeBrand !== 'All' && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setActiveBrand('All')}
                                    >
                                        <span>Brand: {availableBrands.find((b) => b === activeBrand || (b !== 'All' && normalizeSlug(b) === normalizeSlug(activeBrand))) || activeBrand}</span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {activeGender !== 'All' && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setActiveGender('All')}
                                    >
                                        <span>
                                            {isEn ? 'Gender' : 'Gender'}: {(() => {
                                                const match = availableGenders.find((g) => g.slug === activeGender || g.name === activeGender || normalizeSlug(g.slug) === normalizeSlug(activeGender));
                                                return match ? getCategoryItemLabel(match) : activeGender;
                                            })()}
                                        </span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {activeConcentration !== 'All' && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setActiveConcentration('All')}
                                    >
                                        <span>
                                            {isEn ? 'Concentration' : 'Konsentrasi'}: {(() => {
                                                const match = availableConcentrations.find((c) => c.slug === activeConcentration || c.name === activeConcentration || normalizeSlug(c.slug) === normalizeSlug(activeConcentration));
                                                return match ? getCategoryItemLabel(match) : activeConcentration;
                                            })()}
                                        </span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {activeScent !== 'All' && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setActiveScent('All')}
                                    >
                                        <span>
                                            {isEn ? 'Scent' : 'Aroma'}: {(() => {
                                                const match = availableScents.find((s) => s.slug === activeScent || s.name === activeScent || normalizeSlug(s.slug) === normalizeSlug(activeScent));
                                                return match ? getCategoryItemLabel(match) : activeScent;
                                            })()}
                                        </span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {activeCategory !== 'All' && (
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-[11px] rounded-md px-2 py-0.5 border border-border cursor-pointer hover:bg-destructive/10"
                                        onClick={() => setActiveCategory('All')}
                                    >
                                        <span>{formatCategoryName(categories.find((c) => c === activeCategory || (c !== 'All' && normalizeSlug(c) === normalizeSlug(activeCategory))) || activeCategory, isEn)}</span>
                                        <span className="text-xs">&times;</span>
                                    </Badge>
                                )}

                                {(priceTier !== 'all' || customMin || customMax) && (
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
                                            {priceTier === 'under-500' && (isEn ? '< 500k' : '< 500rb')}
                                            {priceTier === '500-1000' && (isEn ? '500k - 1M' : '500rb - 1jt')}
                                            {priceTier === 'above-1000' && (isEn ? '> 1M' : '> 1jt')}
                                            {priceTier === 'under-1500' && (isEn ? '< 1.5M' : '< 1.5jt')}
                                            {priceTier === '1500-2500' && (isEn ? '1.5M - 2.5M' : '1.5jt - 2.5jt')}
                                            {priceTier === 'above-2500' && (isEn ? '> 2.5M' : '> 2.5jt')}
                                            {priceTier === 'custom' && (isEn ? `Custom: IDR ${customMin || 0} - ${customMax || '∞'}` : `Kustom: Rp ${customMin || 0} - ${customMax || '∞'}`)}
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
                            <div className={`grid ${showDesktopFilter ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5'} gap-4 sm:gap-6`}>
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
                            <div className={`grid ${showDesktopFilter ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5'} gap-4 sm:gap-6 transition-opacity duration-200 ${isServerFiltering ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
                            volume: prod.volume || 50,
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
