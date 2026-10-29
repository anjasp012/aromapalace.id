import React, { useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
    Navigation,
    Table as TableIcon,
    Map as MapIcon,
    Eye,
    ShoppingBag,
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
    all_stores = [],
    filters,
    metrics,
}: StoresIndexProps) {
    const mapRef = useRef<AdminStoresMapRef | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const allStoreList = all_stores.length > 0 ? all_stores : stores.data;

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-butik', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/manajemen-butik');
    };

    const handleViewOnMap = (store: StoreItem) => {
        if (store.latitude && store.longitude && mapRef.current) {
            mapRef.current.focusOnStore(store.id, store.latitude, store.longitude);
            window.scrollTo({ top: 120, behavior: 'smooth' });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-butik/${deleteTarget.id}`, {
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
            <Head title="Lokasi Butik - Admin Panel" />

            <div className="w-full space-y-6">
                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Butik Resmi</span>
                                <Store className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2">{metrics.total_stores}</div>
                            <p className="text-xs text-muted-foreground mt-1">Titik gerai fisik terdaftar</p>
                        </CardContent>
                    </Card>
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Pesanan Ambil di Butik</span>
                                <ShoppingBag className="size-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2">{metrics.total_pickup_orders}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total transaksi pickup gerai</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Leaflet Multi-Pin Map - Full Panoramic */}
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
                        onEditStore={(st) => router.visit(`/manajemen-butik/${st.id}/edit`)}
                        height="480px"
                    />
                </div>

                {/* Search & Filter Toolbar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama butik, mall, atau alamat kota..."
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
                                    size="sm"
                                    variant="outline"
                                    onClick={handleResetSearch}
                                    className="h-9 cursor-pointer"
                                    title="Reset Pencarian"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" asChild className="h-9 cursor-pointer">
                                <Link href="/manajemen-butik/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Butik</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Stores Data Table Card */}
                <Card className="py-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium">Butik</th>
                                    <th className="h-10 px-4 text-left font-medium">Alamat &amp; Deskripsi</th>
                                    <th className="h-10 px-4 text-left font-medium">Titik Koordinat</th>
                                    <th className="h-10 px-4 text-center font-medium">Total Order</th>
                                    <th className="h-10 px-4 text-center font-medium">Status</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {stores.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Store className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">Tidak ada butik ditemukan</p>
                                                <p className="text-xs text-muted-foreground">Coba ubah kata kunci pencarian Anda.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                        stores.data.map((st) => {
                                            return (
                                                <tr
                                                    key={st.id}
                                                    className="hover:bg-muted/30 transition-colors group"
                                                >
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-11 rounded-lg border bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                                                {st.thumbnail ? (
                                                                    <img
                                                                        src={st.thumbnail}
                                                                        alt={st.name}
                                                                        className="size-full object-cover"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Store className="size-4 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                                                    <span>{st.name}</span>
                                                                    {st.gmaps_link && (
                                                                        <a
                                                                            href={st.gmaps_link}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-muted-foreground hover:text-primary"
                                                                            title="Buka di Google Maps"
                                                                        >
                                                                            <ExternalLink className="size-3" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    ID Butik #{st.id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle max-w-sm">
                                                        <p className="line-clamp-2 text-foreground/90 font-normal">
                                                            {st.description || 'Butik resmi Aroma Palace'}
                                                        </p>
                                                        {st.description_en && (
                                                            <p className="line-clamp-1 text-[11px] text-muted-foreground italic mt-0.5">
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
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewOnMap(st)}
                                                                className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                                                title="Lihat Titik di Peta"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                asChild
                                                                className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                                                title="Edit Butik"
                                                            >
                                                                <Link href={`/manajemen-butik/${st.id}/edit`}>
                                                                    <Edit3 className="size-3.5" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDeleteTarget(st)}
                                                                className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                                title="Hapus Butik"
                                                            >
                                                                <Trash2 className="size-3.5" />
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

                        {/* Pagination */}
                        {stores.links && stores.links.length > 3 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-6 py-4">
                                <div className="text-xs text-muted-foreground">
                                    Menampilkan {stores.data.length > 0 ? (stores.current_page - 1) * 15 + 1 : 0} sampai{' '}
                                    {Math.min(stores.current_page * 15, stores.total)} dari {stores.total} butik
                                </div>
                                <div className="flex items-center gap-1">
                                    {stores.links.map((link, idx) => {
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
                                                    preserveState
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>

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
