import { Head, Link } from '@inertiajs/react';
import Layout from '@/components/Layout';
import CategoryCard, { type CategoryItem } from '@/components/CategoryCard';
import { useTranslation } from '@/lib/i18n';

interface CategoriesPageProps {
    genders?: CategoryItem[];
    concentrates?: CategoryItem[];
    scents?: CategoryItem[];
    categories?: CategoryItem[];
    searchQuery?: string;
}

export default function CategoriesPage({
    genders = [],
    concentrates = [],
    scents = [],
    categories = [],
    searchQuery = '',
}: CategoriesPageProps) {
    const { t, isEn } = useTranslation();

    // Fallbacks if data passed through single categories array
    const gendersList = genders.length > 0 ? genders : categories.filter((c) => c.type === 'genders');
    const concentratesList = concentrates.length > 0 ? concentrates : categories.filter((c) => c.type === 'concentrates');
    const scentsList = scents.length > 0 ? scents : categories.filter((c) => c.type === 'scents');

    const totalCount = gendersList.length + concentratesList.length + scentsList.length;

    const gridClass = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-6';

    return (
        <Layout>
            <Head>
                <title>{`${isEn ? 'Fragrance Categories' : 'Kategori Wewangian'} • Aroma Palace`}</title>
                <meta
                    name="description"
                    content={
                        isEn
                            ? 'Explore curated luxury fragrances by gender, pure concentration, and signature scent profiles.'
                            : 'Jelajahi wewangian mewah kurasi Aroma Palace berdasarkan gender, tingkat konsentrasi murni, dan karakter profil aroma.'
                    }
                />
            </Head>

            {/* PAGE HEADER BANNER (Matches cart.tsx style) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'Fragrance' : 'Kategori'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Categories' : 'Wewangian'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isEn
                            ? 'Discover artisanal perfumes categorized by target gender, pure extract concentrations, and distinctive olfactory scent families.'
                            : 'Temukan parfum artisanal berkelas yang dikelompokkan berdasarkan preferensi gender, tingkat konsentrasi murni, dan keharuman keluarga aroma.'}
                    </p>
                </div>
            </div>

            {/* MAIN CONTAINER (Matches cart.tsx container structure) */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
                {totalCount === 0 ? (
                    <div className="text-center py-16 px-4 space-y-3 max-w-md mx-auto">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                            {t('categories.empty_title')}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {t('categories.empty_desc')}
                        </p>
                        {searchQuery && (
                            <Link
                                href="/categories"
                                className="inline-block text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] underline"
                            >
                                {isEn ? 'Clear search filter' : 'Bersihkan pencarian'}
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* 1. GENDER SECTION */}
                        {gendersList.length > 0 && (
                            <section id="genders">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                        <span className="font-normal">{isEn ? 'Category' : 'Kategori'}</span>{' '}
                                        <span className="font-bold">{isEn ? 'Gender' : 'Gender'}</span>
                                    </h2>
                                </div>

                                <div className={gridClass}>
                                    {gendersList.map((category, idx) => (
                                        <CategoryCard
                                            key={category.slug}
                                            category={category}
                                            colorIndex={idx}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. CONCENTRATE SECTION */}
                        {concentratesList.length > 0 && (
                            <section id="concentrates">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                        <span className="font-normal">{isEn ? 'Category' : 'Kategori'}</span>{' '}
                                        <span className="font-bold">{isEn ? 'Concentration' : 'Konsentrasi'}</span>
                                    </h2>
                                </div>

                                <div className={gridClass}>
                                    {concentratesList.map((category, idx) => (
                                        <CategoryCard
                                            key={category.slug}
                                            category={category}
                                            colorIndex={idx + 3}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. SCENT SECTION */}
                        {scentsList.length > 0 && (
                            <section id="scents">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                        <span className="font-normal">{isEn ? 'Category' : 'Kategori'}</span>{' '}
                                        <span className="font-bold">{isEn ? 'Scents' : 'Aroma'}</span>
                                    </h2>
                                </div>

                                <div className={gridClass}>
                                    {scentsList.map((scent, idx) => (
                                        <CategoryCard
                                            key={scent.slug}
                                            category={scent}
                                            colorIndex={idx + 7}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
