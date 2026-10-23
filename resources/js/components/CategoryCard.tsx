import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface CategoryItem {
    id?: number;
    name: string;
    name_en?: string;
    slug: string;
    image: string;
    description?: string;
    description_en?: string;
    productsCount?: number;
}

interface CategoryCardProps {
    category: CategoryItem;
    className?: string;
}

export default function CategoryCard({ category, className }: CategoryCardProps) {
    const { pickText, isEn } = useTranslation();
    const displayName = pickText(category.name, category.name_en);

    return (
        <Link
            href={`/products?category=${category.slug}`}
            prefetch="hover"
            cacheFor={['30s', '1m']}
            className={cn('group block h-full', className)}
        >
            <Card className="overflow-hidden relative aspect-square py-0 gap-0 shadow-none rounded-lg w-full h-full">
                <img
                    src={category.image}
                    alt={displayName}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 text-left pointer-events-none">
                    <h3 className="text-[10px] sm:text-xs font-semibold text-white tracking-tight leading-tight line-clamp-1 sm:line-clamp-2">
                        {displayName}
                    </h3>
                    {category.productsCount !== undefined && (
                        <p className="text-[9px] sm:text-[10px] text-white/80 mt-0.5 font-medium">
                            {category.productsCount} {isEn ? 'Products' : 'Produk'}
                        </p>
                    )}
                </div>
            </Card>
        </Link>
    );
}

export function CategoryCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn('overflow-hidden relative aspect-square py-0 gap-0 shadow-none rounded-lg w-full h-full bg-muted/60', className)}>
            <Skeleton className="w-full h-full" />
            <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 space-y-1.5 pointer-events-none">
                <Skeleton className="h-3 w-3/4 bg-white/40 dark:bg-white/20" />
                <Skeleton className="h-2 w-1/3 bg-white/30 dark:bg-white/10" />
            </div>
        </Card>
    );
}

