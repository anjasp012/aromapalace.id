import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    LayoutTemplate,
    ExternalLink,
    Edit3,
    Trash2,
    RefreshCw,
    Image as ImageIcon,
    Globe,
    Link as LinkIcon,
    CheckCircle2,
    XCircle,
    Eye,
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
import { isVideoUrl, isGifUrl } from '@/lib/utils';

interface BannerItem {
    id: number;
    subtitle?: string | null;
    subtitle_en?: string | null;
    title: string;
    title_en?: string | null;
    description?: string | null;
    description_en?: string | null;
    image: string;
    button_text?: string | null;
    button_text_en?: string | null;
    button_link?: string | null;
    secondary_button_text?: string | null;
    secondary_button_text_en?: string | null;
    secondary_button_link?: string | null;
    is_active: boolean;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface BannersIndexProps {
    banners: {
        data: BannerItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
    };
    metrics: {
        total_banners: number;
        active_banners: number;
    };
}

export default function AdminBannersIndex({
    banners,
    filters,
    metrics,
}: BannersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<BannerItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-banner', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/manajemen-banner');
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-banner/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const handleToggleActive = (banner: BannerItem) => {
        setTogglingId(banner.id);
        router.patch(`/manajemen-banner/${banner.id}/toggle-active`, {}, {
            preserveScroll: true,
            onFinish: () => setTogglingId(null),
        });
    };

    const activeBanner = banners.data.find((b) => b.is_active);

    return (
        <AdminLayout
            title="Kelola Banner Promosi"
            subtitle="Manajemen banner promo khusus di beranda (Exclusive Offer) dengan kontrol judul, subtitle, deskripsi, gambar/video, dan arahan tombol."
        >
            <Head title="Kelola Banner - Admin Panel" />

            <div className="space-y-6">
                {/* 1. Metrics & Action Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Banner
                            </CardTitle>
                            <LayoutTemplate className="size-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_banners}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Konten banner promosi tengah yang tersimpan di sistem
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Banner Aktif
                            </CardTitle>
                            <CheckCircle2 className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{metrics.active_banners}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Ditampilkan langsung di section penawaran khusus beranda
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Live Storefront Preview */}
                {activeBanner && (
                    <Card className="border border-border/80 shadow-xs overflow-hidden">
                        <CardHeader className="bg-muted/40 pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="size-4 text-primary" />
                                    <CardTitle className="text-sm font-semibold">Pratinjau Banner Aktif di Beranda</CardTitle>
                                </div>
                                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    Sedang Ditampilkan
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 bg-muted/20">
                            <div className="bg-primary text-primary-foreground p-6 sm:p-8 rounded-xl shadow-sm overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                    <div className="md:col-span-7 space-y-3">
                                        {activeBanner.subtitle && (
                                            <Badge variant="secondary" className="w-fit text-xs">
                                                {activeBanner.subtitle}
                                            </Badge>
                                        )}
                                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                                            {activeBanner.title}
                                        </h3>
                                        {activeBanner.description && (
                                            <p className="text-xs sm:text-sm opacity-90 max-w-md leading-relaxed">
                                                {activeBanner.description}
                                            </p>
                                        )}
                                        <div className="pt-2 flex flex-wrap gap-2.5">
                                            {activeBanner.button_link && (
                                                <Button variant="secondary" size="sm" asChild>
                                                    <a href={activeBanner.button_link} target="_blank" rel="noreferrer">
                                                        <span>{activeBanner.button_text || 'Belanja Promo'}</span>
                                                        <ExternalLink className="size-3.5 ml-1.5" />
                                                    </a>
                                                </Button>
                                            )}
                                            {activeBanner.secondary_button_link && (
                                                <Button variant="outline" size="sm" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                                                    <a href={activeBanner.secondary_button_link} target="_blank" rel="noreferrer">
                                                        <span>{activeBanner.secondary_button_text || 'Cek Keranjang'}</span>
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="md:col-span-5 flex justify-center lg:justify-end">
                                        <div className="relative w-full h-36 sm:h-48 rounded-xl overflow-hidden border border-primary-foreground/20 bg-black/10 flex items-center justify-center">
                                            {activeBanner.image ? (
                                                isVideoUrl(activeBanner.image) ? (
                                                    <video
                                                        src={activeBanner.image}
                                                        autoPlay
                                                        loop
                                                        muted
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <img
                                                        src={activeBanner.image}
                                                        alt={activeBanner.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )
                                            ) : (
                                                <div className="text-xs opacity-75">Tidak ada gambar</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 3. Search & Add Action Bar */}
                <Card className="shadow-xs">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
                        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-80">
                            <div className="relative w-full">
                                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari judul, subtitle, atau tautan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 text-xs h-9"
                                />
                            </div>
                            <Button type="submit" size="sm" variant="secondary" className="h-9 cursor-pointer">
                                Cari
                            </Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleResetSearch}
                                    className="h-9 text-xs"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    Reset
                                </Button>
                            )}
                        </form>

                        <Button size="sm" asChild className="w-full sm:w-auto h-9">
                            <Link href="/manajemen-banner/create" className="flex items-center gap-1.5">
                                <Plus className="size-4" />
                                <span>Tambah Banner Baru</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* 4. Banner Table List */}
                <Card className="shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                                    <th className="h-10 px-4 text-left font-medium w-12">#</th>
                                    <th className="h-10 px-4 text-left font-medium">Banner Media &amp; Judul</th>
                                    <th className="h-10 px-4 text-left font-medium">Versi Bahasa Inggris</th>
                                    <th className="h-10 px-4 text-left font-medium">Arahan Tombol</th>
                                    <th className="h-10 px-4 text-center font-medium">Status</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {banners.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <LayoutTemplate className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">Tidak ada data banner ditemukan</p>
                                                <p className="text-xs text-muted-foreground">Coba ubah kata kunci pencarian Anda atau buat banner baru.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    banners.data.map((banner, index) => (
                                        <tr key={banner.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle text-muted-foreground font-mono">
                                                {(banners.current_page - 1) * 15 + index + 1}
                                            </td>

                                            {/* Media & Judul */}
                                            <td className="p-4 align-middle font-medium text-foreground">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 h-14 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                                                        {banner.image ? (
                                                            isVideoUrl(banner.image) ? (
                                                                <>
                                                                    <video
                                                                        src={banner.image}
                                                                        autoPlay
                                                                        loop
                                                                        muted
                                                                        playsInline
                                                                        className="size-full object-cover"
                                                                    />
                                                                    <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-bold text-white px-1 py-0.5 rounded leading-none">
                                                                        VID
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <img
                                                                        src={banner.image}
                                                                        alt={banner.title}
                                                                        className="size-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                    {isGifUrl(banner.image) && (
                                                                        <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-bold text-white px-1 py-0.5 rounded leading-none">
                                                                            GIF
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )
                                                        ) : (
                                                            <ImageIcon className="size-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="max-w-xs space-y-1">
                                                        {banner.subtitle && (
                                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-muted/40 font-normal">
                                                                {banner.subtitle}
                                                            </Badge>
                                                        )}
                                                        <div className="font-semibold text-foreground line-clamp-1">
                                                            {banner.title}
                                                        </div>
                                                        {banner.description && (
                                                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                                {banner.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* English Version */}
                                            <td className="p-4 align-middle text-muted-foreground max-w-xs">
                                                {banner.title_en ? (
                                                    <div className="space-y-1">
                                                        {banner.subtitle_en && (
                                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                                {banner.subtitle_en}
                                                            </div>
                                                        )}
                                                        <div className="font-medium text-foreground line-clamp-1 flex items-center gap-1">
                                                            <Globe className="size-3 text-muted-foreground shrink-0" />
                                                            <span>{banner.title_en}</span>
                                                        </div>
                                                        {banner.description_en && (
                                                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                                {banner.description_en}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/60 italic text-[11px]">
                                                        Belum diterjemahkan
                                                    </span>
                                                )}
                                            </td>

                                            {/* Arahan Tombol */}
                                            <td className="p-4 align-middle">
                                                <div className="space-y-1 text-[11px]">
                                                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                        <LinkIcon className="size-3 text-primary shrink-0" />
                                                        <span>{banner.button_text || 'Belanja Promo'}:</span>
                                                        <code className="bg-muted px-1 py-0.5 rounded text-[10px] text-primary">
                                                            {banner.button_link || '/products?discount=1'}
                                                        </code>
                                                    </div>
                                                    {banner.secondary_button_link && (
                                                        <div className="text-muted-foreground text-[10px]">
                                                            Sekunder: {banner.secondary_button_text} ({banner.secondary_button_link})
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4 align-middle text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleActive(banner)}
                                                    disabled={togglingId === banner.id}
                                                    className="h-7 text-xs px-2 cursor-pointer"
                                                >
                                                    {banner.is_active ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 font-medium">
                                                            <CheckCircle2 className="size-3 mr-1" />
                                                            Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground font-normal">
                                                            <XCircle className="size-3 mr-1" />
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </td>

                                            {/* Aksi */}
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 cursor-pointer"
                                                        asChild
                                                    >
                                                        <Link href={`/manajemen-banner/${banner.id}/edit`}>
                                                            <Edit3 className="size-3.5" />
                                                            <span className="sr-only">Edit Banner</span>
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(banner)}
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        <span className="sr-only">Hapus Banner</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {banners.last_page > 1 && (
                        <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                                Menampilkan halaman <span className="font-medium text-foreground">{banners.current_page}</span> dari{' '}
                                <span className="font-medium text-foreground">{banners.last_page}</span>
                            </div>
                            <div className="flex gap-1">
                                {banners.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        asChild={Boolean(link.url)}
                                        className="h-8 px-3 text-xs"
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Banner</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus banner <strong>{deleteTarget?.title}</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSubmit}
                            disabled={isDeleting}
                            className="cursor-pointer"
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Banner'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

