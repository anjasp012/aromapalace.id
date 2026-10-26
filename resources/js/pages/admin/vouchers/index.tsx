import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
    name_en?: string | null;
    description?: string | null;
    description_en?: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount: number;
    max_discount_amount?: number | null;
    usage_limit?: number | null;
    used_count: number;
    starts_at?: string | null;
    expires_at?: string | null;
    is_active: boolean;
    voucher_type?: 'biasa' | 'reward';
    points_required?: number | null;
    user_id?: number | null;
    user?: { id: number; name: string; email: string } | null;
    applicable_type?: 'all' | 'specific';
    applicable_product_ids?: number[] | null;
    applicable_product_names?: string[];
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
        voucher_type?: string;
        applicable_type?: string;
    };
    metrics: {
        total_vouchers: number;
        active_vouchers: number;
        expired_vouchers: number;
        total_used: number;
        total_biasa?: number;
        total_reward?: number;
        total_specific?: number;
    };
}

export default function AdminVouchersIndex({
    vouchers,
    filters,
    metrics,
}: VouchersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [typeFilter, setTypeFilter] = useState(filters.voucher_type || 'all');
    const [scopeFilter, setScopeFilter] = useState(filters.applicable_type || 'all');
    const [deleteTarget, setDeleteTarget] = useState<VoucherItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const applyFilter = (newVals: {
        search?: string;
        status?: string;
        voucher_type?: string;
        applicable_type?: string;
    }) => {
        const nextStatus = newVals.status !== undefined ? newVals.status : statusFilter;
        const nextType = newVals.voucher_type !== undefined ? newVals.voucher_type : typeFilter;
        const nextScope = newVals.applicable_type !== undefined ? newVals.applicable_type : scopeFilter;
        const nextSearch = newVals.search !== undefined ? newVals.search : search;

        router.get(
            '/manajemen-voucher',
            {
                search: nextSearch || undefined,
                status: nextStatus !== 'all' ? nextStatus : undefined,
                voucher_type: nextType !== 'all' ? nextType : undefined,
                applicable_type: nextScope !== 'all' ? nextScope : undefined,
            },
            { preserveState: true }
        );
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        applyFilter({ status });
    };

    const handleTypeFilterChange = (voucher_type: string) => {
        setTypeFilter(voucher_type);
        applyFilter({ voucher_type });
    };

    const handleScopeFilterChange = (applicable_type: string) => {
        setScopeFilter(applicable_type);
        applyFilter({ applicable_type });
    };

    const handleResetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        setTypeFilter('all');
        setScopeFilter('all');
        router.get('/manajemen-voucher');
    };

    const handleToggle = (voucher: VoucherItem) => {
        router.patch(`/manajemen-voucher/${voucher.id}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-voucher/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Kelola Voucher Promo"
            subtitle="Manajemen kupon potongan belanja pelanggan, kuota voucher, dan terjemahan dwibahasa."
        >
            <Head title="Kelola Voucher - Admin Panel" />

            <div className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Voucher</span>
                                <Ticket className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_vouchers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Semua kode terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Voucher Aktif</span>
                                <CheckCircle2 className="size-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.active_vouchers}</div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Dapat diklaim pelanggan</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Kadaluarsa</span>
                                <Clock className="size-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.expired_vouchers}</div>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Masa promo berakhir</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Pemakaian</span>
                                <XCircle className="size-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_used}</div>
                            <p className="text-xs text-muted-foreground mt-1">Transaksi checkout berhasil</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Actions */}
                <Card className="p-4 space-y-3">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full lg:max-w-md flex items-center gap-2">
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
                            <Button type="submit" size="sm" className="h-9 cursor-pointer">
                                Cari
                            </Button>
                        </form>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filter Status */}
                            <div className="flex rounded-md border p-0.5 bg-muted/40">
                                <Button
                                    type="button"
                                    variant={statusFilter === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleStatusFilterChange('all')}
                                    className="h-7 text-xs px-2.5 cursor-pointer"
                                >
                                    Semua
                                </Button>
                                <Button
                                    type="button"
                                    variant={statusFilter === 'active' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleStatusFilterChange('active')}
                                    className="h-7 text-xs px-2.5 cursor-pointer"
                                >
                                    Aktif
                                </Button>
                                <Button
                                    type="button"
                                    variant={statusFilter === 'expired' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleStatusFilterChange('expired')}
                                    className="h-7 text-xs px-2.5 cursor-pointer"
                                >
                                    Kadaluarsa
                                </Button>
                            </div>

                            {/* Filter Tipe */}
                            <Select
                                value={typeFilter}
                                onValueChange={(val) => handleTypeFilterChange(val)}
                            >
                                <SelectTrigger className="h-8 text-xs w-[130px]">
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    <SelectItem value="biasa">Voucher Biasa</SelectItem>
                                    <SelectItem value="reward">Voucher Reward</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Filter Cakupan Produk */}
                            <Select
                                value={scopeFilter}
                                onValueChange={(val) => handleScopeFilterChange(val)}
                            >
                                <SelectTrigger className="h-8 text-xs w-[150px]">
                                    <SelectValue placeholder="Semua Cakupan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Cakupan</SelectItem>
                                    <SelectItem value="specific">Khusus Produk</SelectItem>
                                </SelectContent>
                            </Select>

                            {(search !== '' || statusFilter !== 'all' || typeFilter !== 'all' || scopeFilter !== 'all') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilter}
                                    className="h-8 cursor-pointer text-xs"
                                    title="Reset Pencarian"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" asChild className="h-8 cursor-pointer">
                                <Link href="/manajemen-voucher/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Voucher</span>
                                </Link>
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
                                    <th className="h-10 px-4 text-left font-medium">Tipe &amp; Pemilik</th>
                                    <th className="h-10 px-4 text-left font-medium">Cakupan Produk</th>
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
                                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                            Tidak ada voucher promo ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    vouchers.data.map((v) => {
                                        const isExpired = v.expires_at ? new Date(v.expires_at) < new Date() : false;
                                        const isReward = v.voucher_type === 'reward' || v.code.startsWith('REW-');
                                        const isSpecific = v.applicable_type === 'specific';
                                        return (
                                            <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-4 align-middle">
                                                    <div className="font-mono font-bold text-primary flex items-center gap-1.5">
                                                        <span>{v.code}</span>
                                                    </div>
                                                    <div className="font-medium text-foreground mt-0.5">{v.name}</div>
                                                    {v.name_en && (
                                                        <div className="text-[11px] text-muted-foreground italic font-normal">
                                                            EN: {v.name_en}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {isReward ? (
                                                        <div className="space-y-1">
                                                            <div className="flex flex-wrap items-center gap-1">
                                                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                                                                    Reward Royale Club
                                                                </Badge>
                                                                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 text-[10px] font-medium">
                                                                    🪙 {v.points_required ?? 100} Poin
                                                                </Badge>
                                                            </div>
                                                            {v.user && (
                                                                <div className="text-[11px] text-muted-foreground mt-1">
                                                                    <span className="font-medium text-foreground">{v.user.name}</span>
                                                                    <span className="block text-[10px] opacity-80">{v.user.email}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                            Voucher Biasa
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle max-w-[200px]">
                                                    {isSpecific ? (
                                                        <div>
                                                            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 text-[10px] font-semibold">
                                                                Khusus {v.applicable_product_names?.length || v.applicable_product_ids?.length || 0} Produk
                                                            </Badge>
                                                            {v.applicable_product_names && v.applicable_product_names.length > 0 && (
                                                                <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2" title={v.applicable_product_names.join(', ')}>
                                                                    {v.applicable_product_names.join(', ')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[11px]">Semua Produk</span>
                                                    )}
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
                                                        className="h-7 px-2 text-xs flex items-center gap-1.5 cursor-pointer"
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
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            title="Edit Voucher"
                                                        >
                                                            <Link href={`/manajemen-voucher/${v.id}/edit`}>
                                                                <Edit3 className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteTarget(v)}
                                                            className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
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
