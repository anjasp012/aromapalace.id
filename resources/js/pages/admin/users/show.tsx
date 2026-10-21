import React, { useState } from 'react';
import { Link, router, useForm, Deferred } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Crown,
    Shield,
    ShoppingBag,
    TrendingUp,
    TrendingDown,
    History,
    Plus,
    Minus,
    UserCog,
    Sparkles,
    Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface PointHistory {
    id: number;
    type: string;
    category: 'masuk' | 'berkurang';
    type_label: string;
    points: number;
    points_formatted: string;
    balance_after: number;
    balance_after_formatted: string;
    description: string;
    reference_id?: string | null;
    created_at: string;
    is_positive: boolean;
}

interface OrderSummary {
    id: number;
    order_number: string;
    total_amount_formatted: string;
    status: string;
    payment_status: string;
    created_at: string;
}

interface MembershipDetail {
    id: number;
    membership_number: string;
    points: number;
    points_formatted: string;
    lifetime_points: number;
    lifetime_points_formatted: string;
    joined_at: string;
    total_points_in: number;
    total_points_in_formatted: string;
    total_points_out: number;
    total_points_out_formatted: string;
}

interface UserDetail {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    orders_count: number;
}

interface UsersShowProps {
    user: UserDetail;
    membership: MembershipDetail | null;
    point_histories?: PointHistory[];
    recent_orders?: OrderSummary[];
}

const orderStatusLabel: Record<string, string> = {
    menunggu_pembayaran: 'Menunggu Bayar',
    diproses: 'Diproses',
    dikirim: 'Dikirim',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
};

export default function AdminUsersShow({
    user,
    membership,
    point_histories,
    recent_orders,
}: UsersShowProps) {
    const [pointModal, setPointModal] = useState<'add' | 'deduct' | null>(null);
    const [roleModal, setRoleModal] = useState(false);

    const addPointsForm = useForm({ points: '', description: '' });
    const deductPointsForm = useForm({ points: '', description: '' });
    const roleForm = useForm({ role: user.role });

    const handleAddPoints = (e: React.FormEvent) => {
        e.preventDefault();
        addPointsForm.post(`/manajemen-pengguna/${user.id}/points/add`, {
            preserveScroll: true,
            onSuccess: () => {
                setPointModal(null);
                addPointsForm.reset();
            },
        });
    };

    const handleDeductPoints = (e: React.FormEvent) => {
        e.preventDefault();
        deductPointsForm.post(`/manajemen-pengguna/${user.id}/points/deduct`, {
            preserveScroll: true,
            onSuccess: () => {
                setPointModal(null);
                deductPointsForm.reset();
            },
        });
    };

    const handleRoleUpdate = () => {
        roleForm.patch(`/manajemen-pengguna/${user.id}/role`, {
            preserveScroll: true,
            onSuccess: () => setRoleModal(false),
        });
    };

    return (
        <AdminLayout
            title={`Pengguna: ${user.name}`}
            subtitle="Detail profil pengguna, pengelolaan role akses, dan histori mutasi saldo poin loyalitas."
        >
            <div className="space-y-6">
                {/* Back Link */}
                <div>
                    <Button variant="ghost" size="sm" asChild className="w-fit p-0 hover:bg-transparent">
                        <Link href="/manajemen-pengguna" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Pengguna</span>
                        </Link>
                    </Button>
                </div>

                {/* User Profile Card */}
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <span>{user.name}</span>
                                {user.role === 'admin' ? (
                                    <Badge variant="destructive" className="text-[10px]">
                                        <Shield className="size-3 mr-1" /> Admin
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[10px]">
                                        <ShoppingBag className="size-3 mr-1" /> Pelanggan
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                                {user.email} &bull; Terdaftar sejak {user.created_at} &bull; {user.orders_count} pesanan
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRoleModal(true)}
                                className="h-8 text-xs"
                            >
                                <UserCog className="size-3.5 mr-1.5" />
                                Ubah Role
                            </Button>
                            {user.role !== 'admin' && (
                                <>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setPointModal('add')}
                                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Plus className="size-3.5 mr-1" />
                                        Tambah Poin
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPointModal('deduct')}
                                        className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                    >
                                        <Minus className="size-3.5 mr-1" />
                                        Kurangi Poin
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* Membership Detail Panel */}
                {membership ? (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Crown className="size-4 text-amber-600" />
                                    <CardTitle className="text-sm font-semibold">Royale Club Member</CardTitle>
                                    <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                        Aktif
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs mt-0.5">
                                    No. Member: <strong className="font-mono text-foreground">{membership.membership_number}</strong> &bull; Bergabung {membership.joined_at}
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-muted-foreground block">Saldo Poin</span>
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {membership.points_formatted} <span className="text-xs font-normal text-muted-foreground">Poin</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-3 gap-3 text-center text-xs pt-3 border-t">
                                <div className="p-2.5 rounded-lg bg-muted/40 border">
                                    <span className="text-muted-foreground block text-[11px]">Total Lifetime Poin</span>
                                    <span className="font-bold text-foreground text-sm">{membership.lifetime_points_formatted}</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-muted/40 border">
                                    <span className="text-muted-foreground block text-[11px]">Poin Masuk</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">+{membership.total_points_in_formatted}</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-muted/40 border">
                                    <span className="text-muted-foreground block text-[11px]">Poin Berkurang</span>
                                    <span className="font-bold text-red-600 dark:text-red-400 text-sm">-{membership.total_points_out_formatted}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="p-6 text-center text-muted-foreground text-xs">
                            <Crown className="size-8 mx-auto mb-2 opacity-30" />
                            Pengguna ini belum terdaftar di Royale Club.
                        </CardContent>
                    </Card>
                )}

                {/* Two-Column Grid: Point History & Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Point History Card Table */}
                    <Deferred
                        data="point_histories"
                        fallback={
                            <Card className="py-0">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <History className="size-4 text-muted-foreground" />
                                        <span className="text-sm font-semibold text-foreground">Histori Poin Loyalitas</span>
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-3.5 w-48" />
                                                <Skeleton className="h-2.5 w-24" />
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <Skeleton className="h-3.5 w-16 ml-auto" />
                                                <Skeleton className="h-2.5 w-12 ml-auto" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        }
                    >
                        <Card className="py-0">
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <History className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold text-foreground">Histori Poin Loyalitas</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{(point_histories || []).length} catatan</span>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="border-b bg-muted/50 text-muted-foreground">
                                        <tr className="border-b transition-colors text-xs">
                                            <th className="h-9 px-4 text-left font-medium">Keterangan</th>
                                            <th className="h-9 px-4 text-right font-medium">Mutasi</th>
                                            <th className="h-9 px-4 text-right font-medium">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-xs">
                                        {(!point_histories || point_histories.length === 0) ? (
                                            <tr>
                                                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                                                    Belum ada mutasi poin.
                                                </td>
                                            </tr>
                                        ) : (
                                            point_histories.map((h) => (
                                                <tr key={h.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="p-3 align-middle">
                                                        <div className="font-medium text-foreground">{h.description}</div>
                                                        <div className="text-[11px] text-muted-foreground">{h.created_at}</div>
                                                    </td>
                                                    <td className="p-3 align-middle text-right font-bold whitespace-nowrap">
                                                        <span className={h.is_positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                                            {h.points_formatted}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 align-middle text-right font-mono text-muted-foreground whitespace-nowrap">
                                                        {h.balance_after_formatted}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </Deferred>

                    {/* Recent Orders Card Table */}
                    <Deferred
                        data="recent_orders"
                        fallback={
                            <Card className="py-0">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="size-4 text-muted-foreground" />
                                        <span className="text-sm font-semibold text-foreground">Pesanan Terbaru</span>
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-3.5 w-36" />
                                                <Skeleton className="h-2.5 w-24" />
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <Skeleton className="h-5 w-16 ml-auto" />
                                                <Skeleton className="h-3.5 w-20 ml-auto" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        }
                    >
                        <Card className="py-0">
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Package className="size-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold text-foreground">Pesanan Terbaru</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{(recent_orders || []).length} pesanan</span>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="border-b bg-muted/50 text-muted-foreground">
                                        <tr className="border-b transition-colors text-xs">
                                            <th className="h-9 px-4 text-left font-medium">No. Pesanan</th>
                                            <th className="h-9 px-4 text-left font-medium">Status</th>
                                            <th className="h-9 px-4 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-xs">
                                        {(!recent_orders || recent_orders.length === 0) ? (
                                            <tr>
                                                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                                                    Belum ada riwayat pesanan.
                                                </td>
                                            </tr>
                                        ) : (
                                            recent_orders.map((o) => (
                                                <tr key={o.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="p-3 align-middle">
                                                        <Link
                                                            href={`/manajemen-pesanan/${o.id}`}
                                                            prefetch="hover"
                                                            cacheFor={['30s', '1m']}
                                                            className="font-mono font-medium text-foreground hover:underline"
                                                        >
                                                            {o.order_number}
                                                        </Link>
                                                        <div className="text-[11px] text-muted-foreground">{o.created_at}</div>
                                                    </td>
                                                    <td className="p-3 align-middle">
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {orderStatusLabel[o.status] || o.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 align-middle text-right font-medium text-foreground whitespace-nowrap">
                                                        {o.total_amount_formatted}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </Deferred>
                </div>
            </div>

            {/* Modal: Tambah Poin */}
            <Dialog open={pointModal === 'add'} onOpenChange={(open) => !open && setPointModal(null)}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleAddPoints}>
                        <DialogHeader>
                            <DialogTitle>Tambah Poin Manual</DialogTitle>
                            <DialogDescription>
                                Berikan poin bonus kepada <strong>{user.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Jumlah Poin</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={addPointsForm.data.points}
                                    onChange={(e) => addPointsForm.setData('points', e.target.value)}
                                    placeholder="Contoh: 100"
                                    className="h-9 text-xs"
                                    required
                                />
                                {addPointsForm.errors.points && (
                                    <p className="text-destructive text-[11px]">{addPointsForm.errors.points}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Keterangan / Alasan</label>
                                <Input
                                    type="text"
                                    value={addPointsForm.data.description}
                                    onChange={(e) => addPointsForm.setData('description', e.target.value)}
                                    placeholder="Contoh: Bonus event promosi"
                                    className="h-9 text-xs"
                                    required
                                />
                                {addPointsForm.errors.description && (
                                    <p className="text-destructive text-[11px]">{addPointsForm.errors.description}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" size="sm" onClick={() => setPointModal(null)}>
                                Batal
                            </Button>
                            <Button type="submit" size="sm" disabled={addPointsForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {addPointsForm.processing ? 'Menyimpan...' : 'Tambah Poin'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Kurangi Poin */}
            <Dialog open={pointModal === 'deduct'} onOpenChange={(open) => !open && setPointModal(null)}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleDeductPoints}>
                        <DialogHeader>
                            <DialogTitle>Kurangi Poin Manual</DialogTitle>
                            <DialogDescription>
                                Kurangi poin dari saldo akun <strong>{user.name}</strong> (Saldo saat ini: {membership?.points_formatted || 0} Poin).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Jumlah Poin</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={deductPointsForm.data.points}
                                    onChange={(e) => deductPointsForm.setData('points', e.target.value)}
                                    placeholder="Contoh: 50"
                                    className="h-9 text-xs"
                                    required
                                />
                                {deductPointsForm.errors.points && (
                                    <p className="text-destructive text-[11px]">{deductPointsForm.errors.points}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Keterangan / Alasan</label>
                                <Input
                                    type="text"
                                    value={deductPointsForm.data.description}
                                    onChange={(e) => deductPointsForm.setData('description', e.target.value)}
                                    placeholder="Contoh: Koreksi pembatalan transaksi"
                                    className="h-9 text-xs"
                                    required
                                />
                                {deductPointsForm.errors.description && (
                                    <p className="text-destructive text-[11px]">{deductPointsForm.errors.description}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" size="sm" onClick={() => setPointModal(null)}>
                                Batal
                            </Button>
                            <Button type="submit" size="sm" variant="destructive" disabled={deductPointsForm.processing}>
                                {deductPointsForm.processing ? 'Menyimpan...' : 'Kurangi Poin'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Ubah Role */}
            <Dialog open={roleModal} onOpenChange={setRoleModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ubah Role Pengguna</DialogTitle>
                        <DialogDescription>
                            Tentukan hak akses untuk akun <strong>{user.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-1.5 text-xs">
                        <label className="font-medium text-foreground">Hak Akses (Role)</label>
                        <Select value={roleForm.data.role} onValueChange={(v) => roleForm.setData('role', v)}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="customer">Pelanggan</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => setRoleModal(false)}>
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={roleForm.processing || roleForm.data.role === user.role}
                            onClick={handleRoleUpdate}
                        >
                            {roleForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
