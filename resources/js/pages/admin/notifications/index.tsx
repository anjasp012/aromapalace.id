import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Bell,
    CheckCheck,
    Trash2,
    ExternalLink,
    ShoppingBag,
    CreditCard,
    Truck,
    Store,
    Ticket,
    RefreshCw,
    Check,
    PackageCheck,
    CheckCircle2,
    XCircle,
    UserCheck,
    Award,
    Coins,
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

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    body: string;
    url?: string | null;
    data?: Record<string, unknown> | null;
    is_read: boolean;
    created_at?: string | null;
    time_ago?: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface NotificationsIndexProps {
    notifications: {
        data: NotificationItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
        status: string;
        type: string;
    };
    metrics?: {
        total: number;
        unread: number;
        read: number;
    };
}

export default function AdminNotificationsIndex({
    notifications,
    filters,
    metrics,
}: NotificationsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-notifikasi', {
            search: search || undefined,
            status: status !== 'all' ? status : undefined,
            type: typeFilter !== 'all' ? typeFilter : undefined,
        }, { preserveState: true });
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        router.get('/manajemen-notifikasi', {
            search: search || undefined,
            status: newStatus !== 'all' ? newStatus : undefined,
            type: typeFilter !== 'all' ? typeFilter : undefined,
        }, { preserveState: true });
    };

    const handleTypeChange = (newType: string) => {
        setTypeFilter(newType);
        router.get('/manajemen-notifikasi', {
            search: search || undefined,
            status: status !== 'all' ? status : undefined,
            type: newType !== 'all' ? newType : undefined,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setTypeFilter('all');
        router.get('/manajemen-notifikasi');
    };

    const handleMarkAllAsRead = () => {
        router.post('/api/notifications/mark-all-read', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleMarkAsRead = (notif: NotificationItem, e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(`/api/notifications/${notif.id}/read`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-notifikasi/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const renderTypeIcon = (notifType: string) => {
        switch (notifType) {
            case 'new_order':
            case 'admin_new_order':
                return (
                    <div className="size-10 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
                        <ShoppingBag className="size-5" />
                    </div>
                );
            case 'payment_success':
            case 'admin_payment_received':
                return (
                    <div className="size-10 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
                        <CreditCard className="size-5" />
                    </div>
                );
            case 'order_shipped':
            case 'admin_order_shipped':
                return (
                    <div className="size-10 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
                        <Truck className="size-5" />
                    </div>
                );
            case 'store_pickup_ready':
            case 'admin_store_pickup_ready':
                return (
                    <div className="size-10 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-xs">
                        <Store className="size-5" />
                    </div>
                );
            case 'order_delivered':
            case 'admin_order_delivered':
                return (
                    <div className="size-10 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20 shadow-xs">
                        <PackageCheck className="size-5" />
                    </div>
                );
            case 'order_completed':
            case 'admin_order_completed':
                return (
                    <div className="size-10 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 border border-green-500/20 shadow-xs">
                        <CheckCircle2 className="size-5" />
                    </div>
                );
            case 'order_canceled':
            case 'admin_order_canceled':
                return (
                    <div className="size-10 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-xs">
                        <XCircle className="size-5" />
                    </div>
                );
            case 'new_user_welcome':
            case 'admin_new_user':
                return (
                    <div className="size-10 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-xs">
                        <UserCheck className="size-5" />
                    </div>
                );
            case 'loyalty_points_earned':
                return (
                    <div className="size-10 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
                        <Award className="size-5" />
                    </div>
                );
            case 'loyalty_points_redeemed':
            case 'admin_points_redeemed':
                return (
                    <div className="size-10 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20 shadow-xs">
                        <Coins className="size-5" />
                    </div>
                );
            case 'voucher_reward':
            case 'promo':
                return (
                    <div className="size-10 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/20 shadow-xs">
                        <Ticket className="size-5" />
                    </div>
                );
            default:
                return (
                    <div className="size-10 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0 border shadow-xs">
                        <Bell className="size-5" />
                    </div>
                );
        }
    };

    const getTypeBadge = (notifType: string) => {
        switch (notifType) {
            case 'new_order':
            case 'admin_new_order':
                return <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Pesanan Baru</Badge>;
            case 'payment_success':
            case 'admin_payment_received':
                return <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Pembayaran</Badge>;
            case 'order_shipped':
            case 'admin_order_shipped':
                return <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">Pengiriman</Badge>;
            case 'store_pickup_ready':
            case 'admin_store_pickup_ready':
                return <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">Ambil di Butik</Badge>;
            case 'order_delivered':
            case 'admin_order_delivered':
                return <Badge variant="secondary" className="text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20">Pesanan Sampai</Badge>;
            case 'order_completed':
            case 'admin_order_completed':
                return <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Pesanan Selesai</Badge>;
            case 'order_canceled':
            case 'admin_order_canceled':
                return <Badge variant="secondary" className="text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20">Pesanan Batal</Badge>;
            case 'new_user_welcome':
            case 'admin_new_user':
                return <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20">Pelanggan Baru</Badge>;
            case 'loyalty_points_earned':
                return <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Poin Belanja</Badge>;
            case 'loyalty_points_redeemed':
            case 'admin_points_redeemed':
                return <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20">Tukar Poin</Badge>;
            case 'voucher_reward':
            case 'promo':
                return <Badge variant="secondary" className="text-[10px] bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20">Promo & Voucher</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px] text-muted-foreground">Sistem</Badge>;
        }
    };

    const unreadCount = metrics?.unread ?? 0;

    return (
        <AdminLayout
            title="Kelola Notifikasi"
            subtitle="Riwayat seluruh pemberitahuan transaksi, pesanan baru, dan aktivitas sistem toko."
        >
            <Head title="Kelola Notifikasi - Admin Panel" />

            <div className="space-y-6">
                {/* Filter and Actions Toolbar */}
                <Card className="p-4">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full lg:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari judul atau isi notifikasi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9 cursor-pointer">
                                Cari
                            </Button>
                        </form>

                        {/* Filter Status Buttons & Actions */}
                        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
                            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange('all')}
                                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                        status === 'all'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Semua {metrics?.total !== undefined && `(${metrics.total})`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange('unread')}
                                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                        status === 'unread'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Belum Dibaca {metrics?.unread !== undefined && `(${metrics.unread})`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange('read')}
                                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                        status === 'read'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Sudah Dibaca {metrics?.read !== undefined && `(${metrics.read})`}
                                </button>
                            </div>

                            {unreadCount > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="h-9 cursor-pointer text-xs"
                                >
                                    <CheckCheck className="size-3.5 mr-1.5 text-primary" />
                                    <span>Tandai Semua Dibaca</span>
                                </Button>
                            )}

                            {(search !== '' || status !== 'all' || typeFilter !== 'all') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-9 cursor-pointer text-xs"
                                    title="Reset Filter"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="pt-3 mt-3 border-t border-border/60 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1 shrink-0">Kategori:</span>
                        {[
                            { key: 'all', label: 'Semua Kategori' },
                            { key: 'orders', label: 'Pesanan Baru' },
                            { key: 'payments', label: 'Pembayaran' },
                            { key: 'shipping', label: 'Pengiriman' },
                            { key: 'delivered', label: 'Pesanan Sampai' },
                            { key: 'completed', label: 'Pesanan Selesai' },
                            { key: 'canceled', label: 'Pesanan Batal' },
                            { key: 'users', label: 'Pelanggan Baru' },
                            { key: 'loyalty', label: 'Poin & Voucher' },
                            { key: 'system', label: 'Sistem' },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => handleTypeChange(cat.key)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                                    typeFilter === cat.key
                                        ? 'bg-[#4A070B] text-white shadow-xs'
                                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Notifications Table Card */}
                <Card className="py-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium w-12">No</th>
                                    <th className="h-10 px-4 text-left font-medium w-16">Ikon</th>
                                    <th className="h-10 px-4 text-left font-medium">Informasi Notifikasi</th>
                                    <th className="h-10 px-4 text-left font-medium w-36">Status</th>
                                    <th className="h-10 px-4 text-left font-medium w-40">Waktu</th>
                                    <th className="h-10 px-4 text-right font-medium w-48">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {notifications.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                            <Bell className="size-9 mx-auto mb-2 opacity-30" />
                                            <p className="font-semibold text-foreground text-sm">Tidak ada notifikasi ditemukan.</p>
                                            <p className="text-xs mt-1">
                                                {search || status !== 'all'
                                                    ? 'Coba sesuaikan kata kunci pencarian atau tab filter status.'
                                                    : 'Belum ada riwayat pemberitahuan sistem.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    notifications.data.map((notif, index) => (
                                        <tr
                                            key={notif.id}
                                            className={`transition-colors hover:bg-muted/50 ${
                                                !notif.is_read ? 'bg-primary/5' : ''
                                            }`}
                                        >
                                            {/* Number */}
                                            <td className="p-4 align-middle text-muted-foreground font-mono">
                                                {(notifications.current_page - 1) * 15 + index + 1}
                                            </td>

                                            {/* Icon */}
                                            <td className="p-4 align-middle">
                                                {renderTypeIcon(notif.type)}
                                            </td>

                                            {/* Details */}
                                            <td className="p-4 align-middle space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {getTypeBadge(notif.type)}
                                                    <span className={`text-sm ${!notif.is_read ? 'font-bold text-foreground' : 'font-semibold text-foreground/85'}`}>
                                                        {notif.title}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                    {notif.body}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4 align-middle">
                                                {!notif.is_read ? (
                                                    <Badge variant="default" className="text-[10px] py-0 px-2 h-5 bg-primary text-primary-foreground font-semibold">
                                                        Belum Dibaca
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 text-muted-foreground">
                                                        Sudah Dibaca
                                                    </Badge>
                                                )}
                                            </td>

                                            {/* Time */}
                                            <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                                                <div className="font-medium text-foreground text-xs">
                                                    {notif.time_ago || notif.created_at}
                                                </div>
                                                {notif.time_ago && notif.created_at && (
                                                    <div className="text-[11px] text-muted-foreground/80 font-mono mt-0.5">
                                                        {notif.created_at}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {!notif.is_read && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleMarkAsRead(notif, e)}
                                                            className="h-8 text-xs cursor-pointer hover:bg-muted"
                                                            title="Tandai Sudah Dibaca"
                                                        >
                                                            <Check className="size-3.5 text-emerald-600 mr-1" />
                                                            <span className="hidden sm:inline">Dibaca</span>
                                                        </Button>
                                                    )}

                                                    {notif.url && (
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-xs cursor-pointer"
                                                        >
                                                            <Link href={`/manajemen-notifikasi/${notif.id}/go`}>
                                                                <span className="hidden sm:inline">Buka</span>
                                                                <ExternalLink className="size-3.5 sm:ml-1 text-primary" />
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(notif)}
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                        title="Hapus Notifikasi"
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

                    {/* Pagination */}
                    {notifications.total > 0 && notifications.links && notifications.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t bg-muted/20 text-xs text-muted-foreground gap-3">
                            <div>
                                Menampilkan <span className="font-semibold text-foreground">{notifications.data.length}</span> dari{' '}
                                <span className="font-semibold text-foreground">{notifications.total}</span> notifikasi
                            </div>
                            <div className="flex items-center gap-1">
                                {notifications.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        asChild={Boolean(link.url)}
                                        disabled={!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 min-w-7 px-2 text-xs"
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                preserveState
                                                preserveScroll
                                            />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Notifikasi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus notifikasi ini dari riwayat panel admin?
                        </DialogDescription>
                    </DialogHeader>

                    {deleteTarget && (
                        <div className="p-3 bg-muted rounded-lg border text-xs space-y-1">
                            <p className="font-semibold text-foreground">{deleteTarget.title}</p>
                            <p className="text-muted-foreground line-clamp-2">{deleteTarget.body}</p>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteSubmit}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
