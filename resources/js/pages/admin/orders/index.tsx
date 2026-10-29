import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import AdminLayout from '@/layouts/AdminLayout';
import AnimatedWaitingDots from '@/components/AnimatedWaitingDots';
import {
    Search,
    Truck,
    Store,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
    RefreshCw,
    X,
    Eye,
    Package,
    RotateCcw,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface OrderItemPreview {
    name: string;
    quantity: number;
    variant?: string;
    volume: string;
}

interface OrderSummary {
    id: number;
    order_number: string;
    recipient_name?: string;
    recipient_phone?: string;
    customer_name?: string;
    customer_email?: string;
    delivery_type: string;
    store_id?: number | null;
    store_name?: string;
    courier?: string;
    courier_logo?: string;
    tracking_number?: string | null;
    city?: string;
    total_amount: number;
    total_amount_formatted: string;
    payment_method: string;
    payment_channel: string;
    payment_status: string;
    order_status: string;
    status_label: string;
    items_count: number;
    items_preview: OrderItemPreview[];
    created_at: string;
    created_at_human?: string;
    is_deleted?: boolean;
    deleted_at?: string;
    deleted_at_human?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface OrdersIndexProps {
    orders: {
        data: OrderSummary[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    filters: {
        status: string;
        delivery_type: string;
        search: string;
    };
    tab_counts: {
        all: number;
        menunggu_pembayaran: number;
        diproses: number;
        dikirim: number;
        pengambilan: number;
        selesai: number;
        dibatalkan: number;
        sampah?: number;
    };
}

export default function AdminOrdersIndex({
    orders,
    filters,
    tab_counts,
}: OrdersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedDeliveryType, setSelectedDeliveryType] = useState(filters.delivery_type || 'all');
    const [quickStatusOrder, setQuickStatusOrder] = useState<OrderSummary | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<OrderSummary | null>(null);
    const [forceDeleteTarget, setForceDeleteTarget] = useState<OrderSummary | null>(null);
    const [targetStatus, setTargetStatus] = useState<string>('');
    const [statusNotes, setStatusNotes] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isForceDeleting, setIsForceDeleting] = useState(false);
    const [restoringOrder, setRestoringOrder] = useState<string | null>(null);

    const activeTab = filters.status || 'all';

    // Real-time WebSocket: reload orders list on shipping update
    useEcho(
        'admin.orders',
        ['ShippingUpdated', '.ShippingUpdated'],
        () => {
            router.reload({
                preserveScroll: true,
                preserveState: true,
            });
        },
        [],
        'public',
    );

    useEcho(
        'orders',
        ['ShippingUpdated', '.ShippingUpdated'],
        () => {
            router.reload({
                preserveScroll: true,
                preserveState: true,
            });
        },
        [],
        'public',
    );

    const handleTabChange = (statusKey: string) => {
        router.get(
            '/manajemen-pesanan',
            {
                status: statusKey,
                delivery_type: selectedDeliveryType !== 'all' ? selectedDeliveryType : undefined,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/manajemen-pesanan',
            {
                status: activeTab !== 'all' ? activeTab : undefined,
                delivery_type: selectedDeliveryType !== 'all' ? selectedDeliveryType : undefined,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleDeliveryFilterChange = (type: string) => {
        setSelectedDeliveryType(type);
        router.get(
            '/manajemen-pesanan',
            {
                status: activeTab !== 'all' ? activeTab : undefined,
                delivery_type: type !== 'all' ? type : undefined,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedDeliveryType('all');
        router.get('/manajemen-pesanan');
    };

    const handleQuickStatusSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickStatusOrder || !targetStatus) return;

        setIsUpdating(true);
        router.patch(
            `/manajemen-pesanan/${quickStatusOrder.order_number}/status`,
            {
                status: targetStatus,
                notes: statusNotes || undefined,
            },
            {
                onSuccess: () => {
                    setQuickStatusOrder(null);
                    setTargetStatus('');
                    setStatusNotes('');
                },
                onFinish: () => setIsUpdating(false),
            }
        );
    };

    const handleRestoreOrder = (order: OrderSummary) => {
        setRestoringOrder(order.order_number);
        router.post(`/manajemen-pesanan/${order.order_number}/pulihkan`, {}, {
            onFinish: () => setRestoringOrder(null),
        });
    };

    const handleDeleteOrder = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/manajemen-pesanan/${deleteTarget.order_number}`, {
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    const handleForceDeleteOrder = () => {
        if (!forceDeleteTarget) return;
        setIsForceDeleting(true);
        router.delete(`/manajemen-pesanan/${forceDeleteTarget.order_number}/hapus-permanen`, {
            onSuccess: () => setForceDeleteTarget(null),
            onFinish: () => setIsForceDeleting(false),
        });
    };

    const renderStatusBadge = (status: string, label: string, isDeleted?: boolean) => {
        if (isDeleted) {
            return (
                <Badge variant="destructive" className="bg-rose-600 text-white gap-1">
                    <Trash2 className="size-3" /> Terhapus
                </Badge>
            );
        }
        switch (status) {
            case 'selesai':
                return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="size-3 mr-1" /> Selesai</Badge>;
            case 'dikirim':
            case 'pengambilan':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200"><Truck className="size-3 mr-1" /> {label}</Badge>;
            case 'diproses':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200"><Package className="size-3 mr-1" /> Diproses</Badge>;
            case 'dibatalkan':
                return <Badge variant="destructive"><XCircle className="size-3 mr-1" /> Dibatalkan</Badge>;
            case 'menunggu_pembayaran':
            default:
                return <Badge variant="outline"><Clock className="size-3 mr-1" /> Menunggu Bayar</Badge>;
        }
    };

    const TABS = [
        { key: 'all', label: 'Semua', count: tab_counts.all },
        { key: 'menunggu_pembayaran', label: 'Menunggu Bayar', count: tab_counts.menunggu_pembayaran },
        { key: 'diproses', label: 'Diproses', count: tab_counts.diproses },
        { key: 'dikirim', label: 'Dikirim Kurir', count: tab_counts.dikirim },
        { key: 'pengambilan', label: 'Ambil di Butik', count: tab_counts.pengambilan },
        { key: 'selesai', label: 'Selesai', count: tab_counts.selesai },
        { key: 'dibatalkan', label: 'Dibatalkan', count: tab_counts.dibatalkan },
        { key: 'sampah', label: 'Sampah', count: tab_counts.sampah || 0 },
    ];

    return (
        <AdminLayout
            title="Daftar Pesanan"
            subtitle="Pantau alur transaksi dan kelola pengiriman atau pengambilan pesanan."
        >
            <Head title="Daftar Pesanan - Admin Panel" />

            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Pesanan</span>
                                <ShoppingBag className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{tab_counts.all}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {tab_counts.selesai} Selesai &bull; {tab_counts.dibatalkan} Batal
                                {(tab_counts.sampah ?? 0) > 0 && (
                                    <span className="text-destructive font-semibold"> &bull; {tab_counts.sampah} Sampah</span>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Menunggu &amp; Diproses</span>
                                <Clock className="size-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">
                                {tab_counts.menunggu_pembayaran + tab_counts.diproses}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{tab_counts.menunggu_pembayaran} Menunggu &bull; {tab_counts.diproses} Diproses</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Dalam Pengiriman</span>
                                <Truck className="size-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">
                                {tab_counts.dikirim + tab_counts.pengambilan}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{tab_counts.dikirim} Kurir &bull; {tab_counts.pengambilan} Ambil butik</p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pesanan Selesai</span>
                                <CheckCircle2 className="size-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{tab_counts.selesai}</div>
                            <p className="text-xs text-muted-foreground mt-1">Transaksi sukses terbayar</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Tabs Navigation */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <Button
                                key={tab.key}
                                type="button"
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTabChange(tab.key)}
                                className="h-8 gap-2 whitespace-nowrap text-xs"
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${isActive
                                        ? 'bg-primary-foreground text-primary'
                                        : 'bg-muted text-muted-foreground'
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            </Button>
                        );
                    })}
                </div>

                {/* Filter Controls Card */}
                <Card className="p-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari No. Pesanan, Nama, No. HP, Kota..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9">
                                Cari
                            </Button>
                        </form>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <Select
                                value={selectedDeliveryType}
                                onValueChange={(val) => handleDeliveryFilterChange(val)}
                            >
                                <SelectTrigger className="h-9 w-[190px] text-xs">
                                    <SelectValue placeholder="Semua Tipe Pengiriman" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe Pengiriman</SelectItem>
                                    <SelectItem value="delivery">Kurir Pengiriman</SelectItem>
                                    <SelectItem value="pickup">Ambil di Butik</SelectItem>
                                </SelectContent>
                            </Select>

                            {(search !== '' || selectedDeliveryType !== 'all' || activeTab !== 'all') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilter}
                                    className="h-9"
                                    title="Reset Filter"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Orders Table Card */}
                <Card className='py-0'>
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium">No. Pesanan</th>
                                    <th className="h-10 px-4 text-left font-medium">Pelanggan</th>
                                    <th className="h-10 px-4 text-left font-medium">Metode Pengiriman</th>
                                    <th className="h-10 px-4 text-left font-medium">Produk</th>
                                    <th className="h-10 px-4 text-left font-medium">Total</th>
                                    <th className="h-10 px-4 text-left font-medium">Status</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {orders.data.map((order) => {
                                    const isPickup = order.delivery_type === 'pickup';
                                    return (
                                        <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle whitespace-nowrap">
                                                <Link
                                                    href={`/manajemen-pesanan/${order.order_number}`}
                                                    className="font-mono font-semibold text-primary hover:underline block"
                                                >
                                                    #{order.order_number}
                                                </Link>
                                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                                    {order.created_at}
                                                </div>
                                            </td>

                                            <td className="p-4 align-middle whitespace-nowrap">
                                                <div className="font-medium text-foreground">
                                                    {order.recipient_name || 'Pelanggan'}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {order.recipient_phone || '-'}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                                                    {order.city ? order.city : (order.customer_email || '-')}
                                                </div>
                                            </td>

                                            <td className="p-4 align-middle whitespace-nowrap">
                                                {isPickup ? (
                                                    <div>
                                                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                                                            <Store className="size-3 mr-1" /> Ambil Butik
                                                        </Badge>
                                                        <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[140px]">
                                                            {order.store_name || 'Butik Resmi'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            {order.courier_logo ? (
                                                                <div className="h-5 w-12 px-1 py-0.5 rounded bg-white border border-border/70 shadow-2xs flex items-center justify-center shrink-0">
                                                                    <img
                                                                        src={order.courier_logo}
                                                                        alt={order.courier || 'Kurir'}
                                                                        className="h-full w-full object-contain"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <Badge variant="outline">
                                                                    <Truck className="size-3 mr-1" /> Kurir
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[140px]">
                                                            {order.courier || 'Kurir Rekanan'}
                                                        </div>
                                                        {order.tracking_number && (
                                                            <div className="text-[9.5px] font-mono text-primary font-semibold truncate max-w-[140px] mt-0.5">
                                                                Resi: {order.tracking_number.toLowerCase().includes('menunggu') ? (
                                                                    <AnimatedWaitingDots text="Menunggu" />
                                                                ) : (
                                                                    order.tracking_number
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-4 align-middle">
                                                <div className="space-y-1 max-w-[200px]">
                                                    {order.items_preview.map((item, idx) => (
                                                        <div key={idx} className="text-[11px] text-foreground truncate">
                                                            <span className="font-semibold">{item.quantity}x</span> {item.name}{' '}
                                                            <span className="text-muted-foreground">({item.volume})</span>
                                                        </div>
                                                    ))}
                                                    {order.items_count > order.items_preview.length && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            +{order.items_count - order.items_preview.length} item lainnya
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4 align-middle whitespace-nowrap">
                                                <div className="font-semibold text-foreground">
                                                    {order.total_amount_formatted}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {order.payment_channel}
                                                </div>
                                                <span className="text-[10px] uppercase font-medium text-muted-foreground">
                                                    {order.payment_status === 'paid' ? 'Lunas' : order.payment_status}
                                                </span>
                                            </td>

                                            <td className="p-4 align-middle whitespace-nowrap">
                                                {renderStatusBadge(order.order_status, order.status_label, order.is_deleted)}
                                            </td>

                                            <td className="p-4 align-middle whitespace-nowrap text-right">
                                                {order.is_deleted ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={restoringOrder === order.order_number}
                                                            onClick={() => handleRestoreOrder(order)}
                                                            className="h-8 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                                                            title="Pulihkan Pesanan"
                                                        >
                                                            <RotateCcw className={`size-3.5 mr-1 ${restoringOrder === order.order_number ? 'animate-spin' : ''}`} />
                                                            <span>Pulihkan</span>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setForceDeleteTarget(order)}
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
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setQuickStatusOrder(order);
                                                                setTargetStatus(order.order_status);
                                                            }}
                                                            className="h-8 text-xs cursor-pointer"
                                                        >
                                                            Status
                                                        </Button>

                                                        <Button size="sm" variant="default" asChild className="h-8 cursor-pointer">
                                                            <Link href={`/manajemen-pesanan/${order.order_number}`}>
                                                                <Eye className="size-3.5 mr-1" />
                                                                <span>Detail</span>
                                                            </Link>
                                                        </Button>

                                                        {order.order_status === 'dibatalkan' && (
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => setDeleteTarget(order)}
                                                                className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                                title="Pindahkan ke Sampah"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {orders.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ShoppingBag className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">Tidak ada pesanan ditemukan</p>
                                                <p className="text-xs text-muted-foreground">Coba ubah filter status, jenis pengiriman, atau kata kunci pencarian.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {orders.links && orders.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t px-4 py-3 gap-3">
                            <div className="text-xs text-muted-foreground">
                                Menampilkan <span className="font-medium text-foreground">{orders.from || 0}</span> sampai{' '}
                                <span className="font-medium text-foreground">{orders.to || 0}</span> dari{' '}
                                <span className="font-medium text-foreground">{orders.total}</span> pesanan
                            </div>

                            <div className="flex items-center gap-1">
                                {orders.links.map((link, idx) => {
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

            {/* Quick Status Modal */}
            <Dialog open={Boolean(quickStatusOrder)} onOpenChange={(open) => !open && setQuickStatusOrder(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ubah Status Pesanan</DialogTitle>
                        {quickStatusOrder && (
                            <DialogDescription className="font-mono text-xs">
                                #{quickStatusOrder.order_number}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    {quickStatusOrder && (
                        <form onSubmit={handleQuickStatusSubmit} className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Status Baru:</label>
                                <Select
                                    value={targetStatus}
                                    onValueChange={(val) => setTargetStatus(val)}
                                >
                                    <SelectTrigger className="h-9 w-full text-xs">
                                        <SelectValue placeholder="Pilih status baru" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="menunggu_pembayaran">1. Menunggu Pembayaran</SelectItem>
                                        <SelectItem value="diproses">2. Diproses</SelectItem>
                                        <SelectItem value="dikirim">
                                            {quickStatusOrder.delivery_type === 'pickup'
                                                ? '3. Siap Diambil di Butik'
                                                : '3. Dikirim Kurir'}
                                        </SelectItem>
                                        <SelectItem value="selesai">4. Selesai</SelectItem>
                                        <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Catatan (Opsional):</label>
                                <textarea
                                    value={statusNotes}
                                    onChange={(e) => setStatusNotes(e.target.value)}
                                    placeholder="Catatan admin / nomor resi..."
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-transparent p-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuickStatusOrder(null)}
                                    className="h-8 text-xs cursor-pointer"
                                >
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" disabled={isUpdating} className="h-8 text-xs cursor-pointer">
                                    {isUpdating ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete (Soft Delete) Modal */}
            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pindahkan ke Sampah?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin memindahkan pesanan #<strong>{deleteTarget?.order_number}</strong> ke Sampah? Pesanan dapat dipulihkan kapan saja.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-8 text-xs cursor-pointer">
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleDeleteOrder}
                            className="h-8 text-xs cursor-pointer"
                        >
                            {isDeleting ? 'Memindahkan...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Force Delete Modal */}
            <Dialog open={Boolean(forceDeleteTarget)} onOpenChange={(open) => !open && setForceDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md border-destructive/50">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive mb-1">
                            <AlertTriangle className="size-5" />
                            <DialogTitle className="text-destructive">Hapus Permanen Pesanan?</DialogTitle>
                        </div>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus pesanan #<strong>{forceDeleteTarget?.order_number}</strong> secara <strong>PERMANEN</strong> dari database?
                            <span className="block mt-2 text-rose-600 font-medium">
                                PERINGATAN: Seluruh item pesanan dan data resi pengiriman terkait akan dihapus total dari database dan TIDAK DAPAT dipulihkan kembali!
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setForceDeleteTarget(null)} className="h-8 text-xs cursor-pointer">
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isForceDeleting}
                            onClick={handleForceDeleteOrder}
                            className="h-8 text-xs cursor-pointer"
                        >
                            {isForceDeleting ? 'Menghapus Total...' : 'Ya, Hapus Total'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
