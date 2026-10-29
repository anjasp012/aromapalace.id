import { Link } from '@inertiajs/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation, formatCategoryName } from '@/lib/i18n';

export interface ScentItem {
    id?: number;
    name: string;
    name_en?: string;
    slug: string;
    image?: string | null;
    description?: string;
    description_en?: string;
    productsCount?: number;
    type?: string;
}

interface ScentCardProps {
    scent: ScentItem;
    colorIndex?: number;
    className?: string;
    compact?: boolean;
    aspectRatio?: 'portrait' | 'square';
}

function getInitialLetter(name: string): string {
    if (!name) return 'A';
    const clean = name.trim();
    const match = clean.match(/[a-zA-Z]/);
    return match ? match[0].toUpperCase() : clean.charAt(0).toUpperCase();
}

export default function ScentCard({
    scent,
    className,
    compact = false,
    aspectRatio = 'portrait',
}: ScentCardProps) {
    const { pickText, isEn } = useTranslation();
    const rawName = pickText(scent.name, scent.name_en) || scent.name || '';
    const displayName = formatCategoryName(rawName, isEn) || rawName;
    const displayDescription = pickText(scent.description, scent.description_en) || scent.description || '';
    const initial = getInitialLetter(displayName);

    const aspectClass = aspectRatio === 'square' || compact ? 'aspect-square' : 'aspect-[4/5]';

    return (
        <Link
            href={`/products?scent=${encodeURIComponent(scent.slug)}`}
            prefetch="hover"
            cacheFor={['30s', '1m']}
            className={cn('group block h-full select-none rounded-none border-0 bg-transparent', className)}
        >
            <div className="w-full flex flex-col rounded-none border-0">
                {/* Media Container - Sharp (No Rounded) & No Border */}
                <div className={cn('relative w-full overflow-hidden bg-muted/30 rounded-none border-0', aspectClass)}>
                    {scent.image ? (
                        <img
                            src={scent.image}
                            alt={displayName}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded-none transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/20 group-hover:bg-muted/35 transition-colors rounded-none">
                            <span className="font-serif text-2xl sm:text-4xl font-light text-foreground/35 tracking-widest uppercase transition-colors group-hover:text-[#4A070B] dark:group-hover:text-[#E8D0BA]">
                                {initial}
                            </span>
                        </div>
                    )}
                </div>

                {/* Scent Info Direct from Database */}
                <div className={cn('pb-1 flex flex-col', compact ? 'pt-2 text-center' : 'pt-3.5')}>
                    <div className={cn('flex gap-2', compact ? 'flex-col items-center justify-center' : 'items-baseline justify-between')}>
                        <h3 className={cn(
                            'font-serif font-semibold text-foreground tracking-tight group-hover:text-[#4A070B] dark:group-hover:text-[#E8D0BA] transition-colors line-clamp-1',
                            compact ? 'text-xs text-center' : 'text-base sm:text-lg'
                        )}>
                            {displayName}
                        </h3>
                        {!compact && typeof scent.productsCount === 'number' && (
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0 font-medium">
                                {scent.productsCount} {isEn ? 'Products' : 'Produk'}
                            </span>
                        )}
                    </div>

                    {!compact && displayDescription && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
                            {displayDescription}
                        </p>
                    )}

                    {!compact && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/75 group-hover:text-[#4A070B] dark:group-hover:text-[#E8D0BA] transition-colors">
                            <span>{isEn ? 'Explore Scent' : 'Jelajahi Aroma'}</span>
                            <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function ScentCardSkeleton({ className, compact }: { className?: string; compact?: boolean }) {
    return (
        <div className={cn('block h-full select-none rounded-none border-0', className)}>
            <div className={cn('relative w-full overflow-hidden bg-muted/40 rounded-none border-0', compact ? 'aspect-square' : 'aspect-[4/5]')}>
                <Skeleton className="w-full h-full rounded-none" />
            </div>
            <div className="pt-3 pb-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-none" />
                {!compact && <Skeleton className="h-3 w-full rounded-none" />}
            </div>
        </div>
    );
}
