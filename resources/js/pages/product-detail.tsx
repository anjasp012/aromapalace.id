import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProductCard, { type ProductItem } from '@/components/ProductCard';
import ProductQuickViewModal from '@/components/ProductQuickViewModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
    relatedProducts: FragranceDetail[];
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailPageProps) {
    const { props } = usePage<any>();
    const user = props?.auth?.user;
    const isAdmin = Boolean(props?.auth?.is_admin || user?.role === 'admin');

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
                title: `${product.volume || '50ml'} (Signature Produk)`,
                price: product.price,
                rawPrice: product.raw_price,
                originalPrice: product.originalPrice,
                stock: 30,
                inStock: product.in_stock,
            },
        ];
    }, [product]);

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
            router.visit('/login?notice=' + encodeURIComponent('Silakan masuk untuk menyimpan wewangian ke wishlist Anda.'));
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
            router.visit('/login?notice=' + encodeURIComponent('Silakan masuk untuk menambahkan produk ke keranjang belanja.'));
            return;
        }
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
            }
        );
    };



    // WhatsApp Consultation
    const handleWhatsAppConsultation = () => {
        const message = encodeURIComponent(
            `Halo Aroma Palace, saya tertarik berkonsultasi mengenai parfum "${product.name}" (${product.concentration || 'Extrait de Parfum'}). Mohon informasi ketersediaan batch maserasi dan rekomendasi pengiriman.`
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
                    text: `Jelajahi racikan wewangian mewah ${product.name} dari Aroma Palace:`,
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
            window.showPromoToast?.('Tautan wewangian berhasil disalin ke clipboard.');
        } catch {
            window.showPromoToast?.('Gagal menyalin tautan.');
        }
    };

    // Submit review
    const handleAddReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReviewAuthor.trim() || !newReviewText.trim()) return;

        const reviewItem: FragranceReview = {
            name: newReviewAuthor.trim(),
            rating: newRating,
            date: 'Baru saja',
            comment: newReviewText.trim(),
        };

        setCustomReviews((prev) => [reviewItem, ...prev]);
        setNewReviewAuthor('');
        setNewReviewText('');
        setWriteReviewOpen(false);
        window.showPromoToast?.('Terima kasih! Ulasan wewangian Anda berhasil diterbitkan.');
    };

    const renderDescription = (desc?: string) => {
        if (!desc) {
            return (
                <p>
                    Wewangian mahakarya dengan konsentrasi ekstrak murni berkarakter kuat yang dirancang untuk meninggalkan jejak aroma tak terlupakan di setiap ruangan yang Anda masuki.
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

        return (
            <p className="whitespace-pre-line">
                {desc}
            </p>
        );
    };

    const activeImage = images[activeImageIndex] || product.image;

    return (
        <Layout>
            <Head>
                <title>{`${product.name} • Wewangian Mewah Aroma Palace`}</title>
                <meta
                    name="description"
                    content={
                        product.description ||
                        `Pesan parfum artisanal ${product.name} dengan konsentrasi murni ${product.concentration} dari Aroma Palace.`
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
                            <span>Beranda</span>
                        </Link>
                        <span>/</span>
                        <Link href="/products" className="hover:text-foreground transition-colors">
                            Koleksi Produk
                        </Link>
                        <span>/</span>
                        <Link
                            href={`/products?category=${encodeURIComponent(product.family || product.category || 'All')}`}
                            className="hover:text-foreground transition-colors"
                        >
                            {product.family || product.category || 'Parfum'}
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                            {product.name}
                        </span>
                    </nav>
                </div>
            </div>

            {/* PRODUCT HERO SHOWCASE & PURCHASE SECTION */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* ======================================================== */}
                    {/* LEFT COLUMN: INTERACTIVE MEDIA GALLERY */}
                    {/* ======================================================== */}
                    <div className="lg:col-span-6 space-y-4 overflow-x-visible">
                        {/* Main Stage Image */}
                        <div className="relative aspect-square rounded-lg border border-border/80 bg-muted/30 overflow-hidden group shadow-none">
                            {activeImage ? (
                                <img
                                    src={activeImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Gambar Wewangian
                                </div>
                            )}



                            {/* Top Right Wishlist & Zoom Actions */}
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
                                        title={isWishlisted ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
                                    >
                                        <svg className={cn('w-4 h-4', isWishlisted ? 'fill-current' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </Button>
                                )}

                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => setLightboxOpen(true)}
                                    className="rounded-md h-8 w-8 bg-background/90 backdrop-blur-xs border border-border/80 text-muted-foreground hover:text-foreground shadow-none cursor-pointer"
                                    title="Perbesar Tampilan"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </Button>
                            </div>


                        </div>

                        {/* Thumbnail Strip */}
                        {images.length > 1 && (
                            <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 overflow-x-visible">
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

                        {/* Share & Consultation quick row */}
                        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border/70">
                            <button
                                type="button"
                                onClick={handleShare}
                                className="inline-flex items-center gap-1.5 hover:text-[#4A070B] transition-colors cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span>{copiedShare ? 'Tautan Disalin!' : 'Bagikan Wewangian Ini'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleWhatsAppConsultation}
                                className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.288.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.302c-.087.087-.179.182-.077.357.101.174.45 1.077 1.246 1.785.807.717 1.488.94 1.701 1.027.213.087.339.073.465-.072.126-.145.541-.63.685-.847.145-.217.289-.174.484-.101.195.072 1.238.584 1.45.69.213.106.355.158.407.248.052.09.052.523-.092.928z" />
                                </svg>
                                <span>Tanya Fragrance Specialist</span>
                            </button>
                        </div>
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
                                    {product.family}
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
                                {product.reviews_count || customReviews.length || 0} Ulasan Pelanggan
                            </a>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                100% Produk Original Terjamin
                            </span>
                        </div>

                        {/* Price Block */}
                        <div className="space-y-1.5 bg-muted/20 p-4 rounded-lg border border-border/80">
                            <div className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                                Harga Investasi Aroma
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
                                        Diskon {product.discountBadge}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Sudah termasuk pajak PPN &amp; garansi kemasan pengiriman premium dengan kotak segel beludru.
                            </p>
                        </div>

                        {/* Product Description */}
                        <div className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                            {renderDescription(product.description)}
                        </div>

                        {/* SIZE / VOLUME VARIANT SELECTION (OPTIONAL) */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                                    Pilih Varian / Ukuran Botol:
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
                                            aria-label="Kurangi jumlah"
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
                                            aria-label="Tambah jumlah"
                                        >
                                            &#43;
                                        </Button>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <Button
                                        onClick={handleAddToCart}
                                        className="flex-1 h-11 rounded-md bg-[#4A070B] text-white hover:bg-[#360407] font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-none transition-all min-w-0"
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <span className="truncate">+ Keranjang Belanja</span>
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-3.5 bg-muted/50 rounded-lg border border-border/70 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <span className="text-muted-foreground font-medium">
                                        Mode Administrator: Fitur wishlist dan keranjang belanja dinonaktifkan.
                                    </span>
                                    <Button asChild size="sm" variant="outline" className="h-8 text-xs border-[#4A070B]/40 text-[#4A070B] shrink-0">
                                        <Link href={`/admin/products/${product.id}/edit`}>
                                            Edit Produk di CMS &rarr;
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
                                    <div className="text-[11px] font-bold text-foreground">100% Extrait Asli</div>
                                    <div className="text-[10px] text-muted-foreground leading-snug">Standar IFRA Paris &amp; Teruji Laboratorium.</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card/60">
                                <div className="w-7 h-7 rounded-md bg-[#4A070B]/10 text-[#4A070B] flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-foreground">Kemasan Khusus Aman</div>
                                    <div className="text-[10px] text-muted-foreground leading-snug">Boks kayu eksklusif &amp; garansi anti-pecah.</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card/60">
                                <div className="w-7 h-7 rounded-md bg-[#4A070B]/10 text-[#4A070B] flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-foreground">Gratis 2 Sampel Vial</div>
                                    <div className="text-[10px] text-muted-foreground leading-snug">Coba 2 aroma lain di setiap pengiriman.</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card/60">
                                <div className="w-7 h-7 rounded-md bg-[#4A070B]/10 text-[#4A070B] flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-foreground">Garansi Tukar Aroma</div>
                                    <div className="text-[10px] text-muted-foreground leading-snug">Bisa tukar aroma jika segel utama belum dibuka.</div>
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
                                Suara Kolektor Wewangian
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                Ulasan Pelanggan Terverifikasi
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Pengalaman jujur dari para pecinta aroma yang telah mengoleksi botol wewangian ini.
                            </p>
                        </div>

                        <Button
                            onClick={() => setWriteReviewOpen(true)}
                            variant="outline"
                            className="rounded-md border-[#4A070B]/40 text-[#4A070B] dark:text-[#E8D0BA] hover:bg-[#4A070B]/10 text-xs shadow-none cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Tulis Ulasan Anda
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
                                    Berdasarkan {customReviews.length} ulasan terverifikasi
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
                                <Card className="p-8 text-center text-xs text-muted-foreground rounded-lg border-border/80 shadow-none">
                                    Belum ada ulasan untuk wewangian ini. Jadilah yang pertama memberikan ulasan!
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
            {relatedProducts && relatedProducts.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            Rekomendasi Wewangian Terkait
                        </h2>
                    </div>

                    <div className="flex sm:grid overflow-x-auto sm:overflow-visible gap-3 sm:gap-6 pb-3 sm:pb-0 snap-x snap-mandatory scrollbar-none sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                <DialogContent className="max-w-md p-6 rounded-lg border-border shadow-none">
                    <DialogHeader className="text-left space-y-1">
                        <DialogTitle className="text-base font-bold text-foreground">
                            Bagikan Pengalaman Aroma Anda
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Ulasan Anda mengenai {product.name} sangat berarti bagi para kurator dan kolektor lain.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddReview} className="space-y-4 pt-2">
                        {/* Rating Stars Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Nilai Aroma (Rating):</label>
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
                            <label className="text-xs font-semibold text-foreground">Nama Anda:</label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Raden Arya"
                                value={newReviewAuthor}
                                onChange={(e) => setNewReviewAuthor(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#4A070B]"
                            />
                        </div>

                        {/* Review text */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Ulasan Pengalaman:</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Ceritakan bagaimana aroma ini berinteraksi di kulit Anda, ketahanannya, serta situasi pemakaian terbaik..."
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
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-[#4A070B] text-white hover:bg-[#360407] text-xs rounded-md shadow-none cursor-pointer"
                            >
                                Publikasikan Ulasan
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
