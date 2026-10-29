import { Link } from '@inertiajs/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation, formatCategoryName } from '@/lib/i18n';

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
    showTitle?: boolean;
}

export default function CategoryCard({
    category,
    className,
    showTitle = false,
}: CategoryCardProps) {
    const { pickText, isEn } = useTranslation();
    const rawName = pickText(category.name, category.name_en) || category.name || '';
    const displayName = formatCategoryName(rawName, isEn) || rawName;

    const href = category.type === 'scents'
        ? `/products?scent=${encodeURIComponent(category.slug)}`
        : category.type === 'concentrates'
        ? `/products?concentration=${encodeURIComponent(category.slug)}`
        : category.type === 'genders'
        ? `/products?gender=${encodeURIComponent(category.slug)}`
        : `/products?category=${encodeURIComponent(category.slug)}`;

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
            {/* Pure Image Container - Full size, 100% Transparent BG, Never Clipped */}
            <div className="relative w-full aspect-square flex items-center justify-center bg-transparent rounded-none overflow-visible">
                {category.image ? (
                    <img
                        src={category.image}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain rounded-none transition-transform duration-300 ease-out group-hover:scale-105 select-none pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-light text-2xl uppercase tracking-widest transition-transform duration-300 group-hover:scale-105">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {showTitle && (
                <p className="mt-2 text-xs font-medium text-center text-foreground group-hover:text-[#4A070B] dark:group-hover:text-[#E8D0BA] transition-colors line-clamp-1">
                    {displayName}
                </p>
            )}
        </Link>
    );
}

export function CategoryCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('relative w-full aspect-square bg-transparent rounded-none border-0', className)}>
            <Skeleton className="w-full h-full rounded-none" />
        </div>
    );
}
