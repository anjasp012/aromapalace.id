import { Head, Link, usePage, router, Deferred } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import ProductCard, { type ProductItem, ProductCardSkeleton } from '@/components/ProductCard';
import ProductQuickViewModal from '@/components/ProductQuickViewModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { isNativeApp } from '@/lib/native-app';
import { useTranslation, formatCategoryName } from '@/lib/i18n';
import { Check, Loader2 } from 'lucide-react';

export interface FragranceReview {
    name: string;
    rating: number;
    date: string;
    comment: string;
}

export interface ProductVariantItem {
    id: number;
    product_id: number;
    name: string;
    volume: string;
    price: string;
    raw_price: number;
    original_price?: string;
    sku?: string;
    stock: number;
    in_stock: boolean;
}

export interface FragranceDetail {
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
    raw_price: number;
    rating: number;
    reviews_count: number;
    in_stock: boolean;
    image: string;
    gallery?: string[];
    tag?: string;
    mood?: string;
    description?: string;
    description_en?: string;
    longevity?: string;
    sillage?: string;
    season?: string;
    maceration?: string;
    notes?: {
        top: string;
        heart: string;
        base: string;
    };
    reviews?: FragranceReview[];
    has_variants?: boolean;
    variants?: ProductVariantItem[];
}

interface ProductDetailPageProps {
    product: FragranceDetail;
    relatedProducts?: FragranceDetail[];
}

function ProductDetailSkeleton() {
    return (
        <Layout>
            <Head title="Detail Wewangian • Aroma Palace" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <span className="text-muted-foreground/40 text-xs">/</span>
                    <Skeleton className="h-4 w-24" />
                    <span className="text-muted-foreground/40 text-xs">/</span>
                    <Skeleton className="h-4 w-32" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    <div className="lg:col-span-7 space-y-4">
                        <Skeleton className="aspect-square w-full rounded-2xl" />
                        <div className="flex gap-3 overflow-hidden">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-16 w-16 rounded-xl shrink-0" />
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <div className="space-y-2.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-8 sm:h-10 w-4/5" />
                            <Skeleton className="h-4 w-36" />
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border/50">
                            <Skeleton className="h-8 w-44" />
                            <Skeleton className="h-3 w-32" />
                        </div>

                        <div className="space-y-2.5 pt-2">
                            <Skeleton className="h-3 w-20" />
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-24 rounded-lg" />
                                <Skeleton className="h-10 w-24 rounded-lg" />
                                <Skeleton className="h-10 w-24 rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Skeleton className="h-28 w-full rounded-xl" />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Skeleton className="h-12 w-28 rounded-xl" />
                            <Skeleton className="h-12 flex-1 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function ProductDetailContent({ product, relatedProducts }: ProductDetailPageProps) {
    const { props } = usePage<any>();
    const user = props?.auth?.user;
    const isAdmin = Boolean(props?.auth?.is_admin || user?.role === 'admin');
    const { t, pickText, isEn } = useTranslation();

    // Gallery State
    const images = useMemo(() => {
        if (product.gallery && product.gallery.length > 0) {
            return product.gallery;
        }
        return product.image ? [product.image] : [];
    }, [product]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const isProductInWishlist = Boolean(props?.auth?.wishlist_ids?.includes(product.id));
    const [isWishlisted, setIsWishlisted] = useState(isProductInWishlist);

    useEffect(() => {
        setIsWishlisted(Boolean(props?.auth?.wishlist_ids?.includes(product.id)));
    }, [props?.auth?.wishlist_ids, product.id]);

    const [quantity, setQuantity] = useState(1);
    const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
    const [quickViewBottle, setQuickViewBottle] = useState<ProductItem | null>(null);
    const [writeReviewOpen, setWriteReviewOpen] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newReviewAuthor, setNewReviewAuthor] = useState('');
    const [newReviewText, setNewReviewText] = useState('');
    const [customReviews, setCustomReviews] = useState<FragranceReview[]>(product.reviews || []);
    const [copiedShare, setCopiedShare] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isAddedToCart, setIsAddedToCart] = useState(false);

    const galleryScrollRef = useRef<HTMLDivElement>(null);

    const handleMobileGalleryScroll = () => {
        if (!galleryScrollRef.current) return;
        const width = galleryScrollRef.current.offsetWidth;
        if (width <= 0) return;
        const newIndex = Math.round(galleryScrollRef.current.scrollLeft / width);
        if (newIndex !== activeImageIndex && newIndex >= 0 && newIndex < images.length) {
            setActiveImageIndex(newIndex);
        }
    };

    const scrollMobileGalleryTo = (index: number) => {
        setActiveImageIndex(index);
        if (galleryScrollRef.current) {
            const width = galleryScrollRef.current.offsetWidth;
            galleryScrollRef.current.scrollTo({
                left: width * index,
                behavior: 'smooth',
            });
        }
    };

    // Dynamic Variants / Size options from Database (optional)
    const availableSizes = useMemo(() => {
        if (product.variants && product.variants.length > 0) {
            return product.variants.map((v) => ({
                id: v.id,
                label: v.volume,
                title: v.name,
                price: v.price,
                rawPrice: v.raw_price,
                originalPrice: v.original_price,
                stock: v.stock,
                inStock: v.in_stock,
            }));
        }
        return [
            {
                id: null,
                label: product.volume || '50ml',
                title: `${product.volume || '50ml'} (${isEn ? 'Signature Product' : 'Signature Produk'})`,
                price: product.price,
                rawPrice: product.raw_price,
                originalPrice: product.originalPrice,
                stock: 30,
                inStock: product.in_stock,
            },
        ];
    }, [product, isEn]);

    // Dynamic Price based on selected variant
    const currentPriceInfo = useMemo(() => {
        const selected = availableSizes[selectedSizeIndex] || availableSizes[0];
        return {
            price: selected.price,
            originalPrice: selected.originalPrice || null,
            rawPrice: selected.rawPrice,
            variantId: selected.id,
            volume: selected.label,
            title: selected.title,
        };
    }, [availableSizes, selectedSizeIndex]);

    // Quantity modifiers
    const decreaseQty = () => setQuantity((prev) => Math.max(1, prev - 1));
    const increaseQty = () => setQuantity((prev) => Math.min(10, prev + 1));

    // Wishlist Toggle
    const handleToggleWishlist = () => {
        if (isAdmin) return;
        if (!user) {
            router.visit(
                '/login?notice=' +
                    encodeURIComponent(
                        isEn
                            ? 'Please log in to save fragrances to your wishlist.'
                            : 'Silakan masuk untuk menyimpan wewangian ke wishlist Anda.'
                    )
            );
            return;
        }
        setIsWishlisted((prev) => !prev);
        router.post(
            '/wishlist/toggle',
            { product_id: product.id },
            {
                preserveScroll: true,
                onError: () => {
                    setIsWishlisted(isProductInWishlist);
                },
            }
        );
    };

    // Add to Cart
    const handleAddToCart = () => {
        if (isAdmin) return;
        if (!user) {
            router.visit(
                '/login?notice=' +
                    encodeURIComponent(
                        isEn
                            ? 'Please log in to add products to your shopping cart.'
                            : 'Silakan masuk untuk menambahkan produk ke keranjang belanja.'
                    )
            );
            return;
        }

        if (isAddingToCart) return;
        setIsAddingToCart(true);

        router.post(
            '/cart',
            {
                product_id: product.id,
                variant_id: currentPriceInfo.variantId,
                quantity: quantity,
                volume: currentPriceInfo.volume,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Smooth artificial delay so user perceives the feedback animation
                    setTimeout(() => {
                        setIsAddingToCart(false);
                        setIsAddedToCart(true);
                        setTimeout(() => {
                            setIsAddedToCart(false);
                        }, 2000);
                    }, 400);
                },
                onError: () => {
                    setIsAddingToCart(false);
                },
            }
        );
    };

    // WhatsApp Consultation
    const handleWhatsAppConsultation = () => {
        const message = encodeURIComponent(
            isEn
                ? `Hello Aroma Palace, I am interested in consulting about the fragrance "${product.name}" (${product.concentration || 'Extrait de Parfum'}). Please provide batch information and shipping recommendations.`
                : `Halo Aroma Palace, saya tertarik berkonsultasi mengenai parfum "${product.name}" (${product.concentration || 'Extrait de Parfum'}). Mohon informasi ketersediaan batch maserasi dan rekomendasi pengiriman.`
        );
        window.open(`https://wa.me/6281234567890?text=${message}`, '_blank');
    };

    // Share link
    const handleShare = async () => {
        if (typeof window === 'undefined') return;
        const currentUrl = window.location.href;

        if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
            try {
                await navigator.share({
                    title: `${product.name} • Aroma Palace`,
                    text: isEn
                        ? `Explore the luxurious fragrance ${product.name} from Aroma Palace:`
                        : `Jelajahi racikan wewangian mewah ${product.name} dari Aroma Palace:`,
                    url: currentUrl,
                });
                return;
            } catch {
                // fall through
            }
        }

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(currentUrl);
            }
            setCopiedShare(true);
            setTimeout(() => setCopiedShare(false), 2000);
            window.showPromoToast?.(
                isEn
                    ? 'Fragrance link copied to clipboard.'
                    : 'Tautan wewangian berhasil disalin ke clipboard.'
            );
        } catch {
            window.showPromoToast?.(isEn ? 'Failed to copy link.' : 'Gagal menyalin tautan.');
        }
    };

    // Submit review
    const handleAddReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReviewAuthor.trim() || !newReviewText.trim()) return;

        const reviewItem: FragranceReview = {
            name: newReviewAuthor.trim(),
            rating: newRating,
            date: isEn ? 'Just now' : 'Baru saja',
            comment: newReviewText.trim(),
        };

        setCustomReviews((prev) => [reviewItem, ...prev]);
        setNewReviewAuthor('');
        setNewReviewText('');
        setWriteReviewOpen(false);
        window.showPromoToast?.(
            isEn
                ? 'Thank you! Your fragrance review has been submitted.'
                : 'Terima kasih! Ulasan wewangian Anda berhasil diterbitkan.'
        );
    };

    const activeDescription = pickText(product.description, product.description_en);

    const renderDescription = (desc?: string) => {
        if (!desc) {
            return (
                <p>
                    {isEn
                        ? 'A masterwork fragrance with pure extract concentration and strong character, crafted to leave an unforgettable trail in every room you enter.'
                        : 'Wewangian mahakarya dengan konsentrasi ekstrak murni berkarakter kuat yang dirancang untuk meninggalkan jejak aroma tak terlupakan di setiap ruangan yang Anda masuki.'}
                </p>
            );
        }

        if (/<[a-z][\s\S]*>/i.test(desc)) {
            return (
                <div
                    className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-foreground/80 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-foreground [&_a]:text-primary"
                    dangerouslySetInnerHTML={{ __html: desc }}
                />
            );
        }

        return <p className="whitespace-pre-line">{desc}</p>;
    };

    const activeImage = images[activeImageIndex] || product.image;

    return (
        <Layout>
            <Head>
                <title>{`${product.name} • ${isEn ? 'Luxury Fragrance Aroma Palace' : 'Wewangian Mewah Aroma Palace'}`}</title>
                <meta
                    name="description"
                    content={
                        activeDescription ||
                        (isEn
                            ? `Order artisanal fragrance ${product.name} with pure concentration ${product.concentration} from Aroma Palace.`
                            : `Pesan parfum artisanal ${product.name} dengan konsentrasi murni ${product.concentration} dari Aroma Palace.`)
                    }
                />
            </Head>

            {/* BREADCRUMB NAVIGATION */}
            <div className="border-b border-border/70 bg-muted/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5">
                    <nav className="flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
                        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-[#4A070B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>{t('nav.home')}</span>
                        </Link>
                        <span>/</span>
                        <Link href="/products" className="hover:text-foreground transition-colors">
                            {t('nav.products')}
                        </Link>
                        <span>/</span>
                        <Link
                            href={`/products?category=${encodeURIComponent(product.family || product.category || 'All')}`}
                            className="hover:text-foreground transition-colors"
                        >
                            {formatCategoryName(product.family || product.category || 'Parfum', isEn)}
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                            {product.name}
                        </span>
                    </nav>
                </div>
            </div>

            {/* PRODUCT HERO SHOWCASE & PURCHASE SECTION */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-0 pb-8 sm:py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* ======================================================== */}
                    {/* LEFT COLUMN: INTERACTIVE MEDIA GALLERY */}
                    {/* ======================================================== */}
                    <div className="-mx-4 sm:mx-0 lg:col-span-6 space-y-3 sm:space-y-4">
                        {/* MOBILE ONLY: FULL-BLEED SWIPE GALLERY (Snap Scrolling, Edge-to-Edge, No Padding) */}
                        <div className="sm:hidden relative w-full aspect-square overflow-hidden bg-muted/20">
                            <div
                                ref={galleryScrollRef}
                                onScroll={handleMobileGalleryScroll}
                                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {images.map((imgUrl, idx) => (
                                    <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                                        <img
                                            src={imgUrl}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Floating Action Buttons: Love & Share (Matching Desktop rounded-md style) */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                                {!isAdmin && (
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={handleToggleWishlist}
                                        className={cn(
                                            'rounded-md h-8 w-8 bg-background/90 backdrop-blur-xs border border-border/80 transition-colors shadow-none cursor-pointer',
                                            isWishlisted ? 'text-rose-600' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                        title={isWishlisted ? (isEn ? 'Remove from Wishlist' : 'Hapus dari Wishlist') : (isEn ? 'Save to Wishlist' : 'Simpan ke Wishlist')}
                                    >
                                        <svg className={cn('w-4 h-4', isWishlisted ? 'fill-current' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </Button>
                                )}

                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={handleShare}
                                    className="rounded-md h-8 w-8 bg-background/90 backdrop-blur-xs border border-border/80 text-muted-foreground hover:text-[#4A070B] transition-colors shadow-none cursor-pointer"
                                    title={copiedShare ? (isEn ? 'Link Copied!' : 'Tautan Disalin!') : (isEn ? 'Share Fragrance' : 'Bagikan Wewangian')}
                                >
                                    {copiedShare ? (
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    )}
                                </Button>
                            </div>

                            {/* Mobile Pagination Dot Indicator (Inside Image, Bottom Center) */}
                            {images.length > 1 && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-auto">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => scrollMobileGalleryTo(idx)}
                                            aria-label={`Slide ${idx + 1}`}
                                            className={cn(
                                                'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                                                activeImageIndex === idx
                                                    ? 'w-5 bg-white'
                                                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DESKTOP GALLERY: Main Stage Image with Border & Zoom */}
                        <div className="hidden sm:block relative aspect-square rounded-lg border border-border/80 bg-muted/30 overflow-hidden group shadow-none">
                            {activeImage ? (
                                <img
                                    src={activeImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                    {isEn ? 'Fragrance Image' : 'Gambar Wewangian'}
                                </div>
                            )}

                            {/* Top Right Actions: Love, Share & Zoom */}
                            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                                {!isAdmin && (
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={handleToggleWishlist}
                                        className={cn(
                                            'rounded-md h-8 w-8 bg-background/90 backdrop-blur-xs border border-border/80 transition-colors shadow-none cursor-pointer',
                                            isWishlisted ? 'text-rose-600' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                        title={isWishlisted ? (isEn ? 'Remove from Wishlist' : 'Hapus dari Wishlist') : (isEn ? 'Save to Wishlist' : 'Simpan ke Wishlist')}
                                    >
                                        <svg className={cn('w-4 h-4', isWishlisted ? 'fill-current' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </Button>
                                )}

                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={handleShare}
                                    className="rounded-md h-8 w-8 bg-background/90 backdrop-blur-xs border border-border/80 text-muted-foreground hover:text-[#4A070B] transition-colors shadow-none cursor-pointer"
                                    title={copiedShare ? (isEn ? 'Link Copied!' : 'Tautan Disalin!') : (isEn ? 'Share Fragrance' : 'Bagikan Wewangian')}
                                >
                                    {copiedShare ? (
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    )}
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => setLightboxOpen(true)}
                                    className="rounded-md h-8 w-8 bg-background/90 backdrop-blur-xs border border-border/80 text-muted-foreground hover:text-foreground shadow-none cursor-pointer"
                                    title={isEn ? 'Zoom Image' : 'Perbesar Tampilan'}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </Button>
                            </div>
                        </div>

                        {/* Desktop Thumbnail Strip (hidden on mobile) */}
                        {images.length > 1 && (
                            <div className="hidden sm:flex items-center gap-3 overflow-x-auto pb-1 pt-1">
                                {images.map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={cn(
                                            'relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border transition-all shrink-0 cursor-pointer shadow-none',
                                            activeImageIndex === idx
                                                ? 'border-[#4A070B] ring-2 ring-[#4A070B]/30 scale-102'
                                                : 'border-border/80 opacity-70 hover:opacity-100 hover:border-foreground/40'
                                        )}
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`${product.name} thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ======================================================== */}
                    {/* RIGHT COLUMN: PRODUCT SPEC & PURCHASE SUITE */}
                    {/* ======================================================== */}
                    <div className="lg:col-span-6 space-y-6">

                        {/* Brand & Family Badge */}
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#4A070B] dark:text-[#E8D0BA]">
                                    {product.brand || 'Aroma Palace Atelier'}
                                </span>
                                <span className="text-muted-foreground text-xs">•</span>
                                <Badge variant="outline" className="text-[11px] rounded-md border-border/80 font-normal shadow-none">
                                    {formatCategoryName(product.family, isEn)}
                                </Badge>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                                {product.name}
                            </h1>
                        </div>

                        {/* Rating, Reviews count & Question link */}
                        <div className="flex items-center gap-3 text-xs border-y border-border/70 py-2.5">
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                                <span className="text-amber-500 text-sm">★</span>
                                <span>{Number(product.rating || 5).toFixed(1)}</span>
                            </div>
                            <span className="text-muted-foreground">/</span>
                            <a
                                href="#ulasan"
                                className="text-muted-foreground hover:text-[#4A070B] transition-colors"
                            >
                                {product.reviews_count || customReviews.length || 0} {isEn ? 'Customer Reviews' : 'Ulasan Pelanggan'}
                            </a>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                {isEn ? '100% Guaranteed Authentic' : '100% Produk Original Terjamin'}
                            </span>
                        </div>

                        {/* Price Block */}
                        <div className="space-y-1.5 bg-muted/20 p-4 rounded-lg border border-border/80">
                            <div className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                                {isEn ? 'Fragrance Investment' : 'Harga Investasi Aroma'}
                            </div>
                            <div className="flex flex-wrap items-baseline gap-3">
                                <span className="text-2xl sm:text-3xl font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                    {currentPriceInfo.price}
                                </span>
                                {currentPriceInfo.originalPrice && (
                                    <span className="text-sm line-through text-muted-foreground">
                                        {currentPriceInfo.originalPrice}
                                    </span>
                                )}
                                {product.discountBadge && (
                                    <span className="text-xs px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-bold">
                                        {isEn ? 'Discount' : 'Diskon'} {product.discountBadge}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {isEn
                                    ? 'Includes VAT & premium delivery box packaging with velvet-sealed casing.'
                                    : 'Sudah termasuk pajak PPN & garansi kemasan pengiriman premium dengan kotak segel beludru.'}
                            </p>
                        </div>

                        {/* Product Description */}
                        <div className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                            {renderDescription(activeDescription)}
                        </div>

                        {/* SIZE / VOLUME VARIANT SELECTION (OPTIONAL) */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                                    {isEn ? 'Select Variant / Bottle Size:' : 'Pilih Varian / Ukuran Botol:'}
                                </span>
                                <span className="text-muted-foreground text-[11px]">
                                    {currentPriceInfo.title}
                                </span>
                            </div>

                            <div className={cn(
                                "grid gap-2.5",
                                availableSizes.length === 1
                                    ? "grid-cols-1 max-w-xs"
                                    : availableSizes.length === 2
                                        ? "grid-cols-2"
                                        : "grid-cols-2 sm:grid-cols-3"
                            )}>
                                {availableSizes.map((opt, idx) => (
                                    <button
                                        key={opt.label + idx}
                                        type="button"
                                        onClick={() => setSelectedSizeIndex(idx)}
                                        className={cn(
                                            'p-2.5 rounded-md border text-left transition-all cursor-pointer shadow-none',
                                            selectedSizeIndex === idx
                                                ? 'border-[#4A070B] bg-[#4A070B]/5 ring-1 ring-[#4A070B]/30'
                                                : 'border-border/80 hover:border-border hover:bg-muted/40'
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-bold text-xs text-foreground">{opt.label}</span>
                                            <span className="text-[10.5px] font-semibold text-[#4A070B] dark:text-[#E8D0BA]">
                                                {opt.price}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">{opt.title}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* QUANTITY & PRIMARY ACTION BUTTONS */}
                        <div className="space-y-3 pt-2">
                            {!isAdmin ? (
                                <div className="flex flex-row items-center gap-2 sm:gap-3">
                                    {/* Quantity Counter */}
                                    <div className="flex items-center justify-between border border-border/80 rounded-md bg-background px-1 h-11 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={decreaseQty}
                                            disabled={quantity <= 1}
                                            className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                                            aria-label={isEn ? "Decrease quantity" : "Kurangi jumlah"}
                                        >
                                            &minus;
                                        </Button>
                                        <span className="w-8 sm:w-10 text-center font-bold text-xs text-foreground">
                                            {quantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={increaseQty}
                                            disabled={quantity >= 10}
                                            className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                                            aria-label={isEn ? "Increase quantity" : "Tambah jumlah"}
                                        >
                                            &#43;
                                        </Button>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <Button
                                        onClick={handleAddToCart}
                                        disabled={isAddingToCart}
                                        className={cn(
                                            "flex-1 h-11 rounded-md font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-none transition-all duration-300 min-w-0 select-none",
                                            isAddedToCart
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20"
                                                : "bg-[#4A070B] text-white hover:bg-[#360407]"
                                        )}
                                    >
                                        {isAddingToCart ? (
                                            <>
                                                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                                                <span className="truncate">
                                                    {isEn ? 'Adding to Cart...' : 'Memasukkan...'}
                                                </span>
                                            </>
                                        ) : isAddedToCart ? (
                                            <>
                                                <Check className="w-4 h-4 shrink-0 stroke-[2.5] animate-in zoom-in-75 duration-200" />
                                                <span className="truncate">
                                                    {isEn ? 'Added to Cart!' : 'Berhasil Ditambahkan!'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                </svg>
                                                <span className="truncate">{t('product.add_to_cart')}</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-3.5 bg-muted/50 rounded-lg border border-border/70 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <span className="text-muted-foreground font-medium">
                                        {isEn ? 'Administrator Mode: Shopping features disabled.' : 'Mode Administrator: Fitur wishlist dan keranjang belanja dinonaktifkan.'}
                                    </span>
                                    <Button asChild size="sm" variant="outline" className="h-8 text-xs border-[#4A070B]/40 text-[#4A070B] shrink-0">
                                        <Link href={`/admin/products/${product.id}/edit`}>
                                            {isEn ? 'Edit Product in CMS →' : 'Edit Produk di CMS →'}
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* TRUST VALUE BADGES (4 COMPACT PILLARS) */}
                        <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card/60">
                                <div className="w-7 h-7 rounded-md bg-[#4A070B]/10 text-[#4A070B] flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-foreground">{isEn ? '100% Authentic Extrait' : '100% Extrait Asli'}</div>
                                    <div className="text-[10px] text-muted-foreground leading-snug">{isEn ? 'IFRA Paris Standards & Lab Tested.' : 'Standar IFRA Paris & Teruji Laboratorium.'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card/60">
                                <div className="w-7 h-7 rounded-md bg-[#4A070B]/10 text-[#4A070B] flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-foreground">{isEn ? 'Secure Luxury Packaging' : 'Kemasan Khusus Aman'}</div>
                                    <div className="text-[10px] text-muted-foreground leading-snug">{isEn ? 'Exclusive wooden case & anti-breakage guarantee.' : 'Boks kayu eksklusif & garansi anti-pecah.'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card/60">
                                <div className="w-7 h-7 rounded-md bg-[#4A070B]/10 text-[#4A070B] flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-foreground">{isEn ? 'Complimentary 2 Sample Vials' : 'Gratis 2 Sampel Vial'}</div>
                                    <div className="text-[10px] text-muted-foreground leading-snug">{isEn ? 'Experience 2 other scents in every delivery.' : 'Coba 2 aroma lain di setiap pengiriman.'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card/60">
                                <div className="w-7 h-7 rounded-md bg-[#4A070B]/10 text-[#4A070B] flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-foreground">{isEn ? 'Fragrance Exchange Guarantee' : 'Garansi Tukar Aroma'}</div>
                                    <div className="text-[10px] text-muted-foreground leading-snug">{isEn ? 'Exchangeable if the primary seal remains intact.' : 'Bisa tukar aroma jika segel utama belum dibuka.'}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>



            {/* VERIFIED CUSTOMER REVIEWS SECTION */}
            <section id="ulasan" className="border-t border-border/70 bg-muted/20 py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* Header with write review button */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#4A070B] dark:text-[#E8D0BA]">
                                {isEn ? 'Voices of Fragrance Collectors' : 'Suara Kolektor Wewangian'}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                {isEn ? 'Verified Customer Reviews' : 'Ulasan Pelanggan Terverifikasi'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {isEn
                                    ? 'Authentic experiences from fragrance connoisseurs who have collected this creation.'
                                    : 'Pengalaman jujur dari para pecinta aroma yang telah mengoleksi botol wewangian ini.'}
                            </p>
                        </div>

                        <Button
                            onClick={() => setWriteReviewOpen(true)}
                            variant="outline"
                            className="w-full sm:w-auto shrink-0 rounded-md border-[#4A070B]/40 text-[#4A070B] dark:text-[#E8D0BA] hover:bg-[#4A070B]/10 text-xs shadow-none cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {isEn ? 'Write a Review' : 'Tulis Ulasan Anda'}
                        </Button>
                    </div>

                    {/* Summary Rating Banner & Reviews List */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Rating Score Card (4 cols) */}
                        <div className="lg:col-span-4 p-6 rounded-lg border border-border/80 bg-card/60 space-y-4 shadow-none">
                            <div className="text-center space-y-1 pb-4 border-b border-border/70">
                                <div className="text-4xl font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                    {Number(product.rating || 5).toFixed(1)}
                                </div>
                                <div className="flex items-center justify-center gap-1 text-amber-500 text-sm">
                                    {'★'.repeat(5)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {isEn
                                        ? `Based on ${customReviews.length} verified reviews`
                                        : `Berdasarkan ${customReviews.length} ulasan terverifikasi`}
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 flex items-center justify-between text-muted-foreground font-medium shrink-0">
                                        <span>5</span>
                                        <span className="text-amber-500">★</span>
                                    </span>
                                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-[#4A070B] h-full rounded-full" style={{ width: '92%' }}></div>
                                    </div>
                                    <span className="w-8 text-right font-bold text-foreground">92%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-7 flex items-center justify-between text-muted-foreground font-medium shrink-0">
                                        <span>4</span>
                                        <span className="text-amber-500">★</span>
                                    </span>
                                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-[#4A070B] h-full rounded-full" style={{ width: '8%' }}></div>
                                    </div>
                                    <span className="w-8 text-right font-bold text-foreground">8%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-7 flex items-center justify-between text-muted-foreground font-medium shrink-0">
                                        <span>3</span>
                                        <span className="text-amber-500">★</span>
                                    </span>
                                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-[#4A070B] h-full rounded-full" style={{ width: '0%' }}></div>
                                    </div>
                                    <span className="w-8 text-right font-bold text-foreground">0%</span>
                                </div>
                            </div>

                        </div>

                        {/* Reviews Feed (8 cols) */}
                        <div className="lg:col-span-8 space-y-3.5">
                            {customReviews.length === 0 ? (
                                <Card className="p-8 text-center text-xs text-muted-foreground rounded-lg border-border/80 shadow-none space-y-3">
                                    <p>
                                        {isEn
                                            ? 'No reviews yet for this fragrance. Be the first to share your experience!'
                                            : 'Belum ada ulasan untuk wewangian ini. Jadilah yang pertama memberikan ulasan!'}
                                    </p>
                                    <Button
                                        onClick={() => setWriteReviewOpen(true)}
                                        size="sm"
                                        className="bg-[#4A070B] text-white hover:bg-[#360407] text-xs rounded-md shadow-none cursor-pointer mx-auto"
                                    >
                                        {isEn ? 'Write the First Review' : 'Tulis Ulasan Pertama'}
                                    </Button>
                                </Card>
                            ) : (
                                customReviews.map((rev, idx) => (
                                    <Card key={idx} className="p-4 sm:p-5 rounded-lg border border-border/80 bg-card/60 space-y-2 shadow-none">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-[#4A070B]/10 text-[#4A070B] font-bold text-xs flex items-center justify-center">
                                                    {rev.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-xs text-foreground">
                                                        <span>{rev.name}</span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">{rev.date}</div>
                                                </div>
                                            </div>

                                            <div className="text-amber-500 text-xs font-bold">
                                                {'★'.repeat(Math.round(rev.rating))}
                                            </div>
                                        </div>

                                        <p className="text-xs text-foreground/80 leading-relaxed pt-1">
                                            {rev.comment}
                                        </p>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </section>

            {/* RELATED PRODUCTS RECOMMENDATION */}
            <Deferred
                data="relatedProducts"
                fallback={
                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                        <div className="mb-6">
                            <Skeleton className="h-7 w-64" />
                        </div>
                        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 scroll-pl-4 sm:scroll-pl-0 flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-6 pb-3 sm:pb-0 scrollbar-none sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <ProductCardSkeleton
                                    key={i}
                                    className="w-[calc((100%-16px)/2.45)] sm:w-auto shrink-0 sm:shrink"
                                />
                            ))}
                        </div>
                    </section>
                }
            >
                {relatedProducts && relatedProducts.length > 0 && (
                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                        <div className="mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                {isEn ? 'Recommended Fragrances' : 'Rekomendasi Wewangian Terkait'}
                            </h2>
                        </div>

                        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 scroll-pl-4 sm:scroll-pl-0 flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-6 pb-3 sm:pb-0 snap-x snap-mandatory scrollbar-none sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {relatedProducts.slice(0, 10).map((item) => (
                                <ProductCard
                                    key={item.id}
                                    product={item as unknown as ProductItem}
                                    onQuickView={(p) => setQuickViewBottle(p)}
                                    className="w-[calc((100%-16px)/2.45)] sm:w-auto shrink-0 sm:shrink snap-start"
                                />
                            ))}
                        </div>
                    </section>
                )}
            </Deferred>

            {/* LIGHTBOX DIALOG FOR MAIN IMAGE */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="max-w-3xl p-2 bg-background/95 border-border rounded-lg shadow-none">
                    <div className="relative aspect-square w-full rounded-md overflow-hidden bg-black/5">
                        <img
                            src={activeImage}
                            alt={product.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* WRITE REVIEW MODAL */}
            <Dialog open={writeReviewOpen} onOpenChange={setWriteReviewOpen}>
                <DialogContent className="w-[calc(100vw-32px)] sm:w-full max-w-md p-5 sm:p-6 rounded-2xl border-border bg-card shadow-2xl">
                    <DialogHeader className="text-left space-y-1">
                        <DialogTitle className="text-base font-bold text-foreground">
                            {isEn ? 'Share Your Fragrance Experience' : 'Bagikan Pengalaman Aroma Anda'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {isEn
                                ? `Your impression of ${product.name} guides fellow collectors and curators.`
                                : `Ulasan Anda mengenai ${product.name} sangat berarti bagi para kurator dan kolektor lain.`}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddReview} className="space-y-4 pt-2">
                        {/* Rating Stars Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'Scent Rating:' : 'Nilai Aroma (Rating):'}
                            </label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewRating(star)}
                                        className={cn(
                                            'text-xl transition-transform hover:scale-110 cursor-pointer',
                                            star <= newRating ? 'text-amber-500' : 'text-muted-foreground/30'
                                        )}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="text-xs text-muted-foreground ml-2 inline-flex items-center gap-1 font-sans">
                                    <span>{newRating} / 5</span>
                                    <span className="text-amber-500">★</span>
                                </span>
                            </div>
                        </div>

                        {/* Name input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'Your Name:' : 'Nama Anda:'}
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={isEn ? 'e.g., Alexander Smith' : 'Contoh: Raden Arya'}
                                value={newReviewAuthor}
                                onChange={(e) => setNewReviewAuthor(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#4A070B]"
                            />
                        </div>

                        {/* Review text */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'Experience Review:' : 'Ulasan Pengalaman:'}
                            </label>
                            <textarea
                                required
                                rows={4}
                                placeholder={
                                    isEn
                                        ? 'Describe how this scent develops on your skin, its longevity, and best occasions for wear...'
                                        : 'Ceritakan bagaimana aroma ini berinteraksi di kulit Anda, ketahanannya, serta situasi pemakaian terbaik...'
                                }
                                value={newReviewText}
                                onChange={(e) => setNewReviewText(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#4A070B] resize-none"
                            ></textarea>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setWriteReviewOpen(false)}
                                className="text-xs cursor-pointer shadow-none"
                            >
                                {isEn ? 'Cancel' : 'Batal'}
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-[#4A070B] text-white hover:bg-[#360407] text-xs rounded-md shadow-none cursor-pointer"
                            >
                                {isEn ? 'Publish Review' : 'Publikasikan Ulasan'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* QUICK VIEW MODAL FOR RELATED PRODUCTS */}
            {quickViewBottle && (
                <ProductQuickViewModal
                    product={quickViewBottle}
                    open={Boolean(quickViewBottle)}
                    onOpenChange={(open) => {
                        if (!open) setQuickViewBottle(null);
                    }}
                />
            )}
        </Layout>
    );
}

export default function ProductDetail({ product, relatedProducts }: Partial<ProductDetailPageProps>) {
    if (!product) {
        return <ProductDetailSkeleton />;
    }
    return <ProductDetailContent product={product} relatedProducts={relatedProducts} />;
}

