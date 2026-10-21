import React, { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
    };
    metrics: {
        total_users: number;
        total_customers: number;
        total_admins: number;
        total_members: number;
    };
}

export default function AdminUsersIndex({
    users,
    filters,
    metrics,
}: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const userForm = useForm({
        name: '',
        email: '',
        role: 'customer',
        password: '',
    });

    const applyFilter = (newVals: { search?: string; role?: string }) => {
        router.get(
            '/users',
            {
                search: newVals.search !== undefined ? newVals.search : (search || undefined),
                role: newVals.role !== undefined ? (newVals.role !== 'all' ? newVals.role : undefined) : (roleFilter !== 'all' ? roleFilter : undefined),
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

    const handleResetFilter = () => {
        setSearch('');
        setRoleFilter('all');
        router.get('/users');
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        userForm.setData({
            name: '',
            email: '',
            role: 'customer',
            password: '',
        });
        userForm.clearErrors();
        setDialogOpen(true);
    };

    const handleOpenEdit = (user: UserItem) => {
        setEditingUser(user);
        userForm.setData({
            name: user.name,
            email: user.email,
            role: user.role,
            password: '',
        });
        userForm.clearErrors();
        setDialogOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            userForm.put(`/users/${editingUser.id}`, {
                onSuccess: () => {
                    setDialogOpen(false);
                    userForm.reset();
                },
            });
        } else {
            userForm.post('/users', {
                onSuccess: () => {
                    setDialogOpen(false);
                    userForm.reset();
                },
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/users/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AdminLayout
            title="Manajemen Pengguna"
            subtitle="Kelola seluruh akun pelanggan, hak akses administrator, dan status keanggotaan poin loyalitas."
        >
            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_users}</div>
                            <p className="text-xs text-muted-foreground mt-1">Akun terdaftar di sistem</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pelanggan</CardTitle>
                            <ShoppingBag className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_customers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Akun customer aktif</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Administrator</CardTitle>
                            <Shield className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_admins}</div>
                            <p className="text-xs text-muted-foreground mt-1">Akses penuh admin panel</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Member Royale</CardTitle>
                            <Crown className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_members}</div>
                            <p className="text-xs text-muted-foreground mt-1">Memiliki akun poin loyalitas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Actions Bar */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama atau email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                                <SelectTrigger className="w-36 h-9 text-xs">
                                    <SelectValue placeholder="Semua Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Role</SelectItem>
                                    <SelectItem value="customer">Pelanggan</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" size="sm" className="h-9">
                                Cari
                            </Button>
                        </form>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {(search !== '' || roleFilter !== 'all') && (
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
                                <span>Tambah Pengguna</span>
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
                                    <th className="h-10 px-4 text-left font-medium">Bergabung</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            Tidak ada pengguna ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle">
                                                <div className="font-medium text-foreground">{user.name}</div>
                                                <div className="text-muted-foreground text-[11px]">{user.email}</div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                {user.role === 'admin' ? (
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
                                                {user.created_at}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 text-muted-foreground hover:text-foreground"
                                                        title="Lihat Detail & Mutasi Poin"
                                                    >
                                                        <Link href={`/users/${user.id}`}>
                                                            <Eye className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="size-8 text-muted-foreground hover:text-foreground"
                                                        title="Edit Data Pengguna"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    {user.role !== 'admin' && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteTarget(user)}
                                                            className="size-8 text-destructive hover:bg-destructive/10"
                                                            title="Hapus Pengguna"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links.length > 3 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan {users.data.length} dari {users.total} pengguna
                            </div>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, idx) => {
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

            {/* Create/Edit Modal Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'Perbarui nama, alamat email, role akses, atau kata sandi pengguna.'
                                : 'Daftarkan akun pelanggan atau admin baru ke dalam sistem Aroma Palace.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="text-xs font-medium text-foreground block">
                                Nama Lengkap <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Contoh: Budi Santoso"
                                value={userForm.data.name}
                                onChange={(e) => userForm.setData('name', e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                            {userForm.errors.name && (
                                <p className="text-xs text-destructive">{userForm.errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-medium text-foreground block">
                                Alamat Email <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="budi@example.com"
                                value={userForm.data.email}
                                onChange={(e) => userForm.setData('email', e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                            {userForm.errors.email && (
                                <p className="text-xs text-destructive">{userForm.errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="role" className="text-xs font-medium text-foreground block">
                                Role Akses <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={userForm.data.role}
                                onValueChange={(val) => userForm.setData('role', val)}
                            >
                                <SelectTrigger id="role" className="h-9 text-xs">
                                    <SelectValue placeholder="Pilih Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer">Pelanggan (Customer)</SelectItem>
                                    <SelectItem value="admin">Administrator (Admin CMS)</SelectItem>
                                </SelectContent>
                            </Select>
                            {userForm.errors.role && (
                                <p className="text-xs text-destructive">{userForm.errors.role}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-xs font-medium text-foreground block">
                                Kata Sandi {editingUser ? '(Opsional)' : <span className="text-destructive">*</span>}
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 8 karakter'}
                                value={userForm.data.password}
                                onChange={(e) => userForm.setData('password', e.target.value)}
                                className="h-9 text-xs"
                                required={!editingUser}
                            />
                            {userForm.errors.password && (
                                <p className="text-xs text-destructive">{userForm.errors.password}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDialogOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" size="sm" disabled={userForm.processing}>
                                {userForm.processing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Pengguna</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus akun <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
        </AdminLayout>
    );
}
