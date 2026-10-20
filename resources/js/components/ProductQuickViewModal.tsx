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

interface ProductQuickViewModalProps {
    product: ProductItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddToCart?: (product: ProductItem, quantity: number) => void;
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

    useEffect(() => {
        if (open) {
            setQuantity(1);
        }
    }, [open, product]);

    if (!product) return null;

    const handleAdd = () => {
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
        if (onAddToCart) {
            onAddToCart(product, quantity);
        } else {
            window.showCartToast?.(
                isEn
                    ? `${quantity}x ${product.name} (${product.volume || '100ml'}) added to your cart.`
                    : `${quantity}x ${product.name} (${product.volume || '100ml'}) berhasil ditambahkan ke keranjang.`
            );
        }
        onOpenChange(false);
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
                    className="prose prose-neutral dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-muted-foreground [&_p]:my-1"
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
                                {t('catalog.concentration')}: {product.concentration || 'Eau de Parfum'} &bull; {product.volume || '100ml'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex items-baseline gap-2 border-y border-border py-2.5">
                            <span className="text-xl sm:text-2xl font-bold text-foreground">
                                {product.price}
                            </span>
                            {product.originalPrice && (
                                <span className="text-xs line-through text-muted-foreground">
                                    {product.originalPrice}
                                </span>
                            )}
                        </div>

                        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                            {renderDescription(activeDescription)}
                        </div>

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
                                                className="h-7 w-7 p-0 cursor-pointer"
                                                aria-label={isEn ? "Decrease quantity" : "Kurangi jumlah"}
                                            >
                                                &minus;
                                            </Button>
                                            <span className="w-8 text-center font-bold">{quantity}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setQuantity((prev) => prev + 1)}
                                                className="h-7 w-7 p-0 cursor-pointer"
                                                aria-label={isEn ? "Increase quantity" : "Tambah jumlah"}
                                            >
                                                &#43;
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button onClick={handleAdd} size="sm" className="bg-[#4A070B] hover:bg-[#360407] text-white cursor-pointer shadow-none">
                                            {t('product.add_to_cart')}
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
