import { Head, Deferred } from '@inertiajs/react';
import Layout from '@/components/Layout';
import BrandCard, { type BrandItem, BrandCardSkeleton } from '@/components/BrandCard';
import { useTranslation } from '@/lib/i18n';

interface BrandsPageProps {
    brands: BrandItem[];
}

export default function BrandsPage({
    brands = [],
}: BrandsPageProps) {
    const { t, isEn } = useTranslation();
    const activeBrands = brands || [];

    return (
        <Layout>
            <Head>
                <title>{`${t('brands.title')} • Aroma Palace`}</title>
                <meta name="description" content={t('brands.subtitle')} />
            </Head>

            {/* PAGE HEADER BANNER (Consistent with cart.tsx / wishlist.tsx) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'Official' : 'Brand &'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Fragrance Brands' : 'Rumah Parfum'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t('brands.subtitle')}
                    </p>
                </div>
            </div>

            {/* BRANDS GRID - 3 COLUMNS ON MOBILE, 5 COLUMNS ON DESKTOP */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-background min-h-[50vh]">
                <Deferred
                    data="brands"
                    fallback={
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <BrandCardSkeleton key={i} />
                            ))}
                        </div>
                    }
                >
                    {activeBrands.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
                            {activeBrands.map((brand) => (
                                <BrandCard key={brand.slug} brand={brand} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-4 space-y-3 max-w-md mx-auto">
                            <h3 className="text-base sm:text-lg font-bold text-foreground">
                                {t('brands.empty_title')}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {t('brands.empty_desc')}
                            </p>
                        </div>
                    )}
                </Deferred>
            </main>
        </Layout>
    );
}
