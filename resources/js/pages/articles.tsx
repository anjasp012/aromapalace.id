import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import ArticleCard, { type ArticleItem, ArticleCardSkeleton } from '@/components/ArticleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ArticlesProps {
    articles: ArticleItem[];
    searchQuery?: string;
}

export default function ArticlesPage({
    articles = [],
    searchQuery = '',
}: ArticlesProps) {
    const { t, isEn } = useTranslation();
    const [search, setSearch] = useState(searchQuery);
    const [isSearching, setIsSearching] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Keep input synchronized if searchQuery prop changes externally
    useEffect(() => {
        setSearch(searchQuery);
    }, [searchQuery]);

    // Cleanup timer on unmount
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

        router.get('/articles', params, {
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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeServerSearch(search);
    };

    const handleClearSearch = () => {
        setSearch('');
        executeServerSearch('');
    };

    return (
        <Layout>
            <Head>
                <title>{isEn ? 'Articles & Fragrance Journal • Aroma Palace' : 'Artikel & Jurnal Wewangian • Aroma Palace'}</title>
                <meta
                    name="description"
                    content={
                        isEn
                            ? 'Curated luxury fragrance articles, guides, and olfactory stories from Aroma Palace.'
                            : 'Kumpulan artikel dan panduan wewangian mewah dari Aroma Palace.'
                    }
                />
            </Head>

            {/* PAGE HEADER BANNER (Consistent with cart, wishlist, products) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'Articles &' : 'Artikel &'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Fragrance Journal' : 'Jurnal Wewangian'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isEn
                            ? 'Global luxury fragrance guides and insights to enrich your olfactory knowledge and perfume collection.'
                            : 'Panduan dan wawasan seputar wewangian mewah dunia untuk melengkapi wawasan olfaktori dan koleksi parfum Anda.'}
                    </p>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
                {/* TOOLBAR: ARTICLE COUNT & SEARCH */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {searchQuery ? (
                                <>
                                    {isEn ? 'Showing results for ' : 'Menampilkan hasil untuk '}{' '}
                                    <strong className="text-foreground font-bold">&ldquo;{searchQuery}&rdquo;</strong> ({articles.length} {isEn ? 'articles' : 'artikel'})
                                </>
                            ) : (
                                <>
                                    {isEn ? 'Showing ' : 'Menampilkan '}{' '}
                                    <strong className="text-foreground font-bold">{articles.length}</strong> {isEn ? 'fragrance articles' : 'artikel wewangian'}
                                </>
                            )}
                        </span>
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearSearch}
                                className="h-6 px-2 text-[11px] text-[#4A070B] dark:text-[#E8D0BA] hover:underline cursor-pointer"
                            >
                                {isEn ? 'Clear Search' : 'Hapus Pencarian'}
                            </Button>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="w-full sm:w-80">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            {isSearching ? (
                                <Loader2 className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] animate-spin absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            ) : (
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            )}
                            <Input
                                type="text"
                                placeholder={isEn ? 'Search fragrance articles...' : 'Cari artikel wewangian...'}
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9 pr-8 text-xs h-9 bg-card border-border/80 shadow-none focus-visible:ring-1 focus-visible:ring-[#4A070B]"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Articles Grid or Skeleton */}
                {!articles || isSearching ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <ArticleCardSkeleton key={i} />
                        ))}
                    </div>
                ) : articles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                        {articles.map((article) => (
                            <ArticleCard key={article.slug} article={article} />
                        ))}
                    </div>
                ) : (
                    <div className="py-16 px-6 text-center space-y-4">
                        <h3 className="text-base font-bold text-foreground">{isEn ? 'No Articles Found' : 'Tidak Ada Artikel Ditemukan'}</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                            {isEn
                                ? 'No articles matched your search keywords.'
                                : 'Tidak ada artikel yang sesuai dengan kata kunci pencarian Anda.'}
                        </p>
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearSearch}
                                className="text-xs rounded-md border-border/80 cursor-pointer"
                            >
                                {isEn ? 'Show All Articles' : 'Tampilkan Semua Artikel'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
