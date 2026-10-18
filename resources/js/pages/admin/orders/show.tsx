import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    ExternalLink,
    Store,
    Truck,
    CreditCard,
    PackageCheck,
    Package,
    ShoppingBag,
    CheckCircle2,
    Clock,
    XCircle,
    User,
    Phone,
    MapPin,
    Tag,
    FileText,
    Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrderItemDetail {
    id: number;
    product_id: number;
    product_name: string;
    variant_name?: string;
    volume: string;
    price: number;
    price_formatted: string;
    quantity: number;
    total_price: number;
    total_price_formatted: string;
    image: string;
}

interface OrderDetail {
    id: number;
    order_number: string;
    created_at: string;
    created_at_human?: string;
    pay_before?: string | null;
    status: string;
    payment_status: string;
    order_status: string;
    status_label: string;
    delivery_type: string;
    store?: {
        id: number;
        name: string;
        description?: string;
        thumbnail?: string;
        gmaps_link?: string;
    } | null;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
    recipient_name?: string;
    recipient_phone?: string;
    shipping_address?: string;
    city?: string;
    postal_code?: string;
    courier?: string;
    shipping_cost: number;
    shipping_cost_formatted: string;
    subtotal: number;
    subtotal_formatted: string;
    discount_amount: number;
    discount_amount_formatted: string;
    voucher_code?: string | null;
    voucher?: {
        code: string;
        name: string;
        type: string;
        value: number;
    } | null;
    total_amount: number;
    total_amount_formatted: string;
    payment_method: string;
    payment_channel: string;
    payment_code: string;
    notes?: string | null;
    items_count: number;
    items: OrderItemDetail[];
}

interface OrderShowProps {
    order: OrderDetail;
}

export default function AdminOrderShow({ order }: OrderShowProps) {
    const isPickup = order.delivery_type === 'pickup';
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const currentStep = (() => {
        switch (order.order_status) {
            case 'selesai': return 4;
            case 'dikirim':
            case 'pengambilan': return 3;
            case 'diproses':
            case 'menunggu_konfirmasi': return 2;
            case 'menunggu_pembayaran':
            default: return 1;
        }
    })();

    const handleUpdateStatus = (newStatus: string) => {
        setIsUpdatingStatus(true);
        router.patch(
            `/admin/orders/${order.order_number}/status`,
            {
                status: newStatus,
            },
            {
                onFinish: () => setIsUpdatingStatus(false),
            }
        );
    };

    const renderPaymentStatusBadge = () => {
        if (order.payment_status === 'paid') {
            return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="size-3 mr-1" /> Lunas</Badge>;
        }
        if (order.payment_status === 'cancelled') {
            return <Badge variant="destructive"><XCircle className="size-3 mr-1" /> Dibatalkan</Badge>;
        }
        return <Badge variant="outline"><Clock className="size-3 mr-1" /> Menunggu Pembayaran</Badge>;
    };

    const renderOrderStatusBadge = () => {
        switch (order.order_status) {
            case 'selesai':
                return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">Pesanan Selesai</Badge>;
            case 'dikirim':
            case 'pengambilan':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">{isPickup ? 'Siap Diambil di Butik' : 'Dalam Pengiriman'}</Badge>;
            case 'diproses':
                return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">Sedang Diproses</Badge>;
            case 'menunggu_konfirmasi':
                return <Badge variant="outline" className="text-amber-600 border-amber-300">Menunggu Konfirmasi</Badge>;
            case 'dibatalkan':
                return <Badge variant="destructive">Pesanan Dibatalkan</Badge>;
            case 'menunggu_pembayaran':
            default:
                return <Badge variant="outline">Menunggu Pembayaran</Badge>;
        }
    };

    return (
        <AdminLayout
            title={`Pesanan #${order.order_number}`}
            subtitle="Detail lengkap transaksi, alur pemenuhan barang, dan cetak invoice."
        >
            <div className="space-y-6">
                {/* Back Link & Invoice Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Button variant="ghost" size="sm" asChild className="w-fit p-0 hover:bg-transparent">
                        <Link href="/admin/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Pesanan</span>
                        </Link>
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                        <a
                            href={`/orders/${order.order_number}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FileText className="size-3.5 mr-1.5" />
                            <span>Lihat / Cetak Invoice</span>
                            <ExternalLink className="size-3 ml-1" />
                        </a>
                    </Button>
                </div>

                {/* Status Hero Card */}
                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <CardTitle className="font-mono text-xl sm:text-2xl">
                                    #{order.order_number}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    {renderOrderStatusBadge()}
                                    {renderPaymentStatusBadge()}
                                </div>
                            </div>
                            <CardDescription className="mt-1">
                                Dibuat pada {order.created_at} ({order.created_at_human})
                            </CardDescription>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {(order.order_status === 'diproses' || order.order_status === 'menunggu_konfirmasi') && (
                                <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus('dikirim')}
                                    disabled={isUpdatingStatus}
                                >
                                    {isPickup ? (
                                        <>
                                            <ShoppingBag className="size-4 mr-1.5" />
                                            <span>Siap Diambil di Butik</span>
                                        </>
                                    ) : (
                                        <>
                                            <Truck className="size-4 mr-1.5" />
                                            <span>Telah Dikirim Kurir</span>
                                        </>
                                    )}
                                </Button>
                            )}

                            {order.order_status === 'dikirim' && (
                                <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus('selesai')}
                                    disabled={isUpdatingStatus}
                                >
                                    <CheckCircle2 className="size-4 mr-1.5" />
                                    <span>Selesaikan Pesanan</span>
                                </Button>
                            )}

                            {order.order_status !== 'dibatalkan' && order.order_status !== 'selesai' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (confirm(`Batalkan pesanan #${order.order_number}?`)) {
                                            handleUpdateStatus('dibatalkan');
                                        }
                                    }}
                                    disabled={isUpdatingStatus}
                                    className="text-destructive hover:bg-destructive/10"
                                >
                                    <XCircle className="size-3.5 mr-1" />
                                    <span>Batalkan</span>
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    {/* Stepper Tracking Visual (4 Steps: Bayar -> Diproses -> Dikirim -> Selesai) */}
                    {order.order_status !== 'dibatalkan' && (
                        <CardContent className="pt-2">
                            <div className="grid grid-cols-4 text-center gap-2 py-2">
                                <div className="flex flex-col items-center">
                                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                        currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        <CreditCard className="size-4" />
                                    </div>
                                    <span className="text-xs font-medium mt-1.5 text-foreground">1. Bayar (PG)</span>
                                    <span className="text-[10px] text-muted-foreground">{currentStep > 1 ? 'Lunas' : 'Menunggu'}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                        currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        <Package className="size-4" />
                                    </div>
                                    <span className="text-xs font-medium mt-1.5 text-foreground">2. Diproses</span>
                                    <span className="text-[10px] text-muted-foreground">{currentStep >= 2 ? 'Disiapkan' : 'Antre'}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                        currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {isPickup ? <ShoppingBag className="size-4" /> : <Truck className="size-4" />}
                                    </div>
                                    <span className="text-xs font-medium mt-1.5 text-foreground">3. {isPickup ? 'Pengambilan' : 'Dikirim'}</span>
                                    <span className="text-[10px] text-muted-foreground">{isPickup ? 'Di Butik' : 'Kurir'}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                        currentStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        <CheckCircle2 className="size-4" />
                                    </div>
                                    <span className="text-xs font-medium mt-1.5 text-foreground">4. Selesai</span>
                                    <span className="text-[10px] text-muted-foreground">{currentStep >= 4 ? 'Tuntas' : 'Menunggu'}</span>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* 2-Column Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Products & Shipping (Span 2) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Products */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Produk Dipesan ({order.items_count} item)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y text-sm">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="p-4 flex items-center gap-4">
                                            <img
                                                src={item.image}
                                                alt={item.product_name}
                                                className="size-16 rounded-md object-cover border bg-muted shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground truncate">{item.product_name}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {item.variant_name ? `${item.variant_name} • ` : ''}
                                                    <span className="font-medium text-foreground">{item.volume}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {item.quantity} x {item.price_formatted}
                                                </div>
                                            </div>
                                            <div className="font-semibold text-right">
                                                {item.total_price_formatted}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delivery / Boutique Card */}
                        <Card>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold">
                                    {isPickup ? 'Informasi Pengambilan di Butik' : 'Informasi Pengiriman Kurir'}
                                </CardTitle>
                                <Badge variant="outline">
                                    {isPickup ? 'Ambil di Butik' : (order.courier || 'Kurir')}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                {isPickup ? (
                                    <div className="rounded-lg border p-4 space-y-1 bg-muted/30">
                                        <div className="font-semibold text-foreground flex items-center gap-2">
                                            <Store className="size-4" />
                                            <span>{order.store?.name || 'Aroma Palace Boutique'}</span>
                                        </div>
                                        {order.store?.description && (
                                            <p className="text-xs text-muted-foreground">{order.store.description}</p>
                                        )}
                                        {order.store?.gmaps_link && (
                                            <a
                                                href={order.store.gmaps_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1 font-medium"
                                            >
                                                <span>Buka Google Maps</span>
                                                <ExternalLink className="size-3" />
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1 text-xs">
                                        <div className="text-muted-foreground font-medium">Alamat Tujuan:</div>
                                        <div className="rounded-lg border p-3 bg-muted/30">
                                            <div>{order.shipping_address || '-'}</div>
                                            <div className="font-medium mt-1">{order.city} {order.postal_code}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                                    <div className="rounded-lg border p-3">
                                        <div className="text-muted-foreground">{isPickup ? 'Nama Pengambil' : 'Penerima'}</div>
                                        <div className="font-medium text-sm mt-0.5">{order.recipient_name || 'Pelanggan'}</div>
                                        <div className="text-muted-foreground mt-0.5">{order.recipient_phone || '-'}</div>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <div className="text-muted-foreground">Akun Pemesan</div>
                                        <div className="font-medium text-sm mt-0.5">{order.user?.name || '-'}</div>
                                        <div className="text-muted-foreground mt-0.5">{order.user?.email || '-'}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right: Payment & Status Override */}
                    <div className="space-y-6">
                        {/* Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Ringkasan Pembayaran</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Subtotal Produk</span>
                                    <span>{order.subtotal_formatted}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Ongkos Kirim</span>
                                    <span>{order.shipping_cost_formatted}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                                        <span>Diskon Voucher {order.voucher_code ? `(${order.voucher_code})` : ''}</span>
                                        <span>-{order.discount_amount_formatted}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                    <span>Total Tagihan</span>
                                    <span className="text-base">{order.total_amount_formatted}</span>
                                </div>

                                <div className="rounded-lg border p-3 space-y-1.5 text-xs bg-muted/30 mt-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Metode</span>
                                        <span className="font-medium">{order.payment_channel}</span>
                                    </div>
                                    {order.payment_code && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Kode Bayar</span>
                                            <span className="font-mono font-medium">{order.payment_code}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-muted-foreground">Status</span>
                                        <div>{renderPaymentStatusBadge()}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Manual Status Override */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Ubah Status Manual</CardTitle>
                                <CardDescription>Ganti status pesanan ke tahap spesifik.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateStatus('diproses')}
                                    disabled={isUpdatingStatus || order.order_status === 'diproses'}
                                    className="w-full justify-start text-xs"
                                >
                                    <Package className="size-3.5 mr-2 text-blue-500" />
                                    <span>Set ke Diproses</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateStatus('dikirim')}
                                    disabled={isUpdatingStatus || order.order_status === 'dikirim'}
                                    className="w-full justify-start text-xs"
                                >
                                    <Truck className="size-3.5 mr-2 text-indigo-500" />
                                    <span>Set ke {isPickup ? 'Siap Diambil' : 'Dikirim'}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateStatus('selesai')}
                                    disabled={isUpdatingStatus || order.order_status === 'selesai'}
                                    className="w-full justify-start text-xs text-emerald-600"
                                >
                                    <CheckCircle2 className="size-3.5 mr-2 text-emerald-500" />
                                    <span>Set ke Selesai</span>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
