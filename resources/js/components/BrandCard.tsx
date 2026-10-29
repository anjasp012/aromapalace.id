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
                className="relative flex flex-col h-full rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_4px_24px_rgba(74,7,11,0.45)]"
                style={{
                    background: 'linear-gradient(160deg, #7B0D18 0%, #4A070B 50%, #3a050a 100%)',
                    border: '1.5px solid rgba(218,165,32,0.45)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(218,165,32,0.15)',
                }}
            >
                {/* Gold border highlight */}
                <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                        background: 'linear-gradient(135deg, rgba(218,165,32,0.18) 0%, transparent 50%, rgba(218,165,32,0.08) 100%)',
                    }}
                />

                {/* Logo Area */}
                <div className="flex-1 flex items-center justify-center px-3 pt-4 pb-2 sm:px-4 sm:pt-5 sm:pb-3">
                    <div
                        className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.15)' }}
                    >
                        <img
                            src={brand.image}
                            alt={brand.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
                        />
                    </div>
                </div>

                {/* Brand Name */}
                <div className="px-3 pb-1 sm:px-4 text-center">
                    <h4
                        className="text-[10.5px] sm:text-sm font-extrabold tracking-widest uppercase truncate"
                        style={{
                            color: '#DAA520',
                            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                        }}
                    >
                        {brand.name}
                    </h4>
                </div>

                {/* Footer: Collections count */}
                <div
                    className="mx-3 mb-3 sm:mx-4 sm:mb-4 pt-2 flex items-center justify-between text-[9.5px] sm:text-[11px]"
                    style={{
                        borderTop: '1px solid rgba(218,165,32,0.3)',
                    }}
                >
                    <span
                        className="truncate font-medium"
                        style={{ color: 'rgba(218,165,32,0.8)' }}
                    >
                        {brand.collectionsCount} {isEn ? 'Collections' : 'Koleksi'}
                    </span>
                    <span
                        className="group-hover:translate-x-0.5 transition-transform shrink-0 font-bold"
                        style={{ color: '#DAA520' }}
                    >
                        →
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function BrandCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn('flex flex-col h-full rounded-xl overflow-hidden animate-pulse', className)}
            style={{
                background: 'linear-gradient(160deg, #7B0D18 0%, #4A070B 50%, #3a050a 100%)',
                border: '1.5px solid rgba(218,165,32,0.3)',
            }}
        >
            <div className="flex-1 px-3 pt-4 pb-2 sm:px-4 sm:pt-5 sm:pb-3">
                <div
                    className="w-full aspect-square rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                />
            </div>
            <div className="px-3 pb-1 sm:px-4">
                <Skeleton className="h-3.5 w-3/4 mx-auto bg-[#DAA520]/20" />
            </div>
            <div
                className="mx-3 mb-3 sm:mx-4 sm:mb-4 pt-2 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(218,165,32,0.2)' }}
            >
                <Skeleton className="h-2.5 w-1/3 bg-[#DAA520]/20" />
                <Skeleton className="h-2.5 w-3 bg-[#DAA520]/20" />
            </div>
        </div>
    );
}
