import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation, formatCategoryName } from '@/lib/i18n';

export interface ProductItem {
    id: number;
    name: string;
    slug?: string;
    brand?: string;
    category?: string;
    price: string;
    raw_price?: number;
    originalPrice?: string;
    discountBadge?: string;
    isNew?: boolean;
    isPopular?: boolean;
    rating: number;
    reviewsCount?: number;
    reviews_count?: number;
    image?: string;
    volume?: string;
    concentration?: string;
    longevity?: string;
    sillage?: string;
    mood?: string;
    family?: string;
    in_stock?: boolean;
    tag?: string;
    notes?: {
        top: string;
        heart: string;
        base: string;
    };
    description?: string;
    description_en?: string;
}

interface ProductCardProps {
    product: ProductItem;
    isWishlisted?: boolean;
    onToggleWishlist?: (id: number, name: string) => void;
    onQuickView?: (product: ProductItem) => void;
    onAddToCart?: (product: ProductItem) => void;
    className?: string;
    darkTheme?: boolean;
}

export default function ProductCard({
    product,
    isWishlisted = false,
    onToggleWishlist,
    onQuickView,
    className,
    darkTheme = false,
}: ProductCardProps) {
    const { t, isEn } = useTranslation();
    const { props } = usePage<any>();
    const isAdmin = Boolean(props?.auth?.is_admin || props?.auth?.user?.role === 'admin');

    const reviews = product.reviewsCount ?? product.reviews_count ?? 0;
    const productUrl = product.slug ? `/products/${product.slug}` : `/products/${product.id}`;
    const categoryDisplay = formatCategoryName(product.category || product.family || '', isEn);

    return (
        <Card className={cn('group overflow-hidden flex flex-col py-0 gap-0 border-0 border-none shadow-none rounded-lg bg-transparent', className)}>
            <div className="relative aspect-square bg-muted overflow-hidden rounded-lg">
                <Link
                    href={productUrl}
                    prefetch="hover"
                    cacheFor={['30s', '1m']}
                    className="block w-full h-full cursor-pointer"
                >
                    {product.image && (
                        <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    )}
                </Link>

                {/* Discount & New Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                    {product.discountBadge && (
                        <Badge variant="destructive" className="text-[10px]">
                            {product.discountBadge}
                        </Badge>
                    )}
                    {product.isNew && (
                        <Badge variant="secondary" className="text-[10px]">
                            {isEn ? 'New' : 'Baru'}
                        </Badge>
                    )}
                </div>

                {/* Wishlist Button: Hidden for Admin */}
                {!isAdmin && onToggleWishlist && (
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleWishlist(product.id, product.name);
                        }}
                        className={cn(
                            'absolute top-2 right-2 rounded-full h-7 w-7 transition-all',
                            isWishlisted
                                ? 'text-destructive bg-background'
                                : 'opacity-0 group-hover:opacity-100 bg-background/80'
                        )}
                        aria-label={isWishlisted ? (isEn ? 'Remove from Wishlist' : 'Hapus dari Wishlist') : (isEn ? 'Save to Wishlist' : 'Simpan ke Wishlist')}
                    >
                        <svg className={cn('w-3.5 h-3.5', isWishlisted ? 'fill-current' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </Button>
                )}

                {/* Desktop Quick View Overlay Button */}
                {onQuickView && (
                    <div className="absolute inset-x-3 bottom-3 hidden sm:flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onQuickView(product);
                            }}
                            className="w-full text-xs shadow-none cursor-pointer"
                        >
                            {t('common.quick_view')}
                        </Button>
                    </div>
                )}
            </div>

            <CardContent className="py-3 sm:py-4 px-0 space-y-1">
                {(product.brand || categoryDisplay) && (
                    <p className={cn('text-[11px] truncate', darkTheme ? 'text-white/70' : 'text-muted-foreground')}>
                        {product.brand ? product.brand : ''}
                        {product.brand && categoryDisplay ? ' • ' : ''}
                        {categoryDisplay}
                    </p>
                )}
                <h3
                    className={cn(
                        'font-semibold text-xs sm:text-sm line-clamp-1 transition-colors',
                        darkTheme ? 'text-white hover:text-white/80' : 'text-foreground group-hover:text-primary'
                    )}
                >
                    <Link
                        href={productUrl}
                        prefetch="hover"
                        cacheFor={['30s', '1m']}
                        className=""
                    >
                        {product.name}
                    </Link>
                </h3>

                {/* Harga — tepat di bawah nama produk (mobile: atas-bawah, desktop: berdampingan) */}
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 pt-0.5">
                    <span className={cn('font-bold text-xs sm:text-sm leading-tight', darkTheme ? 'text-white' : 'text-foreground')}>
                        {product.price}
                    </span>
                    {product.originalPrice && (
                        <span className={cn('text-[11px] line-through leading-tight', darkTheme ? 'text-white/60' : 'text-muted-foreground')}>
                            {product.originalPrice}
                        </span>
                    )}
                </div>

                {/* Rating & Ulasan — tepat di bawah harga */}
                <div className={cn('flex items-center gap-1 text-[11px]', darkTheme ? 'text-white/70' : 'text-muted-foreground')}>
                    <span className={darkTheme ? 'text-amber-400' : 'text-amber-500'}>★</span>
                    <span>{Number(product.rating || 5).toFixed(1)}</span>
                    <span>({reviews})</span>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('flex flex-col py-0 gap-0 rounded-lg bg-transparent', className)}>
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="py-3 sm:py-4 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
    );
}
