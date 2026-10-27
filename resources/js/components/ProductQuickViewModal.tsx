import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type ProductItem } from '@/components/ProductCard';
import { useTranslation, formatCategoryName } from '@/lib/i18n';
import { Check, Loader2 } from 'lucide-react';
import { cn, formatVolume } from '@/lib/utils';

interface ProductQuickViewModalProps {
    product: ProductItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddToCart?: (product: ProductItem, quantity: number, variant?: any) => void;
}

export default function ProductQuickViewModal({
    product,
    open,
    onOpenChange,
    onAddToCart,
}: ProductQuickViewModalProps) {
    const { props } = usePage<any>();
    const user = props?.auth?.user;
    const isAdmin = Boolean(props?.auth?.is_admin || user?.role === 'admin');
    const { t, pickText, isEn } = useTranslation();

    const [quantity, setQuantity] = useState(1);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    useEffect(() => {
        if (open) {
            setQuantity(1);
            setSelectedVariantIndex(0);
            setIsAdding(false);
            setIsAdded(false);
        }
    }, [open, product]);

    if (!product) return null;

    const variants = product.variants && product.variants.length > 0 ? product.variants : [];
    const hasMultipleVariants = variants.length > 1;
    const currentVariant = variants[selectedVariantIndex] || variants[0] || null;

    const displayPrice = currentVariant ? currentVariant.price : product.price;
    const displayOriginalPrice = currentVariant ? (currentVariant.original_price || null) : (product.originalPrice || null);
    const displayDiscountBadge = currentVariant?.discount_badge || product.discountBadge;
    const displayVolume = currentVariant ? formatVolume(currentVariant.volume) : formatVolume(product.volume || 50);

    const maxStock = currentVariant && typeof currentVariant.stock === 'number' ? currentVariant.stock : 20;
    const isOutOfStock = currentVariant ? currentVariant.stock <= 0 : product.in_stock === false;

    const handleAdd = () => {
        if (isAdmin || isOutOfStock) return;
        if (!user) {
            router.visit(
                '/login?notice=' +
                    encodeURIComponent(
                        isEn
                            ? 'Please log in to add products to your shopping cart.'
                            : 'Silakan masuk untuk menambahkan produk ke keranjang belanja.'
                    )
            );
            onOpenChange(false);
            return;
        }

        if (isAdding) return;
        setIsAdding(true);

        if (onAddToCart) {
            onAddToCart(product, quantity, currentVariant);
            setIsAdding(false);
            setIsAdded(true);
            setTimeout(() => {
                setIsAdded(false);
                onOpenChange(false);
            }, 600);
        } else {
            router.post(
                '/cart',
                {
                    product_id: product.id,
                    variant_id: currentVariant?.id,
                    quantity: quantity,
                    volume: currentVariant ? currentVariant.volume : (product.volume || 50),
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        window.showCartToast?.(
                            isEn ? 'Added to cart.' : 'Berhasil masuk keranjang.'
                        );
                        setIsAdding(false);
                        setIsAdded(true);
                        setTimeout(() => {
                            setIsAdded(false);
                            onOpenChange(false);
                        }, 600);
                    },
                    onError: () => {
                        setIsAdding(false);
                    },
                }
            );
        }
    };

    const categoryOrFamily = product.category || product.family;
    const activeDescription = pickText(product.description, product.description_en);

    const renderDescription = (desc?: string) => {
        if (!desc) {
            return (
                <p>
                    {isEn
                        ? 'Luxurious fragrance crafted with a high concentration formula for all-day scent longevity.'
                        : 'Wewangian mewah dengan formula konsentrasi tinggi untuk ketahanan aroma sepanjang hari.'}
                </p>
            );
        }

        if (/<[a-z][\s\S]*>/i.test(desc)) {
            return (
                <div
                    className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-muted-foreground [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-foreground [&_a]:text-primary"
                    dangerouslySetInnerHTML={{ __html: desc }}
                />
            );
        }

        return <p className="whitespace-pre-line">{desc}</p>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-5 bg-muted rounded-xl overflow-hidden aspect-square">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-7 space-y-4">
                        <DialogHeader className="text-left space-y-1">
                            <div className="flex items-center gap-2">
                                {product.brand && (
                                    <Badge variant="outline" className="text-xs">
                                        {product.brand}
                                    </Badge>
                                )}
                                {categoryOrFamily && (
                                    <span className="text-xs text-muted-foreground">
                                        &bull; {formatCategoryName(categoryOrFamily, isEn)}
                                    </span>
                                )}
                            </div>
                            <DialogTitle className="text-lg sm:text-xl font-bold">
                                {product.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {t('catalog.concentration')}: {product.concentration || 'Eau de Parfum'} &bull; {displayVolume}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex items-baseline gap-2 border-y border-border py-2.5">
                            <span className="text-xl sm:text-2xl font-bold text-foreground">
                                {displayPrice}
                            </span>
                            {displayOriginalPrice && (
                                <span className="text-xs line-through text-muted-foreground">
                                    {displayOriginalPrice}
                                </span>
                            )}
                            {displayDiscountBadge && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                                    {displayDiscountBadge}
                                </Badge>
                            )}
                        </div>

                        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                            {renderDescription(activeDescription)}
                        </div>

                        {/* Variant Selection (Only if multiple variants exist) */}
                        {hasMultipleVariants && (
                            <div className="space-y-2 pt-2 border-t border-border/60">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                                        {isEn ? 'Select Variant / Size:' : 'Pilih Varian / Ukuran:'}
                                    </span>
                                    {currentVariant && (
                                        <span className="text-muted-foreground text-[11px] truncate max-w-[160px]">
                                            {currentVariant.name}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {variants.map((v, idx) => (
                                        <button
                                            key={v.id || idx}
                                            type="button"
                                            onClick={() => {
                                                setSelectedVariantIndex(idx);
                                                setQuantity(1);
                                            }}
                                            className={cn(
                                                'p-2 rounded-md border text-left transition-all cursor-pointer shadow-none text-xs',
                                                selectedVariantIndex === idx
                                                    ? 'border-[#4A070B] bg-[#4A070B]/5 ring-1 ring-[#4A070B]/30'
                                                    : 'border-border/80 hover:border-border hover:bg-muted/40'
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="font-bold text-xs text-foreground truncate" title={v.name}>
                                                    {v.name}
                                                </span>
                                                <span className="text-[10px] font-semibold text-[#4A070B] dark:text-[#E8D0BA] shrink-0">
                                                    {v.price}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                                                <span className="font-medium">{formatVolume(v.volume)}</span>
                                                {v.stock !== undefined && (
                                                    <span className={v.stock <= 5 ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                                                        {v.stock > 0 ? `Stok: ${v.stock}` : (isEn ? 'Out of stock' : 'Habis')}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            {!isAdmin ? (
                                <>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium">{t('product.quantity')}:</span>
                                        <div className="flex items-center border border-border rounded-md">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                                disabled={quantity <= 1 || isOutOfStock}
                                                className="h-7 w-7 p-0 cursor-pointer"
                                                aria-label={isEn ? "Decrease quantity" : "Kurangi jumlah"}
                                            >
                                                &minus;
                                            </Button>
                                            <span className="w-8 text-center font-bold">{quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setQuantity((prev) => Math.min(Math.max(1, maxStock), prev + 1))}
                                                disabled={quantity >= maxStock || isOutOfStock}
                                                className="h-7 w-7 p-0 cursor-pointer"
                                                aria-label={isEn ? "Increase quantity" : "Tambah jumlah"}
                                            >
                                                &#43;
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={handleAdd}
                                            disabled={isAdding || isOutOfStock}
                                            size="sm"
                                            className={cn(
                                                "cursor-pointer shadow-none transition-all duration-300",
                                                isOutOfStock
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-80"
                                                    : isAdded
                                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20"
                                                        : "bg-[#4A070B] hover:bg-[#360407] text-white"
                                            )}
                                        >
                                            {isAdding ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span className="truncate">{isEn ? 'Adding...' : 'Memasukkan...'}</span>
                                                </span>
                                            ) : isAdded ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Check className="w-3.5 h-3.5 stroke-[2.5] animate-in zoom-in-75" />
                                                    <span className="truncate">{isEn ? 'Added!' : 'Berhasil!'}</span>
                                                </span>
                                            ) : isOutOfStock ? (
                                                <span>{isEn ? 'Out of Stock' : 'Stok Habis'}</span>
                                            ) : (
                                                t('product.add_to_cart')
                                            )}
                                        </Button>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={product.slug ? `/products/${product.slug}` : '/products'}>
                                                {isEn ? 'View Product' : 'Lihat Halaman'}
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground italic">
                                        {isEn ? 'Administrator Mode: Shopping features disabled.' : 'Mode Administrator: Fitur belanja dinonaktifkan.'}
                                    </p>
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href={product.slug ? `/products/${product.slug}` : '/products'}>
                                            {isEn ? 'View Product Page' : 'Lihat Halaman Produk'}
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
