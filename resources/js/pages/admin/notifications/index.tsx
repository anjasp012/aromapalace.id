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
    Filter,
    RefreshCw,
    Sparkles,
    AlertCircle,
    Check,
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
    metrics: {
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
    const [type, setType] = useState(filters.type || 'all');
    const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manajemen-notifikasi', {
            search: search || undefined,
            status: status !== 'all' ? status : undefined,
            type: type !== 'all' ? type : undefined,
        }, { preserveState: true });
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        router.get('/manajemen-notifikasi', {
            search: search || undefined,
            status: newStatus !== 'all' ? newStatus : undefined,
            type: type !== 'all' ? type : undefined,
        }, { preserveState: true });
    };

    const handleTypeChange = (newType: string) => {
        setType(newType);
        router.get('/manajemen-notifikasi', {
            search: search || undefined,
            status: status !== 'all' ? status : undefined,
            type: newType !== 'all' ? newType : undefined,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setType('all');
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

    const getTypeIcon = (notifType: string) => {
        switch (notifType) {
            case 'new_order':
                return (
                    <div className="size-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <ShoppingBag className="size-4" />
                    </div>
                );
            case 'payment_success':
            case 'admin_payment_received':
                return (
                    <div className="size-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CreditCard className="size-4" />
                    </div>
                );
            case 'order_shipped':
                return (
                    <div className="size-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Truck className="size-4" />
                    </div>
                );
            case 'store_pickup_ready':
                return (
                    <div className="size-9 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Store className="size-4" />
                    </div>
                );
            case 'voucher_reward':
            case 'promo':
                return (
                    <div className="size-9 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                        <Ticket className="size-4" />
                    </div>
                );
            default:
                return (
                    <div className="size-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                        <Bell className="size-4" />
                    </div>
                );
        }
    };

    const getTypeLabel = (notifType: string) => {
        switch (notifType) {
            case 'new_order':
                return 'Pesanan Baru';
            case 'payment_success':
            case 'admin_payment_received':
                return 'Pembayaran';
            case 'order_shipped':
                return 'Pengiriman';
            case 'store_pickup_ready':
                return 'Ambil di Toko';
            case 'voucher_reward':
            case 'promo':
                return 'Promo & Voucher';
            default:
                return 'Sistem';
        }
    };

    return (
        <AdminLayout
            title="Pusat Notifikasi"
            subtitle="Riwayat pemberitahuan transaksi, pesanan baru, dan aktivitas sistem toko."
        >
            <Head title="Pusat Notifikasi - Admin Panel" />

            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Total Notifikasi
                            </CardTitle>
                            <Bell className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Keseluruhan pemberitahuan tercatat
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs border-amber-500/20 bg-amber-500/5">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Belum Dibaca
                            </CardTitle>
                            <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                {metrics.unread}
                            </div>
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                                Membutuhkan perhatian admin
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs border-emerald-500/20 bg-emerald-500/5">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Sudah Dibaca
                            </CardTitle>
                            <CheckCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                {metrics.read}
                            </div>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                                Telah diperiksa sebelumnya
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Action Toolbar */}
                <Card className="shadow-xs">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            {/* Search Form */}
                            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari judul atau isi notifikasi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 pr-4 text-sm"
                                />
                            </form>

                            <div className="flex items-center gap-2 flex-wrap">
                                {metrics.unread > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleMarkAllAsRead}
                                        className="cursor-pointer"
                                    >
                                        <CheckCheck className="size-4 mr-1.5 text-primary" />
                                        <span>Tandai Semua Dibaca</span>
                                    </Button>
                                )}

                                {(search || status !== 'all' || type !== 'all') && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleReset}
                                        className="cursor-pointer"
                                    >
                                        <RefreshCw className="size-3.5 mr-1.5" />
                                        <span>Reset Filter</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Filter Tabs / Selectors */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mr-1">
                                <Filter className="size-3.5" /> Status:
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                variant={status === 'all' ? 'default' : 'outline'}
                                className="h-7 text-xs rounded-full px-3"
                                onClick={() => handleStatusChange('all')}
                            >
                                Semua ({metrics.total})
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={status === 'unread' ? 'default' : 'outline'}
                                className="h-7 text-xs rounded-full px-3"
                                onClick={() => handleStatusChange('unread')}
                            >
                                Belum Dibaca ({metrics.unread})
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={status === 'read' ? 'default' : 'outline'}
                                className="h-7 text-xs rounded-full px-3"
                                onClick={() => handleStatusChange('read')}
                            >
                                Sudah Dibaca ({metrics.read})
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification List Table / Cards */}
                <Card className="shadow-xs overflow-hidden">
                    {notifications.data.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground space-y-2">
                            <Bell className="size-10 mx-auto opacity-30" />
                            <p className="text-sm font-semibold text-foreground">Tidak ada notifikasi ditemukan</p>
                            <p className="text-xs">
                                {search || status !== 'all' || type !== 'all'
                                    ? 'Coba sesuaikan kata kunci pencarian atau filter status yang dipilih.'
                                    : 'Belum ada riwayat pemberitahuan sistem.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.data.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors hover:bg-muted/40 ${
                                        !notif.is_read ? 'bg-primary/5' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                        {getTypeIcon(notif.type)}

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline" className="text-[10px] py-0 px-2 h-4 font-normal">
                                                    {getTypeLabel(notif.type)}
                                                </Badge>
                                                {!notif.is_read && (
                                                    <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-primary text-primary-foreground font-semibold">
                                                        Baru
                                                    </Badge>
                                                )}
                                                <span className="text-[11px] text-muted-foreground font-mono">
                                                    {notif.time_ago || notif.created_at}
                                                </span>
                                            </div>

                                            <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                                                {notif.title}
                                            </h4>

                                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                                {notif.body}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        {!notif.is_read && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => handleMarkAsRead(notif, e)}
                                                className="h-8 text-xs cursor-pointer"
                                                title="Tandai Sudah Dibaca"
                                            >
                                                <Check className="size-3.5 mr-1 text-emerald-600" />
                                                <span>Tandai Dibaca</span>
                                            </Button>
                                        )}

                                        {notif.url && (
                                            <Button
                                                asChild
                                                variant="default"
                                                size="sm"
                                                className="h-8 text-xs cursor-pointer"
                                            >
                                                <Link href={`/manajemen-notifikasi/${notif.id}/go`}>
                                                    <span>Buka Tautan</span>
                                                    <ExternalLink className="size-3.5 ml-1" />
                                                </Link>
                                            </Button>
                                        )}

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteTarget(notif)}
                                            className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                            title="Hapus Notifikasi"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {notifications.total > 0 && notifications.links && notifications.links.length > 3 && (
                        <div className="flex items-center justify-between p-4 border-t bg-muted/20 text-xs text-muted-foreground">
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
