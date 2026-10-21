import React, { useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    Store,
    MapPin,
    ExternalLink,
    Edit3,
    Trash2,
    RefreshCw,
    Upload,
    Navigation,
    Table as TableIcon,
    Map as MapIcon,
    Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import StoreMapPicker from '@/components/StoreMapPicker';
import AdminStoresMap, { AdminStoresMapRef } from '@/components/AdminStoresMap';

interface StoreItem {
    id: number;
    name: string;
    description?: string | null;
    description_en?: string | null;
    thumbnail?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    gmaps_link?: string | null;
    orders_count: number;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface StoresIndexProps {
    stores: {
        data: StoreItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    all_stores?: StoreItem[];
    filters: {
        search: string;
    };
    metrics: {
        total_stores: number;
        total_pickup_orders: number;
    };
}

export default function AdminStoresIndex({
    stores,
    all_stores,
    filters,
    metrics,
}: StoresIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreItem | null>(null);

    const mapRef = useRef<AdminStoresMapRef | null>(null);

    const allStoreList = all_stores || stores.data;

    const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const handleViewOnMap = (st: StoreItem) => {
        window.scrollTo({ top: 100, behavior: 'smooth' });
        setTimeout(() => {
            mapRef.current?.focusStore(st);
        }, 150);
    };

    const form = useForm<{
        _method?: string;
        name: string;
        description: string;
        description_en: string;
        thumbnail: File | string | null;
        latitude: string | number;
        longitude: string | number;
        gmaps_link: string;
    }>({
        name: '',
        description: '',
        description_en: '',
        thumbnail: null,
        latitude: '',
        longitude: '',
        gmaps_link: '',
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/stores', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/stores');
    };

    const handleOpenCreate = () => {
        setEditingStore(null);
        setThumbnailPreview(null);
        form.setData({
            name: '',
            description: '',
            description_en: '',
            thumbnail: null,
            latitude: '',
            longitude: '',
            gmaps_link: '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleOpenEdit = (st: StoreItem) => {
        setEditingStore(st);
        setThumbnailPreview(st.thumbnail || null);
        form.setData({
            _method: 'put',
            name: st.name,
            description: st.description || '',
            description_en: st.description_en || '',
            thumbnail: st.thumbnail || '',
            latitude: st.latitude !== null && st.latitude !== undefined ? st.latitude : '',
            longitude: st.longitude !== null && st.longitude !== undefined ? st.longitude : '',
            gmaps_link: st.gmaps_link || '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('thumbnail', file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStore) {
            form.post(`/stores/${editingStore.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    setDialogOpen(false);
                },
            });
        } else {
            form.post('/stores', {
                forceFormData: true,
                onSuccess: () => {
                    setDialogOpen(false);
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/stores/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Lokasi Butik (Stores)"
            subtitle="Kelola butik resmi Aroma Palace untuk titik pengambilan pesanan dan kunjungan pelanggan."
        >
            <div className="w-full space-y-6">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Lokasi Butik &amp; Outlet</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Sebaran seluruh titik gerai fisik resmi Aroma Palace di Indonesia.
                        </p>
                    </div>

                    <Button onClick={handleOpenCreate} size="sm" className="h-9 cursor-pointer">
                        <Plus className="size-4 mr-1.5" />
                        <span>Tambah Butik</span>
                    </Button>
                </div>

                {/* Leaflet Multi-Pin Map directly at the Top - Full Panoramic */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <MapIcon className="size-3.5 text-primary" />
                                Peta Interaktif Sebaran Gerai Resmi
                            </span>
                            <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono">
                                {allStoreList.length} Titik Gerai
                            </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            Klik titik pin untuk melihat detail butik atau gunakan tombol mata (👁️) di tabel
                        </span>
                    </div>

                    <AdminStoresMap
                        ref={mapRef}
                        stores={allStoreList}
                        onEditStore={(st) => handleOpenEdit(st as StoreItem)}
                        height="480px"
                    />
                </div>

                {/* Search & Filter Toolbar */}
                <Card>
                    <CardContent className="p-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Cari nama butik, mall, atau alamat kota..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 h-9 text-xs"
                                    />
                                </div>
                                <Button type="submit" size="sm" variant="secondary" className="h-9">
                                    Cari
                                </Button>
                                {filters.search && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetSearch}
                                        className="h-9 text-xs text-muted-foreground"
                                    >
                                        <RefreshCw className="size-3.5 mr-1" />
                                        Reset
                                    </Button>
                                )}
                            </form>

                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-center">
                                <TableIcon className="size-3.5 text-muted-foreground" />
                                <span>Menampilkan <strong>{stores.data.length}</strong> dari <strong>{stores.total}</strong> butik</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stores Table Card */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="border-b bg-muted/30 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                                    <tr>
                                        <th className="p-4 w-12 text-center">#</th>
                                        <th className="p-4">Nama &amp; Jenis Gerai</th>
                                        <th className="p-4">Wilayah &amp; Alamat</th>
                                        <th className="p-4">Koordinat</th>
                                        <th className="p-4 text-center">Pesanan</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 w-28 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stores.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                <Store className="size-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-medium text-foreground">Tidak ada butik ditemukan.</p>
                                                <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian Anda atau tambahkan lokasi baru.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        stores.data.map((st, idx) => {
                                            const rowNumber = (stores.current_page - 1) * 10 + idx + 1;

                                            return (
                                                <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="p-4 align-middle text-center text-muted-foreground font-mono text-xs">
                                                        {rowNumber}
                                                    </td>
                                                    <td className="p-4 align-middle font-medium text-foreground">
                                                        <div className="flex items-center gap-2.5">
                                                            {st.thumbnail && (
                                                                <div className="size-9 rounded-lg border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                                                                    <img
                                                                        src={st.thumbnail}
                                                                        alt={st.name}
                                                                        className="size-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-bold text-sm text-foreground">{st.name}</span>
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border">
                                                                        {st.name.toLowerCase().includes('flagship') ? 'Flagship' : 'Butik Resmi'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground font-mono">ID: #{st.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle text-muted-foreground max-w-xs">
                                                        <p className="line-clamp-2 text-xs leading-relaxed text-foreground/80">
                                                            {st.description || '-'}
                                                        </p>
                                                        {st.description_en && (
                                                            <p className="line-clamp-1 text-[11px] leading-relaxed text-muted-foreground mt-0.5 italic">
                                                                <span className="font-semibold text-[10px] text-amber-600 dark:text-amber-400 not-italic mr-1">EN:</span>
                                                                {st.description_en}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {st.latitude && st.longitude ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewOnMap(st)}
                                                                className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
                                                                title="Klik untuk fokus pada peta di atas"
                                                            >
                                                                <Navigation className="size-3 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                                                                <span className="group-hover:underline">
                                                                    {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <Badge variant="secondary" className="font-semibold text-xs">
                                                            {st.orders_count} pesanan
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                            Aktif
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewOnMap(st)}
                                                                className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                                                title="Lihat Titik di Peta"
                                                            >
                                                                <Eye className="size-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenEdit(st)}
                                                                className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                                                title="Edit Butik"
                                                            >
                                                                <Edit3 className="size-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDeleteTarget(st)}
                                                                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                                title="Hapus Butik"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                            {/* Pagination Links */}
                            {stores.links && stores.links.length > 3 && (
                                <div className="flex items-center justify-between border-t p-4">
                                    <span className="text-xs text-muted-foreground">
                                        Halaman {stores.current_page} dari {stores.last_page} (Total {stores.total})
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {stores.links.map((link, idx) => (
                                            <Button
                                                key={idx}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                disabled={!link.url}
                                                asChild={!!link.url}
                                                className="h-8 px-3 text-xs"
                                            >
                                                {link.url ? (
                                                    <Link
                                                        href={link.url}
                                                        preserveState
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                )}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                {/* Dialog Form Create / Edit */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingStore ? 'Edit Lokasi Butik' : 'Tambah Lokasi Butik Baru'}
                            </DialogTitle>
                            <DialogDescription>
                                Tentukan titik lokasi gerai pada peta Leaflet, kelola alamat, dan foto galeri butik.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
                            {/* 1. Interactive Leaflet Map Picker at the Top of Dialog */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                                        <MapPin className="size-3.5 text-primary" />
                                        Titik Peta Lokasi (Leaflet Map) *
                                    </label>
                                    <span className="text-[11px] text-muted-foreground">
                                        Klik peta atau pilih kota untuk menentukan titik
                                    </span>
                                </div>

                                <StoreMapPicker
                                    latitude={form.data.latitude}
                                    longitude={form.data.longitude}
                                    onChange={(lat, lng) => {
                                        form.setData((prev) => ({
                                            ...prev,
                                            latitude: lat,
                                            longitude: lng,
                                            gmaps_link: prev.gmaps_link && !prev.gmaps_link.includes('maps.google.com/?q=')
                                                ? prev.gmaps_link
                                                : `https://maps.google.com/?q=${lat},${lng}`,
                                        }));
                                    }}
                                    height="240px"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <label className="font-medium text-foreground text-[11px]">Latitude GPS</label>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="-6.227244"
                                            value={form.data.latitude}
                                            onChange={(e) => form.setData('latitude', e.target.value)}
                                            className="h-8 font-mono text-xs"
                                        />
                                        {form.errors.latitude && (
                                            <p className="text-destructive text-[11px]">{form.errors.latitude}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-medium text-foreground text-[11px]">Longitude GPS</label>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="106.797282"
                                            value={form.data.longitude}
                                            onChange={(e) => form.setData('longitude', e.target.value)}
                                            className="h-8 font-mono text-xs"
                                        />
                                        {form.errors.longitude && (
                                            <p className="text-destructive text-[11px]">{form.errors.longitude}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Nama Butik / Toko */}
                            <div className="space-y-1.5 pt-2 border-t">
                                <label className="font-medium text-foreground">Nama Butik / Toko *</label>
                                <Input
                                    type="text"
                                    placeholder="Contoh: Flagship Boutique Senayan City Jakarta"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="h-9"
                                    required
                                />
                                {form.errors.name && (
                                    <p className="text-destructive text-[11px]">{form.errors.name}</p>
                                )}
                            </div>

                            {/* 3. Foto Sampul Butik */}
                            <div className="space-y-2">
                                <label className="font-medium text-foreground">Foto Sampul Butik</label>
                                <div className="flex items-center gap-3">
                                    <div className="size-16 rounded-lg border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                                        {thumbnailPreview ? (
                                            <img
                                                src={thumbnailPreview}
                                                alt="Preview"
                                                className="size-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <Store className="size-6 text-muted-foreground/60" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-1.5">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-8 text-xs"
                                            >
                                                <Upload className="size-3.5 mr-1" />
                                                <span>Pilih File Foto</span>
                                            </Button>

                                            {thumbnailPreview && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setThumbnailPreview(null);
                                                        form.setData('thumbnail', '');
                                                    }}
                                                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                                >
                                                    Hapus
                                                </Button>
                                            )}
                                        </div>

                                        <Input
                                            type="text"
                                            placeholder="Atau masukkan URL foto (https://...)"
                                            value={typeof form.data.thumbnail === 'string' ? form.data.thumbnail : ''}
                                            onChange={(e) => {
                                                form.setData('thumbnail', e.target.value);
                                                setThumbnailPreview(e.target.value);
                                            }}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                                {form.errors.thumbnail && (
                                    <p className="text-destructive text-[11px]">{form.errors.thumbnail}</p>
                                )}
                            </div>

                            {/* 4. Alamat Lengkap & Fasilitas Butik */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-medium text-foreground">Alamat Lengkap &amp; Fasilitas Butik (Bahasa Indonesia)</label>
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60">🇮🇩 ID</Badge>
                                </div>
                                <Textarea
                                    rows={2}
                                    placeholder="Contoh: Senayan City Mall, Ground Floor Unit G-12, Jl. Asia Afrika Lot 19. Menghadirkan private scent lounge..."
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    className="text-xs"
                                />
                                {form.errors.description && (
                                    <p className="text-destructive text-[11px]">{form.errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-medium text-foreground">Boutique Address &amp; Facilities (English)</label>
                                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/5">🇬🇧 EN</Badge>
                                </div>
                                <Textarea
                                    rows={2}
                                    placeholder="e.g. Senayan City Mall, Ground Floor Unit G-12. Featuring a private scent lounge..."
                                    value={form.data.description_en}
                                    onChange={(e) => form.setData('description_en', e.target.value)}
                                    className="text-xs"
                                />
                                {form.errors.description_en && (
                                    <p className="text-destructive text-[11px]">{form.errors.description_en}</p>
                                )}
                            </div>

                            {/* 5. Link Google Maps (Opsional) */}
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Link Google Maps (Opsional)</label>
                                <Input
                                    type="url"
                                    placeholder="https://maps.google.com/?q=-6.227244,106.797282"
                                    value={form.data.gmaps_link}
                                    onChange={(e) => form.setData('gmaps_link', e.target.value)}
                                    className="h-9 text-xs font-mono"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Jika dikosongkan, link akan digenerate otomatis dari koordinat GPS.
                                </p>
                                {form.errors.gmaps_link && (
                                    <p className="text-destructive text-[11px]">{form.errors.gmaps_link}</p>
                                )}
                            </div>

                            <DialogFooter className="pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" disabled={form.processing}>
                                    {form.processing ? 'Menyimpan...' : editingStore ? 'Perbarui Butik' : 'Simpan Butik'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog Delete Confirmation */}
                <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
                                <Trash2 className="size-5" />
                            </div>
                            <DialogTitle className="text-center">Hapus Lokasi Butik?</DialogTitle>
                            <DialogDescription className="text-center text-xs leading-relaxed">
                                Apakah Anda yakin ingin menghapus butik{' '}
                                <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
                                {deleteTarget && deleteTarget.orders_count > 0 && (
                                    <span className="block text-destructive font-medium mt-1">
                                        Perhatian: Butik ini memiliki {deleteTarget.orders_count} pesanan pelanggan.
                                    </span>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex items-center justify-center gap-2 sm:justify-center pt-2">
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
                                onClick={handleDelete}
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
