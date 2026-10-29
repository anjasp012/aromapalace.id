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
}

export default function ScentCard({
    scent,
    className,
    compact = false,
}: ScentCardProps) {
    const { pickText, isEn } = useTranslation();
    const rawName = pickText(scent.name, scent.name_en) || scent.name || '';
    const displayName = formatCategoryName(rawName, isEn) || rawName;

    const href = `/products?scent=${encodeURIComponent(scent.slug)}`;

    if (compact) {
        return (
            <Link
                href={href}
                prefetch="hover"
                cacheFor={['30s', '1m']}
                title={displayName}
                className={cn('group block select-none rounded-none border-0 bg-transparent', className)}
            >
                <div className="relative w-full aspect-square flex items-center justify-center p-2.5 bg-muted/20 hover:bg-muted/30 transition-colors rounded-none overflow-visible">
                    {scent.image ? (
                        <img
                            src={scent.image}
                            alt={displayName}
                            loading="lazy"
                            decoding="async"
                            className="max-h-full max-w-full w-auto h-auto object-contain rounded-none transition-transform duration-300 ease-out group-hover:scale-105 pointer-events-none"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-light text-xl uppercase tracking-widest transition-transform duration-300 group-hover:scale-105">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <p className="mt-2 text-xs font-medium text-center text-foreground group-hover:text-[#4A070B] dark:group-hover:text-[#E8D0BA] transition-colors line-clamp-1">
                    {displayName}
                </p>
            </Link>
        );
    }

    // Default categories page: Murni Cuma Gambar Aja, Jangan Kepotong, Rounded-none, Border-0
    return (
        <Link
            href={href}
            prefetch="hover"
            cacheFor={['30s', '1m']}
            title={displayName}
            className={cn(
                'group relative block w-full select-none rounded-none border-0 bg-transparent transition-all duration-300',
                className
            )}
        >
            <div className="relative w-full aspect-square flex items-center justify-center p-3 sm:p-4 bg-muted/20 hover:bg-muted/30 transition-colors rounded-none overflow-visible">
                {scent.image ? (
                    <img
                        src={scent.image}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full max-w-full w-auto h-auto object-contain rounded-none transition-transform duration-300 ease-out group-hover:scale-105 select-none pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-light text-2xl uppercase tracking-widest transition-transform duration-300 group-hover:scale-105">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
        </Link>
    );
}

export function ScentCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('relative w-full aspect-square p-3 bg-muted/30 rounded-none border-0', className)}>
            <Skeleton className="w-full h-full rounded-none" />
        </div>
    );
}
