import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    X,
    Copy,
    Check,
    MapPin,
    CreditCard,
    Truck,
    ChevronDown,
    ChevronUp,
    PackageCheck,
    PackageOpen,
    Home,
    Info,
    ExternalLink,
    ShoppingBag,
    Store,
} from 'lucide-react';

interface OrderItemData {
    id: number;
    product_id: number;
    variant_id: number | null;
    product_name: string;
    variant_name?: string;
    volume: string;
    price: number;
    price_formatted: string;
    quantity: number;
    total_price: number;
    total_price_formatted: string;
    image: string;
    slug: string;
}

interface OrderVoucherData {
    id: number;
    code: string;
    name: string;
    description?: string;
    terms?: string[];
    type: string;
    value: number;
}

interface OrderStoreData {
    id: number;
    name: string;
    description?: string;
    thumbnail?: string;
    gmaps_link?: string;
}

interface OrderData {
    id: number;
    order_number: string;
    delivery_type?: string;
    store_id?: number | null;
    store?: OrderStoreData | null;
    created_at: string;
    created_at_raw?: string;
    pay_before?: string;
    pay_before_raw?: string;
    status: string;
    order_status?: string;
    status_label: string;
    payment_method: string;
    payment_channel: string;
    payment_code: string;
    recipient_name?: string;
    recipient_phone?: string;
    shipping_address?: string;
    city?: string;
    postal_code?: string;
    courier?: string;
    shipping_cost?: number;
    shipping_cost_formatted?: string;
    subtotal?: number;
    subtotal_formatted?: string;
    discount_amount?: number;
    discount_amount_formatted?: string;
    voucher_code?: string;
    voucher_id?: number | null;
    voucher?: OrderVoucherData | null;
    notes?: string;
    total_amount: number;
    total_amount_formatted: string;
    items_count: number;
    items: OrderItemData[];
}

interface TabCounts {
    all: number;
    menunggu_pembayaran: number;
    menunggu_konfirmasi: number;
    diproses: number;
    dikirim: number;
    selesai: number;
}

interface OrdersProps {
    orders: OrderData[];
    active_tab?: string;
    tab_counts?: TabCounts;
}

const TABS = [
    { key: 'all', label: 'Semua' },
    { key: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
    { key: 'menunggu_konfirmasi', label: 'Menunggu Konfirmasi' },
    { key: 'diproses', label: 'Diproses' },
    { key: 'dikirim', label: 'Dikirim' },
    { key: 'selesai', label: 'Selesai' },
] as const;

export default function OrdersPage({
    orders = [],
    active_tab = 'all',
    tab_counts,
}: OrdersProps) {
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedInvoice, setCopiedInvoice] = useState(false);
    const [showTracking, setShowTracking] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

    // Lock body scroll and close on Escape when modal is open
    useEffect(() => {
        if (selectedOrder) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setSelectedOrder(null);
                }
            };

            window.addEventListener('keydown', handleKeyDown);

            return () => {
                document.body.style.overflow = originalOverflow;
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [selectedOrder]);

    const handleTabChange = (tabKey: string) => {
        router.get(
            '/account/orders',
            tabKey === 'all' ? {} : { status: tabKey },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const toggleOrderItems = (orderId: number) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };

    const handleCopyCode = (code: string) => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(code);
        }
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleCopyInvoice = (orderNumber: string) => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(`INV/${orderNumber.replace('AP-', '')}`);
        }
        setCopiedInvoice(true);
        setTimeout(() => setCopiedInvoice(false), 2000);
    };

    const renderTransactionStatusBadge = (status: string, label: string) => {
        if (status === 'selesai' || status === 'paid') {
            return (
                <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Selesai
                </span>
            );
        }
        if (status === 'dikirim') {
            return (
                <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                    Dikirim
                </span>
            );
        }
        if (status === 'diproses') {
            return (
                <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                    Diproses
                </span>
            );
        }
        if (status === 'menunggu_konfirmasi') {
            return (
                <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
                    Menunggu Konfirmasi
                </span>
            );
        }
        if (status === 'cancelled' || status === 'dibatalkan') {
            return (
                <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    Dibatalkan
                </span>
            );
        }
        return (
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                Menunggu Pembayaran
            </span>
        );
    };

    const renderItemRow = (item: OrderItemData) => (
        <div
            key={item.id}
            className="flex items-center justify-between gap-4"
        >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-md border border-border/80 bg-muted/30 overflow-hidden shrink-0">
                    <img
                        src={item.image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="space-y-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {item.product_name}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] bg-muted/40 border border-border/70 px-2 py-0.5 rounded-md">
                            <span>Ukuran:</span>
                            <strong className="text-foreground">{item.volume}</strong>
                            {item.variant_name && (
                                <span className="text-[#4A070B] dark:text-[#E8D0BA] font-medium ml-0.5">
                                    ({item.variant_name})
                                </span>
                            )}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            Jumlah: <strong className="text-foreground">{item.quantity}</strong>
                        </span>
                    </div>
                </div>
            </div>

            <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm font-bold text-[#4A070B] dark:text-[#E8D0BA]">
                    {item.total_price_formatted}
                </div>
                <div className="text-[10px] text-muted-foreground">
                    {item.price_formatted} / unit
                </div>
            </div>
        </div>
    );

    const renderStatusBadge = (status: string, label: string) => {
        if (status === 'selesai' || status === 'paid') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{label}</span>
                </span>
            );
        }

        if (status === 'dikirim' || status === 'pengambilan') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                    {label === 'Pengambilan' ? <ShoppingBag className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                    <span>{label}</span>
                </span>
            );
        }

        if (status === 'diproses') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                    <Package className="w-3.5 h-3.5" />
                    <span>{label}</span>
                </span>
            );
        }

        if (status === 'menunggu_konfirmasi') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/20">
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>{label}</span>
                </span>
            );
        }

        if (status === 'cancelled' || status === 'dibatalkan') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{label}</span>
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>{label}</span>
            </span>
        );
    };

    return (
        <Layout>
            <Head title="Riwayat Pesanan Saya • Aroma Palace" />

            {/* PAGE HEADER BANNER (Consistent with cart, checkout, and payment) */}
            <div className="border-b border-border/70 bg-gradient-to-b from-muted/30 via-background to-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">Riwayat &amp;</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">Pesanan Saya</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Pantau status transaksi, rincian pembayaran, dan riwayat pesanan wewangian mewah Anda di Aroma Palace.
                    </p>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
                {/* STATUS FILTER TABS (Serverside) */}
                <div className="border-b border-border/80">
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
                        {TABS.map((tab) => {
                            const isActive = (active_tab || 'all') === tab.key;
                            const count = tab_counts ? tab_counts[tab.key as keyof TabCounts] : undefined;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${isActive
                                            ? 'bg-[#4A070B] text-white shadow-xs'
                                            : 'bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/60'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    {typeof count === 'number' && (
                                        <span
                                            className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {orders.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="py-16 px-6 text-center space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15 text-[#4A070B] dark:text-[#E8D0BA] flex items-center justify-center mx-auto">
                            <Package className="w-8 h-8" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">
                            {active_tab && active_tab !== 'all'
                                ? 'Tidak Ada Pesanan'
                                : 'Belum Ada Pesanan'}
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {active_tab && active_tab !== 'all'
                                ? `Belum ada riwayat pesanan dengan status "${TABS.find((t) => t.key === active_tab)?.label}".`
                                : 'Anda belum memiliki riwayat transaksi pesanan di Aroma Palace. Temukan racikan wewangian berkarakter kuat dari Dubai dan mulai koleksi pertama Anda.'}
                        </p>
                        <div className="pt-2 flex items-center justify-center gap-2">
                            {active_tab && active_tab !== 'all' ? (
                                <Button
                                    onClick={() => handleTabChange('all')}
                                    className="bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-semibold px-6 h-10 rounded-md shadow-none cursor-pointer"
                                >
                                    Lihat Semua Pesanan
                                </Button>
                            ) : (
                                <Link href="/products">
                                    <Button className="bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-semibold px-6 h-10 rounded-md shadow-none cursor-pointer">
                                        Mulai Belanja Sekarang
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ORDERS LIST */
                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border/80">
                            <span className="text-xs text-muted-foreground">
                                Menampilkan <strong className="text-foreground">{orders.length}</strong> pesanan
                                {active_tab && active_tab !== 'all' && (
                                    <span> • Status: <strong className="text-foreground">{TABS.find((t) => t.key === active_tab)?.label}</strong></span>
                                )}
                            </span>
                            <Link
                                href="/products"
                                className="text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA]"
                            >
                                Belanja Lagi →
                            </Link>
                        </div>

                        {orders.map((order) => {
                            const isPending = (order.order_status || order.status) === 'menunggu_pembayaran' || (order.status === 'pending' && (!order.order_status || order.order_status === 'menunggu_pembayaran'));
                            const isExpanded = !!expandedOrders[order.id];
                            const remainingCount = order.items.length - 1;

                            return (
                                <div
                                    key={order.id}
                                    className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none space-y-4 transition-colors"
                                >
                                    {/* Order Card Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/80 text-xs">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="font-extrabold text-foreground tracking-wide font-mono">
                                                #{order.order_number}
                                            </span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="text-muted-foreground">{order.created_at}</span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="text-muted-foreground">{order.payment_channel}</span>
                                        </div>

                                        <div>
                                            {renderStatusBadge(order.order_status || order.status, order.status_label)}
                                        </div>
                                    </div>

                                    {/* Order Items List (Shows 1 product by default, accordion for remaining) */}
                                    <div className="space-y-3">
                                        {order.items.length > 0 && renderItemRow(order.items[0])}

                                        {remainingCount > 0 && (
                                            <div className="space-y-3">
                                                {isExpanded && (
                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {order.items.slice(1).map(renderItemRow)}
                                                    </div>
                                                )}

                                                <div className="pt-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleOrderItems(order.id)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] hover:opacity-85 transition-opacity cursor-pointer py-1 px-2.5 rounded-md bg-muted/40 hover:bg-muted/70 border border-border/80"
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <span>Sembunyikan produk lainnya</span>
                                                                <ChevronUp className="w-3.5 h-3.5" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>Lihat {remainingCount} produk lainnya</span>
                                                                <ChevronDown className="w-3.5 h-3.5" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Card Footer */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/80">
                                        <div>
                                            <div className="text-[11px] text-muted-foreground">
                                                Total Pembayaran ({order.items_count} produk)
                                            </div>
                                            <div className="text-base sm:text-lg font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                                {order.total_amount_formatted}
                                            </div>
                                        </div>

                                        {/* Action buttons: Detail Pesanan on the left, Selesaikan Pembayaran on the right */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedOrder(order)}
                                                className="border border-border/80 hover:bg-muted text-xs font-semibold h-9 px-4 rounded-md shadow-none cursor-pointer bg-background text-foreground"
                                            >
                                                Detail Pesanan
                                            </Button>

                                            {isPending && (
                                                <Link href={`/payment/${order.order_number}`}>
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-semibold h-9 px-4 rounded-md shadow-none cursor-pointer"
                                                    >
                                                        Selesaikan Pembayaran
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* DETAIL TRANSAKSI POPUP MODAL */}
            {selectedOrder && (() => {
                const effectiveStatus = selectedOrder.order_status || (selectedOrder.status === 'paid' ? 'selesai' : 'menunggu_pembayaran');
                const isPendingPayment = effectiveStatus === 'menunggu_pembayaran' || selectedOrder.status === 'pending';
                const payBeforeFormatted = selectedOrder.pay_before || (() => {
                    if (selectedOrder.created_at_raw) {
                        const d = new Date(new Date(selectedOrder.created_at_raw).getTime() + 24 * 3600 * 1000);
                        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                    }
                    return null;
                })();

                const renderPaymentStatusBadge = () => {
                    if (selectedOrder.status === 'paid' || effectiveStatus === 'selesai' || effectiveStatus === 'dikirim' || effectiveStatus === 'diproses' || effectiveStatus === 'menunggu_konfirmasi') {
                        return (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Lunas
                            </span>
                        );
                    }
                    if (selectedOrder.status === 'expired' || selectedOrder.status === 'failed' || effectiveStatus === 'dibatalkan' || effectiveStatus === 'cancelled') {
                        return (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                                {selectedOrder.status === 'expired' ? 'Kedaluwarsa' : 'Dibatalkan'}
                            </span>
                        );
                    }
                    return (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                            Menunggu Pembayaran
                        </span>
                    );
                };

                const isPickup = selectedOrder.delivery_type === 'pickup';
                const currentStep = (() => {
                    switch (effectiveStatus) {
                        case 'selesai': return 5;
                        case 'dikirim':
                        case 'pengambilan':
                        case 'siap_diambil':
                            return 4;
                        case 'diproses': return 3;
                        case 'menunggu_konfirmasi': return 2;
                        case 'menunggu_pembayaran':
                        default: return 1;
                    }
                })();

                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
                        onClick={() => setSelectedOrder(null)}
                    >
                        <div
                            className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-2xl max-w-3xl w-full h-[90vh] sm:h-[85vh] max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 overscroll-contain"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/80 shrink-0">
                                <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                                    Detail Transaksi
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                                    aria-label="Tutup"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 p-5 sm:p-6 overflow-hidden">
                                {/* LEFT COLUMN: Transaction Info, Shipping, Tracking Stepper, Products */}
                                <div className="flex-1 min-w-0 w-full h-full rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs overflow-hidden flex flex-col shadow-none">
                                    <div className="p-5 sm:p-6 space-y-4 no-scrollbar h-full overflow-auto">
                                        {/* Top Transaction Info */}
                                        <div className="space-y-2.5 text-xs">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-foreground font-medium">
                                                    INV/{selectedOrder.order_number.replace('AP-', '')}
                                                </span>
                                                <a
                                                    href={`/orders/${selectedOrder.order_number}/invoice`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                                                >
                                                    <span>Lihat Invoice</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-muted-foreground">Tanggal Pembelian</span>
                                                <span className="text-foreground font-medium">{selectedOrder.created_at}</span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-muted-foreground">Metode Pembayaran</span>
                                                <span className="text-foreground font-medium">{selectedOrder.payment_channel}</span>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-muted-foreground">Status Pembayaran</span>
                                                <div>{renderPaymentStatusBadge()}</div>
                                            </div>

                                            {isPendingPayment && payBeforeFormatted && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">Bayar Sebelum</span>
                                                    <span className="text-amber-700 dark:text-amber-400 font-semibold inline-flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{payBeforeFormatted}</span>
                                                    </span>
                                                </div>
                                            )}

                                            {!isPendingPayment && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-muted-foreground">Status Pesanan</span>
                                                    <div>
                                                        {renderTransactionStatusBadge(selectedOrder.order_status || selectedOrder.status, selectedOrder.status_label)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Shipping / Boutique Information */}
                                        <div className="pt-4 border-t border-border/80 space-y-2.5 text-xs">
                                            <div className="font-bold text-xs text-foreground">
                                                {isPickup ? 'Pengambilan di Butik' : 'Pengiriman'}
                                            </div>
                                            {isPickup ? (
                                                <div className="space-y-1">
                                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                                        <Store className="w-3.5 h-3.5 text-[#4A070B] dark:text-[#E8D0BA]" />
                                                        <span>{selectedOrder.store?.name || 'Aroma Palace Boutique'}</span>
                                                    </div>
                                                    {selectedOrder.store?.description && (
                                                        <div className="text-muted-foreground text-[11px] leading-relaxed">
                                                            {selectedOrder.store.description}
                                                        </div>
                                                    )}
                                                    {selectedOrder.store?.gmaps_link && (
                                                        <a
                                                            href={selectedOrder.store.gmaps_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                                                        >
                                                            <span>Petunjuk Arah Google Maps</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-foreground">
                                                        {selectedOrder.courier || 'JNE Express VIP (Bebas Ongkir)'}
                                                    </div>
                                                    <div className="text-muted-foreground text-[11px]">
                                                        Express Delivery (1 - 3 Hari)
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-0.5 pt-1">
                                                <div className="font-bold text-foreground">
                                                    {isPickup ? 'Nama Pengambil' : 'Alamat Pengiriman'}
                                                </div>
                                                <div className="font-medium text-foreground">
                                                    {selectedOrder.recipient_name || 'Pelanggan'} {selectedOrder.recipient_phone ? `(${selectedOrder.recipient_phone})` : ''}
                                                </div>
                                                {!isPickup && (
                                                    <div className="text-muted-foreground leading-relaxed text-[11px]">
                                                        {selectedOrder.shipping_address || '-'}
                                                        {selectedOrder.city ? `, ${selectedOrder.city}` : ''}
                                                        {selectedOrder.postal_code ? ` ${selectedOrder.postal_code}` : ''}
                                                    </div>
                                                )}
                                                {selectedOrder.notes && (
                                                    <div className="italic text-muted-foreground text-[11px] pt-1">
                                                        Catatan: "{selectedOrder.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Pesanan Stepper */}
                                        {!isPendingPayment && (
                                            <div className="pt-4 border-t border-border/80 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-foreground">Status Pesanan</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowTracking(!showTracking)}
                                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span>{showTracking ? 'Sembunyikan' : 'Lihat'}</span>
                                                    {showTracking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>

                                            {showTracking && (
                                                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                                                    {/* 5 Stepper Icons: Bayar -> Konfirmasi -> Diproses -> Dikirim -> Selesai */}
                                                    <div className="grid grid-cols-5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${
                                                                currentStep >= 1 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            </div>
                                                            <span className="text-[10px] font-semibold mt-1.5 text-foreground truncate max-w-full">Bayar</span>
                                                        </div>

                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${
                                                                currentStep >= 2 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                                <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            </div>
                                                            <span className="text-[10px] font-semibold mt-1.5 text-foreground truncate max-w-full">Konfirmasi</span>
                                                        </div>

                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${
                                                                currentStep >= 3 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            </div>
                                                            <span className="text-[10px] font-semibold mt-1.5 text-foreground truncate max-w-full">Diproses</span>
                                                        </div>

                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${
                                                                currentStep >= 4 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                                {isPickup ? (
                                                                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                ) : (
                                                                    <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-semibold mt-1.5 text-foreground truncate max-w-full">
                                                                {isPickup ? 'Pengambilan' : 'Dikirim'}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${
                                                                currentStep >= 5 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            </div>
                                                            <span className="text-[10px] font-semibold mt-1.5 text-foreground truncate max-w-full">Selesai</span>
                                                        </div>
                                                    </div>

                                                    {/* Stepper Connecting Line with Node Circles */}
                                                    <div className="relative flex items-center justify-between px-4 sm:px-6">
                                                        <div className="absolute left-6 right-6 sm:left-8 sm:right-8 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-[#FACC15] dark:border-amber-600 z-0" />
                                                        <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${
                                                            currentStep >= 2 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-amber-500 text-amber-600 dark:text-amber-400'
                                                        }`}>
                                                            {currentStep >= 2 ? '✓' : '1'}
                                                        </div>
                                                        <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${
                                                            currentStep >= 3 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : currentStep >= 2 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-muted-foreground/40 text-muted-foreground'
                                                        }`}>
                                                            {currentStep >= 3 ? '✓' : '2'}
                                                        </div>
                                                        <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${
                                                            currentStep >= 4 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : currentStep >= 3 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-muted-foreground/40 text-muted-foreground'
                                                        }`}>
                                                            {currentStep >= 4 ? '✓' : '3'}
                                                        </div>
                                                        <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${
                                                            currentStep >= 5 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : currentStep >= 4 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-muted-foreground/40 text-muted-foreground'
                                                        }`}>
                                                            {currentStep >= 5 ? '✓' : '4'}
                                                        </div>
                                                        <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${
                                                            currentStep >= 5 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-muted-foreground/40 text-muted-foreground'
                                                        }`}>
                                                            {currentStep >= 5 ? '✓' : '5'}
                                                        </div>
                                                    </div>

                                                    {/* Status Text & Action Link */}
                                                    <div className="text-center space-y-1 pt-1">
                                                        <div className="font-bold text-xs sm:text-sm text-foreground">
                                                            {effectiveStatus === 'selesai'
                                                                ? 'Pesanan Selesai / Terverifikasi!'
                                                                : (effectiveStatus === 'dikirim' || effectiveStatus === 'pengambilan')
                                                                    ? (isPickup ? 'Pesanan Siap Diambil di Butik!' : 'Pesanan Sedang Dikirim!')
                                                                    : effectiveStatus === 'diproses'
                                                                        ? (isPickup ? 'Pesanan Sedang Disiapkan di Butik!' : 'Pesanan Sedang Diproses & Dikemas!')
                                                                        : effectiveStatus === 'menunggu_konfirmasi'
                                                                            ? 'Menunggu Konfirmasi Pesanan!'
                                                                            : 'Menunggu Pembayaran!'}
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {effectiveStatus === 'selesai'
                                                                ? 'Pesanan telah diterima dan transaksi telah selesai. Terima kasih telah berbelanja di Aroma Palace.'
                                                                : (effectiveStatus === 'dikirim' || effectiveStatus === 'pengambilan')
                                                                    ? (isPickup
                                                                        ? `Wewangian Anda telah siap diambil di butik ${selectedOrder.store?.name || 'Aroma Palace'}. Silakan tunjukkan detail pesanan ini kepada kurator butik kami.`
                                                                        : 'Pesanan Anda sedang dalam perjalanan oleh kurir pengiriman ke alamat tujuan.')
                                                                    : effectiveStatus === 'diproses'
                                                                        ? (isPickup
                                                                            ? 'Pembayaran telah terverifikasi. Pesanan Anda sedang disiapkan oleh kurator butik kami.'
                                                                            : 'Pembayaran telah terverifikasi. Pesanan Anda sedang disiapkan dan dikemas secara eksklusif.')
                                                                        : effectiveStatus === 'menunggu_konfirmasi'
                                                                            ? 'Pembayaran telah kami terima dan sedang menunggu konfirmasi admin Aroma Palace.'
                                                                            : 'Segera selesaikan pembayaran sebelum batas waktu berakhir.'}
                                                        </p>
                                                        {isPendingPayment ? (
                                                            <Link
                                                                href={`/payment/${selectedOrder.order_number}`}
                                                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 pt-0.5"
                                                            >
                                                                <span>Selesaikan Pembayaran →</span>
                                                            </Link>
                                                        ) : isPickup ? (
                                                            selectedOrder.store?.gmaps_link ? (
                                                                <a
                                                                    href={selectedOrder.store.gmaps_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 pt-0.5"
                                                                >
                                                                    <span>Petunjuk Lokasi Butik →</span>
                                                                </a>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-default pt-0.5">
                                                                    <span>Ambil di Butik →</span>
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-default pt-0.5">
                                                                <span>Lacak Pesanan →</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                        {/* Ordered Products Section */}
                                        <div className="pt-4 border-t border-border/80 space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Produk yang dipesan</span>
                                            </div>

                                            <div className="space-y-3">
                                                {selectedOrder.items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md border border-border/80 bg-muted/30 overflow-hidden shrink-0">
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.product_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="space-y-0.5 min-w-0">
                                                                <h4 className="font-semibold text-foreground truncate">
                                                                    {item.product_name}
                                                                </h4>
                                                                <div className="text-[11px] text-muted-foreground">
                                                                    1 produk ({item.volume}{item.variant_name ? ` • ${item.variant_name}` : ''})
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground">
                                                                    {item.quantity} × {item.price_formatted}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 font-bold text-foreground">
                                                            {item.total_price_formatted}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-border/80 text-xs">
                                                <span className="text-muted-foreground">
                                                    Total Pesanan ({selectedOrder.items_count} barang)
                                                </span>
                                                <span className="font-bold text-foreground">
                                                    {selectedOrder.total_amount_formatted}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Price Breakdown & Selesaikan Pembayaran button (Fixed / No scroll) */}
                                <div className="w-full lg:w-[310px] space-y-4 shrink-0 lg:self-start">
                                    <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none space-y-4 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">
                                                Subtotal ({selectedOrder.items_count} Barang)
                                            </span>
                                            <span className="text-foreground font-medium">
                                                {selectedOrder.subtotal_formatted}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Total Ongkos Kirim</span>
                                            <span className="text-foreground font-medium">
                                                {selectedOrder.shipping_cost_formatted || 'Gratis'}
                                            </span>
                                        </div>

                                        {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 ? (
                                            <div className="space-y-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                                                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                                                    <span>
                                                        Diskon Voucher {selectedOrder.voucher_code ? `(${selectedOrder.voucher_code})` : ''}
                                                    </span>
                                                    <span className="font-bold">
                                                        -{selectedOrder.discount_amount_formatted}
                                                    </span>
                                                </div>
                                                {selectedOrder.voucher && (
                                                    <div className="text-[11px] text-emerald-950/80 dark:text-emerald-200/80 pt-0.5 space-y-0.5">
                                                        <div className="font-bold text-foreground">
                                                            {selectedOrder.voucher.name}
                                                        </div>
                                                        {selectedOrder.voucher.description && (
                                                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                                {selectedOrder.voucher.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}

                                        <div className="flex items-center justify-between text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <span>Biaya Layanan</span>
                                                <Info className="w-3.5 h-3.5" />
                                            </span>
                                            <span>Rp0</span>
                                        </div>

                                        <div className="flex items-center justify-between text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <span>Ongkos Pembayaran</span>
                                                <Info className="w-3.5 h-3.5" />
                                            </span>
                                            <span>Rp0</span>
                                        </div>

                                        <div className="pt-4 border-t border-border/80 flex items-center justify-between">
                                            <span className="font-bold text-foreground text-sm">Total Belanja</span>
                                            <span className="font-extrabold text-[#4A070B] dark:text-[#E8D0BA] text-lg sm:text-xl">
                                                {selectedOrder.total_amount_formatted}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Selesaikan Pembayaran button only when pending; disappears if already paid */}
                                    {isPendingPayment && (
                                        <Link href={`/payment/${selectedOrder.order_number}`} className="block w-full">
                                            <Button className="w-full bg-[#4A070B] hover:bg-[#360407] text-white font-semibold rounded-md h-11 text-xs sm:text-sm shadow-none transition active:scale-[0.98] cursor-pointer">
                                                Selesaikan Pembayaran
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </Layout>
    );
}
