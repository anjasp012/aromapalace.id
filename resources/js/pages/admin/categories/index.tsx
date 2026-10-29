import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    Boxes,
    Edit3,
    Trash2,
    RefreshCw,
    Image as ImageIcon,
    Users,
    FlaskConical,
    Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
        total_in_type?: number;
        with_products_in_type?: number;
        total_categories?: number;
        categories_with_products?: number;
    };
}

const typeMeta: Record<string, {
    title: string;
    subtitle: string;
    headTitle: string;
    itemName: string;
    metricLabel: string;
    emptyText: string;
    icon: React.ComponentType<{ className?: string }>;
}> = {
    genders: {
        title: 'Kelola Gender',
        subtitle: 'Manajemen klasifikasi target pengguna parfum (Pria, Wanita, Unisex), foto thumbnail, dan terjemahan.',
        headTitle: 'Kelola Gender - Admin Panel',
        itemName: 'Gender',
        metricLabel: 'Total Gender',
        emptyText: 'Tidak ada data gender parfum ditemukan.',
        icon: Users,
    },
    concentrates: {
        title: 'Kelola Konsentrasi Parfum',
        subtitle: 'Manajemen tingkat konsentrasi kepekatan aroma parfum (Extrait, Eau de Parfum, Eau de Toilette, dll).',
        headTitle: 'Kelola Konsentrasi - Admin Panel',
        itemName: 'Konsentrasi',
        metricLabel: 'Total Konsentrasi',
        emptyText: 'Tidak ada data konsentrasi parfum ditemukan.',
        icon: FlaskConical,
    },
    scents: {
        title: 'Kelola Scent & Aroma',
        subtitle: 'Manajemen kelompok aroma dan notes karakter parfum (Woody, Fresh, Floral, Gourmand, dll).',
        headTitle: 'Kelola Scent & Aroma - Admin Panel',
        itemName: 'Scent',
        metricLabel: 'Total Scent',
        emptyText: 'Tidak ada data scent / aroma parfum ditemukan.',
        icon: Sparkles,
    },
};

export default function AdminCategoriesIndex({
    categories,
    filters,
    metrics,
}: CategoriesIndexProps) {
    const currentType = filters.type || 'genders';
    const meta = typeMeta[currentType] || typeMeta.genders;
    const MetaIcon = meta.icon;

    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/manajemen-kategori',
            {
                search: search || undefined,
                type: currentType,
            },
            { preserveState: true }
        );
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/manajemen-kategori', { type: currentType });
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
            title={meta.title}
            subtitle={meta.subtitle}
        >
            <Head title={meta.headTitle} />

            <div className="space-y-6">
                {/* Dedicated Metrics Cards for current category type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{meta.metricLabel}</span>
                                <MetaIcon className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">
                                {metrics.total_in_type ?? categories.total}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Klasifikasi {meta.itemName.toLowerCase()} terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Digunakan Produk</span>
                                <Boxes className="size-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">
                                {metrics.with_products_in_type ?? 0}
                            </div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Aktif terhubung ke katalog produk</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Action Toolbar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder={`Cari nama ${meta.itemName.toLowerCase()}, slug, atau deskripsi...`}
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
                                <Link href={`/manajemen-kategori/create?type=${currentType}`}>
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah {meta.itemName}</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Categories Table Card */}
                <Card className="py-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium w-16">Foto</th>
                                    <th className="h-10 px-4 text-left font-medium">Nama {meta.itemName}</th>
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
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <MetaIcon className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">{meta.emptyText}</p>
                                                <p className="text-xs text-muted-foreground">Belum ada data atau kata kunci pencarian tidak ditemukan.</p>
                                            </div>
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
                                                <div className="font-semibold text-sm">{cat.name}</div>
                                                {cat.name_en && (
                                                    <div className="text-[11px] text-muted-foreground font-normal italic mt-0.5">
                                                        EN: {cat.name_en}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-4 align-middle text-muted-foreground font-mono text-[11px]">
                                                {cat.slug}
                                            </td>

                                            <td className="p-4 align-middle text-muted-foreground max-w-xs truncate">
                                                {cat.description || '-'}
                                            </td>

                                            <td className="p-4 align-middle">
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {cat.products_count} Produk
                                                </Badge>
                                            </td>

                                            <td className="p-4 align-middle text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="ghost" size="icon" asChild className="size-8 text-muted-foreground hover:text-foreground cursor-pointer" title={`Edit ${meta.itemName}`}>
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
                                                        title={`Hapus ${meta.itemName}`}
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
                    {categories.links && categories.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t px-4 py-3 gap-3">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan halaman <span className="font-medium text-foreground">{categories.current_page}</span> dari{' '}
                                <span className="font-medium text-foreground">{categories.last_page}</span> (Total{' '}
                                <span className="font-medium text-foreground">{categories.total}</span> {meta.itemName.toLowerCase()})
                            </div>
                            <div className="flex items-center gap-1">
                                {categories.links.map((link, i) =>
                                    link.url ? (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            asChild
                                            className="h-8 min-w-8 px-2.5 text-xs cursor-pointer"
                                        >
                                            <Link
                                                href={link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        </Button>
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 text-xs text-muted-foreground/40 rounded border border-transparent"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal Dialog Konfirmasi Hapus */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus {meta.itemName}?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus {meta.itemName.toLowerCase()} &ldquo;{deleteTarget?.name}&rdquo;?
                            {deleteTarget && deleteTarget.products_count > 0 && (
                                <span className="block mt-2 text-destructive font-medium">
                                    Peringatan: {meta.itemName} ini terhubung dengan {deleteTarget.products_count} produk parfum!
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSubmit}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Menghapus...' : `Hapus ${meta.itemName}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
