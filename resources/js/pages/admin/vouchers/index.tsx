import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    Ticket,
    CheckCircle2,
    XCircle,
    Clock,
    Edit3,
    Trash2,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface VoucherItem {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount: number;
    max_discount_amount?: number | null;
    usage_limit?: number | null;
    used_count: number;
    starts_at?: string | null;
    expires_at?: string | null;
    is_active: boolean;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface VouchersIndexProps {
    vouchers: {
        data: VoucherItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
        status: string;
    };
    metrics: {
        total_vouchers: number;
        active_vouchers: number;
        expired_vouchers: number;
        total_used: number;
    };
}

export default function AdminVouchersIndex({
    vouchers,
    filters,
    metrics,
}: VouchersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<VoucherItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 10,
        min_order_amount: 0,
        max_discount_amount: '' as string | number,
        usage_limit: '' as string | number,
        starts_at: '',
        expires_at: '',
        is_active: true,
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter({ search });
    };

    const applyFilter = (newVals: { search?: string; status?: string }) => {
        router.get(
            '/admin/vouchers',
            {
                search: newVals.search !== undefined ? newVals.search : (search || undefined),
                status: newVals.status !== undefined ? (newVals.status !== 'all' ? newVals.status : undefined) : (statusFilter !== 'all' ? statusFilter : undefined),
            },
            { preserveState: true }
        );
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        applyFilter({ status });
    };

    const handleResetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        router.get('/admin/vouchers');
    };

    const handleOpenCreate = () => {
        setEditingVoucher(null);
        form.setData({
            code: '',
            name: '',
            description: '',
            type: 'percentage',
            value: 10,
            min_order_amount: 0,
            max_discount_amount: '',
            usage_limit: '',
            starts_at: '',
            expires_at: '',
            is_active: true,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleOpenEdit = (voucher: VoucherItem) => {
        setEditingVoucher(voucher);
        form.setData({
            code: voucher.code,
            name: voucher.name,
            description: voucher.description || '',
            type: voucher.type,
            value: voucher.value,
            min_order_amount: voucher.min_order_amount,
            max_discount_amount: voucher.max_discount_amount ?? '',
            usage_limit: voucher.usage_limit ?? '',
            starts_at: voucher.starts_at ? voucher.starts_at.slice(0, 16) : '',
            expires_at: voucher.expires_at ? voucher.expires_at.slice(0, 16) : '',
            is_active: voucher.is_active,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVoucher) {
            form.put(`/admin/vouchers/${editingVoucher.id}`, {
                onSuccess: () => {
                    setDialogOpen(false);
                    form.reset();
                },
            });
        } else {
            form.post('/admin/vouchers', {
                onSuccess: () => {
                    setDialogOpen(false);
                    form.reset();
                },
            });
        }
    };

    const handleToggle = (voucher: VoucherItem) => {
        router.patch(`/admin/vouchers/${voucher.id}/toggle`, {}, { preserveState: true });
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/admin/vouchers/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Voucher &amp; Promo"
            subtitle="Kelola kode voucher diskon belanja, kuota penggunaan, dan batas minimal pembelian."
        >
            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Voucher</CardTitle>
                            <Ticket className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_vouchers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Seluruh kupon diskon</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Voucher Aktif</CardTitle>
                            <CheckCircle2 className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.active_vouchers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Dapat diklaim pelanggan</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400">Kadaluarsa</CardTitle>
                            <Clock className="size-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{metrics.expired_vouchers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Melewati batas waktu</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Digunakan</CardTitle>
                            <Ticket className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_used}x</div>
                            <p className="text-xs text-muted-foreground mt-1">Transaksi checkout berhasil</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Actions */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari kode atau nama voucher..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9">
                                Cari
                            </Button>
                        </form>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <div className="flex rounded-md border p-0.5 bg-muted/40">
                                <Button
                                    type="button"
                                    variant={statusFilter === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleStatusFilterChange('all')}
                                    className="h-7 text-xs px-2.5"
                                >
                                    Semua
                                </Button>
                                <Button
                                    type="button"
                                    variant={statusFilter === 'active' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleStatusFilterChange('active')}
                                    className="h-7 text-xs px-2.5"
                                >
                                    Aktif
                                </Button>
                                <Button
                                    type="button"
                                    variant={statusFilter === 'expired' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleStatusFilterChange('expired')}
                                    className="h-7 text-xs px-2.5"
                                >
                                    Kadaluarsa
                                </Button>
                            </div>

                            {(search !== '' || statusFilter !== 'all') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilter}
                                    className="h-9"
                                    title="Reset Pencarian"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" onClick={handleOpenCreate} className="h-9">
                                <Plus className="size-4 mr-1.5" />
                                <span>Tambah Voucher</span>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Vouchers Table Card */}
                <Card className="py-0">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium">Kode &amp; Nama</th>
                                    <th className="h-10 px-4 text-left font-medium">Potongan Diskon</th>
                                    <th className="h-10 px-4 text-left font-medium">Syarat Belanja</th>
                                    <th className="h-10 px-4 text-left font-medium">Pemakaian</th>
                                    <th className="h-10 px-4 text-left font-medium">Masa Berlaku</th>
                                    <th className="h-10 px-4 text-left font-medium">Status</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {vouchers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            Tidak ada voucher promo ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    vouchers.data.map((v) => {
                                        const isExpired = v.expires_at ? new Date(v.expires_at) < new Date() : false;
                                        return (
                                            <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-4 align-middle">
                                                    <div className="font-mono font-bold text-primary flex items-center gap-1.5">
                                                        <span>{v.code}</span>
                                                    </div>
                                                    <div className="font-medium text-foreground mt-0.5">{v.name}</div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {v.type === 'percentage' ? `${v.value}%` : formatCurrency(v.value)}
                                                    </span>
                                                    {v.type === 'percentage' && v.max_discount_amount && (
                                                        <div className="text-[11px] text-muted-foreground">
                                                            Maks: {formatCurrency(v.max_discount_amount)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {v.min_order_amount > 0 ? (
                                                        <span>Min. {formatCurrency(v.min_order_amount)}</span>
                                                    ) : (
                                                        <span>Tanpa minimal</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle font-mono">
                                                    <span>{v.used_count}</span>
                                                    <span className="text-muted-foreground"> / {v.usage_limit ? `${v.usage_limit}` : '∞'}</span>
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {v.expires_at ? (
                                                        <div className={isExpired ? 'text-destructive font-medium' : ''}>
                                                            {new Date(v.expires_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                            {isExpired && <span className="block text-[10px]">Kadaluarsa</span>}
                                                        </div>
                                                    ) : (
                                                        <span>Selamanya</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggle(v)}
                                                        className="h-7 px-2 text-xs flex items-center gap-1.5"
                                                        title="Klik untuk ubah status aktif"
                                                    >
                                                        {v.is_active && !isExpired ? (
                                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground">
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </Button>
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenEdit(v)}
                                                            className="size-8 text-muted-foreground hover:text-foreground"
                                                            title="Edit Voucher"
                                                        >
                                                            <Edit3 className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteTarget(v)}
                                                            className="size-8 text-destructive hover:bg-destructive/10"
                                                            title="Hapus Voucher"
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
                    {vouchers.links.length > 3 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan {vouchers.data.length} dari {vouchers.total} voucher
                            </div>
                            <div className="flex items-center gap-1">
                                {vouchers.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 text-xs text-muted-foreground"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground font-medium'
                                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Atur kode kupon, potongan harga, batas penggunaan, dan masa berlaku.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Kode Voucher *</label>
                                <Input
                                    type="text"
                                    placeholder="AROMA10"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                    className="h-9 font-mono uppercase"
                                    required
                                />
                                {form.errors.code && <p className="text-destructive text-[11px]">{form.errors.code}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Nama Voucher *</label>
                                <Input
                                    type="text"
                                    placeholder="Diskon Pembukaan 10%"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="h-9"
                                    required
                                />
                                {form.errors.name && <p className="text-destructive text-[11px]">{form.errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Tipe Diskon *</label>
                                <Select
                                    value={form.data.type}
                                    onValueChange={(val) => form.setData('type', val as 'percentage' | 'fixed')}
                                >
                                    <SelectTrigger className="h-9 w-full text-xs">
                                        <SelectValue placeholder="Pilih Tipe Diskon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Persentase (%)</SelectItem>
                                        <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">
                                    Nilai Potongan {form.data.type === 'percentage' ? '(%)' : '(Rp)'} *
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.data.value}
                                    onChange={(e) => form.setData('value', parseInt(e.target.value) || 0)}
                                    className="h-9 font-semibold"
                                    required
                                />
                                {form.errors.value && <p className="text-destructive text-[11px]">{form.errors.value}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Min. Belanja (Rp)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.data.min_order_amount}
                                    onChange={(e) => form.setData('min_order_amount', parseInt(e.target.value) || 0)}
                                    className="h-9"
                                />
                                {form.errors.min_order_amount && <p className="text-destructive text-[11px]">{form.errors.min_order_amount}</p>}
                            </div>

                            {form.data.type === 'percentage' && (
                                <div className="space-y-1.5">
                                    <label className="font-medium text-foreground">Maks. Potongan (Rp)</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="Tanpa batas"
                                        value={form.data.max_discount_amount}
                                        onChange={(e) => form.setData('max_discount_amount', e.target.value ? parseInt(e.target.value) : '')}
                                        className="h-9"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Batas Kuota Penggunaan</label>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="Tidak terbatas"
                                    value={form.data.usage_limit}
                                    onChange={(e) => form.setData('usage_limit', e.target.value ? parseInt(e.target.value) : '')}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Berlaku Sampai (Tanggal)</label>
                                <Input
                                    type="datetime-local"
                                    value={form.data.expires_at}
                                    onChange={(e) => form.setData('expires_at', e.target.value)}
                                    className="h-9"
                                />
                                {form.errors.expires_at && <p className="text-destructive text-[11px]">{form.errors.expires_at}</p>}
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="font-medium text-foreground">Deskripsi &amp; Syarat (Opsional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Keterangan voucher atau ketentuan promosi..."
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    className="w-full rounded-md border border-input bg-transparent p-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" size="sm" disabled={form.processing}>
                                {form.processing ? 'Menyimpan...' : (editingVoucher ? 'Simpan Perubahan' : 'Tambah Voucher')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Voucher?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus voucher{' '}
                            <span className="font-semibold text-foreground">"{deleteTarget?.code}"</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-2">
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
                            onClick={handleDeleteSubmit}
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
