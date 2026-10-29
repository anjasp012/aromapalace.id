import { Link } from '@inertiajs/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface CategoryItem {
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

interface CategoryCardProps {
    category: CategoryItem;
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

export default function CategoryCard({
    category,
    className,
    compact = false,
    aspectRatio = 'portrait',
}: CategoryCardProps) {
    const { pickText, isEn } = useTranslation();
    const rawName = pickText(category.name, category.name_en) || category.name || '';

    // Tampilkan apa adanya dari database (Men ya Men, Women ya Women, dsb)
    let displayName = rawName;
    const lower = rawName.toLowerCase().trim();
    if (lower === 'men' || category.slug === 'men' || category.slug === 'parfum-pria') {
        displayName = 'Men';
    } else if (lower === 'women' || category.slug === 'women' || category.slug === 'parfum-wanita') {
        displayName = 'Women';
    } else if (lower === 'unisex' || category.slug === 'unisex' || category.slug === 'unisex-fragrance') {
        displayName = 'Unisex';
    }

    const displayDescription = pickText(category.description, category.description_en) || category.description || '';
    const initial = getInitialLetter(displayName);

    const href = category.type === 'scents'
        ? `/products?scent=${encodeURIComponent(category.slug)}`
        : category.type === 'concentrates'
        ? `/products?concentration=${encodeURIComponent(category.slug)}`
        : category.type === 'genders'
        ? `/products?gender=${encodeURIComponent(category.slug)}`
        : `/products?category=${encodeURIComponent(category.slug)}`;

    const aspectClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-[4/5]';

    return (
        <Link
            href={href}
            prefetch="hover"
            cacheFor={['30s', '1m']}
            className={cn('group block h-full select-none rounded-none border-0 bg-transparent', className)}
        >
            <div className="w-full flex flex-col rounded-none border-0">
                {/* Image / Thumbnail Container - Strictly Sharp (No Rounded) & No Border */}
                <div className={cn('relative w-full overflow-hidden bg-muted/30 rounded-none border-0', aspectClass)}>
                    {category.image ? (
                        <img
                            src={category.image}
                            alt={displayName}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded-none transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-muted/20 group-hover:bg-muted/35 transition-colors rounded-none">
                            <span className="font-serif text-3xl sm:text-5xl font-light text-foreground/35 tracking-widest uppercase transition-colors group-hover:text-[#4A070B] dark:group-hover:text-[#E8D0BA]">
                                {initial}
                            </span>
                        </div>
                    )}
                </div>

                {/* Database Metadata - Plain & Direct as in DB */}
                <div className="pt-3.5 pb-1 flex flex-col">
                    <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-foreground tracking-tight group-hover:text-[#4A070B] dark:group-hover:text-[#E8D0BA] transition-colors line-clamp-1">
                            {displayName}
                        </h3>
                        {typeof category.productsCount === 'number' && (
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0 font-medium">
                                {category.productsCount} {isEn ? 'Products' : 'Produk'}
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
                            <span>{isEn ? 'Explore Collection' : 'Jelajahi Koleksi'}</span>
                            <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function CategoryCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('block h-full select-none rounded-none border-0', className)}>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/40 rounded-none border-0">
                <Skeleton className="w-full h-full rounded-none" />
            </div>
            <div className="pt-3.5 pb-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-none" />
                <Skeleton className="h-3 w-full rounded-none" />
            </div>
        </div>
    );
}
