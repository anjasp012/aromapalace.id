import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { getStorefrontUrl } from '@/lib/route-resolver';
import {
    Search,
    Plus,
    FileText,
    ExternalLink,
    Edit3,
    Trash2,
    RefreshCw,
    Clock,
    Image,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface ArticleItem {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
    read_time: string;
    excerpt: string;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ArticlesIndexProps {
    articles: {
        data: ArticleItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
    };
    metrics: {
        total_articles: number;
    };
}

export default function AdminArticlesIndex({
    articles,
    filters,
    metrics,
}: ArticlesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<ArticleItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-artikel', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/manajemen-artikel');
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-artikel/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false),
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Artikel &amp; Jurnal"
            subtitle="Kelola konten edukasi wewangian, panduan aroma, dan tips perawatan parfum."
        >
            <div className="space-y-6">
                {/* Metric Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Artikel</CardTitle>
                            <FileText className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_articles}</div>
                            <p className="text-xs text-muted-foreground mt-1">Publikasi jurnal wewangian aktif</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Halaman Publik</CardTitle>
                            <ExternalLink className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <a
                                href={getStorefrontUrl('/articles')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                            >
                                <span>Kunjungi Jurnal Aroma Palace</span>
                                <ExternalLink className="size-3.5" />
                            </a>
                            <p className="text-xs text-muted-foreground mt-1">Dapat dibaca oleh semua pengunjung</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Actions */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari judul atau isi artikel..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9">
                                Cari
                            </Button>
                        </form>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {search !== '' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetSearch}
                                    className="h-9"
                                    title="Reset Pencarian"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" asChild className="h-9">
                                <Link href="/manajemen-artikel/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tulis Artikel Baru</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Articles Table Card */}
                <Card className="py-0">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium">Artikel &amp; Thumbnail</th>
                                    <th className="h-10 px-4 text-left font-medium">Slug</th>
                                    <th className="h-10 px-4 text-left font-medium">Waktu Baca</th>
                                    <th className="h-10 px-4 text-left font-medium">Cuplikan</th>
                                    <th className="h-10 px-4 text-left font-medium">Tanggal</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {articles.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            Tidak ada artikel jurnal ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    articles.data.map((art) => (
                                        <tr key={art.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-11 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                                        {art.thumbnail ? (
                                                            <img
                                                                src={art.thumbnail}
                                                                alt={art.title}
                                                                className="size-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <Image className="size-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <div className="font-semibold line-clamp-1">{art.title}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle font-mono text-muted-foreground">
                                                /{art.slug}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    <span>{art.read_time}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground max-w-sm truncate">
                                                {art.excerpt}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                                                {art.created_at ? new Date(art.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                }) : '-'}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 text-muted-foreground hover:text-foreground"
                                                        title="Lihat Halaman Publik"
                                                    >
                                                        <a
                                                            href={getStorefrontUrl(`/articles/${art.slug}`)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="size-3.5" />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 text-muted-foreground hover:text-foreground"
                                                        title="Edit Artikel"
                                                    >
                                                        <Link href={`/manajemen-artikel/${art.id}/edit`}>
                                                            <Edit3 className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(art)}
                                                        className="size-8 text-destructive hover:bg-destructive/10"
                                                        title="Hapus Artikel"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {articles.links.length > 3 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan {articles.data.length} dari {articles.total} artikel
                            </div>
                            <div className="flex items-center gap-1">
                                {articles.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 text-xs text-muted-foreground"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground font-medium'
                                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Artikel?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus artikel{' '}
                            <span className="font-semibold text-foreground">"{deleteTarget?.title}"</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleDeleteSubmit}
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
