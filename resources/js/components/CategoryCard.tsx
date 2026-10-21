import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface CategoryItem {
    name: string;
    name_en?: string;
    slug: string;
    image: string;
}

interface CategoryCardProps {
    category: CategoryItem;
    className?: string;
}

export default function CategoryCard({ category, className }: CategoryCardProps) {
    const { pickText } = useTranslation();
    const displayName = pickText(category.name, category.name_en);

    return (
        <Link
            href={`/products?category=${category.slug}`}
            prefetch="hover"
            cacheFor={['30s', '1m']}
            className={cn('group block', className)}
        >
            <Card className="overflow-hidden relative aspect-square py-0 gap-0 shadow-none rounded-lg w-full h-full">
                <img
                    src={category.image}
                    alt={displayName}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2.5 text-center sm:text-left pointer-events-none">
                    <h3 className="text-[9px] sm:text-xs font-semibold text-white tracking-tight leading-tight line-clamp-1 sm:line-clamp-2">
                        {displayName}
                    </h3>
                </div>
            </Card>
        </Link>
    );
}
