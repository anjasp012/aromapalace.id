import { Head } from '@inertiajs/react';
import Layout from '@/components/Layout';
import CategoryCard, { type CategoryItem } from '@/components/CategoryCard';
import { useTranslation } from '@/lib/i18n';

interface CategoriesPageProps {
    categories: CategoryItem[];
}

export default function CategoriesPage({
    categories = [],
}: CategoriesPageProps) {
    const { t, isEn } = useTranslation();
    const activeCategories = categories || [];

    return (
        <Layout>
            <Head>
                <title>{`${t('categories.title')} • Aroma Palace`}</title>
                <meta name="description" content={t('categories.subtitle')} />
            </Head>

            {/* PAGE HEADER BANNER (Consistent with cart.tsx / wishlist.tsx) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'Fragrance' : 'Kategori'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Categories' : 'Wewangian'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t('categories.subtitle')}
                    </p>
                </div>
            </div>

            {/* CATEGORIES GRID - 3 COLUMNS ON MOBILE, 5 COLUMNS ON DESKTOP */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-background min-h-[50vh]">
                {activeCategories.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
                        {activeCategories.map((category) => (
                            <CategoryCard key={category.slug} category={category} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 space-y-3 max-w-md mx-auto">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                            {t('categories.empty_title')}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {t('categories.empty_desc')}
                        </p>
                    </div>
                )}
            </main>
        </Layout>
    );
}
