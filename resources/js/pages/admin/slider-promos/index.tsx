import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    SlidersHorizontal,
    ExternalLink,
    Edit3,
    Trash2,
    RefreshCw,
    Image as ImageIcon,
    Globe,
    Link as LinkIcon,
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

interface SliderPromoItem {
    id: number;
    title: string;
    title_en?: string | null;
    description?: string | null;
    description_en?: string | null;
    link?: string | null;
    thumbnail: string;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface SliderPromosIndexProps {
    sliderPromos: {
        data: SliderPromoItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
    };
    metrics: {
        total_sliders: number;
    };
}

export default function AdminSliderPromosIndex({
    sliderPromos,
    filters,
    metrics,
}: SliderPromosIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<SliderPromoItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-slider-promo', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/manajemen-slider-promo');
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-slider-promo/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Kelola Slider Promo"
            subtitle="Manajemen banner hero bergerak di beranda utama dengan dukungan dwibahasa dan tautan promosi."
        >
            <Head title="Kelola Slider Promo - Admin Panel" />

            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Slider Promo</span>
                                <SlidersHorizontal className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2">{metrics.total_sliders}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Banner promosi yang ditampilkan di rotasi hero beranda
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Pratinjau Beranda</span>
                                <Globe className="size-4 text-primary" />
                            </div>
                            <div className="mt-2">
                                <a
                                    href="/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-base font-bold text-primary hover:underline"
                                >
                                    <span>Lihat Beranda Aroma Palace</span>
                                    <ExternalLink className="size-3.5" />
                                </a>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Buka beranda di tab baru untuk melihat rotasi banner terkini
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Actions Card */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari judul, deskripsi, atau tautan slider..."
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
                                <Link href="/manajemen-slider-promo/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Slider Promo</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Slider Promos Table Card */}
                <Card className="py-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium w-16">No</th>
                                    <th className="h-10 px-4 text-left font-medium">Banner &amp; Judul</th>
                                    <th className="h-10 px-4 text-left font-medium">Versi Bahasa Inggris</th>
                                    <th className="h-10 px-4 text-left font-medium">Tautan (Link)</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {sliderPromos.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <SlidersHorizontal className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">Tidak ada data slider promo ditemukan</p>
                                                <p className="text-xs text-muted-foreground">Coba ubah kata kunci pencarian Anda.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sliderPromos.data.map((slider, index) => (
                                        <tr key={slider.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle text-muted-foreground font-mono">
                                                {(sliderPromos.current_page - 1) * 15 + index + 1}
                                            </td>

                                            {/* Banner & Title (ID) */}
                                            <td className="p-4 align-middle font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 h-12 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                                        {slider.thumbnail ? (
                                                            <img
                                                                src={slider.thumbnail}
                                                                alt={slider.title}
                                                                className="size-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <ImageIcon className="size-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="max-w-xs space-y-1">
                                                        <div className="font-semibold text-foreground line-clamp-1">
                                                            {slider.title}
                                                        </div>
                                                        {slider.description && (
                                                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                                {slider.description}
                                                            </p>
                                                        )}
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                                            ID
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* English Version */}
                                            <td className="p-4 align-middle text-muted-foreground max-w-xs">
                                                {slider.title_en ? (
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-foreground line-clamp-1">
                                                            {slider.title_en}
                                                        </div>
                                                        {slider.description_en && (
                                                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                                {slider.description_en}
                                                            </p>
                                                        )}
                                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                                                            EN
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/60 italic">Tidak diisi</span>
                                                )}
                                            </td>

                                            {/* Target Link */}
                                            <td className="p-4 align-middle font-mono text-[11px]">
                                                {slider.link ? (
                                                    <a
                                                        href={slider.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                                    >
                                                        <LinkIcon className="size-3 shrink-0" />
                                                        <span className="max-w-[160px] truncate">{slider.link}</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">/products</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="ghost" size="icon" asChild className="size-8 cursor-pointer">
                                                        <Link
                                                            href={`/manajemen-slider-promo/${slider.id}/edit`}
                                                            title="Edit Slider Promo"
                                                        >
                                                            <Edit3 className="size-3.5 text-foreground/80 hover:text-foreground" />
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(slider)}
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                        title="Hapus Slider Promo"
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
                    {sliderPromos.links && sliderPromos.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-6 py-4">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan {sliderPromos.data.length > 0 ? (sliderPromos.current_page - 1) * 15 + 1 : 0} sampai{' '}
                                {Math.min(sliderPromos.current_page * 15, sliderPromos.total)} dari {sliderPromos.total} slider promo
                            </div>
                            <div className="flex items-center gap-1">
                                {sliderPromos.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="h-8 min-w-8 px-2.5 text-xs opacity-50"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Button
                                            key={idx}
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
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Slider Promo?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini akan menghapus banner promo &ldquo;
                            <span className="font-semibold text-foreground">{deleteTarget?.title}</span>&rdquo; dari
                            rotasi hero slider di halaman beranda utama. Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isDeleting}
                            className="cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSubmit}
                            disabled={isDeleting}
                            className="cursor-pointer"
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Slider'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
