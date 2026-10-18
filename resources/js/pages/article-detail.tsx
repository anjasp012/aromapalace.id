import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import ArticleCard, { type ArticleItem } from '@/components/ArticleCard';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Clock,
    Share2,
    Check,
    ArrowLeft,
    MessageCircle,
} from 'lucide-react';

export interface ArticleDetailData {
    id: number;
    slug: string;
    title: string;
    thumbnail?: string;
    image?: string;
    readTime: string;
    date: string;
    excerpt: string;
    content: string;
}

interface ArticleDetailProps {
    article: ArticleDetailData;
    relatedArticles?: ArticleItem[];
}

export default function ArticleDetail({
    article,
    relatedArticles = [],
}: ArticleDetailProps) {
    const [copied, setCopied] = useState(false);
    const thumbnailSrc = article.thumbnail || article.image || '';

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard?.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleShareWhatsApp = () => {
        if (typeof window !== 'undefined') {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(`Baca artikel "${article.title}" di Aroma Palace:\n${url}`);
            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        }
    };

    // Format content: HTML from TextEditor, or fallback to markdown headers (##), blockquotes (>), lists (-), and paragraphs
    const renderFormattedContent = (content: string) => {
        if (/<[a-z][\s\S]*>/i.test(content)) {
            return (
                <div
                    className="prose prose-neutral dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-foreground/85 font-normal [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:border-l-3 [&_h2]:border-[#4A070B] dark:[&_h2]:border-[#E8D0BA] [&_h2]:pl-3.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-3 [&_blockquote]:my-6 [&_blockquote]:p-4 sm:[&_blockquote]:p-5 [&_blockquote]:rounded-lg [&_blockquote]:border-l-4 [&_blockquote]:border-[#4A070B] dark:[&_blockquote]:border-[#E8D0BA] [&_blockquote]:bg-[#4A070B]/5 dark:[&_blockquote]:bg-[#E8D0BA]/5 [&_blockquote]:italic [&_blockquote]:font-serif [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-4 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-4 [&_ol]:space-y-2 [&_li]:leading-relaxed [&_a]:text-primary [&_a]:underline [&_hr]:my-6 [&_hr]:border-border"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        }

        const sections = content.split('\n\n');

        return sections.map((section, idx) => {
            const trimmed = section.trim();

            if (trimmed.startsWith('## ')) {
                const headingText = trimmed.replace('## ', '');
                return (
                    <h2
                        key={idx}
                        className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-8 mb-4 border-l-3 border-[#4A070B] dark:border-[#E8D0BA] pl-3.5"
                    >
                        {headingText}
                    </h2>
                );
            }

            if (trimmed.startsWith('> ')) {
                const quoteText = trimmed.replace(/^>\s*/, '').replace(/^"|"$/g, '');
                return (
                    <blockquote
                        key={idx}
                        className="my-6 p-4 sm:p-5 rounded-lg border-l-4 border-[#4A070B] dark:border-[#E8D0BA] bg-[#4A070B]/5 dark:bg-[#E8D0BA]/5 italic text-sm sm:text-base text-foreground/90 font-serif leading-relaxed"
                    >
                        &ldquo;{quoteText}&rdquo;
                    </blockquote>
                );
            }

            if (trimmed.startsWith('- ')) {
                const items = trimmed.split('\n').filter((item) => item.trim().startsWith('- '));
                return (
                    <ul key={idx} className="my-4 space-y-2 pl-5 list-disc text-xs sm:text-sm text-foreground/85 leading-relaxed marker:text-[#4A070B] dark:marker:text-[#E8D0BA]">
                        {items.map((it, itemIdx) => {
                            const rawItem = it.replace(/^- /, '');
                            const boldMatch = rawItem.match(/^\*\*(.*?)\*\*(.*)$/);
                            if (boldMatch) {
                                return (
                                    <li key={itemIdx}>
                                        <strong className="text-foreground font-semibold">{boldMatch[1]}</strong>
                                        {boldMatch[2]}
                                    </li>
                                );
                            }
                            return <li key={itemIdx}>{rawItem}</li>;
                        })}
                    </ul>
                );
            }

            return (
                <p
                    key={idx}
                    className="text-sm sm:text-base leading-relaxed text-foreground/85 my-4 font-normal"
                >
                    {trimmed}
                </p>
            );
        });
    };

    return (
        <Layout>
            <Head>
                <title>{`${article.title} - Aroma Palace`}</title>
                <meta name="description" content={article.excerpt} />
            </Head>

            <article className="bg-background min-h-screen pb-20">
                {/* BREADCRUMB NAVIGATION */}
                <div className="border-b border-border/70 bg-muted/20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5">
                        <nav className="flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
                            <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-[#4A070B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Beranda</span>
                            </Link>
                            <span>/</span>
                            <Link href="/articles" className="hover:text-foreground transition-colors">
                                Artikel &amp; Jurnal
                            </Link>
                            <span>/</span>
                            <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                                {article.title}
                            </span>
                        </nav>
                    </div>
                </div>

                {/* 2. ARTICLE HEADER SECTION */}
                <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-6 space-y-4">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight sm:leading-snug">
                        {article.title}
                    </h1>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {article.excerpt}
                    </p>

                    {/* Metadata & Actions */}
                    <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {article.date}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {article.readTime} baca
                            </span>
                        </div>

                        {/* Share Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShareWhatsApp}
                                className="h-8 text-xs gap-1.5 cursor-pointer text-[#4A070B] dark:text-[#E8D0BA] border-border"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className="h-8 text-xs gap-1.5 cursor-pointer border-border"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-600 font-semibold">Tersalin!</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-3.5 h-3.5" />
                                        <span>Salin Tautan</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* 3. THUMBNAIL IMAGE */}
                {thumbnailSrc && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-8">
                        <div className="relative overflow-hidden rounded-xl aspect-[16/9] sm:aspect-[21/10] bg-muted shadow-xs border border-border/80">
                            <img
                                src={thumbnailSrc}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* 4. MAIN ARTICLE CONTENT */}
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        {renderFormattedContent(article.content)}
                    </div>
                </div>

                {/* 5. RELATED ARTICLES SECTION */}
                {relatedArticles.length > 0 && (
                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 border-t border-border/70">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl tracking-tight text-foreground">
                                <span className="font-normal">Artikel &amp;</span>{' '}
                                <span className="font-bold">Jurnal Terkait</span>
                            </h2>
                            <Button asChild variant="ghost" size="sm" className="text-xs">
                                <Link href="/articles">
                                    Baca Semua &rarr;
                                </Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                            {relatedArticles.map((rel) => (
                                <ArticleCard key={rel.slug} article={rel} />
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </Layout>
    );
}
