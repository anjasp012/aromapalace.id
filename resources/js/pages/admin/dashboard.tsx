import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    DollarSign,
    ShoppingBag,
    Users,
    Package,
    AlertCircle,
    ArrowUpRight,
    Truck,
    Store,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
} from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OrderSummary {
    id: number;
    order_number: string;
    recipient_name?: string;
    recipient_phone?: string;
    customer_email?: string;
    delivery_type: string;
    store_name?: string;
    total_amount: number;
    total_amount_formatted: string;
    payment_channel: string;
    payment_status: string;
    order_status: string;
    status_label: string;
    items_count: number;
    first_item?: string;
    created_at: string;
    created_at_human?: string;
}

interface DashboardProps {
    metrics: {
        total_revenue: number;
        total_revenue_formatted: string;
        total_orders: number;
        total_customers: number;
        total_products: number;
        needs_action_count: number;
    };
    status_counts: {
        menunggu_pembayaran: number;
        menunggu_konfirmasi: number;
        diproses: number;
        dikirim: number;
        pengambilan: number;
        selesai: number;
        dibatalkan: number;
    };
    action_needed_orders: OrderSummary[];
    recent_orders: OrderSummary[];
}

export default function AdminDashboard({
    metrics,
    status_counts,
    action_needed_orders = [],
    recent_orders = [],
}: DashboardProps) {
    const renderStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'selesai':
                return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="size-3 mr-1" /> Selesai</Badge>;
            case 'dikirim':
            case 'pengambilan':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"><Truck className="size-3 mr-1" /> {label}</Badge>;
            case 'diproses':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"><Package className="size-3 mr-1" /> Diproses</Badge>;
            case 'menunggu_konfirmasi':
                return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50/50"><Clock className="size-3 mr-1" /> Konfirmasi</Badge>;
            case 'dibatalkan':
                return <Badge variant="destructive"><XCircle className="size-3 mr-1" /> Dibatalkan</Badge>;
            case 'menunggu_pembayaran':
            default:
                return <Badge variant="outline"><Clock className="size-3 mr-1" /> Menunggu Bayar</Badge>;
        }
    };

    return (
        <AdminLayout
            title="Dashboard"
            subtitle="Ringkasan performa penjualan dan status pemenuhan pesanan."
        >
            <div className="space-y-6">
                {/* 4 Default shadcn Metric Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                            <DollarSign className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_revenue_formatted}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Akumulasi pesanan lunas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                            <ShoppingBag className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_orders}</div>
                            <Link
                                href="/admin/orders"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                            >
                                <span>Lihat semua</span>
                                <ArrowUpRight className="size-3" />
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Perlu Tindakan</CardTitle>
                            <AlertCircle className="size-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {metrics.needs_action_count}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {status_counts.menunggu_konfirmasi} Konfirmasi &bull; {status_counts.diproses} Diproses
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pelanggan</CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_customers}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.total_products} produk di katalog
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Pipeline Navigation */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Alur Status Pesanan</CardTitle>
                        <CardDescription>Pilih status untuk memfilter pesanan secara langsung.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                            <Button variant="outline" asChild className="h-auto py-2.5 flex-col items-start gap-1 justify-start">
                                <Link href="/admin/orders?status=menunggu_pembayaran">
                                    <span className="text-xs text-muted-foreground">Menunggu Bayar</span>
                                    <span className="text-base font-bold">{status_counts.menunggu_pembayaran}</span>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="h-auto py-2.5 flex-col items-start gap-1 justify-start border-amber-200 dark:border-amber-900 bg-amber-50/30">
                                <Link href="/admin/orders?status=menunggu_konfirmasi">
                                    <span className="text-xs text-amber-700 dark:text-amber-400">Konfirmasi</span>
                                    <span className="text-base font-bold text-amber-700 dark:text-amber-400">{status_counts.menunggu_konfirmasi}</span>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="h-auto py-2.5 flex-col items-start gap-1 justify-start border-blue-200 dark:border-blue-900 bg-blue-50/30">
                                <Link href="/admin/orders?status=diproses">
                                    <span className="text-xs text-blue-700 dark:text-blue-400">Diproses</span>
                                    <span className="text-base font-bold text-blue-700 dark:text-blue-400">{status_counts.diproses}</span>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="h-auto py-2.5 flex-col items-start gap-1 justify-start">
                                <Link href="/admin/orders?status=dikirim">
                                    <span className="text-xs text-muted-foreground">Dikirim Kurir</span>
                                    <span className="text-base font-bold">{status_counts.dikirim}</span>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="h-auto py-2.5 flex-col items-start gap-1 justify-start">
                                <Link href="/admin/orders?status=pengambilan">
                                    <span className="text-xs text-muted-foreground">Ambil di Butik</span>
                                    <span className="text-base font-bold">{status_counts.pengambilan}</span>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="h-auto py-2.5 flex-col items-start gap-1 justify-start">
                                <Link href="/admin/orders?status=selesai">
                                    <span className="text-xs text-muted-foreground">Selesai</span>
                                    <span className="text-base font-bold">{status_counts.selesai}</span>
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="h-auto py-2.5 flex-col items-start gap-1 justify-start">
                                <Link href="/admin/orders?status=dibatalkan">
                                    <span className="text-xs text-muted-foreground">Dibatalkan</span>
                                    <span className="text-base font-bold">{status_counts.dibatalkan}</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Needed Orders */}
                {action_needed_orders.length > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-semibold">Pesanan Perlu Diproses ({action_needed_orders.length})</CardTitle>
                                <CardDescription>Pesanan yang memerlukan verifikasi admin atau persiapan pengiriman.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/orders?status=menunggu_konfirmasi">
                                    <span>Lihat Semua</span>
                                    <ChevronRight className="size-4 ml-1" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {action_needed_orders.map((order) => {
                                    const isPickup = order.delivery_type === 'pickup';
                                    return (
                                        <div
                                            key={order.id}
                                            className="rounded-lg border p-4 flex flex-col justify-between gap-3 bg-card hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-xs font-semibold">#{order.order_number}</span>
                                                    {renderStatusBadge(order.order_status, order.status_label)}
                                                </div>

                                                <div>
                                                    <div className="font-medium text-sm">{order.recipient_name || 'Pelanggan'}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{order.customer_email || order.recipient_phone || '-'}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    {isPickup ? (
                                                        <span className="inline-flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                                                            <Store className="size-3.5" />
                                                            <span>Ambil di Butik: {order.store_name || 'Butik'}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Truck className="size-3.5" />
                                                            <span>Kurir Pengiriman</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t flex items-center justify-between gap-2">
                                                <span className="font-semibold text-sm">{order.total_amount_formatted}</span>
                                                <Button size="sm" variant="outline" asChild className="h-8">
                                                    <Link href={`/admin/orders/${order.order_number}`}>
                                                        <span>Kelola</span>
                                                        <ChevronRight className="size-3.5 ml-1" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Orders Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">Pesanan Terbaru</CardTitle>
                            <CardDescription>Daftar 8 transaksi pesanan paling baru.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/orders">
                                <span>Semua Pesanan</span>
                                <ChevronRight className="size-4 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="border-b bg-muted/50 text-muted-foreground">
                                    <tr className="border-b transition-colors">
                                        <th className="h-10 px-4 text-left font-medium">No. Pesanan</th>
                                        <th className="h-10 px-4 text-left font-medium">Pelanggan</th>
                                        <th className="h-10 px-4 text-left font-medium">Metode</th>
                                        <th className="h-10 px-4 text-left font-medium">Total</th>
                                        <th className="h-10 px-4 text-left font-medium">Status</th>
                                        <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {recent_orders.map((order) => {
                                        const isPickup = order.delivery_type === 'pickup';
                                        return (
                                            <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    <div className="font-mono font-medium">#{order.order_number}</div>
                                                    <div className="text-xs text-muted-foreground">{order.created_at}</div>
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    <div className="font-medium">{order.recipient_name || 'Pelanggan'}</div>
                                                    <div className="text-xs text-muted-foreground">{order.customer_email || order.recipient_phone || '-'}</div>
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    <div className="text-xs font-medium">
                                                        {isPickup ? 'Ambil di Butik' : 'Kurir'}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">{order.payment_channel}</div>
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap font-medium">
                                                    {order.total_amount_formatted}
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    {renderStatusBadge(order.order_status, order.status_label)}
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap text-right">
                                                    <Button variant="ghost" size="sm" asChild className="h-8">
                                                        <Link href={`/admin/orders/${order.order_number}`}>
                                                            <span>Detail</span>
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {recent_orders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                                Belum ada pesanan yang tercatat.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
