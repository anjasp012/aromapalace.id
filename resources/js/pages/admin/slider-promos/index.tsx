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

                {/* Card Grid Layout (Reorderable - 4 Items Per Row with Language Tabs) */}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {items.map((slider, index) => {
                            const isBeingDragged = draggedIndex === index;
                            const isOver = dragOverIndex === index;

                            return (
                                <SliderPromoCardItem
                                    key={slider.id}
                                    slider={slider}
                                    index={index}
                                    totalItems={items.length}
                                    isBeingDragged={isBeingDragged}
                                    isOver={isOver}
                                    isSavingOrder={isSavingOrder}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onMove={handleMove}
                                    onDelete={setDeleteTarget}
                                />
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

interface SliderPromoCardItemProps {
    slider: SliderPromoItem;
    index: number;
    totalItems: number;
    isBeingDragged: boolean;
    isOver: boolean;
    isSavingOrder: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
    onDelete: (slider: SliderPromoItem) => void;
}

function SliderPromoCardItem({
    slider,
    index,
    totalItems,
    isBeingDragged,
    isOver,
    isSavingOrder,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
    onMove,
    onDelete,
}: SliderPromoCardItemProps) {
    const [activeLang, setActiveLang] = useState<'id' | 'en'>('id');

    const currentTitle = activeLang === 'id' ? slider.title : slider.title_en;
    const currentDesc = activeLang === 'id' ? slider.description : slider.description_en;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            className={`group relative flex flex-col justify-between rounded-xl border bg-card p-3.5 transition-all duration-200 select-none ${
                isBeingDragged
                    ? 'opacity-40 scale-95 border-primary border-dashed ring-2 ring-primary/30'
                    : isOver
                    ? 'border-primary ring-2 ring-primary/40 shadow-md scale-[1.01]'
                    : 'hover:shadow-md hover:border-foreground/20'
            }`}
        >
            <div className="space-y-3">
                {/* Header: Drag handle, Order Badge, & Quick move controls */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                        <GripVertical className="size-4 shrink-0" />
                        <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0 h-5 font-semibold">
                            #{index + 1}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === 0 || isSavingOrder}
                            onClick={() => onMove(index, 'up')}
                            className="size-6 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                            title="Pindah ke Atas / Depan"
                        >
                            <ChevronUp className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === totalItems - 1 || isSavingOrder}
                            onClick={() => onMove(index, 'down')}
                            className="size-6 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                            title="Pindah ke Bawah / Belakang"
                        >
                            <ChevronDown className="size-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Media Preview (16:9 aspect ratio) */}
                <div className="relative aspect-video w-full rounded-lg border overflow-hidden bg-muted/40">
                    {isVideoUrl(slider.thumbnail) ? (
                        <video
                            src={slider.thumbnail}
                            muted
                            loop
                            autoPlay
                            playsInline
                            className="size-full object-cover"
                        />
                    ) : (
                        <img
                            src={slider.thumbnail}
                            alt={slider.title}
                            className="size-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                    )}
                    {isVideoUrl(slider.thumbnail) && (
                        <Badge variant="secondary" className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0 bg-black/70 text-white border-none backdrop-blur-xs">
                            Video
                        </Badge>
                    )}
                </div>

                {/* Language Tabs: [🇮🇩 Indonesia] [🇬🇧 English] */}
                <div className="flex items-center gap-1 p-0.5 bg-muted/70 rounded-md border text-[11px] font-medium">
                    <button
                        type="button"
                        onClick={() => setActiveLang('id')}
                        className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                            activeLang === 'id'
                                ? 'bg-background text-foreground shadow-xs font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span>🇮🇩</span>
                        <span>Indonesia</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveLang('en')}
                        className={`flex-1 py-1 px-2 rounded text-center transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                            activeLang === 'en'
                                ? 'bg-background text-foreground shadow-xs font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <span>🇬🇧</span>
                        <span>English</span>
                        {slider.title_en ? (
                            <span className="size-1.5 rounded-full bg-emerald-500 ml-0.5" title="Terjemahan tersedia" />
                        ) : null}
                    </button>
                </div>

                {/* Content according to active language */}
                <div className="space-y-1 min-h-[52px]">
                    <h4 className="font-semibold text-sm text-foreground line-clamp-1" title={currentTitle || ''}>
                        {currentTitle || (
                            <span className="text-muted-foreground italic font-normal text-xs">
                                {activeLang === 'en' ? 'Belum ada judul bahasa Inggris' : 'Tanpa judul'}
                            </span>
                        )}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {currentDesc || (
                            <span className="italic opacity-60">
                                {activeLang === 'en' ? 'Belum ada deskripsi bahasa Inggris' : 'Tanpa deskripsi'}
                            </span>
                        )}
                    </p>
                </div>

                {/* Promotional Link (if any) */}
                <div className="pt-1 border-t text-[11px]">
                    {slider.link ? (
                        <a
                            href={slider.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline truncate"
                            title={slider.link}
                        >
                            <LinkIcon className="size-3 shrink-0" />
                            <span className="truncate">{slider.link}</span>
                            <ExternalLink className="size-2.5 shrink-0 opacity-60" />
                        </a>
                    ) : (
                        <span className="text-muted-foreground italic flex items-center gap-1">
                            <LinkIcon className="size-3 shrink-0 opacity-40" />
                            <span>Tanpa tautan redirect</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Actions: Edit and Delete */}
            <div className="flex items-center gap-2 pt-3 mt-3 border-t">
                <Button variant="outline" size="sm" asChild className="h-8 flex-1 text-xs cursor-pointer">
                    <Link href={`/manajemen-slider-promo/${slider.id}/edit`}>
                        <Edit3 className="size-3.5 mr-1" />
                        <span>Edit</span>
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(slider)}
                    className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    title="Hapus Slider"
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}
