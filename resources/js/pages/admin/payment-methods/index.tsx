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
    Image as ImageIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
    metrics?: {
        total_methods: number;
    };
}

export default function AdminPaymentMethodsIndex({
    paymentMethods,
    filters,
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
                {/* Filter and Actions Toolbar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama atau kode teknis metode pembayaran..."
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
                                <Link href="/manajemen-pembayaran/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Metode Pembayaran</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Payment Methods Table Card */}
                <Card className="py-0">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium w-16">No</th>
                                    <th className="h-10 px-4 text-left font-medium">Logo / Icon</th>
                                    <th className="h-10 px-4 text-left font-medium">Nama Metode</th>
                                    <th className="h-10 px-4 text-left font-medium">Kode Teknis</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {paymentMethods.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            <CreditCard className="size-8 mx-auto mb-2 opacity-30" />
                                            <p className="font-medium text-foreground">Tidak ada metode pembayaran ditemukan.</p>
                                            <p className="text-[11px] mt-1">Sesuaikan kata kunci pencarian atau tambahkan metode pembayaran baru.</p>
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

                                            {/* Actions */}
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="ghost" size="icon" asChild className="size-8 cursor-pointer">
                                                        <Link
                                                            href={`/manajemen-pembayaran/${pm.id}/edit`}
                                                            title="Edit Metode Pembayaran"
                                                        >
                                                            <Edit3 className="size-4 text-foreground/80 hover:text-foreground" />
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(pm)}
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                        title="Hapus Metode Pembayaran"
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
                        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
                            <div>
                                Menampilkan halaman <span className="font-semibold text-foreground">{paymentMethods.current_page}</span> dari{' '}
                                <span className="font-semibold text-foreground">{paymentMethods.last_page}</span> (Total{' '}
                                <span className="font-semibold text-foreground">{paymentMethods.total}</span> metode)
                            </div>
                            <div className="flex items-center gap-1">
                                {paymentMethods.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className="px-2.5 py-1 text-muted-foreground/40 rounded border border-transparent"
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-2.5 py-1 rounded border transition-colors ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                                    : 'hover:bg-muted text-foreground border-border'
                                            }`}
                                        />
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
