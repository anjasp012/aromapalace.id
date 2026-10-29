import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    CreditCard,
    Edit3,
    Trash2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface PaymentMethodItem {
    id: number;
    code: string;
    name: string;
    icon?: string | null;
    is_active: boolean;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaymentMethodsIndexProps {
    paymentMethods: {
        data: PaymentMethodItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
        status?: string;
    };
    metrics?: {
        total_methods: number;
        active_methods: number;
        inactive_methods: number;
    };
}

export default function AdminPaymentMethodsIndex({
    paymentMethods,
    filters,
    metrics,
}: PaymentMethodsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [deleteTarget, setDeleteTarget] = useState<PaymentMethodItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-pembayaran', {
            search: search || undefined,
            status: statusFilter || undefined,
        }, { preserveState: true });
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        router.get('/manajemen-pembayaran', {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        setStatusFilter('');
        router.get('/manajemen-pembayaran');
    };

    const handleToggleStatus = (pm: PaymentMethodItem) => {
        setTogglingId(pm.id);
        router.patch(`/manajemen-pembayaran/${pm.id}/toggle`, {}, {
            preserveScroll: true,
            onFinish: () => setTogglingId(null),
        });
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-pembayaran/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const renderIconBadge = (iconStr?: string | null, name?: string) => {
        if (!iconStr) {
            return (
                <div className="size-11 rounded-md bg-muted border flex items-center justify-center text-muted-foreground shrink-0 shadow-xs">
                    <CreditCard className="size-5" />
                </div>
            );
        }

        if (iconStr.startsWith('http') || iconStr.startsWith('/storage') || iconStr.startsWith('data:')) {
            return (
                <div className="size-11 rounded-md bg-muted/50 border p-1.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    <img
                        src={iconStr}
                        alt={name || 'Logo'}
                        className="size-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                </div>
            );
        }

        return (
            <div className="size-11 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0 shadow-xs">
                {iconStr.slice(0, 4)}
            </div>
        );
    };

    return (
        <AdminLayout
            title="Kelola Metode Pembayaran"
            subtitle="Manajemen kanal gateway pembayaran, transfer bank, e-wallet, dan QRIS untuk transaksi pelanggan."
        >
            <Head title="Kelola Metode Pembayaran - Admin Panel" />

            <div className="space-y-6">
                {/* Metric Summary Cards */}
                {metrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="py-4">
                            <CardContent className="p-0 px-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">Total Metode</span>
                                    <CreditCard className="size-4 text-primary" />
                                </div>
                                <div className="text-2xl font-bold mt-2">{metrics.total_methods}</div>
                                <p className="text-xs text-muted-foreground mt-1">Kanal pembayaran terdaftar</p>
                            </CardContent>
                        </Card>
                        <Card className="py-4">
                            <CardContent className="p-0 px-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">Metode Aktif</span>
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                </div>
                                <div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{metrics.active_methods}</div>
                                <p className="text-xs text-muted-foreground mt-1">Tampil di pilihan checkout</p>
                            </CardContent>
                        </Card>
                        <Card className="py-4">
                            <CardContent className="p-0 px-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">Metode Nonaktif</span>
                                    <XCircle className="size-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold mt-2 text-muted-foreground">{metrics.inactive_methods}</div>
                                <p className="text-xs text-muted-foreground mt-1">Disembunyikan dari pelanggan</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filter and Actions Toolbar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama atau kode teknis metode..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9 cursor-pointer">
                                Cari
                            </Button>
                        </form>

                        {/* Status Filter Badges */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            <Button
                                type="button"
                                variant={statusFilter === '' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleStatusFilterChange('')}
                                className="h-8 text-xs cursor-pointer"
                            >
                                Semua
                            </Button>
                            <Button
                                type="button"
                                variant={statusFilter === 'active' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleStatusFilterChange('active')}
                                className="h-8 text-xs cursor-pointer"
                            >
                                Aktif ({metrics?.active_methods ?? 0})
                            </Button>
                            <Button
                                type="button"
                                variant={statusFilter === 'inactive' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => handleStatusFilterChange('inactive')}
                                className="h-8 text-xs cursor-pointer"
                            >
                                Nonaktif ({metrics?.inactive_methods ?? 0})
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {(search !== '' || statusFilter !== '') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetSearch}
                                    className="h-9 cursor-pointer"
                                    title="Reset Filter"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" asChild className="h-9 cursor-pointer">
                                <Link href="/manajemen-pembayaran/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Metode</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Payment Methods Table Card */}
                <Card className="py-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium w-16">No</th>
                                    <th className="h-10 px-4 text-left font-medium">Logo / Icon</th>
                                    <th className="h-10 px-4 text-left font-medium">Nama Metode</th>
                                    <th className="h-10 px-4 text-left font-medium">Kode Teknis</th>
                                    <th className="h-10 px-4 text-left font-medium">Status &amp; Visibilitas</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {paymentMethods.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <CreditCard className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">Tidak ada metode pembayaran ditemukan</p>
                                                <p className="text-xs text-muted-foreground">Sesuaikan kata kunci pencarian atau tambahkan metode pembayaran baru.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paymentMethods.data.map((pm, index) => (
                                        <tr key={pm.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle text-muted-foreground font-mono">
                                                {(paymentMethods.current_page - 1) * 15 + index + 1}
                                            </td>

                                            {/* Icon */}
                                            <td className="p-4 align-middle">
                                                {renderIconBadge(pm.icon, pm.name)}
                                            </td>

                                            {/* Name */}
                                            <td className="p-4 align-middle font-medium text-foreground">
                                                <div className="font-semibold text-sm">{pm.name}</div>
                                            </td>

                                            {/* Code */}
                                            <td className="p-4 align-middle font-mono">
                                                <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5">
                                                    {pm.code}
                                                </Badge>
                                            </td>

                                            {/* Status & Visibilitas Switch */}
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-2.5">
                                                    <Switch
                                                        checked={pm.is_active}
                                                        disabled={togglingId === pm.id}
                                                        onCheckedChange={() => handleToggleStatus(pm)}
                                                        title={pm.is_active ? 'Klik untuk nonaktifkan (sembunyikan dari pelanggan)' : 'Klik untuk aktifkan (tampilkan ke pelanggan)'}
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        {togglingId === pm.id ? (
                                                            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                                                        ) : pm.is_active ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 className="size-3.5" />
                                                                <span>Aktif</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                                <XCircle className="size-3.5" />
                                                                <span>Nonaktif</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="ghost" size="icon" asChild className="size-8 cursor-pointer">
                                                        <Link
                                                            href={`/manajemen-pembayaran/${pm.id}/edit`}
                                                            title="Edit Metode Pembayaran"
                                                        >
                                                            <Edit3 className="size-3.5 text-foreground/80 hover:text-foreground" />
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(pm)}
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                        title="Hapus Metode Pembayaran"
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
                    {paymentMethods.links && paymentMethods.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-6 py-4">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan {paymentMethods.data.length > 0 ? (paymentMethods.current_page - 1) * 15 + 1 : 0} sampai{' '}
                                {Math.min(paymentMethods.current_page * 15, paymentMethods.total)} dari {paymentMethods.total} metode
                            </div>
                            <div className="flex items-center gap-1">
                                {paymentMethods.links.map((link, idx) => {
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
                        <DialogTitle>Hapus Metode Pembayaran?</DialogTitle>
                        <DialogDescription>
                            Tindakan ini akan menghapus metode pembayaran &ldquo;
                            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>&rdquo; (
                            <code>{deleteTarget?.code}</code>) dari opsi checkout pelanggan. Tindakan ini tidak dapat dibatalkan.
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
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Metode'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
