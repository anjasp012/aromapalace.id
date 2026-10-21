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
    Check,
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

interface PaymentMethodItem {
    id: number;
    code: string;
    name: string;
    icon?: string | null;
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
    };
    metrics: {
        total_methods: number;
    };
}

export default function AdminPaymentMethodsIndex({
    paymentMethods,
    filters,
    metrics,
}: PaymentMethodsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<PaymentMethodItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-pembayaran', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/manajemen-pembayaran');
    };

    const handleDelete = () => {
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
                <div className="size-9 rounded-md bg-muted border flex items-center justify-center text-muted-foreground shrink-0">
                    <CreditCard className="size-4" />
                </div>
            );
        }

        if (iconStr.startsWith('http') || iconStr.startsWith('/storage') || iconStr.startsWith('data:')) {
            return (
                <div className="size-9 rounded-md bg-muted/40 border p-1 flex items-center justify-center shrink-0">
                    <img
                        src={iconStr}
                        alt={name || 'Logo'}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                </div>
            );
        }

        return (
            <div className="size-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px] uppercase shrink-0">
                {iconStr.slice(0, 4)}
            </div>
        );
    };

    return (
        <AdminLayout
            title="Metode Pembayaran"
            subtitle="Kelola kanal pembayaran, virtual account, dan QRIS untuk transaksi pelanggan."
        >
            <Head title="Metode Pembayaran - Admin Panel" />

            <div className="w-full space-y-6">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Metode Pembayaran</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Total {metrics.total_methods} kanal pembayaran terdaftar di sistem.
                        </p>
                    </div>

                    <Button asChild size="sm" className="h-9 cursor-pointer">
                        <Link href="/manajemen-pembayaran/create">
                            <Plus className="size-4 mr-1.5" />
                            <span>Tambah Metode</span>
                        </Link>
                    </Button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription className="text-xs">Total Kanal Pembayaran</CardDescription>
                            <CardTitle className="text-2xl font-bold">{metrics.total_methods}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <CreditCard className="size-3 text-primary" />
                                <span>Tersedia di halaman checkout</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter Toolbar */}
                <Card>
                    <CardContent className="p-3">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari berdasarkan nama atau kode (contoh: qris, bca, mandiri)..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" variant="secondary" className="h-9 cursor-pointer">
                                Cari
                            </Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetSearch}
                                    className="h-9 text-xs text-muted-foreground cursor-pointer"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    Reset
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Table Card */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="border-b bg-muted/30 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                                    <tr>
                                        <th className="p-4 w-16">Logo</th>
                                        <th className="p-4">Nama Metode</th>
                                        <th className="p-4">Kode Teknis</th>
                                        <th className="p-4 w-32 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paymentMethods.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                <CreditCard className="size-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-medium text-foreground">Tidak ada metode pembayaran ditemukan.</p>
                                                <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian Anda atau tambahkan baru.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paymentMethods.data.map((pm) => (
                                            <tr key={pm.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-4 align-middle">
                                                    {renderIconBadge(pm.icon, pm.name)}
                                                </td>
                                                <td className="p-4 align-middle font-medium text-foreground">
                                                    <div className="font-semibold text-sm">{pm.name}</div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">ID: #{pm.id}</div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant="outline" className="font-mono text-[11px] bg-muted/30">
                                                        {pm.code}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            title="Edit Metode"
                                                        >
                                                            <Link href={`/manajemen-pembayaran/${pm.id}/edit`}>
                                                                <Edit3 className="size-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteTarget(pm)}
                                                            className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                            title="Hapus Metode"
                                                        >
                                                            <Trash2 className="size-4" />
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
                        {paymentMethods.links && paymentMethods.links.length > 3 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <span className="text-xs text-muted-foreground">
                                    Halaman {paymentMethods.current_page} dari {paymentMethods.last_page} (Total {paymentMethods.total})
                                </span>
                                <div className="flex items-center gap-1">
                                    {paymentMethods.links.map((link, idx) => (
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

                {/* Dialog Delete Confirmation */}
                <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
                                <Trash2 className="size-5" />
                            </div>
                            <DialogTitle className="text-center">Hapus Metode Pembayaran?</DialogTitle>
                            <DialogDescription className="text-center text-xs leading-relaxed">
                                Apakah Anda yakin ingin menghapus metode pembayaran{' '}
                                <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
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
