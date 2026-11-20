import React, { useState, useEffect } from 'react';
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
    GripVertical,
    ChevronUp,
    ChevronDown,
    Check,
    Loader2,
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

interface SliderPromoItem {
    id: number;
    title: string;
    title_en?: string | null;
    description?: string | null;
    description_en?: string | null;
    link?: string | null;
    thumbnail: string;
    sort_order?: number;
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

    // Local items list for instant drag-and-drop reordering feedback
    const [items, setItems] = useState<SliderPromoItem[]>(sliderPromos.data);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [orderSavedSuccess, setOrderSavedSuccess] = useState(false);

    useEffect(() => {
        setItems(sliderPromos.data);
    }, [sliderPromos.data]);

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

    // Save reordered list to database
    const saveNewOrder = (newItems: SliderPromoItem[]) => {
        setItems(newItems);
        setIsSavingOrder(true);
        setOrderSavedSuccess(false);

        const payload = newItems.map((item, idx) => ({
            id: item.id,
            sort_order: idx + 1,
        }));

        router.post(
            '/manajemen-slider-promo/reorder',
            { items: payload },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsSavingOrder(false);
                    setOrderSavedSuccess(true);
                    setTimeout(() => setOrderSavedSuccess(false), 2500);
                },
                onError: () => {
                    setIsSavingOrder(false);
                },
            }
        );
    };

    // HTML5 Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        if (e.dataTransfer.setDragImage && e.currentTarget instanceof HTMLElement) {
            e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
        }
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            handleDragEnd();
            return;
        }

        const reordered = [...items];
        const [movedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, movedItem);

        handleDragEnd();
        saveNewOrder(reordered);
    };

    // Quick move item up or down
    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        const reordered = [...items];
        const [movedItem] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, movedItem);

        saveNewOrder(reordered);
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
                            {/* Save state status indicator */}
                            {isSavingOrder && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                                    <Loader2 className="size-3.5 animate-spin text-primary" />
                                    <span>Menyimpan urutan...</span>
                                </div>
                            )}
                            {orderSavedSuccess && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium px-2 animate-in fade-in">
                                    <Check className="size-3.5" />
                                    <span>Urutan tersimpan!</span>
                                </div>
                            )}

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

                {/* Card Grid Layout (Reorderable like Categories) */}
                {items.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <SlidersHorizontal className="size-10 text-muted-foreground/30" />
                            <p className="text-sm font-medium text-foreground">Tidak ada data slider promo ditemukan</p>
                            <p className="text-xs text-muted-foreground">Coba ubah kata kunci pencarian Anda atau tambahkan slider promo baru.</p>
                            <Button size="sm" asChild className="mt-4">
                                <Link href="/manajemen-slider-promo/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Slider Promo Sekarang</span>
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map((slider, index) => {
                            const isBeingDragged = draggedIndex === index;
                            const isOver = dragOverIndex === index;

                            return (
                                <div
                                    key={slider.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`group relative rounded-xl border bg-card p-4 transition-all duration-200 select-none flex flex-col justify-between ${
                                        isBeingDragged
                                            ? 'opacity-40 scale-95 border-primary border-dashed ring-2 ring-primary/30'
                                            : isOver
                                            ? 'border-primary ring-2 ring-primary/40 shadow-md scale-[1.01]'
                                            : 'hover:shadow-md hover:border-foreground/20'
                                    }`}
                                >
                                    <div>
                                        {/* Card Top: Drag Handle & Order Badge & Arrow controls */}
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                                <GripVertical className="size-4 shrink-0" />
                                                <Badge variant="secondary" className="font-mono text-[11px] px-2 py-0.5 h-5 font-semibold">
                                                    Slide #{index + 1}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {/* Up / Down buttons for mobile accessibility */}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={index === 0 || isSavingOrder}
                                                    onClick={() => handleMove(index, 'up')}
                                                    className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                                    title="Pindah ke Posisi Sebelumnya"
                                                >
                                                    <ChevronUp className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={index === items.length - 1 || isSavingOrder}
                                                    onClick={() => handleMove(index, 'down')}
                                                    className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                                    title="Pindah ke Posisi Berikutnya"
                                                >
                                                    <ChevronDown className="size-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Media Preview Box (16:9 Aspect Ratio) */}
                                        <div className="relative w-full aspect-[16/9] rounded-lg border overflow-hidden bg-muted/40 mb-3.5 shadow-xs">
                                            {slider.thumbnail ? (
                                                isVideoUrl(slider.thumbnail) ? (
                                                    <>
                                                        <video
                                                            src={slider.thumbnail}
                                                            autoPlay
                                                            loop
                                                            muted
                                                            playsInline
                                                            onEnded={(e) => {
                                                                e.currentTarget.currentTime = 0;
                                                                e.currentTarget.play().catch(() => {});
                                                            }}
                                                            className="size-full object-cover"
                                                        />
                                                        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded leading-none">
                                                            VIDEO
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <img
                                                            src={slider.thumbnail}
                                                            alt={slider.title}
                                                            className="size-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                        {isGifUrl(slider.thumbnail) && (
                                                            <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded leading-none">
                                                                GIF
                                                            </span>
                                                        )}
                                                    </>
                                                )
                                            ) : (
                                                <div className="size-full flex items-center justify-center text-muted-foreground/50">
                                                    <ImageIcon className="size-8" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Titles & Descriptions */}
                                        <div className="space-y-2">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5 leading-none">
                                                        ID
                                                    </Badge>
                                                    <h4 className="font-semibold text-sm text-foreground line-clamp-1" title={slider.title}>
                                                        {slider.title}
                                                    </h4>
                                                </div>
                                                {slider.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {slider.description}
                                                    </p>
                                                )}
                                            </div>

                                            {slider.title_en ? (
                                                <div className="pt-1.5 border-t border-border/50">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Badge variant="secondary" className="text-[9px] py-0 px-1 h-3.5 leading-none">
                                                            EN
                                                        </Badge>
                                                        <p className="text-xs font-medium text-foreground/90 line-clamp-1 italic" title={slider.title_en}>
                                                            {slider.title_en}
                                                        </p>
                                                    </div>
                                                    {slider.description_en && (
                                                        <p className="text-[11px] text-muted-foreground/80 line-clamp-1 leading-relaxed">
                                                            {slider.description_en}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-muted-foreground/50 italic">
                                                    Versi bahasa Inggris belum diisi
                                                </p>
                                            )}

                                            {/* Link */}
                                            <div className="pt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <LinkIcon className="size-3 text-muted-foreground/70 shrink-0" />
                                                <a
                                                    href={slider.link || '/products'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-[11px] text-primary hover:underline truncate"
                                                    title={slider.link || '/products'}
                                                >
                                                    {slider.link || '/products'}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-muted-foreground">
                                            {slider.created_at ? new Date(slider.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                        </span>

                                        <div className="flex items-center gap-1.5">
                                            <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs cursor-pointer">
                                                <Link href={`/manajemen-slider-promo/${slider.id}/edit`}>
                                                    <Edit3 className="size-3 mr-1" />
                                                    <span>Edit</span>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteTarget(slider)}
                                                className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                title="Hapus Slider"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
