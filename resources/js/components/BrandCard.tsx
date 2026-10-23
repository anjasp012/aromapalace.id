import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface BrandItem {
    name: string;
    slug: string;
    description: string;
    description_en?: string;
    collectionsCount: number;
    image: string;
}

interface BrandCardProps {
    brand: BrandItem;
    className?: string;
}

export default function BrandCard({ brand, className }: BrandCardProps) {
    const { pickText, isEn } = useTranslation();
    const displayDesc = pickText(brand.description, brand.description_en);

    return (
        <Link
            href={`/products?brand=${brand.slug}`}
            prefetch="hover"
            cacheFor={['30s', '1m']}
            className={cn('block h-full group', className)}
        >
            <Card className="p-2 sm:p-3.5 transition flex flex-col justify-between h-full py-2 sm:py-3 gap-0 shadow-none hover:border-foreground/30 rounded-lg w-full">
                <div className="space-y-1.5 sm:space-y-2.5">
                    <div className="aspect-square rounded-md overflow-hidden bg-muted">
                        <img
                            src={brand.image}
                            alt={brand.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <div>
                        <h4 className="text-[10.5px] sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {brand.name}
                        </h4>
                        <p className="hidden sm:line-clamp-2 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {displayDesc}
                        </p>
                    </div>
                </div>
                <div className="pt-1.5 sm:pt-2.5 border-t border-border flex items-center justify-between text-[9.5px] sm:text-[11px] text-muted-foreground mt-1.5 sm:mt-2.5">
                    <span className="truncate">{brand.collectionsCount} {isEn ? 'Koleksi' : 'Koleksi'}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform shrink-0">&rarr;</span>
                </div>
            </Card>
        </Link>
    );
}

export function BrandCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn('p-2 sm:p-3.5 flex flex-col justify-between h-full py-2 sm:py-3 gap-0 shadow-none rounded-lg w-full', className)}>
            <div className="space-y-1.5 sm:space-y-2.5">
                <Skeleton className="aspect-square w-full rounded-md" />
                <div className="space-y-1">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="hidden sm:block h-3 w-full" />
                </div>
            </div>
            <div className="pt-1.5 sm:pt-2.5 border-t border-border flex items-center justify-between mt-1.5 sm:mt-2.5">
                <Skeleton className="h-2.5 w-1/3" />
                <Skeleton className="h-2.5 w-3" />
            </div>
        </Card>
    );
}
