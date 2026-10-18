import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface BrandItem {
    name: string;
    slug: string;
    description: string;
    collectionsCount: number;
    image: string;
}

interface BrandCardProps {
    brand: BrandItem;
    className?: string;
}

export default function BrandCard({ brand, className }: BrandCardProps) {
    return (
        <Link href={`/products?brand=${brand.slug}`} className="block h-full group">
            <Card className={cn('p-3 sm:p-4 transition flex flex-col justify-between h-full py-3 gap-0 shadow-none hover:border-foreground/30 rounded-lg', className)}>
                <div className="space-y-3">
                    <div className="aspect-square rounded-md overflow-hidden bg-muted">
                        <img
                            src={brand.image}
                            alt={brand.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {brand.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {brand.description}
                        </p>
                    </div>
                </div>
                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground mt-3">
                    <span>{brand.collectionsCount} Koleksi</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </div>
            </Card>
        </Link>
    );
}
