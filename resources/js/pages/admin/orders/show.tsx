import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import AdminLayout from '@/layouts/AdminLayout';
import TrackingModal from '@/components/TrackingModal';
import AnimatedWaitingDots from '@/components/AnimatedWaitingDots';
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
    FileText,
    Check,
    ChevronDown,
    Sparkles,
    Copy,
    Edit2,
    RefreshCw,
    Printer,
    FileCheck2,
    Eye,
    ThumbsUp,
    ThumbsDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { formatVolume } from '@/lib/utils';

interface OrderItemDetail {
    id: number;
    product_id: number;
    product_name: string;
    variant_name?: string;
    volume: string | number;
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
    address?: string;
    province_id?: number | null;
    province_name?: string | null;
    city_id?: number | null;
    city_name?: string | null;
    district_id?: number | null;
    district_name?: string | null;
    subdistrict_id?: number | null;
    subdistrict_name?: string | null;
    city?: string;
    postal_code?: string;
    courier?: string;
    courier_service?: string;
    courier_service_type?: string;
    courier_logo?: string;
    tracking_number?: string | null;
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
    is_manual?: boolean;
    payment_proof?: string | null;
    payment_proof_uploaded_at?: string | null;
    payment_sender_name?: string | null;
    payment_notes?: string | null;
    notes?: string | null;
    items_count: number;
    items: OrderItemDetail[];
    shipping?: any;
    sender?: any;
    weight_formatted?: string;
    total_qty?: number;
    is_cod?: boolean;
}

export interface PickupSchedule {
    clock: string;
    until: string;
}

interface OrderShowProps {
    order: OrderDetail;
    pickupSchedules?: (PickupSchedule | null)[];
}

export default function AdminOrderShow({ order, pickupSchedules }: OrderShowProps) {
    const isPickup = order.delivery_type === 'pickup';
    const isManualAwaitingConfirmation = order.is_manual && order.order_status === 'menunggu_konfirmasi';
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isAutomaticModalOpen, setIsAutomaticModalOpen] = useState(false);
    const [isApprovingProof, setIsApprovingProof] = useState(false);
    const [isRejectingProof, setIsRejectingProof] = useState(false);

    const isSchedulesLoaded = pickupSchedules !== undefined;
    const validSchedules = React.useMemo(() => {
        if (!Array.isArray(pickupSchedules)) return [];
        return pickupSchedules.filter((s): s is PickupSchedule => Boolean(s && typeof s === 'object' && s.clock));
    }, [pickupSchedules]);

    const formatScheduleDate = (clockStr: string) => {
        try {
            const parts = clockStr.split(' ');
            if (parts.length < 2) return clockStr;
            const [datePart, timePart] = parts;
            const [y, m, d] = datePart.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
            const monthName = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date);
            const timeFormatted = timePart.substring(0, 5);
            return `${dayName}, ${d} ${monthName} ${y} • ${timeFormatted} WIB`;
        } catch {
            return clockStr;
        }
    };

    const [selectedSchedule, setSelectedSchedule] = useState<string>('');
    const [isRefreshingSchedules, setIsRefreshingSchedules] = useState(false);

    React.useEffect(() => {
        if (selectedSchedule && !validSchedules.some((s) => s.clock === selectedSchedule)) {
            setSelectedSchedule('');
        }
    }, [validSchedules, selectedSchedule]);

    // Otomatis pilih slot pertama begitu daftar jadwal tersedia
    React.useEffect(() => {
        if (!selectedSchedule && validSchedules.length > 0) {
            setSelectedSchedule(validSchedules[0].clock);
        }
    }, [validSchedules, selectedSchedule]);

    const handleRefreshSchedules = React.useCallback(() => {
        if (isRefreshingSchedules) return;
        setIsRefreshingSchedules(true);
        router.reload({
            only: ['pickupSchedules'],
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setIsRefreshingSchedules(false);
            },
        });
    }, [isRefreshingSchedules]);

    // Muat jadwal pickup hanya ketika modal dibuka jika belum ada jadwal
    React.useEffect(() => {
        if (isAutomaticModalOpen && !isSchedulesLoaded && !isRefreshingSchedules) {
            handleRefreshSchedules();
        }
    }, [isAutomaticModalOpen, isSchedulesLoaded, isRefreshingSchedules, handleRefreshSchedules]);

    const [manualTrackingNumber, setManualTrackingNumber] = useState(order.tracking_number || '');
    const [manualCourier, setManualCourier] = useState(order.courier || '');
    const [manualError, setManualError] = useState('');
    const [copiedTracking, setCopiedTracking] = useState(false);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const isWaitingTracking = !order.tracking_number || order.tracking_number.toLowerCase().includes('menunggu');

    React.useEffect(() => {
        setManualTrackingNumber(order.tracking_number || '');
        setManualCourier(order.courier || '');
    }, [order.tracking_number, order.courier]);

    // Real-time WebSocket: listen for ShippingUpdated event via Laravel Reverb
    useEcho(
        `orders.${order.order_number}`,
        ['ShippingUpdated', '.ShippingUpdated'],
        () => {
            router.reload({
                preserveScroll: true,
                preserveState: true,
            });
        },
        [order.order_number],
        'public',
    );

    useEcho(
        'admin.orders',
        ['ShippingUpdated', '.ShippingUpdated'],
        () => {
            router.reload({
                preserveScroll: true,
                preserveState: true,
            });
        },
        [order.order_number],
        'public',
    );

    // Smart fallback: poll every 10s if tracking number is pending or order is shipped
    React.useEffect(() => {
        if (!isWaitingTracking && order.order_status !== 'dikirim') return;

        const interval = setInterval(() => {
            router.reload({
                preserveScroll: true,
                preserveState: true,
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [isWaitingTracking, order.order_status]);

    const isPaid = order.payment_status === 'paid';
    const canShip = (order.order_status === 'diproses' || isPaid) &&
        order.order_status !== 'dikirim' &&
        order.order_status !== 'selesai' &&
        order.order_status !== 'dibatalkan';

    const currentStep = (() => {
        switch (order.order_status) {
            case 'selesai': return 4;
            case 'dikirim':
            case 'pengambilan': return 3;
            case 'diproses': return 2;
            case 'menunggu_pembayaran':
            default: return 1;
        }
    })();

    const handleUpdateStatus = (newStatus: string) => {
        setIsUpdatingStatus(true);
        router.patch(
            `/manajemen-pesanan/${order.order_number}/status`,
            {
                status: newStatus,
            },
            {
                onFinish: () => setIsUpdatingStatus(false),
            }
        );
    };

    const handleShipAutomatic = (scheduleClock?: string) => {
        const clockToUse = scheduleClock || selectedSchedule;
        if (!clockToUse) return;

        setIsUpdatingStatus(true);
        router.patch(
            `/manajemen-pesanan/${order.order_number}/status`,
            {
                status: 'dikirim',
                shipping_mode: 'kiriminaja',
                pickup_schedule: clockToUse,
                schedule: clockToUse,
            },
            {
                onFinish: () => {
                    setIsUpdatingStatus(false);
                    setIsAutomaticModalOpen(false);
                },
            }
        );
    };

    const handleShipManual = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = manualTrackingNumber.trim();
        if (!trimmed) {
            setManualError('Nomor resi wajib diisi.');
            return;
        }

        setIsUpdatingStatus(true);
        router.patch(
            `/manajemen-pesanan/${order.order_number}/status`,
            {
                status: 'dikirim',
                shipping_mode: 'manual',
                tracking_number: trimmed,
                courier: manualCourier.trim() || order.courier || 'Kurir Rekanan',
            },
            {
                onFinish: () => {
                    setIsUpdatingStatus(false);
                    setIsManualModalOpen(false);
                },
            }
        );
    };

    const handleCopyTracking = () => {
        if (isWaitingTracking || !order.tracking_number) return;
        navigator.clipboard.writeText(order.tracking_number);
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
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
                        <Link href="/manajemen-pesanan" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Pesanan</span>
                        </Link>
                    </Button>

                    {/* Desktop: Buka tab baru */}
                    <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
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

                    {/* Mobile: Buka di tab yang sama */}
                    <Button variant="outline" size="sm" asChild className="sm:hidden inline-flex">
                        <Link href={`/orders/${order.order_number}/invoice`}>
                            <FileText className="size-3.5 mr-1.5" />
                            <span>Lihat / Cetak Invoice</span>
                            <ExternalLink className="size-3 ml-1" />
                        </Link>
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
                            {canShip && (
                                isPickup ? (
                                    <Button
                                        size="sm"
                                        onClick={() => handleUpdateStatus('dikirim')}
                                        disabled={isUpdatingStatus}
                                    >
                                        <ShoppingBag className="size-4 mr-1.5" />
                                        <span>Siap Diambil di Butik</span>
                                    </Button>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                size="sm"
                                                disabled={isUpdatingStatus}
                                                className="bg-[#4A070B] hover:bg-[#360407] text-[#E8D0BA] dark:bg-[#E8D0BA] dark:text-[#4A070B] dark:hover:bg-[#dfc4ab] font-medium shadow-xs"
                                            >
                                                <Truck className="size-4 mr-1.5" />
                                                <span>Kirim</span>
                                                <ChevronDown className="size-3.5 ml-1.5 opacity-70" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 p-1.5">
                                            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                                                Metode Penerbitan Resi
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedSchedule('');
                                                    setIsAutomaticModalOpen(true);
                                                }}
                                                disabled={isUpdatingStatus}
                                                className="cursor-pointer py-2 px-2.5 rounded-md focus:bg-accent"
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                                        <Sparkles className="size-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold text-foreground">Resi Otomatis</div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                                            Pilih jadwal pickup &amp; generate resi KiriminAja
                                                        </div>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setManualTrackingNumber(order.tracking_number || '');
                                                    setManualCourier(order.courier || '');
                                                    setManualError('');
                                                    setIsManualModalOpen(true);
                                                }}
                                                disabled={isUpdatingStatus}
                                                className="cursor-pointer py-2 px-2.5 rounded-md focus:bg-accent"
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                                                        <FileText className="size-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold text-foreground">Resi Manual</div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                                            Input nomor resi & kurir sendiri
                                                        </div>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )
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
                                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                        }`}>
                                        <CreditCard className="size-4" />
                                    </div>
                                    <span className="text-xs font-medium mt-1.5 text-foreground">1. Bayar</span>
                                    <span className="text-[10px] text-muted-foreground">{currentStep > 1 ? 'Lunas' : 'Menunggu'}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                        }`}>
                                        <Package className="size-4" />
                                    </div>
                                    <span className="text-xs font-medium mt-1.5 text-foreground">2. Diproses</span>
                                    <span className="text-[10px] text-muted-foreground">{currentStep >= 2 ? 'Disiapkan' : 'Antre'}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {isPickup ? <ShoppingBag className="size-4" /> : <Truck className="size-4" />}
                                    </div>
                                    <span className="text-xs font-medium mt-1.5 text-foreground">3. {isPickup ? 'Pengambilan' : 'Dikirim'}</span>
                                    <span className="text-[10px] text-muted-foreground">{isPickup ? 'Di Butik' : 'Kurir'}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
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
                                                    <span className="font-medium text-foreground">{formatVolume(item.volume)}</span>
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
                            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
                                <CardTitle className="text-base font-semibold">
                                    {isPickup ? 'Informasi Pengambilan di Butik' : 'Informasi Pengiriman Kurir'}
                                </CardTitle>
                                {isPickup ? (
                                    <Badge variant="outline">Ambil di Butik</Badge>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {order.courier_logo && (
                                            <div className="h-7 w-16 px-1.5 py-0.5 rounded-md bg-white border border-border/80 shadow-2xs flex items-center justify-center shrink-0">
                                                <img
                                                    src={order.courier_logo}
                                                    alt={order.courier || 'Kurir'}
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                        )}
                                        <Badge variant="outline" className="font-semibold text-xs">
                                            {order.courier || 'Kurir'}
                                        </Badge>
                                    </div>
                                )}
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
                                    <>
                                        {order.tracking_number ? (
                                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                        <Truck className="size-3.5 text-primary" />
                                                        <span>Nomor Resi / AWB</span>
                                                    </span>

                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-sm sm:text-base font-extrabold text-foreground tracking-wider select-all">
                                                        {isWaitingTracking ? (
                                                            <AnimatedWaitingDots text="Menunggu Resi" className="text-amber-600 dark:text-amber-400 font-semibold" />
                                                        ) : (
                                                            order.tracking_number
                                                        )}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="h-7 px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                                                        >
                                                            <a
                                                                href={`/manajemen-pesanan/${order.id}/shipping-label?print=1`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Cetak label pengiriman thermal (100x150mm) di tab baru"
                                                            >
                                                                <Printer className="size-3 mr-1" />
                                                                <span>Cetak Label</span>
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleCopyTracking}
                                                            disabled={isWaitingTracking}
                                                            className="h-7 px-2.5 text-xs disabled:opacity-50"
                                                        >
                                                            {copiedTracking ? (
                                                                <>
                                                                    <Check className="size-3 mr-1 text-emerald-600" />
                                                                    <span>Tersalin</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="size-3 mr-1" />
                                                                    <span>Salin</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setIsTrackingModalOpen(true)}
                                                            title="Lacak status dan riwayat pengiriman paket"
                                                            className="h-7 px-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20"
                                                        >
                                                            <Truck className="size-3 mr-1" />
                                                            <span>Lacak</span>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setManualTrackingNumber(order.tracking_number || '');
                                                                setManualCourier(order.courier || '');
                                                                setManualError('');
                                                                setIsManualModalOpen(true);
                                                            }}
                                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Edit2 className="size-3 mr-1" />
                                                            <span>Ubah</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (order.order_status === 'dikirim' || order.order_status === 'selesai') ? (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-center justify-between gap-2">
                                                <div className="text-xs text-amber-800 dark:text-amber-300">
                                                    Pesanan telah dikirim namun nomor resi belum dicatat.
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setManualTrackingNumber('');
                                                        setManualCourier(order.courier || '');
                                                        setManualError('');
                                                        setIsManualModalOpen(true);
                                                    }}
                                                    className="h-7 text-xs shrink-0"
                                                >
                                                    Input Resi
                                                </Button>
                                            </div>
                                        ) : null}

                                        <div className="space-y-1 text-xs">
                                            <div className="text-muted-foreground font-medium">Alamat Tujuan:</div>
                                            <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
                                                <div className="text-foreground">{order.address || '-'}</div>
                                                <div className="font-medium text-foreground">
                                                    {[
                                                        order.subdistrict_name ? `Kel. ${order.subdistrict_name}` : null,
                                                        order.district_name ? `Kec. ${order.district_name}` : null,
                                                        order.city_name || order.city,
                                                        order.province_name,
                                                        order.postal_code,
                                                    ].filter(Boolean).join(', ') || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </>
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

                        {/* Manual Payment Proof Card */}
                        {order.is_manual && order.payment_proof && (
                            <Card className="border-orange-200 dark:border-orange-900/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <FileCheck2 className="size-4 text-orange-500" />
                                        <CardTitle className="text-sm font-semibold">Bukti Transfer Manual</CardTitle>
                                    </div>
                                    {order.payment_proof_uploaded_at && (
                                        <p className="text-[11px] text-muted-foreground">Diunggah: {order.payment_proof_uploaded_at}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3 text-xs">
                                    {order.payment_sender_name && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nama Pengirim</span>
                                            <span className="font-medium">{order.payment_sender_name}</span>
                                        </div>
                                    )}
                                    {order.payment_notes && (
                                        <div className="flex justify-between gap-2">
                                            <span className="text-muted-foreground shrink-0">Catatan</span>
                                            <span className="text-right">{order.payment_notes}</span>
                                        </div>
                                    )}

                                    {/* Proof Preview */}
                                    <div className="pt-1">
                                        {order.payment_proof.toLowerCase().endsWith('.pdf') ? (
                                            <a
                                                href={order.payment_proof}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-primary hover:underline"
                                            >
                                                <FileText className="size-3.5" />
                                                Lihat Bukti Transfer (PDF)
                                            </a>
                                        ) : (
                                            <>
                                                <img
                                                    src={order.payment_proof}
                                                    alt="Bukti Transfer"
                                                    className="w-full max-h-48 object-contain rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setIsProofDialogOpen(true)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setIsProofDialogOpen(true)}
                                                    className="mt-1.5 flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                                                >
                                                    <Eye className="size-3" /> Lihat ukuran penuh
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Approve / Reject buttons — only when awaiting confirmation */}
                                    {isManualAwaitingConfirmation && (
                                        <div className="flex gap-2 pt-2 border-t">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                                disabled={isApprovingProof || isRejectingProof}
                                                onClick={() => {
                                                    setIsApprovingProof(true);
                                                    router.post(`/manajemen-pesanan/${order.order_number}/acc-bukti`, {}, {
                                                        preserveScroll: true,
                                                        onFinish: () => setIsApprovingProof(false),
                                                    });
                                                }}
                                            >
                                                <ThumbsUp className="size-3 mr-1.5" />
                                                {isApprovingProof ? 'Memproses...' : 'Acc Bukti'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-8 text-xs border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                                disabled={isApprovingProof || isRejectingProof}
                                                onClick={() => {
                                                    setIsRejectingProof(true);
                                                    router.post(`/manajemen-pesanan/${order.order_number}/tolak-bukti`, {}, {
                                                        preserveScroll: true,
                                                        onFinish: () => setIsRejectingProof(false),
                                                    });
                                                }}
                                            >
                                                <ThumbsDown className="size-3 mr-1.5" />
                                                {isRejectingProof ? 'Memproses...' : 'Tolak Bukti'}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

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
                                {isPickup ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus('dikirim')}
                                        disabled={isUpdatingStatus || order.order_status === 'dikirim'}
                                        className="w-full justify-start text-xs"
                                    >
                                        <Truck className="size-3.5 mr-2 text-indigo-500" />
                                        <span>Set ke Siap Diambil</span>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setManualTrackingNumber(order.tracking_number || '');
                                            setManualCourier(order.courier || '');
                                            setManualError('');
                                            setIsManualModalOpen(true);
                                        }}
                                        disabled={isUpdatingStatus || order.order_status === 'dikirim'}
                                        className="w-full justify-start text-xs"
                                    >
                                        <Truck className="size-3.5 mr-2 text-indigo-500" />
                                        <span>Set ke Dikirim (Input Resi)</span>
                                    </Button>
                                )}
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

            {/* Proof Image Full-Size Preview Dialog */}
            {order.payment_proof && !order.payment_proof.toLowerCase().endsWith('.pdf') && (
                <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
                    <DialogContent className="sm:max-w-2xl p-2">
                        <DialogHeader className="px-3 pt-2 pb-1">
                            <DialogTitle className="flex items-center gap-2 text-sm">
                                <FileCheck2 className="size-4 text-orange-500" />
                                Bukti Transfer — #{order.order_number}
                            </DialogTitle>
                            {order.payment_sender_name && (
                                <DialogDescription className="text-xs">
                                    Atas nama: <span className="font-medium text-foreground">{order.payment_sender_name}</span>
                                    {order.payment_proof_uploaded_at && <> · {order.payment_proof_uploaded_at}</>}
                                </DialogDescription>
                            )}
                        </DialogHeader>
                        <div className="overflow-auto max-h-[75vh] rounded-md border">
                            <img
                                src={order.payment_proof}
                                alt="Bukti Transfer"
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal Dialog Input Resi Manual */}
            <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="size-5 text-[#4A070B] dark:text-[#E8D0BA]" />
                            <span>Kirim Pesanan - Resi Manual</span>
                        </DialogTitle>
                        <DialogDescription>
                            Masukkan kurir dan nomor resi pengiriman untuk pesanan #{order.order_number}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleShipManual} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Kurir Pengiriman
                            </label>
                            <Input
                                value={manualCourier}
                                onChange={(e) => setManualCourier(e.target.value)}
                                placeholder="Contoh: J&T Express, JNE, SiCepat"
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Nomor Resi / No. Waybill <span className="text-destructive">*</span>
                            </label>
                            <Input
                                value={manualTrackingNumber}
                                onChange={(e) => {
                                    setManualTrackingNumber(e.target.value);
                                    if (manualError) setManualError('');
                                }}
                                placeholder="Contoh: JP8291038291, TJNE01928392"
                                className="font-mono text-xs"
                                autoFocus
                            />
                            {manualError && (
                                <p className="text-[11px] text-destructive font-medium">{manualError}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                Nomor resi akan langsung dikirimkan ke akun pembeli dan dapat dipantau di status pesanan.
                            </p>
                        </div>

                        <DialogFooter className="pt-3 gap-3 sm:gap-3 flex-row items-center justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsManualModalOpen(false)}
                                disabled={isUpdatingStatus}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isUpdatingStatus}
                                className="bg-[#4A070B] hover:bg-[#360407] text-[#E8D0BA] dark:bg-[#E8D0BA] dark:text-[#4A070B] dark:hover:bg-[#dfc4ab]"
                            >
                                {isUpdatingStatus ? 'Menyimpan...' : 'Kirim Pesanan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Modal Dialog Pilih Jadwal Pickup (Resi Otomatis KiriminAja) */}
            <Dialog
                open={isAutomaticModalOpen}
                onOpenChange={(open) => {
                    setIsAutomaticModalOpen(open);
                    if (!open) {
                        setSelectedSchedule('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
                            <span>Pilih Jadwal Pickup (Resi Otomatis)</span>
                        </DialogTitle>
                        <DialogDescription>
                            Tentukan waktu penjemputan paket oleh kurir untuk pesanan #{order.order_number}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Ringkasan Pengiriman */}
                        <div className="bg-muted/40 border border-border/70 rounded-lg p-3 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Kurir Ekspedisi:</span>
                                <div className="flex items-center gap-2 font-semibold text-foreground">
                                    {order.courier_logo && (
                                        <div className="h-6 w-14 px-1 py-0.5 rounded bg-white border border-border/70 shadow-2xs flex items-center justify-center shrink-0">
                                            <img
                                                src={order.courier_logo}
                                                alt={order.courier || 'Kurir'}
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <span>{order.courier || 'KiriminAja Express'}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Penerima:</span>
                                <span className="font-semibold text-foreground truncate max-w-[200px]">
                                    {order.recipient_name} ({order.recipient_phone})
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span>Tujuan:</span>
                                <span className="font-medium text-foreground truncate max-w-[200px]">
                                    {[order.district_name, order.city_name || order.city].filter(Boolean).join(', ') || order.address}
                                </span>
                            </div>
                        </div>

                        {/* Pilihan Jadwal Pickup */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <span>Pilihan Jadwal Pickup Tersedia</span>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                        ({validSchedules.length} slot waktu)
                                    </span>
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRefreshSchedules()}
                                    disabled={isRefreshingSchedules || isUpdatingStatus}
                                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground border-border/80 flex items-center gap-1.5 transition-colors"
                                    title="Perbarui daftar jadwal pickup dari KiriminAja"
                                >
                                    <RefreshCw className={`size-3 ${isRefreshingSchedules ? 'animate-spin text-[#4A070B] dark:text-[#E8D0BA]' : ''}`} />
                                    <span>{isRefreshingSchedules ? 'Memperbarui...' : 'Refresh Jadwal'}</span>
                                </Button>
                            </div>

                            {(!isSchedulesLoaded || isRefreshingSchedules) && validSchedules.length === 0 ? (
                                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-lg flex flex-col items-center justify-center gap-2.5 bg-muted/20">
                                    <RefreshCw className="size-4 animate-spin text-[#4A070B] dark:text-[#E8D0BA]" />
                                    <div className="space-y-0.5">
                                        <p className="font-medium text-foreground">Memeriksa ketersediaan jadwal pickup...</p>
                                        <p className="text-[11px] text-muted-foreground">Menghubungkan ke sistem ekspedisi KiriminAja</p>
                                    </div>
                                </div>
                            ) : validSchedules.length === 0 ? (
                                <div className="py-5 px-4 text-center text-xs border border-dashed border-amber-500/40 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-foreground">Tidak ada jadwal pickup tersedia saat ini</p>
                                        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                            Ekspedisi belum membuka slot penjemputan atau sedang di luar jam operasional pickup. Anda dapat mencoba refresh kembali atau beralih ke Resi Manual jika paket diantar langsung ke counter kurir.
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRefreshSchedules()}
                                            disabled={isRefreshingSchedules || isUpdatingStatus}
                                            className="h-7 text-xs flex items-center gap-1.5"
                                        >
                                            <RefreshCw className={`size-3 ${isRefreshingSchedules ? 'animate-spin' : ''}`} />
                                            <span>{isRefreshingSchedules ? 'Memeriksa...' : 'Coba Refresh Jadwal'}</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setIsAutomaticModalOpen(false);
                                                setManualTrackingNumber(order.tracking_number || '');
                                                setManualCourier(order.courier || '');
                                                setManualError('');
                                                setIsManualModalOpen(true);
                                            }}
                                            className="h-7 text-xs flex items-center gap-1.5"
                                        >
                                            <FileText className="size-3" />
                                            <span>Gunakan Resi Manual</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                                    {validSchedules.map((schedule, idx) => {
                                        const isSelected = selectedSchedule === schedule.clock;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedSchedule(schedule.clock)}
                                                className={`p-3 rounded-lg border text-left cursor-pointer transition select-none flex items-center justify-between gap-3 ${isSelected
                                                    ? 'border-[#4A070B] dark:border-[#E8D0BA] bg-[#4A070B]/5 dark:bg-[#E8D0BA]/5 ring-1 ring-[#4A070B] dark:ring-[#E8D0BA]'
                                                    : 'border-border/80 hover:border-border bg-background/50 hover:bg-muted/40'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                            ? 'bg-[#4A070B] text-white dark:bg-[#E8D0BA] dark:text-[#4A070B]'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        <Clock className="size-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-foreground">
                                                            <span>{formatScheduleDate(schedule.clock)}</span>
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                                            <span className="font-mono text-[10.5px]">{schedule.clock}</span>
                                                            {schedule.until && (
                                                                <span>• Batas: {schedule.until}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Radio indicator */}
                                                <div
                                                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition ${isSelected
                                                        ? 'border-[#4A070B] dark:border-[#E8D0BA] bg-background'
                                                        : 'border-border/80'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[#4A070B] dark:bg-[#E8D0BA]" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {!selectedSchedule && validSchedules.length > 0 && (
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                                    * Silakan pilih salah satu slot jadwal pickup di atas untuk mengaktifkan tombol terbitkan resi.
                                </p>
                            )}
                        </div>

                        <DialogFooter className="pt-3 gap-2 flex-row items-center justify-between">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsAutomaticModalOpen(false);
                                    setManualTrackingNumber(order.tracking_number || '');
                                    setManualCourier(order.courier || '');
                                    setManualError('');
                                    setIsManualModalOpen(true);
                                }}
                                disabled={isUpdatingStatus}
                                className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 flex items-center gap-1.5"
                            >
                                <FileText className="size-3.5" />
                                <span className="hidden sm:inline">Ganti ke</span> Resi Manual
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAutomaticModalOpen(false)}
                                    disabled={isUpdatingStatus}
                                    className="h-8 text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleShipAutomatic()}
                                    disabled={isUpdatingStatus || isRefreshingSchedules || !selectedSchedule}
                                    className="h-8 text-xs bg-[#4A070B] hover:bg-[#360407] text-[#E8D0BA] dark:bg-[#E8D0BA] dark:text-[#4A070B] dark:hover:bg-[#dfc4ab] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdatingStatus ? 'Memproses Resi...' : 'Terbitkan Resi Otomatis'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <TrackingModal
                open={isTrackingModalOpen}
                onOpenChange={setIsTrackingModalOpen}
                awb={order.tracking_number}
                orderNumber={order.order_number}
                initialData={order ? {
                    ...order.shipping,
                    courier: order.courier,
                    courier_service: order.courier_service,
                    courier_logo: order.courier_logo,
                } : null}
            />
        </AdminLayout>
    );
}
