import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
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
    Crown,
    FileText,
    Printer,
    Loader2,
    Download,
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
    address?: string;
    city?: string;
    postal_code?: string;
    courier?: string;
    tracking_number?: string | null;
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
    { key: 'diproses', label: 'Diproses' },
    { key: 'dikirim', label: 'Dikirim' },
    { key: 'selesai', label: 'Selesai' },
] as const;

export default function OrdersPage({
    orders = [],
    active_tab = 'all',
    tab_counts,
}: OrdersProps) {
    const { auth } = usePage<{ auth?: { membership?: { points_formatted: string; membership_number: string } | null } }>().props;
    const membershipData = auth?.membership;

    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
    const [invoiceModalOrder, setInvoiceModalOrder] = useState<OrderData | null>(null);
    const [iframeLoading, setIframeLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedInvoice, setCopiedInvoice] = useState(false);
    const [showTracking, setShowTracking] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
    const [navigatingOrderNumber, setNavigatingOrderNumber] = useState<string | null>(null);
    const { isEn } = useTranslation();

    const handlePayNow = (orderNumber: string) => {
        setNavigatingOrderNumber(orderNumber);
        router.visit(`/payment/${orderNumber}`, {
            onFinish: () => setNavigatingOrderNumber(null),
        });
    };

    // Lock body scroll and close on Escape when modal is open
    useEffect(() => {
        if (selectedOrder || invoiceModalOrder) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    if (invoiceModalOrder) {
                        setInvoiceModalOrder(null);
                    } else {
                        setSelectedOrder(null);
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);

            return () => {
                document.body.style.overflow = originalOverflow;
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [selectedOrder, invoiceModalOrder]);

    // Listen for close message from invoice iframe
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'CLOSE_INVOICE_MODAL') {
                setInvoiceModalOrder(null);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

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
            navigator.clipboard.writeText(`INV/${orderNumber.replace(/^(ARPL-|AP-)/, '')}`);
        }
        setCopiedInvoice(true);
        setTimeout(() => setCopiedInvoice(false), 2000);
    };

    const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

    const handleDownloadInvoice = async (orderNumber: string) => {
        if (isDownloadingInvoice) return;
        setIsDownloadingInvoice(true);
        try {
            const downloadUrl = `/orders/${orderNumber}/invoice/download`;
            const response = await fetch(downloadUrl);
            if (response.ok) {
                const blob = await response.blob();
                const fileName = `Invoice-${orderNumber}.pdf`;
                const file = new File([blob], fileName, { type: 'application/pdf' });

                const isMobileDevice = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

                // Hanya di perangkat mobile (iPhone/iPad/Android) panggil share sheet bawaan
                if (isMobileDevice && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Invoice #${orderNumber}`,
                        });
                    } catch {
                        // User menutup share sheet
                    }
                    setIsDownloadingInvoice(false);
                    return;
                }

                // Download file murni ke perangkat tanpa navigasi/auto-buka
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    if (document.body.contains(a)) {
                        document.body.removeChild(a);
                    }
                }, 1000);
                setIsDownloadingInvoice(false);
                return;
            }
        } catch (err) {
            console.error('Download invoice failed:', err);
        }
        setIsDownloadingInvoice(false);
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
                                <span className="hidden sm:inline text-[#4A070B] dark:text-[#E8D0BA] font-medium ml-0.5">
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
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
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
                {/* ROYALE CLUB MEMBERSHIP BANNER */}
                <div className="p-4 sm:p-5 rounded-xl border border-[#E5A844]/30 bg-gradient-to-r from-[#4A070B] via-[#360407] to-[#2B0305] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[#E5A844]/15 border border-[#E5A844]/30 text-[#E5A844] flex items-center justify-center shrink-0">
                            <Crown className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                                    Royale Club Membership
                                </span>
                                {membershipData ? (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E5A844] text-[#360407]">
                                        Member Aktif
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                        Bonus +100 Poin
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-white/70">
                                {membershipData
                                    ? `Saldo: ${membershipData.points_formatted} Poin • Dapatkan 1 poin setiap belanja Rp 10.000.`
                                    : 'Kumpulkan poin di setiap belanja wewangian dan tukarkan dengan voucher diskon hingga Rp 200.000.'}
                            </p>
                        </div>
                    </div>
                    <Link href="/membership" className="shrink-0">
                        <Button
                            size="sm"
                            className="w-full sm:w-auto bg-gradient-to-r from-[#F7D070] to-[#E5A844] hover:from-[#E5A844] hover:to-[#C98A2C] text-[#360407] font-bold text-xs px-4 h-9 shadow-xs cursor-pointer"
                        >
                            {membershipData ? 'Lihat Royale Club →' : 'Gabung Membership (Gratis) →'}
                        </Button>
                    </Link>
                </div>

                {/* STATUS FILTER TABS (Sticky on Mobile & Desktop) */}
                <div className="sticky top-[var(--main-header-height,96px)] sm:top-[calc(var(--main-header-height,130px)+0px)] z-30 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 sm:py-3 border-b border-border/80 transition-all">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {TABS.map((tab) => {
                            const isActive = (active_tab || 'all') === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`inline-flex items-center justify-center px-4 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${isActive
                                        ? 'bg-[#4A070B] text-white shadow-xs'
                                        : 'bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/60'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {tab_counts === undefined && orders.length === 0 ? (
                    /* SKELETON LOADING STATE FOR INSTANT VISITS */
                    <div className="space-y-4">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="rounded-xl border border-border/80 bg-card p-5 space-y-4 animate-pulse">
                                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                                    <div className="h-4 w-32 bg-muted/80 rounded" />
                                    <div className="h-5 w-24 bg-muted/80 rounded-full" />
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="h-16 w-16 bg-muted/80 rounded-lg shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-48 bg-muted/80 rounded" />
                                        <div className="h-3 w-28 bg-muted/80 rounded" />
                                    </div>
                                    <div className="h-5 w-24 bg-muted/80 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
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
                        {orders.map((order) => {
                            const isPending = (order.order_status || order.status) === 'menunggu_pembayaran' || (order.status === 'pending' && (!order.order_status || order.order_status === 'menunggu_pembayaran'));
                            const isExpanded = !!expandedOrders[order.id];
                            const remainingCount = order.items.length - 1;

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none space-y-4 transition-colors cursor-pointer sm:cursor-default"
                                >
                                    {/* Order Card Header: flex row on mobile and desktop so no order & status are side-by-side */}
                                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/80 text-xs">
                                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
                                            <span className="font-extrabold text-foreground tracking-wide font-mono truncate">
                                                #{order.order_number}
                                            </span>
                                            <span className="hidden sm:inline text-muted-foreground">•</span>
                                            <span className="hidden sm:inline text-muted-foreground">{order.created_at}</span>
                                            <span className="hidden sm:inline text-muted-foreground">•</span>
                                            <span className="hidden sm:inline text-muted-foreground">{order.payment_channel}</span>
                                            {order.tracking_number && (
                                                <>
                                                    <span className="hidden sm:inline text-muted-foreground">•</span>
                                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#4A070B] dark:text-[#E8D0BA] bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15 px-2 py-0.5 rounded border border-[#4A070B]/20 dark:border-[#E8D0BA]/20">
                                                        <Truck className="w-3 h-3 shrink-0" />
                                                        <span>Resi: {order.tracking_number}</span>
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="shrink-0">
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleOrderItems(order.id);
                                                        }}
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
                                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/80">
                                        <div>
                                            <div className="text-[11px] text-muted-foreground">
                                                Total Pembayaran ({order.items_count} produk)
                                            </div>
                                            <div className="text-base sm:text-lg font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                                {order.total_amount_formatted}
                                            </div>
                                        </div>

                                        {/* Action buttons: Detail Pesanan on desktop only, Selesaikan Pembayaran visible on both mobile & desktop when pending */}
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedOrder(order)}
                                                className="hidden sm:inline-flex border border-border/80 hover:bg-muted text-xs font-semibold h-9 px-4 rounded-md shadow-none cursor-pointer bg-background text-foreground"
                                            >
                                                Detail Pesanan
                                            </Button>

                                            {isPending && (
                                                <Button
                                                    size="sm"
                                                    disabled={navigatingOrderNumber === order.order_number}
                                                    onClick={() => handlePayNow(order.order_number)}
                                                    className="bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-semibold h-9 px-3.5 sm:px-4 rounded-md shadow-xs cursor-pointer active:scale-95 transition flex items-center justify-center gap-1.5"
                                                >
                                                    {navigatingOrderNumber === order.order_number ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            <span>{isEn ? 'Processing...' : 'Memproses...'}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="sm:hidden">{isEn ? 'Pay Now' : 'Bayar Sekarang'}</span>
                                                            <span className="hidden sm:inline">{isEn ? 'Complete Payment' : 'Selesaikan Pembayaran'}</span>
                                                        </>
                                                    )}
                                                </Button>
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
                        case 'selesai': return 4;
                        case 'dikirim':
                        case 'pengambilan':
                        case 'siap_diambil':
                            return 3;
                        case 'diproses':
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
                                                    INV/{selectedOrder.order_number.replace(/^(ARPL-|AP-)/, '')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIframeLoading(true);
                                                        setInvoiceModalOrder(selectedOrder);
                                                    }}
                                                    className="inline-flex font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer items-center gap-1.5 text-xs py-0.5 px-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span>Lihat Invoice</span>
                                                </button>
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
                                                    {selectedOrder.tracking_number && (
                                                        <div className="mt-2.5 p-2.5 rounded-lg bg-[#4A070B]/5 dark:bg-[#E8D0BA]/10 border border-[#4A070B]/20 dark:border-[#E8D0BA]/20 flex items-center justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                                    Nomor Resi / AWB
                                                                </div>
                                                                <div className="font-mono text-xs sm:text-sm font-extrabold text-foreground truncate">
                                                                    {selectedOrder.tracking_number}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(selectedOrder.tracking_number!);
                                                                    setCopiedCode(true);
                                                                    setTimeout(() => setCopiedCode(false), 2000);
                                                                }}
                                                                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border/80 bg-background hover:bg-muted text-foreground transition-colors shrink-0 cursor-pointer shadow-none"
                                                            >
                                                                {copiedCode ? 'Tersalin' : 'Salin'}
                                                            </button>
                                                        </div>
                                                    )}
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
                                                        {selectedOrder.address || '-'}
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
                                                        {/* 4 Stepper Icons: Bayar -> Diproses -> Dikirim -> Selesai */}
                                                        <div className="grid grid-cols-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${currentStep >= 1 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
                                                                    }`}>
                                                                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                </div>
                                                                <span className="text-[10px] font-semibold mt-1.5 text-foreground truncate max-w-full">Bayar</span>
                                                            </div>

                                                            <div className="flex flex-col items-center">
                                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${currentStep >= 2 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
                                                                    }`}>
                                                                    <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                </div>
                                                                <span className="text-[10px] font-semibold mt-1.5 text-foreground truncate max-w-full">Diproses</span>
                                                            </div>

                                                            <div className="flex flex-col items-center">
                                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${currentStep >= 3 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
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
                                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xs ${currentStep >= 4 ? 'bg-[#FEF08A] dark:bg-amber-900/50 text-[#854D0E] dark:text-amber-300' : 'bg-muted text-muted-foreground'
                                                                    }`}>
                                                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                </div>
                                                                <span className="text-[10px] font-semibold mt-1.5 text-foreground truncate max-w-full">Selesai</span>
                                                            </div>
                                                        </div>

                                                        {/* Stepper Connecting Line with Node Circles */}
                                                        <div className="relative flex items-center justify-between px-6 sm:px-10">
                                                            <div className="absolute left-8 right-8 sm:left-12 sm:right-12 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-[#FACC15] dark:border-amber-600 z-0" />
                                                            <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${currentStep >= 2 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-amber-500 text-amber-600 dark:text-amber-400'
                                                                }`}>
                                                                {currentStep >= 2 ? '✓' : '1'}
                                                            </div>
                                                            <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${currentStep >= 3 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : currentStep >= 2 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-muted-foreground/40 text-muted-foreground'
                                                                }`}>
                                                                {currentStep >= 3 ? '✓' : '2'}
                                                            </div>
                                                            <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${currentStep >= 4 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : currentStep >= 3 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-muted-foreground/40 text-muted-foreground'
                                                                }`}>
                                                                {currentStep >= 4 ? '✓' : '3'}
                                                            </div>
                                                            <div className={`relative z-10 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold ${currentStep >= 4 ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-muted-foreground/40 text-muted-foreground'
                                                                }`}>
                                                                {currentStep >= 4 ? '✓' : '4'}
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
                                        <Button
                                            disabled={navigatingOrderNumber === selectedOrder.order_number}
                                            onClick={() => handlePayNow(selectedOrder.order_number)}
                                            className="w-full bg-[#4A070B] hover:bg-[#360407] text-white font-semibold rounded-md h-11 text-xs sm:text-sm shadow-none transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            {navigatingOrderNumber === selectedOrder.order_number ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>{isEn ? 'Redirecting to Payment...' : 'Menuju Halaman Pembayaran...'}</span>
                                                </>
                                            ) : (
                                                <span>{isEn ? 'Complete Payment' : 'Selesaikan Pembayaran'}</span>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* INVOICE PREVIEW MODAL (Consistent Aroma Palace Theme & Safe Area Aware) */}
            {invoiceModalOrder && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] overscroll-contain"
                    onClick={() => setInvoiceModalOrder(null)}
                >
                    <div
                        className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-2xl max-w-3xl w-full h-[90vh] sm:h-[86vh] max-h-[90vh] sm:max-h-[86vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 overscroll-contain"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Consistent Modal Header */}
                        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-border/80 shrink-0 bg-card">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15 text-[#4A070B] dark:text-[#E8D0BA] flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight truncate">
                                        Invoice #{invoiceModalOrder.order_number}
                                    </h3>
                                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                                        Aroma Palace Official Boutique
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Download Button (Triggers iOS Native Share Sheet or PDF download) */}
                                <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(invoiceModalOrder.order_number)}
                                    disabled={isDownloadingInvoice}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#4A070B] hover:bg-[#360407] text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-70"
                                    title="Download Invoice (PDF)"
                                    aria-label="Download Invoice"
                                >
                                    {isDownloadingInvoice ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                </button>

                                {/* Close Button */}
                                <button
                                    type="button"
                                    onClick={() => setInvoiceModalOrder(null)}
                                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                                    aria-label="Tutup"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body with Iframe */}
                        <div className="flex-1 w-full relative bg-[#F8F9FA] overflow-hidden">
                            {iframeLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#4A070B]" />
                                    <span className="text-xs text-muted-foreground font-medium">Memuat invoice...</span>
                                </div>
                            )}
                            <iframe
                                ref={iframeRef}
                                src={`/orders/${invoiceModalOrder.order_number}/invoice?embed=1`}
                                className="w-full h-full border-0 bg-[#F8F9FA]"
                                title={`Invoice ${invoiceModalOrder.order_number}`}
                                onLoad={() => setIframeLoading(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
