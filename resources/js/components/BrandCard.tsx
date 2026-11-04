import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface BrandItem {
    name: string;
    slug: string;
    description?: string;
    description_en?: string;
    collectionsCount: number;
    image: string;
}

interface BrandCardProps {
    brand: BrandItem;
    className?: string;
}

export default function BrandCard({ brand, className }: BrandCardProps) {
    const { isEn } = useTranslation();

    return (
        <Link
            href={`/products?brand=${brand.slug}`}
            prefetch="hover"
            cacheFor={['30s', '1m']}
            className={cn('block h-full group', className)}
        >
            <Card className="p-2 sm:p-3 transition flex flex-col justify-between h-full py-2 sm:py-2.5 gap-0 shadow-none hover:border-foreground/30 rounded-xl w-full">
                <div className="space-y-1.5 sm:space-y-2">
                    <div
                        className="aspect-square rounded-xl overflow-hidden flex items-center justify-center p-2.5 sm:p-3 relative bg-[#63030E]"
                    >
                        <img
                            src={brand.image}
                            alt={brand.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
                        />
                    </div>
                    <div>
                        <h4 className="text-[11px] sm:text-sm font-bold text-foreground truncate uppercase group-hover:text-primary transition-colors">
                            {brand.name}
                        </h4>
                    </div>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-border flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                    <span className="truncate">{brand.collectionsCount} {isEn ? 'Perfumes' : 'Parfum'}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform shrink-0">&rarr;</span>
                </div>
            </Card>
        </Link>
    );
}

export function BrandCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn('p-2 sm:p-3 flex flex-col justify-between h-full py-2 sm:py-2.5 gap-0 shadow-none rounded-xl w-full', className)}>
            <div className="space-y-1.5 sm:space-y-2">
                <div
                    className="aspect-square w-full rounded-xl animate-pulse opacity-85 bg-[#63030E]"
                />
                <div className="space-y-1">
                    <Skeleton className="h-3.5 w-3/4" />
                </div>
            </div>
            <div className="pt-1.5 sm:pt-2.5 border-t border-border flex items-center justify-between mt-1.5 sm:mt-2.5">
                <Skeleton className="h-2.5 w-1/3" />
                <Skeleton className="h-2.5 w-3" />
            </div>
        </Card>
    );
}
