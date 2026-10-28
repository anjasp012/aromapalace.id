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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface CategoryItem {
    id: number;
    name: string;
    name_en?: string | null;
    type?: string | null;
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
        type?: string;
    };
    metrics: {
        total_categories: number;
        categories_with_products: number;
        total_genders?: number;
        total_concentrates?: number;
        total_scents?: number;
    };
}

export default function AdminCategoriesIndex({
    categories,
    filters,
    metrics,
}: CategoriesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/manajemen-kategori',
            {
                search: search || undefined,
                type: selectedType !== 'all' ? selectedType : undefined,
            },
            { preserveState: true }
        );
    };

    const handleTypeChange = (newType: string) => {
        setSelectedType(newType);
        router.get(
            '/manajemen-kategori',
            {
                search: search || undefined,
                type: newType !== 'all' ? newType : undefined,
            },
            { preserveState: true }
        );
    };

    const handleResetSearch = () => {
        setSearch('');
        setSelectedType('all');
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="py-3">
                        <CardContent className="flex items-center justify-between p-0 px-4">
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Total Kategori</p>
                                <h3 className="text-xl font-bold mt-0.5 text-foreground">{metrics.total_categories}</h3>
                            </div>
                            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Tags className="size-4" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="py-3">
                        <CardContent className="flex items-center justify-between p-0 px-4">
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Gender</p>
                                <h3 className="text-xl font-bold mt-0.5 text-sky-600 dark:text-sky-400">{metrics.total_genders ?? 0}</h3>
                            </div>
                            <div className="size-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                                <span className="text-xs font-bold">GEN</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="py-3">
                        <CardContent className="flex items-center justify-between p-0 px-4">
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Concentrate</p>
                                <h3 className="text-xl font-bold mt-0.5 text-amber-600 dark:text-amber-400">{metrics.total_concentrates ?? 0}</h3>
                            </div>
                            <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <span className="text-xs font-bold">CON</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="py-3">
                        <CardContent className="flex items-center justify-between p-0 px-4">
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Scent</p>
                                <h3 className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{metrics.total_scents ?? 0}</h3>
                            </div>
                            <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <span className="text-xs font-bold">SCE</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Action Toolbar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1 max-w-xl">
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full flex-1">
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

                            <Select value={selectedType} onValueChange={handleTypeChange}>
                                <SelectTrigger className="h-9 w-full sm:w-[170px] text-xs">
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    <SelectItem value="genders">Gender</SelectItem>
                                    <SelectItem value="concentrates">Concentrate</SelectItem>
                                    <SelectItem value="scents">Scent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {(search !== '' || selectedType !== 'all') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetSearch}
                                    className="h-9 cursor-pointer"
                                    title="Reset Pencarian & Filter"
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
                                                <div className="flex items-center gap-2">
                                                    <span>{cat.name}</span>
                                                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 uppercase font-semibold ${
                                                        cat.type === 'concentrates'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                                                            : cat.type === 'scents'
                                                            ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300'
                                                            : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'
                                                    }`}>
                                                        {cat.type || 'genders'}
                                                    </Badge>
                                                </div>
                                                {cat.name_en && (
                                                    <div className="text-[11px] text-muted-foreground font-normal italic mt-0.5">
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
