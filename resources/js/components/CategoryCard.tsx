import { Link } from '@inertiajs/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
}

export default function CategoryCard({ category, className }: CategoryCardProps) {
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
            title={category.name}
            className={cn(
                'group relative block w-full select-none rounded-none border-0 bg-transparent transition-all duration-300',
                className
            )}
        >
            {/* Pure Image Container - Unrounded, Borderless, Never Clipped */}
            <div className="relative w-full aspect-square flex items-center justify-center p-3 sm:p-4 bg-muted/20 hover:bg-muted/30 transition-colors rounded-none overflow-visible">
                {category.image ? (
                    <img
                        src={category.image}
                        alt={category.name}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full max-w-full w-auto h-auto object-contain rounded-none transition-transform duration-300 ease-out group-hover:scale-105 select-none pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-light text-2xl uppercase tracking-widest transition-transform duration-300 group-hover:scale-105">
                        {category.name ? category.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                )}
            </div>
        </Link>
    );
}

export function CategoryCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('relative w-full aspect-square p-3 bg-muted/30 rounded-none border-0', className)}>
            <Skeleton className="w-full h-full rounded-none" />
        </div>
    );
}
