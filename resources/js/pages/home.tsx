import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import ProductCard, { type ProductItem } from '@/components/ProductCard';
import ProductQuickViewModal from '@/components/ProductQuickViewModal';
import CategoryCard, { type CategoryItem } from '@/components/CategoryCard';
import VoucherCard, { type VoucherItem } from '@/components/VoucherCard';
import ArticleCard, { type ArticleItem } from '@/components/ArticleCard';
import BrandCard, { type BrandItem } from '@/components/BrandCard';
import { useTranslation } from '@/lib/i18n';

interface HomeProps {
    popularProducts?: ProductItem[];
    discountedProducts?: ProductItem[];
    recommendedProducts?: ProductItem[];
    categories?: CategoryItem[];
    brands?: BrandItem[];
    vouchers?: VoucherItem[];
    articles?: ArticleItem[];
}

export default function Home({
    popularProducts: propPopularProducts = [],
    discountedProducts: propDiscountedProducts = [],
    recommendedProducts: propRecommendedProducts = [],
    categories: propCategories = [],
    brands: propBrands = [],
    vouchers: propVouchers = [],
    articles: propArticles = [],
}: HomeProps) {
    const { props } = usePage<any>();
    const user = props?.auth?.user;
    const isAdmin = Boolean(props?.auth?.is_admin || user?.role === 'admin');
    const { t, pickText, isEn } = useTranslation();

    const activeVouchers = propVouchers;

    // 1. Hero Carousel State (Embla with touch/swipe & autoplay)
    const banners = [
        {
            id: 1,
            title: isEn ? 'The Art of Fragrance' : 'Seni Wewangian Mahakarya',
            subtitle: isEn
                ? 'Explore our world-renowned luxury fragrance collection with artisanal scents that captivate every sense.'
                : 'Jelajahi koleksi wewangian mewah dunia dengan keharuman artisanal eksklusif yang memikat setiap indera.',
            image: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=1200&q=80',
            link: '/products',
            ambientGradient: 'from-[#FAF6F0] via-[#F4ECE1] to-[#EAE0D0] dark:from-[#21160F] dark:via-[#19110B] dark:to-[#120B07]',
        },
        {
            id: 2,
            title: isEn ? 'Flash Sale up to 20% Off' : 'Flash Sale Diskon hingga 20%',
            subtitle: isEn
                ? 'Use promo code AROMA20 for special discounts on first orders of selected extrait & niche fragrances.'
                : 'Gunakan kode promo AROMA20 untuk potongan harga spesial di pesanan pertama wewangian ekstrak & niche terpilih.',
            image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80',
            link: '/products?discount=1',
            ambientGradient: 'from-[#FDF2F3] via-[#F8E9EB] to-[#F1DEE1] dark:from-[#24080B] dark:via-[#1B0508] dark:to-[#120305]',
        },
        {
            id: 3,
            title: isEn ? 'Boutique Store Pickup Available' : 'Store Pickup Sekarang Tersedia',
            subtitle: isEn
                ? 'Order online with ease, pick up at our flagship boutiques in Grand Indonesia, Senayan City, & TP5 Surabaya.'
                : 'Pesan langsung secara online, ambil di gerai flagship Grand Indonesia, Senayan City, & TP5 Surabaya.',
            image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80',
            link: '/products',
            ambientGradient: 'from-[#FBF8F2] via-[#F6F0E4] to-[#EDE3D0] dark:from-[#1E1810] dark:via-[#16120B] dark:to-[#0F0D07]',
        },
    ];

    const [activeSlide, setActiveSlide] = useState(0);
    const [heroRef, heroApi] = useEmblaCarousel(
        { loop: true, align: 'start', duration: 25 },
        [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const onHeroSelect = useCallback(() => {
        if (!heroApi) return;
        setActiveSlide(heroApi.selectedScrollSnap());
    }, [heroApi]);

    useEffect(() => {
        if (!heroApi) return;
        heroApi.on('select', onHeroSelect);
        heroApi.on('reInit', onHeroSelect);
        return () => {
            heroApi.off('select', onHeroSelect);
            heroApi.off('reInit', onHeroSelect);
        };
    }, [heroApi, onHeroSelect]);

    // 2. Wishlist State
    const [wishlistedIds, setWishlistedIds] = useState<number[]>(props?.auth?.wishlist_ids ?? []);

    useEffect(() => {
        if (props?.auth?.wishlist_ids) {
            setWishlistedIds(props.auth.wishlist_ids);
        }
    }, [props?.auth?.wishlist_ids]);

    const toggleWishlist = (id: number, name: string) => {
        if (isAdmin) return;
        if (!user) {
            router.visit('/login?notice=' + encodeURIComponent('Silakan masuk untuk menyimpan wewangian ke wishlist Anda.'));
            return;
        }
        setWishlistedIds((prev) => {
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
                        setWishlistedIds(props.auth.wishlist_ids);
                    }
                },
            }
        );
    };

    // 3. Voucher Copied & Modal State
    const [copiedCodes, setCopiedCodes] = useState<Record<string, boolean>>({});
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);

    const handleCopyCode = (code: string) => {
        window.copyPromoCode?.(code);
        setCopiedCodes((prev) => ({ ...prev, [code]: true }));
        setTimeout(() => {
            setCopiedCodes((prev) => ({ ...prev, [code]: false }));
        }, 2500);
    };

    // 4. Quick View Product Modal State
    const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);

    const openQuickView = (product: ProductItem) => {
        setQuickViewProduct(product);
    };

    // 5. Embla Carousels for Vouchers & Discounts
    const [voucherRef, voucherApi] = useEmblaCarousel({
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree: true,
    });

    const [discountRef, discountApi] = useEmblaCarousel({
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree: true,
    });

    // Offline state & cache persistence for seamless offline experience
    const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (propPopularProducts.length > 0) {
            try {
                localStorage.setItem('aromapalace_cached_home', JSON.stringify({
                    popularProducts: propPopularProducts,
                    discountedProducts: propDiscountedProducts,
                    recommendedProducts: propRecommendedProducts,
                    categories: propCategories,
                    brands: propBrands,
                    vouchers: propVouchers,
                    articles: propArticles,
                    cachedAt: Date.now(),
                }));
            } catch (e) {}
        }
    }, [propPopularProducts, propDiscountedProducts, propRecommendedProducts, propCategories, propBrands, propVouchers, propArticles]);

    const [cachedHome] = useState<any>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem('aromapalace_cached_home');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    // Products Datasets from Database (fallback to cached data if offline / props empty)
    const popularProducts: ProductItem[] = propPopularProducts.length > 0
        ? propPopularProducts
        : (cachedHome?.popularProducts || []);
    const recommendedProducts: ProductItem[] = propRecommendedProducts.length > 0
        ? propRecommendedProducts
        : (cachedHome?.recommendedProducts?.length > 0 ? cachedHome.recommendedProducts : popularProducts);
    const discountedProducts: ProductItem[] = propDiscountedProducts.length > 0
        ? propDiscountedProducts
        : (cachedHome?.discountedProducts || []);

    const categoriesList: CategoryItem[] = propCategories.length > 0
        ? propCategories
        : (cachedHome?.categories || []);
    const brandList: BrandItem[] = propBrands.length > 0
        ? propBrands
        : (cachedHome?.brands || []);
    const activeVouchers = propVouchers.length > 0
        ? propVouchers
        : (cachedHome?.vouchers || []);
    const articlesList: ArticleItem[] = propArticles.length > 0
        ? propArticles
        : (cachedHome?.articles || []);

    return (
        <Layout>
            <Head title="Aroma Palace - Koleksi Parfum Mewah" />

            {!isOnline && (
                <div className="bg-[#4A070B] text-amber-200 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-amber-500/20">
                    <span>📶</span>
                    <span>{isEn ? 'Offline Mode • Displaying saved fragrance catalog' : 'Mode Offline • Menampilkan katalog wewangian tersimpan'}</span>
                </div>
            )}

            <div className="py-6 sm:py-10 space-y-10 sm:space-y-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-16">
                    {/* 1. HERO CAROUSEL BANNER DENGAN YOUTUBE-STYLE AMBIENT FLARE */}
                    <section className="-mx-4 sm:mx-0">
                        <Card
                            className="relative overflow-hidden border-0 sm:border sm:border-border/70 py-0 gap-0 shadow-none sm:shadow-lg rounded-none sm:rounded-2xl group transition-all duration-700 bg-transparent sm:bg-card"
                        >
                            {/* Dynamic Ambient Background Canvas (Hardware-accelerated Image Ambient Glow, no heavy color code divs) */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20">
                                {banners.map((b, idx) => (
                                    <div
                                        key={`ambient-${b.id}`}
                                        aria-hidden="true"
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSlide === idx ? 'opacity-100' : 'opacity-0'
                                            }`}
                                    >
                                        {/* Base Ambient Tint Gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${b.ambientGradient}`} />

                                        {/* Image-based Ambient Flare: gentle blurred banner image radiating into card background */}
                                        <div className="absolute -inset-10 opacity-30 sm:opacity-40 blur-2xl sm:blur-3xl saturate-150 transform-gpu pointer-events-none overflow-hidden">
                                            <img
                                                src={b.image}
                                                alt=""
                                                className="w-full h-full object-cover scale-110"
                                            />
                                        </div>

                                        {/* Soft Vignette Overlay to ensure crisp contrast on text */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-background/20 to-transparent pointer-events-none" />
                                    </div>
                                ))}
                            </div>

                            {/* Slide Content with Embla Carousel Swipe */}
                            <div ref={heroRef} className="relative z-10 overflow-hidden cursor-grab active:cursor-grabbing select-none">
                                <div className="flex">
                                    {banners.map((banner) => (
                                        <div key={banner.id} className="min-w-0 shrink-0 grow-0 basis-[88%] sm:basis-full pl-4 sm:pl-0">
                                            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                                                {/* Left Column: Content (Desktop only, hidden on mobile) */}
                                                <div className="hidden lg:flex lg:col-span-6 p-6 pb-12 sm:p-10 sm:pb-12 lg:p-14 lg:pb-14 flex-col justify-center">
                                                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
                                                        {banner.title}
                                                    </h1>
                                                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-foreground/75 leading-relaxed max-w-md">
                                                        {banner.subtitle}
                                                    </p>

                                                    {/* Action Buttons using shadcn Button */}
                                                    <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
                                                        <Button
                                                            asChild
                                                            size="default"
                                                            className="shadow-sm font-semibold hover:shadow-md transition-shadow"
                                                        >
                                                            <Link href={banner.link}>Belanja Sekarang</Link>
                                                        </Button>
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="default"
                                                            className="bg-background/60 hover:bg-background/90 backdrop-blur-xs border-border/80"
                                                        >
                                                            <Link href="/products?sort=popular">Jelajahi Koleksi</Link>
                                                        </Button>
                                                    </div>

                                                    {/* 4 Feature Points with subtle glass border */}
                                                    <div className="mt-8 sm:mt-12 pt-6 border-t border-border/70 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">Gratis Ongkir</p>
                                                            <p className="text-[11px] text-muted-foreground">Min. Rp 500rb</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">Pembayaran Aman</p>
                                                            <p className="text-[11px] text-muted-foreground">100% Terenkripsi</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">Layanan 24/7</p>
                                                            <p className="text-[11px] text-muted-foreground">Bantuan Ramah</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">Garansi Retur</p>
                                                            <p className="text-[11px] text-muted-foreground">100% Original</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: Image (Full banner on mobile, featured card on desktop) */}
                                                <div className="lg:col-span-6 relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-auto lg:h-[480px] p-0 lg:p-12 flex items-center justify-center">
                                                    <Link
                                                        href={banner.link}
                                                        className="relative w-full h-full lg:max-w-[500px] flex items-center justify-center block cursor-pointer"
                                                    >
                                                        {/* Ambient Flare behind Image (Desktop) */}
                                                        <div
                                                            aria-hidden="true"
                                                            className="hidden lg:block absolute -inset-3 sm:-inset-6 rounded-2xl overflow-hidden pointer-events-none blur-2xl sm:blur-3xl opacity-65 sm:opacity-80 scale-105 sm:scale-110 saturate-150 transform-gpu transition-all duration-700"
                                                        >
                                                            <img
                                                                src={banner.image}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        {/* Crisp Main Image Card */}
                                                        <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-border/50 lg:border lg:border-white/60 dark:lg:border-white/10 bg-background shadow-md lg:shadow-xl">
                                                            <img
                                                                src={banner.image}
                                                                alt={banner.title}
                                                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                                            />
                                                            {/* Subtle gradient vignette on image bottom */}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
                                                        </div>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Prev / Next Slide Arrows (Desktop & Interactive) */}
                            <button
                                type="button"
                                onClick={() => heroApi?.scrollPrev()}
                                aria-label="Slide Sebelumnya"
                                className="hidden lg:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 hover:bg-background text-[#4A070B] dark:text-[#E8D0BA] border border-border/70 shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => heroApi?.scrollNext()}
                                aria-label="Slide Berikutnya"
                                className="hidden lg:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 hover:bg-background text-[#4A070B] dark:text-[#E8D0BA] border border-border/70 shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Slide Indicators: Centered Floating Glass Capsule */}
                            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 px-2 py-0.5 rounded-full bg-black/25 backdrop-blur-xs border border-white/10 lg:bg-transparent lg:border-none lg:backdrop-blur-none">
                                {banners.map((b, i) => (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => heroApi?.scrollTo(i)}
                                        aria-label={`Slide ${i + 1}`}
                                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 cursor-pointer ${activeSlide === i
                                                ? 'w-6 sm:w-8 bg-white lg:bg-[#4A070B] dark:lg:bg-[#D4A373] shadow-xs'
                                                : 'w-1.5 sm:w-2 bg-white/60 lg:bg-foreground/25 hover:bg-white/80 lg:hover:bg-foreground/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </Card>
                    </section>

                    {/* 2. KATEGORI PRODUK */}
                    <section id="categories">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                <span className="font-normal">{isEn ? 'Product' : 'Kategori'}</span>{' '}
                                <span className="font-bold">{isEn ? 'Categories' : 'Produk'}</span>
                            </h2>
                            <Button asChild variant="ghost" size="sm" className="text-xs">
                                <Link href="/products">
                                    {t('common.see_all')} &rarr;
                                </Link>
                            </Button>
                        </div>

                        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 scroll-pl-4 sm:scroll-pl-0 flex sm:grid overflow-x-auto sm:overflow-visible gap-2 sm:gap-2.5 lg:gap-3 pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory sm:grid-cols-4 lg:grid-cols-9">
                            {categoriesList.map((cat, idx) => (
                                <CategoryCard
                                    key={cat.slug}
                                    category={cat}
                                    className={`w-[calc((100%-24px)/4)] sm:w-auto shrink-0 sm:shrink snap-start ${idx >= 9 ? 'sm:hidden lg:block' : ''}`}
                                />
                            ))}
                        </div>
                    </section>

                    {/* 3. PRODUK POPULER (Slider 2.5 on Mobile, Grid on Desktop) */}
                    <section id="best-sellers">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                <span className="font-normal">{isEn ? 'Popular' : 'Produk'}</span>{' '}
                                <span className="font-bold">{isEn ? 'Fragrances' : 'Populer'}</span>
                            </h2>
                            <Button asChild variant="ghost" size="sm" className="text-xs">
                                <Link href="/products?sort=popular">
                                    {t('common.see_all')} &rarr;
                                </Link>
                            </Button>
                        </div>

                        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 scroll-pl-4 sm:scroll-pl-0 flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-5 pb-3 sm:pb-0 snap-x snap-mandatory scrollbar-none sm:grid-cols-3 lg:grid-cols-5">
                            {popularProducts.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    isWishlisted={wishlistedIds.includes(p.id)}
                                    onToggleWishlist={toggleWishlist}
                                    onQuickView={openQuickView}
                                    className="w-[calc((100%-16px)/2.45)] sm:w-auto shrink-0 sm:shrink snap-start"
                                />
                            ))}
                        </div>
                    </section>

                    {/* 4. MID-BANNER PROMO */}
                    <section id="special-offers">
                        <Card className="bg-primary text-primary-foreground p-6 sm:p-10 lg:p-12 overflow-hidden border-none shadow-none rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                <div className="md:col-span-7 space-y-3">
                                    <Badge variant="secondary" className="w-fit">{isEn ? 'Exclusive Offer' : 'Penawaran Eksklusif'}</Badge>
                                    <h2 className="text-2xl sm:text-4xl tracking-tight">
                                        <span className="font-normal">{isEn ? "Today's" : 'Promo Spesial'}</span>{' '}
                                        <span className="font-bold">{isEn ? 'Special Deals!' : 'Hari Ini!'}</span>
                                    </h2>
                                    <p className="text-xs sm:text-sm opacity-90 max-w-md leading-relaxed">
                                        {isEn
                                            ? 'Get special discounts for selected luxury fragrance collections with official Aroma Palace voucher codes.'
                                            : 'Dapatkan diskon istimewa untuk berbagai koleksi wewangian terpilih dengan menggunakan kode voucher resmi Aroma Palace.'}
                                    </p>
                                    <div className="pt-2 flex flex-wrap gap-2.5">
                                        <Button asChild variant="secondary" size="default">
                                            <Link href="/products?discount=1">{isEn ? 'Shop Promo' : 'Belanja Promo'}</Link>
                                        </Button>
                                        <Button asChild variant="outline" size="default" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground">
                                            <Link href="/cart">{isEn ? 'View Cart' : 'Cek Keranjang'}</Link>
                                        </Button>
                                    </div>
                                </div>
                                <div className="md:col-span-5 flex justify-center lg:justify-end">
                                    <div className="relative w-full h-44 sm:h-64 rounded-xl overflow-hidden border border-primary-foreground/20">
                                        <img
                                            src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=700&q=80"
                                            alt={isEn ? 'Special Promo' : 'Promo Spesial'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* 5. VOUCHER & PROMO EKSKLUSIF */}
                    {activeVouchers.length > 0 && (
                        <section id="vouchers">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                    <span className="font-normal">{isEn ? 'Vouchers &' : 'Voucher &'}</span>{' '}
                                    <span className="font-bold">{isEn ? 'Exclusive Deals' : 'Promo Eksklusif'}</span>
                                </h2>
                            </div>

                            <div className="relative group/voucher">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => voucherApi?.scrollPrev()}
                                    aria-label="Scroll left"
                                    className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md bg-background/90 hover:bg-background hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer opacity-0 pointer-events-none group-hover/voucher:opacity-100 group-hover/voucher:pointer-events-auto"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Button>

                                <div ref={voucherRef} className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-hidden pb-3">
                                    <div className="flex gap-3 sm:gap-4">
                                        {activeVouchers.map((vouch, idx) => (
                                            <div
                                                key={`${vouch.code}-${idx}`}
                                                className="w-[calc((100%-12px)/1.3)] sm:w-[calc((100%-24px)/2.2)] lg:w-[calc((100%-40px)/3.5)] shrink-0 min-w-0"
                                            >
                                                <VoucherCard
                                                    voucher={vouch}
                                                    isCopied={copiedCodes[vouch.code]}
                                                    onCopy={handleCopyCode}
                                                    onSelect={setSelectedVoucher}
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => voucherApi?.scrollNext()}
                                    aria-label="Scroll right"
                                    className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md bg-background/90 hover:bg-background hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer opacity-0 pointer-events-none group-hover/voucher:opacity-100 group-hover/voucher:pointer-events-auto"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            </div>
                        </section>
                    )}

                    {/* 6. DIPILIH KHUSUS UNTUKMU (RECOMMENDED) */}
                    <section>
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                <span className="font-normal">{isEn ? 'Curated' : 'Dipilih'}</span>{' '}
                                <span className="font-bold">{isEn ? 'Just For You' : 'Khusus Untukmu'}</span>
                            </h2>
                            <Button asChild variant="ghost" size="sm" className="text-xs">
                                <Link href="/products">
                                    {t('common.see_all')} &rarr;
                                </Link>
                            </Button>
                        </div>

                        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 scroll-pl-4 sm:scroll-pl-0 flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-5 pb-3 sm:pb-0 snap-x snap-mandatory scrollbar-none sm:grid-cols-3 lg:grid-cols-5">
                            {recommendedProducts.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    isWishlisted={wishlistedIds.includes(p.id)}
                                    onToggleWishlist={toggleWishlist}
                                    onQuickView={openQuickView}
                                    className="w-[calc((100%-16px)/2.45)] sm:w-auto shrink-0 sm:shrink snap-start"
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* 7. PRODUK DENGAN DISKON (FULL-WIDTH SECTION SLIDER) */}
                {discountedProducts.length > 0 && (
                    <section
                        id="discounts"
                        className="w-full bg-gradient-to-br from-[#4A070B] via-[#52090F] to-[#360407] border-y border-[#360407] py-8 sm:py-12"
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl tracking-tight text-white">
                                    <span className="font-normal text-white/90">{isEn ? 'Special' : 'Produk dengan'}</span>{' '}
                                    <span className="font-bold text-white">{isEn ? 'Discounts' : 'Diskon'}</span>
                                </h2>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-white/90 hover:text-white hover:bg-white/10"
                                >
                                    <Link href="/products?discount=1">
                                        {t('common.see_all')} &rarr;
                                    </Link>
                                </Button>
                            </div>

                            <div className="relative group/deal">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => discountApi?.scrollPrev()}
                                    aria-label="Scroll left"
                                    className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md bg-white/95 text-neutral-900 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer opacity-0 pointer-events-none group-hover/deal:opacity-100 group-hover/deal:pointer-events-auto border-none"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Button>

                                <div ref={discountRef} className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-hidden pb-3">
                                    <div className="flex gap-4">
                                        {discountedProducts.map((p, idx) => (
                                            <div
                                                key={`${p.id}-${idx}`}
                                                className="w-[calc((100%-16px)/2.2)] sm:w-[calc((100%-32px)/3.5)] lg:w-[calc((100%-72px)/5.5)] shrink-0 min-w-0"
                                            >
                                                <ProductCard
                                                    product={p}
                                                    isWishlisted={wishlistedIds.includes(p.id)}
                                                    onToggleWishlist={toggleWishlist}
                                                    onQuickView={openQuickView}
                                                    darkTheme
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => discountApi?.scrollNext()}
                                    aria-label="Scroll right"
                                    className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md bg-white/95 text-neutral-900 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer opacity-0 pointer-events-none group-hover/deal:opacity-100 group-hover/deal:pointer-events-auto border-none"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-16">
                    {/* 8. BRAND PILIHAN */}
                    <section id="brands">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                <span className="font-normal">{isEn ? 'Featured' : 'Brand'}</span>{' '}
                                <span className="font-bold">{isEn ? 'Brands' : 'Pilihan'}</span>
                            </h2>
                            <Button asChild variant="ghost" size="sm" className="text-xs">
                                <Link href="/products">
                                    {isEn ? 'Explore Brands' : 'Jelajahi Brand'} &rarr;
                                </Link>
                            </Button>
                        </div>

                        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 scroll-pl-4 sm:scroll-pl-0 flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-4 pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory sm:grid-cols-3 lg:grid-cols-6">
                            {brandList.map((b) => (
                                <BrandCard
                                    key={b.slug}
                                    brand={b}
                                    className="w-[calc((100%-30px)/3.5)] sm:w-auto shrink-0 sm:shrink snap-start"
                                />
                            ))}
                        </div>
                    </section>

                    {/* 9. ARTIKEL TERBARU */}
                    {articlesList.length > 0 && (
                        <section id="articles">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                    <span className="font-normal">{isEn ? 'Articles &' : 'Artikel &'}</span>{' '}
                                    <span className="font-bold">{isEn ? 'Fragrance Journal' : 'Jurnal Wewangian'}</span>
                                </h2>
                                <Button asChild variant="ghost" size="sm" className="text-xs">
                                    <Link href="/articles">
                                        {isEn ? 'Read All' : 'Baca Semua'} &rarr;
                                    </Link>
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                                {articlesList.map((art) => (
                                    <ArticleCard key={art.slug} article={art} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 10. VALUE PROPOSITIONS */}
                    <Card className="bg-muted/40 p-6 sm:p-8 border-border shadow-none rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="flex items-start gap-3.5">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-foreground">
                                        {isEn ? 'Guaranteed Quality' : 'Kualitas Terjamin'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {isEn
                                            ? 'Selected premium products from world master perfumers.'
                                            : 'Produk premium pilihan terpercaya dari master perfumer dunia.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-foreground">
                                        {isEn ? 'Long-Lasting Scent' : 'Aroma Tahan Lama'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {isEn
                                            ? 'Pure fragrance oil concentration up to 35% for maximum sillage.'
                                            : 'Konsentrasi minyak wangi murni hingga 35% untuk sillage maksimal.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-foreground">
                                        {isEn ? '100% Authentic Guarantee' : 'Garansi 100% Asli'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {isEn
                                            ? 'Full money-back guarantee if proven inauthentic.'
                                            : 'Jaminan uang kembali penuh bila terbukti tidak original.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3.5">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a2 2 0 11-4 0m10 0a2 2 0 11-4 0" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-foreground">
                                        {isEn ? 'Nationwide Delivery' : 'Pengiriman Seluruh Indonesia'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {isEn
                                            ? 'Secure shatterproof packaging with extra thick bubble wrap.'
                                            : 'Kemasan aman anti pecah dengan bubble wrap berlapis tebal.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* POPUP 1: QUICK VIEW PRODUCT (Unified Component) */}
            <ProductQuickViewModal
                product={quickViewProduct}
                open={!!quickViewProduct}
                onOpenChange={(open) => !open && setQuickViewProduct(null)}
            />

            {/* POPUP 2: VOUCHER CLAIM (shadcn Dialog) */}
            <Dialog open={!!selectedVoucher} onOpenChange={(open) => !open && setSelectedVoucher(null)}>
                {selectedVoucher && (
                    <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-md p-5 sm:p-6 rounded-2xl">
                        <DialogHeader className="text-left space-y-2">
                            <Badge variant="secondary" className="w-fit">{selectedVoucher.badge}</Badge>
                            <DialogTitle className="text-lg font-bold">
                                {pickText(selectedVoucher.title, (selectedVoucher as any).title_en)}
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed">
                                {pickText(selectedVoucher.desc, (selectedVoucher as any).desc_en)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-3 p-3.5 rounded-lg bg-muted border border-border text-xs space-y-2">
                            <p className="font-semibold text-foreground">{isEn ? 'Terms & Conditions:' : 'Syarat & Ketentuan:'}</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {selectedVoucher.terms.map((t, i) => (
                                    <li key={i}>{t}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    handleCopyCode(selectedVoucher.code);
                                    setSelectedVoucher(null);
                                }}
                                className="flex-1"
                                size="sm"
                            >
                                {isEn ? 'Copy Code' : 'Salin Kode'} ({selectedVoucher.code})
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSelectedVoucher(null)}>
                                {isEn ? 'Close' : 'Tutup'}
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </Layout>
    );
}
