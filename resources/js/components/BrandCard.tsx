import { Link } from '@inertiajs/react';
import { Skeleton } from '@/components/ui/skeleton';
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
    const { isEn } = useTranslation();

    return (
        <Link
            href={`/products?brand=${brand.slug}`}
            prefetch="hover"
            cacheFor={['30s', '1m']}
            className={cn('block h-full group', className)}
        >
            <div
                className="relative flex flex-col justify-between h-full rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_8px_30px_rgba(74,7,11,0.6)]"
                style={{
                    background: 'radial-gradient(circle at 50% 30%, #5C0710 0%, #3D040A 55%, #250205 100%)',
                    border: '2px solid #C5A059',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
                }}
            >
                {/* Subtle top-corner golden sheen */}
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,232,158,0.2) 0%, transparent 40%, rgba(197,160,89,0.1) 100%)',
                    }}
                />

                {/* 1. Brand Logo (Direct on maroon background, no inner container) */}
                <div className="flex-1 flex items-center justify-center p-3 sm:p-5 pt-4 sm:pt-6 pb-3">
                    <div className="w-full aspect-square max-w-[130px] flex items-center justify-center">
                        <img
                            src={brand.image}
                            alt={brand.name}
                            loading="lazy"
                            decoding="async"
                            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                            style={{
                                filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.65))',
                            }}
                        />
                    </div>
                </div>

                {/* 2. Brand Name with Metallic Gold Effect */}
                <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-3 text-center">
                    <h4
                        className="font-serif text-[11px] sm:text-sm md:text-[15px] font-bold tracking-[0.14em] uppercase truncate"
                        style={{
                            background: 'linear-gradient(180deg, #FFF3BF 0%, #F0CE68 30%, #D4A937 65%, #9E7418 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
                            display: 'block',
                        }}
                    >
                        {brand.name}
                    </h4>
                </div>

                {/* 3. Footer Divider & Collections Count */}
                <div
                    className="mx-2.5 mb-2.5 sm:mx-4 sm:mb-3.5 pt-2 sm:pt-2.5 flex items-center justify-between text-[10px] sm:text-xs"
                    style={{
                        borderTop: '1px solid rgba(197, 160, 89, 0.4)',
                    }}
                >
                    <span
                        className="truncate font-serif tracking-wide"
                        style={{ color: '#DFC48A' }}
                    >
                        {brand.collectionsCount} {isEn ? 'Koleksi' : 'Koleksi'}
                    </span>
                    <span
                        className="group-hover:translate-x-1 transition-transform shrink-0 font-bold ml-1"
                        style={{ color: '#DFC48A' }}
                    >
                        &rarr;
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function BrandCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn('flex flex-col justify-between h-full rounded-2xl overflow-hidden animate-pulse', className)}
            style={{
                background: 'radial-gradient(circle at 50% 30%, #5C0710 0%, #3D040A 55%, #250205 100%)',
                border: '2px solid rgba(197, 160, 89, 0.5)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            }}
        >
            <div className="flex-1 flex items-center justify-center p-3 sm:p-5 pt-4 sm:pt-6">
                <div
                    className="w-full aspect-square max-w-[130px] rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                />
            </div>
            <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-3">
                <Skeleton className="h-4 w-3/4 mx-auto bg-[#D4A937]/25" />
            </div>
            <div
                className="mx-2.5 mb-2.5 sm:mx-4 sm:mb-3.5 pt-2 sm:pt-2.5 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(197, 160, 89, 0.3)' }}
            >
                <Skeleton className="h-3 w-1/3 bg-[#D4A937]/25" />
                <Skeleton className="h-3 w-3 bg-[#D4A937]/25" />
            </div>
        </div>
    );
}
