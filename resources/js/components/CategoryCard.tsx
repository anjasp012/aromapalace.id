import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CategoryItem {
    name: string;
    slug: string;
    image: string;
}

interface CategoryCardProps {
    category: CategoryItem;
    className?: string;
}

export default function CategoryCard({ category, className }: CategoryCardProps) {
    return (
        <Link href={`/products?category=${category.slug}`} className="group block">
            <Card className={cn('overflow-hidden relative aspect-square py-0 gap-0 shadow-none rounded-lg', className)}>
                <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 text-center sm:text-left pointer-events-none">
                    <h3 className="text-[11px] sm:text-xs font-semibold text-white tracking-tight leading-tight line-clamp-2">
                        {category.name}
                    </h3>
                </div>
            </Card>
        </Link>
    );
}
