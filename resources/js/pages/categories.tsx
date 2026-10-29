import { Head, Link } from '@inertiajs/react';
import Layout from '@/components/Layout';
import CategoryCard, { type CategoryItem } from '@/components/CategoryCard';
import ScentCard, { type ScentItem } from '@/components/ScentCard';
import { useTranslation } from '@/lib/i18n';

interface CategoriesPageProps {
    genders?: CategoryItem[];
    concentrates?: CategoryItem[];
    scents?: ScentItem[];
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
    const scentsList = scents.length > 0 ? scents : (categories.filter((c) => c.type === 'scents') as ScentItem[]);

    const totalCount = gendersList.length + concentratesList.length + scentsList.length;

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

            {/* PAGE HEADER BANNER - Pure Luxury Editorial: No Borders, No Rounded */}
            <div className="bg-background py-10 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-medium">
                        {isEn ? 'The Fragrance Directory' : 'Direktori Wewangian'}
                    </p>
                    <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground font-normal">
                        <span>{isEn ? 'Fragrance' : 'Kategori'}</span>{' '}
                        <span className="font-bold">{isEn ? 'Categories' : 'Wewangian'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isEn
                            ? 'Discover artisanal perfumes categorized by target gender, pure extract concentrations, and distinctive olfactory scent families.'
                            : 'Temukan parfum artisanal berkelas yang dikelompokkan berdasarkan preferensi gender, tingkat konsentrasi murni, dan keharuman keluarga aroma.'}
                    </p>
                </div>
            </div>

            {/* MAIN CONTENT: 3 DISTINCT SECTIONS - No Borders, No Rounded, Pure DB Data */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 bg-background min-h-[50vh] space-y-16 sm:space-y-24">
                {totalCount === 0 ? (
                    <div className="text-center py-20 px-4 space-y-3 max-w-md mx-auto">
                        <h3 className="font-serif text-lg font-bold text-foreground">
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
                                <div className="flex items-end justify-between mb-6 sm:mb-8 pb-2">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                            {isEn ? 'Collection by' : 'Koleksi Berdasarkan'}
                                        </p>
                                        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mt-1">
                                            <span className="font-normal">{isEn ? 'Category' : 'Kategori'}</span>{' '}
                                            <span className="font-bold">{isEn ? 'Gender' : 'Gender'}</span>
                                        </h2>
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium shrink-0">
                                        {gendersList.length} {isEn ? 'Categories' : 'Pilihan'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
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
                                <div className="flex items-end justify-between mb-6 sm:mb-8 pb-2">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                            {isEn ? 'Pure Essence' : 'Kemurnian Esensial'}
                                        </p>
                                        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mt-1">
                                            <span className="font-normal">{isEn ? 'Category' : 'Kategori'}</span>{' '}
                                            <span className="font-bold">{isEn ? 'Concentration' : 'Konsentrasi'}</span>
                                        </h2>
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium shrink-0">
                                        {concentratesList.length} {isEn ? 'Types' : 'Pilihan'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
                                <div className="flex items-end justify-between mb-6 sm:mb-8 pb-2">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                            {isEn ? 'Olfactory Families' : 'Keluarga Aroma'}
                                        </p>
                                        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mt-1">
                                            <span className="font-normal">{isEn ? 'Category' : 'Kategori'}</span>{' '}
                                            <span className="font-bold">{isEn ? 'Scents' : 'Aroma'}</span>
                                        </h2>
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium shrink-0">
                                        {scentsList.length} {isEn ? 'Aromas' : 'Pilihan'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                                    {scentsList.map((scent, idx) => (
                                        <ScentCard
                                            key={scent.slug}
                                            scent={scent}
                                            colorIndex={idx + 7}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </Layout>
    );
}
