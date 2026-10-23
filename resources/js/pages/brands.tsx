import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import BrandCard, { type BrandItem } from '@/components/BrandCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface BrandsPageProps {
    brands: BrandItem[];
    searchQuery?: string;
}

export default function BrandsPage({
    brands = [],
    searchQuery = '',
}: BrandsPageProps) {
    const { t, isEn } = useTranslation();
    const [search, setSearch] = useState(searchQuery);
    const [isSearching, setIsSearching] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setSearch(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const executeServerSearch = (query: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        const params: Record<string, string> = {};
        if (query.trim() !== '') {
            params.search = query.trim();
        }

        router.get('/brands', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsSearching(true),
            onFinish: () => setIsSearching(false),
        });
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            executeServerSearch(val);
        }, 350);
    };

    const handleClearSearch = () => {
        setSearch('');
        executeServerSearch('');
    };

    const activeBrands = brands || [];

    return (
        <Layout>
            <Head>
                <title>{`${t('brands.title')} • Aroma Palace`}</title>
                <meta name="description" content={t('brands.subtitle')} />
            </Head>

            {/* BREADCRUMB NAVIGATION */}
            <div className="border-b border-border/70 bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5">
                    <nav className="flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
                        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-[#4A070B] dark:text-[#E8D0BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>{t('nav.home')}</span>
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-foreground truncate">
                            {t('brands.title')}
                        </span>
                    </nav>
                </div>
            </div>

            {/* PAGE HEADER */}
            <section className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
                    <div className="max-w-2xl space-y-2">
                        <Badge variant="secondary" className="gap-1.5 w-fit">
                            <Sparkles className="w-3 h-3 text-[#4A070B] dark:text-[#E8D0BA]" />
                            <span>{isEn ? 'Official Maisons & Ateliers' : 'Rumah Parfum & Brand Resmi'}</span>
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                            {t('brands.title')}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {t('brands.subtitle')}
                        </p>
                    </div>

                    {/* SEARCH INPUT */}
                    <div className="pt-2 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder={t('brands.search_placeholder')}
                                className="pl-10 pr-10 text-xs sm:text-sm h-11 bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                            />
                            {isSearching ? (
                                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                            ) : search ? (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            {/* BRANDS GRID - 3 ITEMS PER ROW CONSISTENT WITH OTHER PAGES */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 bg-background min-h-[50vh]">
                {activeBrands.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                        {activeBrands.map((brand) => (
                            <BrandCard key={brand.slug} brand={brand} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 space-y-4 max-w-md mx-auto">
                        <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Search className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-base sm:text-lg font-bold text-foreground">
                                {t('brands.empty_title')}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {t('brands.empty_desc')}
                            </p>
                        </div>
                        {search && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearSearch}
                                className="text-xs cursor-pointer"
                            >
                                {t('brands.reset_search')}
                            </Button>
                        )}
                    </div>
                )}
            </main>
        </Layout>
    );
}
