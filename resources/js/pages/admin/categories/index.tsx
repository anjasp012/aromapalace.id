import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    Tags,
    Boxes,
    Edit3,
    Trash2,
    RefreshCw,
    Image as ImageIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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

interface CategoryItem {
    id: number;
    name: string;
    name_en?: string | null;
    slug: string;
    thumbnail?: string | null;
    description?: string | null;
    description_en?: string | null;
    products_count: number;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface CategoriesIndexProps {
    categories: {
        data: CategoryItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
    };
    metrics: {
        total_categories: number;
        categories_with_products: number;
    };
}

export default function AdminCategoriesIndex({
    categories,
    filters,
    metrics,
}: CategoriesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-kategori', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/manajemen-kategori');
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-kategori/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Kelola Kategori"
            subtitle="Manajemen kategori kelompok aroma parfum, thumbnail foto, dan terjemahan dwibahasa."
        >
            <Head title="Kelola Kategori - Admin Panel" />

            <div className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="py-4">
                        <CardContent className="flex items-center justify-between p-0 px-6">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total Kategori</p>
                                <h3 className="text-2xl font-bold mt-1 text-foreground">{metrics.total_categories}</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Klasifikasi aroma parfum</p>
                            </div>
                            <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Tags className="size-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="flex items-center justify-between p-0 px-6">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Memiliki Produk</p>
                                <h3 className="text-2xl font-bold mt-1 text-foreground">{metrics.categories_with_products}</h3>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Aktif terhubung ke katalog</p>
                            </div>
                            <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Boxes className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Action Toolbar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama, slug, atau deskripsi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9 cursor-pointer">
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
                                    className="h-9 cursor-pointer"
                                    title="Reset Pencarian"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" asChild className="h-9 cursor-pointer">
                                <Link href="/manajemen-kategori/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Kategori</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Categories Table Card */}
                <Card className="py-0">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium w-16">Foto</th>
                                    <th className="h-10 px-4 text-left font-medium">Nama Kategori</th>
                                    <th className="h-10 px-4 text-left font-medium">Slug</th>
                                    <th className="h-10 px-4 text-left font-medium">Deskripsi</th>
                                    <th className="h-10 px-4 text-left font-medium">Jumlah Produk</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {categories.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            Tidak ada kategori parfum ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.data.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
                                            {/* Thumbnail Column */}
                                            <td className="p-4 align-middle">
                                                {cat.thumbnail ? (
                                                    <div className="size-11 rounded-lg border overflow-hidden bg-muted/40 shrink-0 shadow-xs">
                                                        <img
                                                            src={cat.thumbnail}
                                                            alt={cat.name}
                                                            className="size-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="size-11 rounded-lg border border-dashed flex items-center justify-center bg-muted/30 text-muted-foreground/60 shrink-0">
                                                        <ImageIcon className="size-4" />
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-4 align-middle font-medium text-foreground">
                                                <div>{cat.name}</div>
                                                {cat.name_en && (
                                                    <div className="text-[11px] text-muted-foreground font-normal italic">
                                                        EN: {cat.name_en}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle font-mono text-muted-foreground">
                                                /{cat.slug}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground max-w-xs truncate">
                                                {cat.description || '-'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge variant="outline" className="font-mono">
                                                    {cat.products_count} produk
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                                        title="Edit Kategori"
                                                    >
                                                        <Link href={`/manajemen-kategori/${cat.id}/edit`}>
                                                            <Edit3 className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(cat)}
                                                        className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                        title="Hapus Kategori"
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
                    {categories.links.length > 3 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan {categories.data.length} dari {categories.total} kategori
                            </div>
                            <div className="flex items-center gap-1">
                                {categories.links.map((link, idx) => {
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
                        <DialogTitle>Hapus Kategori?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kategori{' '}
                            <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
                            {deleteTarget && deleteTarget.products_count > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                    Peringatan: Kategori ini masih memiliki {deleteTarget.products_count} produk terdaftar.
                                </span>
                            )}
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
