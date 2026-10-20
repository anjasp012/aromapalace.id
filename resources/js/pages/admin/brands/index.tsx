import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    Sparkles,
    Boxes,
    Edit3,
    Trash2,
    RefreshCw,
    Image,
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

interface BrandItem {
    id: number;
    name: string;
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

interface BrandsIndexProps {
    brands: {
        data: BrandItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
    };
    metrics: {
        total_brands: number;
        brands_with_products: number;
    };
}

export default function AdminBrandsIndex({
    brands,
    filters,
    metrics,
}: BrandsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<BrandItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        name: '',
        slug: '',
        thumbnail: '',
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
        router.get('/admin/brands', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/admin/brands');
    };

    const handleOpenCreate = () => {
        setEditingBrand(null);
        form.setData({
            name: '',
            slug: '',
            thumbnail: '',
            description: '',
            description_en: '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleOpenEdit = (brand: BrandItem) => {
        setEditingBrand(brand);
        form.setData({
            name: brand.name,
            slug: brand.slug,
            thumbnail: brand.thumbnail || '',
            description: brand.description || '',
            description_en: brand.description_en || '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBrand) {
            form.put(`/admin/brands/${editingBrand.id}`, {
                onSuccess: () => {
                    setDialogOpen(false);
                    form.reset();
                },
            });
        } else {
            form.post('/admin/brands', {
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
        router.delete(`/admin/brands/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Brand Parfum"
            subtitle="Kelola rumah parfum dan produsen wewangian (Creed, Tom Ford, Maison Margiela, dll)."
        >
            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Brand</CardTitle>
                            <Sparkles className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_brands}</div>
                            <p className="text-xs text-muted-foreground mt-1">Produsen wewangian terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Brand Berisi Produk</CardTitle>
                            <Boxes className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.brands_with_products}</div>
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
                                    placeholder="Cari nama atau slug brand..."
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
                                <span>Tambah Brand</span>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Brands Table Card */}
                <Card className="py-0">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium">Logo / Brand</th>
                                    <th className="h-10 px-4 text-left font-medium">Slug</th>
                                    <th className="h-10 px-4 text-left font-medium">Deskripsi</th>
                                    <th className="h-10 px-4 text-left font-medium">Jumlah Produk</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {brands.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            Tidak ada brand parfum ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    brands.data.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                                        {b.thumbnail ? (
                                                            <img
                                                                src={b.thumbnail}
                                                                alt={b.name}
                                                                className="size-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <Sparkles className="size-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{b.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle font-mono text-muted-foreground">
                                                /{b.slug}
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground max-w-xs truncate">
                                                {b.description || '-'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge variant="outline" className="font-mono">
                                                    {b.products_count} produk
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(b)}
                                                        className="size-8 text-muted-foreground hover:text-foreground"
                                                        title="Edit Brand"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(b)}
                                                        className="size-8 text-destructive hover:bg-destructive/10"
                                                        title="Hapus Brand"
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
                    {brands.links.length > 3 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan {brands.data.length} dari {brands.total} brand
                            </div>
                            <div className="flex items-center gap-1">
                                {brands.links.map((link, idx) => {
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
                            {editingBrand ? 'Edit Brand' : 'Tambah Brand Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Isi detail nama rumah parfum dan logo di bawah ini.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                            <label className="font-medium text-foreground">Nama Brand *</label>
                            <Input
                                type="text"
                                placeholder="Contoh: Maison Francis Kurkdjian"
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
                            <label className="font-medium text-foreground">URL Slug</label>
                            <Input
                                type="text"
                                placeholder="maison-francis-kurkdjian"
                                value={form.data.slug}
                                onChange={(e) => form.setData('slug', slugify(e.target.value))}
                                className="h-9 font-mono"
                            />
                            {form.errors.slug && <p className="text-destructive text-[11px]">{form.errors.slug}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-medium text-foreground">URL Logo / Thumbnail (Opsional)</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="url"
                                    placeholder="https://..."
                                    value={form.data.thumbnail}
                                    onChange={(e) => form.setData('thumbnail', e.target.value)}
                                    className="h-9"
                                />
                                {form.data.thumbnail && (
                                    <div className="size-9 rounded-md border overflow-hidden shrink-0">
                                        <img
                                            src={form.data.thumbnail}
                                            alt="Preview"
                                            className="size-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            {form.errors.thumbnail && <p className="text-destructive text-[11px]">{form.errors.thumbnail}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="font-medium text-foreground">Deskripsi (Indonesia)</label>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">🇮🇩 ID</span>
                            </div>
                            <textarea
                                rows={2}
                                placeholder="Profil rumah parfum atau sejarah brand..."
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
                                placeholder="Perfume house profile, heritage or brand story in English..."
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
                                {form.processing ? 'Menyimpan...' : (editingBrand ? 'Simpan Perubahan' : 'Tambah Brand')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Brand?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus brand{' '}
                            <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
                            {deleteTarget && deleteTarget.products_count > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                    Peringatan: Brand ini masih memiliki {deleteTarget.products_count} produk terdaftar.
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
