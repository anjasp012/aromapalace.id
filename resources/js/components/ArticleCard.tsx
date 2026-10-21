import { Link } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface ArticleItem {
    id?: number;
    slug: string;
    title: string;
    title_en?: string;
    thumbnail?: string;
    image?: string;
    readTime: string;
    date: string;
    excerpt: string;
    excerpt_en?: string;
}

interface ArticleCardProps {
    article: ArticleItem;
    className?: string;
}

export default function ArticleCard({ article, className }: ArticleCardProps) {
    const { pickText, isEn } = useTranslation();
    const articleUrl = `/articles/${article.slug}`;
    const thumbnailSrc = article.thumbnail || article.image || '';
    const displayTitle = pickText(article.title, article.title_en);
    const displayExcerpt = pickText(article.excerpt, article.excerpt_en);

    return (
        <Card
            className={cn(
                'group flex flex-col justify-between overflow-hidden border border-border/80 bg-card hover:border-[#4A070B]/40 dark:hover:border-[#E8D0BA]/40 shadow-none hover:shadow-sm transition-all duration-300 rounded-lg py-0 gap-0',
                className
            )}
        >
            <div className="flex flex-col">
                {/* Image Container with smooth hover zoom */}
                <Link
                    href={articleUrl}
                    prefetch="hover"
                    cacheFor={['30s', '1m']}
                    className="block overflow-hidden relative aspect-[16/10] bg-muted"
                >
                    <img
                        src={thumbnailSrc}
                        alt={displayTitle}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                </Link>

                {/* Content */}
                <CardHeader className="p-4 sm:p-5 pb-3 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                        <span>{article.date}</span>
                        <span className="text-muted-foreground/40">&bull;</span>
                        <span>{article.readTime} {isEn ? 'read' : 'baca'}</span>
                    </div>

                    <CardTitle className="text-sm sm:text-base font-bold leading-snug line-clamp-2">
                        <Link
                            href={articleUrl}
                            prefetch="hover"
                            cacheFor={['30s', '1m']}
                            className="hover:text-[#4A070B] dark:hover:text-[#E8D0BA] transition-colors"
                        >
                            {displayTitle}
                        </Link>
                    </CardTitle>

                    <CardDescription className="text-xs leading-relaxed line-clamp-2 text-muted-foreground/90">
                        {displayExcerpt}
                    </CardDescription>
                </CardHeader>
            </div>

            {/* Editorial Footer Link */}
            <CardFooter className="p-4 sm:p-5 pt-0 mt-auto">
                <Link
                    href={articleUrl}
                    prefetch="hover"
                    cacheFor={['30s', '1m']}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground group-hover:text-[#4A070B] dark:group-hover:text-[#E8D0BA] transition-colors cursor-pointer"
                >
                    <span>{isEn ? 'Read More' : 'Baca Selengkapnya'}</span>
                    <svg
                        className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </CardFooter>
        </Card>
    );
}

export function ArticleCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn('flex flex-col justify-between overflow-hidden border border-border/80 bg-card rounded-lg py-0 gap-0', className)}>
            <div className="flex flex-col">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 sm:p-5 pb-3 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            </div>
            <div className="p-4 sm:p-5 pt-0 mt-auto">
                <Skeleton className="h-4 w-28" />
            </div>
        </Card>
    );
}

