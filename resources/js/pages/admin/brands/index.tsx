import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    Sparkles,
    Boxes,
    Edit3,
    Trash2,
    RefreshCw,
    Image as ImageIcon,
    GripVertical,
    ChevronUp,
    ChevronDown,
    Check,
    Loader2,
    ArrowUpDown,
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

interface BrandItem {
    id: number;
    name: string;
    slug: string;
    thumbnail?: string | null;
    description?: string | null;
    description_en?: string | null;
    products_count: number;
    sort_order?: number;
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
    const [deleteTarget, setDeleteTarget] = useState<BrandItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Local items list for instant drag-and-drop feedback
    const [items, setItems] = useState<BrandItem[]>(brands.data);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [orderSavedSuccess, setOrderSavedSuccess] = useState(false);

    useEffect(() => {
        setItems(brands.data);
    }, [brands.data]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-brand', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/manajemen-brand');
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-brand/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    // Save reordered list to database
    const saveNewOrder = (newItems: BrandItem[]) => {
        setItems(newItems);
        setIsSavingOrder(true);
        setOrderSavedSuccess(false);

        const payload = newItems.map((item, idx) => ({
            id: item.id,
            sort_order: idx + 1,
        }));

        router.post(
            '/manajemen-brand/reorder',
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
            title="Kelola Brand"
            subtitle="Manajemen rumah parfum (maison de parfum), logo, urutan tampilan di katalog, dan profil cerita dwibahasa."
        >
            <Head title="Kelola Brand - Admin Panel" />

            <div className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Brand / Maison</span>
                                <Sparkles className="size-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_brands}</div>
                            <p className="text-xs text-muted-foreground mt-1">Rumah parfum resmi terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Brand Aktif Berproduk</span>
                                <Boxes className="size-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.brands_with_products}</div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Koleksi aktif di etalase</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Action Toolbar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama brand, slug, atau deskripsi..."
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
                                <Link href="/manajemen-brand/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Brand</span>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Hint: Drag and drop to sort */}
                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <ArrowUpDown className="size-3.5 text-primary" />
                            <span><strong>Tips Sort:</strong> Tarik dan geser kartu brand untuk mengubah urutan tampilan pada katalog. Urutan tersimpan otomatis.</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            {items.length} Brand
                        </Badge>
                    </div>
                </Card>

                {/* Card Grid Layout (Reorderable) */}
                {items.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Sparkles className="size-10 text-muted-foreground/30" />
                            <p className="text-sm font-medium text-foreground">Tidak ada brand parfum ditemukan</p>
                            <p className="text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau tambahkan brand baru.</p>
                            <Button size="sm" asChild className="mt-4">
                                <Link href="/manajemen-brand/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Brand Sekarang</span>
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((b, index) => {
                            const isBeingDragged = draggedIndex === index;
                            const isOver = dragOverIndex === index;

                            return (
                                <div
                                    key={b.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`group relative rounded-xl border bg-card p-4 transition-all duration-200 select-none ${
                                        isBeingDragged
                                            ? 'opacity-40 scale-95 border-primary border-dashed ring-2 ring-primary/30'
                                            : isOver
                                            ? 'border-primary ring-2 ring-primary/40 shadow-md scale-[1.01]'
                                            : 'hover:shadow-md hover:border-foreground/20'
                                    }`}
                                >
                                    {/* Card Top: Drag Handle & Order Badge & Arrow controls */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                            <GripVertical className="size-4 shrink-0" />
                                            <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0 h-5 font-semibold">
                                                #{index + 1}
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
                                                className="size-6 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                                title="Pindah ke Atas"
                                            >
                                                <ChevronUp className="size-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={index === items.length - 1 || isSavingOrder}
                                                onClick={() => handleMove(index, 'down')}
                                                className="size-6 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                                title="Pindah ke Bawah"
                                            >
                                                <ChevronDown className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Card Body: Thumbnail & Details */}
                                    <div className="flex items-start gap-3">
                                        {b.thumbnail ? (
                                            <div className="size-14 rounded-lg border overflow-hidden bg-muted/40 shrink-0 shadow-xs flex items-center justify-center p-1">
                                                <img
                                                    src={b.thumbnail}
                                                    alt={b.name}
                                                    className="size-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="size-14 rounded-lg border border-dashed flex items-center justify-center bg-muted/30 text-muted-foreground/60 shrink-0">
                                                <Sparkles className="size-5" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-foreground truncate" title={b.name}>
                                                {b.name}
                                            </h4>
                                            <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                                                /{b.slug}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2.5 min-h-[2rem]">
                                        {b.description || 'Tidak ada profil cerita brand.'}
                                    </p>

                                    {/* Card Footer: Product Count & Actions */}
                                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                        <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5">
                                            {b.products_count} Produk
                                        </Badge>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                                title="Edit Brand"
                                            >
                                                <Link href={`/manajemen-brand/${b.id}/edit`}>
                                                    <Edit3 className="size-3.5" />
                                                </Link>
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteTarget(b)}
                                                className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                title="Hapus Brand"
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

            {/* Modal Dialog Konfirmasi Hapus */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Brand</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus brand{' '}
                            <strong>&quot;{deleteTarget?.name}&quot;</strong>?
                            {deleteTarget && deleteTarget.products_count > 0 && (
                                <span className="block text-destructive font-medium mt-2">
                                    Peringatan: Brand ini masih memiliki {deleteTarget.products_count} produk terhubung dan tidak dapat dihapus.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
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
                            disabled={isDeleting || (deleteTarget?.products_count ?? 0) > 0}
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
