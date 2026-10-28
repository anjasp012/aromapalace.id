import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
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
}

const CATEGORY_BG_PALETTES = [
    {
        gradient: 'from-[#4A070B] via-[#630E14] to-[#2B0407]',
        text: 'text-rose-100',
        capsule: 'bg-rose-400/20 text-rose-100 border-rose-300/30',
        glow: 'from-rose-500/25 to-transparent',
    },
    {
        gradient: 'from-[#92400E] via-[#B45309] to-[#78350F]',
        text: 'text-amber-100',
        capsule: 'bg-amber-400/20 text-amber-100 border-amber-300/30',
        glow: 'from-amber-500/25 to-transparent',
    },
    {
        gradient: 'from-[#065F46] via-[#047857] to-[#064E3B]',
        text: 'text-emerald-100',
        capsule: 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30',
        glow: 'from-emerald-500/25 to-transparent',
    },
    {
        gradient: 'from-[#1E3A8A] via-[#1D4ED8] to-[#172554]',
        text: 'text-blue-100',
        capsule: 'bg-blue-400/20 text-blue-100 border-blue-300/30',
        glow: 'from-blue-500/25 to-transparent',
    },
    {
        gradient: 'from-[#581C87] via-[#7E22CE] to-[#3B0764]',
        text: 'text-purple-100',
        capsule: 'bg-purple-400/20 text-purple-100 border-purple-300/30',
        glow: 'from-purple-500/25 to-transparent',
    },
    {
        gradient: 'from-[#831843] via-[#BE185D] to-[#500724]',
        text: 'text-pink-100',
        capsule: 'bg-pink-400/20 text-pink-100 border-pink-300/30',
        glow: 'from-pink-500/25 to-transparent',
    },
    {
        gradient: 'from-[#0F766E] via-[#0D9488] to-[#134E4A]',
        text: 'text-teal-100',
        capsule: 'bg-teal-400/20 text-teal-100 border-teal-300/30',
        glow: 'from-teal-500/25 to-transparent',
    },
    {
        gradient: 'from-[#C2410C] via-[#EA580C] to-[#7C2D12]',
        text: 'text-orange-100',
        capsule: 'bg-orange-400/20 text-orange-100 border-orange-300/30',
        glow: 'from-orange-500/25 to-transparent',
    },
    {
        gradient: 'from-[#312E81] via-[#4338CA] to-[#1E1B4B]',
        text: 'text-indigo-100',
        capsule: 'bg-indigo-400/20 text-indigo-100 border-indigo-300/30',
        glow: 'from-indigo-500/25 to-transparent',
    },
];

function getPalette(colorIndex?: number, name?: string) {
    if (typeof colorIndex === 'number' && colorIndex >= 0) {
        return CATEGORY_BG_PALETTES[colorIndex % CATEGORY_BG_PALETTES.length];
    }
    const str = name || '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return CATEGORY_BG_PALETTES[Math.abs(hash) % CATEGORY_BG_PALETTES.length];
}

function getInitialLetter(name: string): string {
    if (!name) return 'A';
    const clean = name.trim();
    const match = clean.match(/[a-zA-Z]/);
    return match ? match[0].toUpperCase() : clean.charAt(0).toUpperCase();
}

export default function CategoryCard({ category, colorIndex, className }: CategoryCardProps) {
    const { pickText, isEn } = useTranslation();
    const rawName = pickText(category.name, category.name_en);
    const displayName = formatCategoryName(rawName, isEn);
    const initial = getInitialLetter(displayName);
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
            className={cn('group block h-full select-none', className)}
        >
            <Card className="overflow-hidden relative aspect-square py-0 gap-0 shadow-none rounded-xl w-full h-full border border-border/70 hover:border-[#4A070B]/40 hover:shadow-md transition-all duration-300 bg-card">
                {category.image ? (
                    <>
                        <img
                            src={category.image}
                            alt={displayName}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 text-left pointer-events-none">
                            <h3 className="text-[10px] sm:text-xs font-semibold text-white tracking-tight leading-tight line-clamp-1 sm:line-clamp-2">
                                {displayName}
                            </h3>
                            {category.productsCount !== undefined && (
                                <p className="text-[9px] sm:text-[10px] text-white/80 mt-0.5 font-medium">
                                    {category.productsCount} {isEn ? 'Products' : 'Produk'}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    /* Initial Letter with Dynamic Alternating Gradient */
                    <div className={cn(
                        'w-full h-full bg-gradient-to-br flex flex-col items-center justify-between p-2.5 sm:p-3 relative overflow-hidden transition-all duration-500 group-hover:scale-[1.02]',
                        palette.gradient
                    )}>
                        <div className={cn('absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br blur-xl opacity-60 pointer-events-none', palette.glow)} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10 pointer-events-none" />

                        <div className="w-full flex justify-end relative z-10">
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-white/50 font-mono font-medium">
                                {category.type === 'scents' ? 'SCENT' : 'COLLECTION'}
                            </span>
                        </div>

                        <div className="flex-1 flex items-center justify-center relative z-10 my-auto">
                            <div className={cn(
                                'size-10 sm:size-12 md:size-13 rounded-full flex items-center justify-center border backdrop-blur-md shadow-md transition-all duration-300 group-hover:scale-110',
                                palette.capsule
                            )}>
                                <span className={cn('font-serif font-black text-xl sm:text-2xl tracking-tight leading-none', palette.text)}>
                                    {initial}
                                </span>
                            </div>
                        </div>

                        <div className="w-full text-center relative z-10 pt-1 pointer-events-none">
                            <h3 className="text-[10px] sm:text-xs font-bold text-white tracking-tight leading-tight line-clamp-1">
                                {displayName}
                            </h3>
                            {category.productsCount !== undefined && (
                                <p className="text-[9px] sm:text-[10px] text-white/75 mt-0.5 font-medium">
                                    {category.productsCount} {isEn ? 'Products' : 'Produk'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </Link>
    );
}

export function CategoryCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn('overflow-hidden relative aspect-square py-0 gap-0 shadow-none rounded-xl w-full h-full bg-muted/60', className)}>
            <Skeleton className="w-full h-full" />
            <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 space-y-1.5 pointer-events-none">
                <Skeleton className="h-3 w-3/4 bg-white/40 dark:bg-white/20 mx-auto" />
                <Skeleton className="h-2 w-1/3 bg-white/30 dark:bg-white/10 mx-auto" />
            </div>
        </Card>
    );
}
