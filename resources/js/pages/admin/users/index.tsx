import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Users,
    Crown,
    Shield,
    ShoppingBag,
    Eye,
    Edit3,
    Trash2,
    RefreshCw,
    Plus,
    RotateCcw,
    AlertTriangle,
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

interface MembershipSummary {
    points: number;
    points_formatted: string;
    membership_number: string;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    orders_count: number;
    membership: MembershipSummary | null;
    created_at: string;
    created_at_human: string;
    is_deleted?: boolean;
    deleted_at?: string;
    deleted_at_human?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface UsersIndexProps {
    users: {
        data: UserItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    filters: {
        search: string;
        role: string;
        status?: string;
    };
    metrics: {
        total_users: number;
        total_customers: number;
        total_admins: number;
        total_members: number;
        total_trashed?: number;
    };
}

export default function AdminUsersIndex({
    users,
    filters,
    metrics,
}: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
    const [forceDeleteTarget, setForceDeleteTarget] = useState<UserItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isForceDeleting, setIsForceDeleting] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);

    const applyFilter = (newVals: { search?: string; role?: string; status?: string }) => {
        router.get(
            '/manajemen-pengguna',
            {
                search: newVals.search !== undefined ? newVals.search : (search || undefined),
                role: newVals.role !== undefined ? (newVals.role !== 'all' ? newVals.role : undefined) : (roleFilter !== 'all' ? roleFilter : undefined),
                status: newVals.status !== undefined ? (newVals.status !== 'all' ? newVals.status : undefined) : (statusFilter !== 'all' ? statusFilter : undefined),
            },
            { preserveState: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter({ search });
    };

    const handleRoleFilterChange = (role: string) => {
        setRoleFilter(role);
        applyFilter({ role });
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        applyFilter({ status });
    };

    const handleResetFilter = () => {
        setSearch('');
        setRoleFilter('all');
        setStatusFilter('all');
        router.get('/manajemen-pengguna');
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-pengguna/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const handleRestoreUser = (user: UserItem) => {
        setRestoringId(user.id);
        router.post(`/manajemen-pengguna/${user.id}/pulihkan`, {}, {
            onFinish: () => setRestoringId(null),
        });
    };

    const handleForceDeleteSubmit = () => {
        if (!forceDeleteTarget) return;
        setIsForceDeleting(true);
        router.delete(`/manajemen-pengguna/${forceDeleteTarget.id}/hapus-permanen`, {
            onFinish: () => {
                setIsForceDeleting(false);
                setForceDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Kelola Pengguna"
            subtitle="Manajemen data pelanggan, akun administrator, dan keanggotaan loyalty program."
        >
            <Head title="Kelola Pengguna - Admin Panel" />

            <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Pengguna</span>
                                <Users className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_users}</div>
                            <p className="text-xs text-muted-foreground mt-1">Seluruh akun terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Pelanggan Aktif</span>
                                <ShoppingBag className="size-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_customers}</div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Pengguna storefront</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Royale Members</span>
                                <Crown className="size-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_members}</div>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Pemegang kartu poin</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Staf Administrator</span>
                                <Shield className="size-4 text-rose-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_admins}</div>
                            <p className="text-xs text-muted-foreground mt-1">Akses penuh panel admin</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Action Bar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari berdasarkan nama atau email..."
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
                            <div className="flex rounded-md border p-0.5 bg-muted/40">
                                <Button
                                    type="button"
                                    variant={statusFilter !== 'trashed' && roleFilter === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setStatusFilter('all');
                                        handleRoleFilterChange('all');
                                    }}
                                    className="h-7 text-xs px-2.5 cursor-pointer"
                                >
                                    Semua
                                </Button>
                                <Button
                                    type="button"
                                    variant={statusFilter !== 'trashed' && roleFilter === 'customer' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setStatusFilter('all');
                                        handleRoleFilterChange('customer');
                                    }}
                                    className="h-7 text-xs px-2.5 cursor-pointer"
                                >
                                    Pelanggan
                                </Button>
                                <Button
                                    type="button"
                                    variant={statusFilter !== 'trashed' && roleFilter === 'admin' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setStatusFilter('all');
                                        handleRoleFilterChange('admin');
                                    }}
                                    className="h-7 text-xs px-2.5 cursor-pointer"
                                >
                                    Admin
                                </Button>
                                <Button
                                    type="button"
                                    variant={statusFilter === 'trashed' ? 'destructive' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleStatusFilterChange(statusFilter === 'trashed' ? 'all' : 'trashed')}
                                    className="h-7 text-xs px-2.5 cursor-pointer gap-1"
                                >
                                    <Trash2 className="size-3" />
                                    <span>Sampah</span>
                                    {metrics.total_trashed ? (
                                        <Badge
                                            variant={statusFilter === 'trashed' ? 'secondary' : 'destructive'}
                                            className="text-[9px] px-1 py-0 h-4 font-bold"
                                        >
                                            {metrics.total_trashed}
                                        </Badge>
                                    ) : null}
                                </Button>
                            </div>

                            {(search !== '' || roleFilter !== 'all' || statusFilter !== 'all') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilter}
                                    className="h-9 cursor-pointer"
                                    title="Reset Pencarian"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" asChild className="h-9 cursor-pointer">
                                <Link href="/manajemen-pengguna/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Pengguna</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Users Table Card */}
                <Card className="py-0">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium">Pengguna</th>
                                    <th className="h-10 px-4 text-left font-medium">Role</th>
                                    <th className="h-10 px-4 text-left font-medium">Status Member</th>
                                    <th className="h-10 px-4 text-left font-medium">Saldo Poin</th>
                                    <th className="h-10 px-4 text-left font-medium">Pesanan</th>
                                    <th className="h-10 px-4 text-left font-medium">
                                        {statusFilter === 'trashed' ? 'Waktu Dihapus' : 'Bergabung'}
                                    </th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">
                                                    {statusFilter === 'trashed'
                                                        ? 'Tidak ada akun di dalam tong sampah'
                                                        : 'Tidak ada pengguna ditemukan'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau filter yang dipilih.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className={`hover:bg-muted/50 transition-colors ${user.is_deleted ? 'bg-destructive/5' : ''}`}>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium text-foreground">{user.name}</div>
                                                <div className="text-muted-foreground text-[11px]">{user.email}</div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                {user.is_deleted ? (
                                                    <Badge variant="destructive" className="text-[10px] gap-1">
                                                        <Trash2 className="size-3" />
                                                        Terhapus
                                                    </Badge>
                                                ) : user.role === 'admin' ? (
                                                    <Badge variant="destructive" className="text-[10px]">
                                                        Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        Pelanggan
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {user.membership ? (
                                                    <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                                        Royale Member
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-[11px]">Bukan Member</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {user.membership ? (
                                                    <span className="font-bold text-amber-600 dark:text-amber-400">
                                                        {user.membership.points_formatted} Poin
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle font-mono">
                                                {user.orders_count} pesanan
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                {user.is_deleted ? (
                                                    <div className="text-destructive font-medium text-[11px]">
                                                        {user.deleted_at || '-'}
                                                        <span className="block text-[10px] text-muted-foreground font-normal">
                                                            {user.deleted_at_human}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    user.created_at
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                {user.is_deleted ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={restoringId === user.id}
                                                            onClick={() => handleRestoreUser(user)}
                                                            className="h-8 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                                                            title="Pulihkan Akun"
                                                        >
                                                            <RotateCcw className={`size-3.5 mr-1 ${restoringId === user.id ? 'animate-spin' : ''}`} />
                                                            <span>Pulihkan</span>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => setForceDeleteTarget(user)}
                                                            className="h-8 text-xs cursor-pointer"
                                                            title="Hapus Total dari Database"
                                                        >
                                                            <Trash2 className="size-3.5 mr-1" />
                                                            <span>Hapus Total</span>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            title="Lihat Detail & Mutasi Poin"
                                                        >
                                                            <Link href={`/manajemen-pengguna/${user.id}`}>
                                                                <Eye className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                                            title="Edit Data Pengguna"
                                                        >
                                                            <Link href={`/manajemen-pengguna/${user.id}/edit`}>
                                                                <Edit3 className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                        {user.role !== 'admin' && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDeleteTarget(user)}
                                                                className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                                title="Hapus Pengguna"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links && users.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t px-4 py-3 gap-3">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan <span className="font-medium text-foreground">{users.from || 0}</span> sampai{' '}
                                <span className="font-medium text-foreground">{users.to || 0}</span> dari{' '}
                                <span className="font-medium text-foreground">{users.total}</span> pengguna
                            </div>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 text-xs text-muted-foreground/40 rounded border border-transparent"
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

            {/* Soft Delete Confirmation Dialog */}
            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pindahkan Pengguna ke Sampah?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus akun <strong>{deleteTarget?.name}</strong>? Akun akan dipindahkan ke folder Sampah dan dapat dipulihkan kapan saja.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
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

            {/* Force Delete Confirmation Dialog */}
            <Dialog open={Boolean(forceDeleteTarget)} onOpenChange={(open) => !open && setForceDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive mb-1">
                            <AlertTriangle className="size-5" />
                            <DialogTitle className="text-destructive">Hapus Permanen Akun?</DialogTitle>
                        </div>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus akun <strong>{forceDeleteTarget?.name}</strong> secara <strong>PERMANEN</strong> dari database?
                            <span className="block mt-2 text-rose-600 font-semibold">
                                PERINGATAN: Tindakan ini akan menghapus total data pengguna dan TIDAK DAPAT dipulihkan kembali!
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setForceDeleteTarget(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isForceDeleting}
                            onClick={handleForceDeleteSubmit}
                        >
                            {isForceDeleting ? 'Menghapus Permanen...' : 'Ya, Hapus Total'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
