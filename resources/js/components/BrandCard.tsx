import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
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
        <Link href={`/products?brand=${brand.slug}`} className={cn('block h-full group', className)}>
            <Card className="p-2.5 sm:p-4 transition flex flex-col justify-between h-full py-2.5 sm:py-3 gap-0 shadow-none hover:border-foreground/30 rounded-lg w-full">
                <div className="space-y-2 sm:space-y-3">
                    <div className="aspect-square rounded-md overflow-hidden bg-muted">
                        <img
                            src={brand.image}
                            alt={brand.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <div>
                        <h4 className="text-[11px] sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {brand.name}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1 sm:line-clamp-2 mt-0.5 leading-relaxed">
                            {displayDesc}
                        </p>
                    </div>
                </div>
                <div className="pt-2 sm:pt-3 border-t border-border flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground mt-2 sm:mt-3">
                    <span>{brand.collectionsCount} {isEn ? 'Collections' : 'Koleksi'}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </div>
            </Card>
        </Link>
    );
}
