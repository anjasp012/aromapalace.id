import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    Tags,
    Boxes,
    Edit3,
    Trash2,
    RefreshCw,
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
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        name: '',
        name_en: '',
        slug: '',
        description: '',
        description_en: '',
    });

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/categories', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/admin/categories');
    };

    const handleOpenCreate = () => {
        setEditingCategory(null);
        form.setData({
            name: '',
            name_en: '',
            slug: '',
            description: '',
            description_en: '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleOpenEdit = (category: CategoryItem) => {
        setEditingCategory(category);
        form.setData({
            name: category.name,
            name_en: category.name_en || '',
            slug: category.slug,
            description: category.description || '',
            description_en: category.description_en || '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            form.put(`/admin/categories/${editingCategory.id}`, {
                onSuccess: () => {
                    setDialogOpen(false);
                    form.reset();
                },
            });
        } else {
            form.post('/admin/categories', {
                onSuccess: () => {
                    setDialogOpen(false);
                    form.reset();
                },
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/admin/categories/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Kategori Parfum"
            subtitle="Kelola klasifikasi aroma parfum (Woody, Oriental, Floral, Fresh, dll)."
        >
            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
                            <Tags className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_categories}</div>
                            <p className="text-xs text-muted-foreground mt-1">Klasifikasi aktif di toko</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Kategori Berisi Produk</CardTitle>
                            <Boxes className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.categories_with_products}</div>
                            <p className="text-xs text-muted-foreground mt-1">Memiliki minimal 1 parfum</p>
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
                                    placeholder="Cari nama atau slug kategori..."
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

                            <Button size="sm" onClick={handleOpenCreate} className="h-9">
                                <Plus className="size-4 mr-1.5" />
                                <span>Tambah Kategori</span>
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
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            Tidak ada kategori parfum ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.data.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
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
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(cat)}
                                                        className="size-8 text-muted-foreground hover:text-foreground"
                                                        title="Edit Kategori"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(cat)}
                                                        className="size-8 text-destructive hover:bg-destructive/10"
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

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Isi detail nama kategori aroma parfum di bawah ini.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-medium text-foreground">Nama Kategori *</label>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">🇮🇩 ID</span>
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Contoh: Oriental Mewah"
                                    value={form.data.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        form.setData((prev) => ({
                                            ...prev,
                                            name: val,
                                            slug: prev.slug === '' || prev.slug === slugify(prev.name) ? slugify(val) : prev.slug,
                                        }));
                                    }}
                                    className="h-9"
                                    required
                                />
                                {form.errors.name && <p className="text-destructive text-[11px]">{form.errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-medium text-foreground">Nama Kategori (English)</label>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">🇬🇧 EN</span>
                                </div>
                                <Input
                                    type="text"
                                    placeholder="e.g. Luxurious Oriental"
                                    value={form.data.name_en}
                                    onChange={(e) => form.setData('name_en', e.target.value)}
                                    className="h-9"
                                />
                                {form.errors.name_en && <p className="text-destructive text-[11px]">{form.errors.name_en}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-medium text-foreground">URL Slug</label>
                            <Input
                                type="text"
                                placeholder="oriental-spicy"
                                value={form.data.slug}
                                onChange={(e) => form.setData('slug', slugify(e.target.value))}
                                className="h-9 font-mono"
                            />
                            {form.errors.slug && <p className="text-destructive text-[11px]">{form.errors.slug}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="font-medium text-foreground">Deskripsi (Indonesia)</label>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">🇮🇩 ID</span>
                            </div>
                            <textarea
                                rows={2}
                                placeholder="Karakteristik atau keunikan kelompok aroma ini..."
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                className="w-full rounded-md border border-input bg-transparent p-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            {form.errors.description && <p className="text-destructive text-[11px]">{form.errors.description}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="font-medium text-foreground">Deskripsi (English)</label>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">🇬🇧 EN</span>
                            </div>
                            <textarea
                                rows={2}
                                placeholder="Characteristics or distinctive traits of this scent family in English..."
                                value={form.data.description_en}
                                onChange={(e) => form.setData('description_en', e.target.value)}
                                className="w-full rounded-md border border-input bg-transparent p-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            {form.errors.description_en && <p className="text-destructive text-[11px]">{form.errors.description_en}</p>}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" size="sm" disabled={form.processing}>
                                {form.processing ? 'Menyimpan...' : (editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
