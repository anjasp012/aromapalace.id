import React, { useState, useEffect } from 'react';
import { useEcho } from '@laravel/echo-react';
import AnimatedWaitingDots from '@/components/AnimatedWaitingDots';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Copy,
    Check,
    Truck,
    PackageCheck,
    AlertCircle,
    Loader2,
    X,
    ExternalLink,
    Image as ImageIcon,
} from 'lucide-react';

export interface TrackingHistoryItem {
    time?: string;
    status?: string;
    note: string;
    image?: string | string[] | null;
}

export interface TrackingData {
    id?: number | null;
    awb: string;
    order_number?: string;
    courier?: string;
    courier_service?: string;
    courier_logo?: string;
    sender?: {
        name?: string;
        phone?: string;
        address?: string;
    };
    recipient?: {
        name?: string;
        phone?: string;
        address?: string;
    };
    text?: string;
    histories?: TrackingHistoryItem[];
    images?: string[];
}

interface TrackingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    awb?: string | null;
    orderNumber?: string | null;
    initialData?: Partial<TrackingData> | null;
}

const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatDateIndo(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
        // Support both ISO strings ("2026-10-25T11:30:00Z") and KiriminAja timestamps ("2026-08-07 13:49")
        const hasOffset = dateStr.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
        const parsedDate = new Date(hasOffset ? dateStr : (dateStr.includes('T') ? `${dateStr}+07:00` : `${dateStr.replace(' ', 'T')}+07:00`));
        const d = isNaN(parsedDate.getTime()) ? new Date(dateStr.replace(' ', 'T')) : parsedDate;
        if (isNaN(d.getTime())) return dateStr;

        const datePart = d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
        });
        const timePart = d.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
        });

        return `${datePart} ${timePart} WIB`;
    } catch {
        return dateStr;
    }
}

function getCourierLogo(logo?: string, courierName?: string): string | null {
    if (logo) return logo;
    if (!courierName) return null;
    const clean = courierName.toLowerCase().replace(/[\s\-_&]/g, '');
    const courierMap: Record<string, string> = {
        jtcargo: 'jtcargo',
        jnt: 'jnt',
        jt: 'jnt',
        jne: 'jne',
        sicepat: 'sicepat',
        shopee: 'spx',
        spx: 'spx',
        anteraja: 'anteraja',
        lion: 'lion',
        ninja: 'ninja',
        sap: 'sap',
        idexpress: 'idx',
        idx: 'idx',
        tiki: 'tiki',
        posindonesia: 'posindonesia',
        posindo: 'posindonesia',
        pos: 'posindonesia',
        rpx: 'rpx',
        sentral: 'sentral',
        ncs: 'ncs',
        borzo: 'borzo',
        gosend: 'gosend',
        gojek: 'gosend',
        grab: 'grab',
        paxel: 'paxel',
    };
    for (const [key, code] of Object.entries(courierMap)) {
        if (clean.includes(key)) {
            return `https://storage.googleapis.com/tprt0ezsggqjornc7nf1wwluvgulhr/assets/courier-logo/${code}.png`;
        }
    }
    return null;
}

export default function TrackingModal({
    open,
    onOpenChange,
    awb,
    orderNumber,
    initialData = null,
}: TrackingModalProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TrackingData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const lookupCode = awb || orderNumber || initialData?.awb || initialData?.order_number;

    useEffect(() => {
        if (!open) {
            setPreviewImage(null);
            return;
        }

        // Preload from initialData if provided
        if (initialData && (initialData.awb || initialData.histories || initialData.courier || initialData.courier_logo)) {
            setData({
                awb: initialData.awb || lookupCode || '',
                order_number: initialData.order_number,
                courier: initialData.courier || 'Kurir Pengiriman',
                courier_service: initialData.courier_service,
                courier_logo: initialData.courier_logo,
                sender: initialData.sender || { name: 'Aroma Palace Official' },
                recipient: initialData.recipient,
                text: initialData.text,
                histories: initialData.histories || [],
                images: initialData.images || [],
            });
        }

        if (!lookupCode) return;

        setLoading(true);
        setError(null);

        fetch(`/api/shipping/track/${encodeURIComponent(lookupCode)}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Data pelacakan belum tersedia.');
                }
                return res.json();
            })
            .then((resJson) => {
                if (resJson.status && resJson.data) {
                    setData(resJson.data);
                } else if (!data) {
                    setError(resJson.message || 'Data pelacakan belum tersedia.');
                }
            })
            .catch((err) => {
                if (!data || !data.histories || data.histories.length === 0) {
                    setError(err.message || 'Gagal memuat informasi pelacakan.');
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [open, lookupCode]);

    // Real-time WebSocket: listen for ShippingUpdated event via Laravel Reverb
    const channelName = orderNumber ? `orders.${orderNumber}` : (lookupCode ? `orders.${lookupCode}` : '');
    useEcho(
        open && channelName ? channelName : '',
        ['ShippingUpdated', '.ShippingUpdated'],
        (payload?: any) => {
            if (payload && payload.awb && !payload.awb.toLowerCase().includes('menunggu')) {
                setData((prev) => ({
                    ...prev,
                    awb: payload.awb,
                    status: payload.status,
                    text: payload.text || prev?.text,
                    delivered_at: payload.delivered_at,
                    auto_completes_at: payload.auto_completes_at,
                    auto_completes_at_formatted: payload.auto_completes_at_formatted,
                    histories: Array.isArray(payload.histories) && payload.histories.length > 0 ? payload.histories : prev?.histories,
                }));
            }
            if (lookupCode) {
                fetch(`/api/shipping/track/${encodeURIComponent(lookupCode)}`)
                    .then((res) => res.json())
                    .then((resJson) => {
                        if (resJson.status && resJson.data) {
                            setData(resJson.data);
                        }
                    })
                    .catch(() => {});
            }
        },
        [open, channelName, lookupCode],
        'public',
    );

    // Smart fallback: poll tracking API every 6s while modal is open
    useEffect(() => {
        if (!open || !lookupCode) return;

        const interval = setInterval(() => {
            fetch(`/api/shipping/track/${encodeURIComponent(lookupCode)}`)
                .then((res) => res.json())
                .then((resJson) => {
                    if (resJson.status && resJson.data) {
                        setData(resJson.data);
                    }
                })
                .catch(() => {});
        }, 6000);

        return () => clearInterval(interval);
    }, [open, lookupCode]);

    const displayAwb = data?.awb || lookupCode || '-';
    const isWaitingAwb = !displayAwb || displayAwb === '-' || displayAwb.toLowerCase().includes('menunggu');

    const handleCopy = () => {
        if (isWaitingAwb) return;
        const textToCopy = data?.awb || lookupCode || '';
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const displayCourier = data?.courier || initialData?.courier || 'Kurir Pengiriman';
    const displaySenderName = data?.sender?.name || initialData?.sender?.name || 'Aroma Palace Official';
    const displayRecipientName = data?.recipient?.name || initialData?.recipient?.name || 'Penerima';
    const displayRecipientPhone = data?.recipient?.phone || initialData?.recipient?.phone || '';
    const displayRecipientAddress = data?.recipient?.address || initialData?.recipient?.address || '';

    const histories = data?.histories || [];
    const podImages = data?.images || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-w-4xl lg:max-w-5xl w-full h-[90vh] sm:h-[85vh] max-h-[90vh] sm:max-h-[85vh] p-0 gap-0 rounded-2xl bg-card text-card-foreground border border-border/80 shadow-2xl flex flex-col overflow-hidden outline-none"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/80 shrink-0 bg-card">
                    <DialogTitle className="font-extrabold text-base sm:text-lg text-foreground tracking-tight m-0 p-0">
                        Lacak Pesanan
                    </DialogTitle>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 p-5 sm:p-6 overflow-y-auto md:overflow-hidden">
                    {/* LEFT COLUMN: COURIER, AWB, SENDER & RECIPIENT */}
                    <div className="w-full md:w-80 lg:w-84 shrink-0 rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 space-y-4 h-fit shadow-none text-left">
                        {/* Courier Information - HANYA LOGO (tanpa teks ongkir/layanan) */}
                        <div className="space-y-2 text-xs">
                            <div className="font-bold text-xs text-foreground">
                                Pengiriman
                            </div>
                            <div className="pt-0.5">
                                {courierLogoUrl ? (
                                    <div className="h-9 w-24 px-2 py-1 rounded-md bg-white border border-border/80 shadow-2xs flex items-center justify-center">
                                        <img
                                            src={courierLogoUrl}
                                            alt={displayCourier || 'Kurir'}
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-8 w-20 px-2 py-1 rounded-md bg-white border border-border/80 flex items-center justify-center text-muted-foreground">
                                        <Truck className="size-5 text-[#4A070B] dark:text-[#E8D0BA]" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Nomor Resi / AWB */}
                        <div className="pt-4 border-t border-border/80 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Nomor Resi / AWB</span>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={isWaitingAwb}
                                    className="inline-flex font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer items-center gap-1 text-xs py-0.5 px-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Salin nomor resi"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            <span className="text-emerald-600">Tersalin</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="font-mono text-xs font-bold text-foreground break-all bg-muted/40 dark:bg-muted/20 px-2.5 py-1.5 rounded border border-border/60">
                                {isWaitingAwb ? (
                                    <AnimatedWaitingDots text="Menunggu Resi" className="text-amber-600 dark:text-amber-400 font-semibold" />
                                ) : (
                                    displayAwb
                                )}
                            </div>
                        </div>

                        {/* Pengirim */}
                        <div className="pt-4 border-t border-border/80 space-y-1 text-xs">
                            <div className="font-bold text-foreground">
                                Pengirim
                            </div>
                            <div className="font-medium text-foreground">
                                {displaySenderName}
                            </div>
                        </div>

                        {/* Penerima & Alamat Pengiriman */}
                        <div className="pt-4 border-t border-border/80 space-y-1 text-xs">
                            <div className="font-bold text-foreground">
                                Alamat Pengiriman
                            </div>
                            <div className="font-medium text-foreground">
                                {displayRecipientName} {displayRecipientPhone ? `(${displayRecipientPhone})` : ''}
                            </div>
                            {displayRecipientAddress && (
                                <div className="text-muted-foreground leading-relaxed text-[11px] pt-0.5">
                                    {displayRecipientAddress}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: TIMELINE RIWAYAT */}
                    <div className="flex-1 min-w-0 w-full h-full rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs overflow-hidden flex flex-col shadow-none">
                        <div className="p-5 sm:p-6 space-y-4 no-scrollbar h-full overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-border/80">
                                <span className="font-bold text-xs text-foreground">Riwayat Perjalanan</span>
                                {histories.length > 0 && (
                                    <span className="text-[11px] text-muted-foreground">
                                        {histories.length} Titik Perjalanan
                                    </span>
                                )}
                            </div>

                            {loading && histories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="text-xs font-medium">Memuat riwayat pelacakan...</span>
                                </div>
                            ) : error && histories.length === 0 ? (
                                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                                    <div className="font-bold flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Informasi Pelacakan Belum Tersedia</span>
                                    </div>
                                    <div className="text-[11px] opacity-90 pl-5.5">{error}</div>
                                </div>
                            ) : histories.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-border/80 p-8 text-center space-y-2">
                                    <PackageCheck className="w-8 h-8 mx-auto text-muted-foreground opacity-60" />
                                    <div className="font-semibold text-xs text-foreground">
                                        Belum Ada Riwayat Perjalanan
                                    </div>
                                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                        Paket sedang disiapkan. Riwayat pelacakan akan otomatis muncul begitu kurir memindai paket Anda.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-0 pt-1">
                                    {histories.map((item, index) => {
                                        const isLatest = index === 0;
                                        const isLast = index === histories.length - 1;

                                        const itemImages = item.image
                                            ? (Array.isArray(item.image) ? item.image : [item.image])
                                            : (isLatest && podImages.length > 0 ? podImages : []);

                                        return (
                                            <div key={index} className="flex items-start gap-3 relative pb-5 last:pb-0">
                                                {/* Left Column: Timeline Line & Node */}
                                                <div className="flex flex-col items-center self-stretch shrink-0 relative w-4 pt-1">
                                                    {!isLast && (
                                                        <div className="absolute top-3.5 bottom-0 w-0 border-l-2 border-dashed border-blue-500/70 dark:border-blue-400/70 -translate-x-[0.5px]" />
                                                    )}

                                                    <div
                                                        className={`w-3.5 h-3.5 rounded-full border-2 bg-background z-10 flex items-center justify-center shrink-0 ${
                                                            isLatest
                                                                ? 'border-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/60'
                                                                : 'border-muted-foreground/40'
                                                        }`}
                                                    >
                                                        {isLatest && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                                    </div>
                                                </div>

                                                {/* Right Column: Milestone Note, Link, and Timestamp */}
                                                <div className="min-w-0 flex-1 space-y-1 text-left">
                                                    <div className={`text-xs leading-relaxed ${isLatest ? 'font-bold text-foreground' : 'text-foreground/90 font-normal'}`}>
                                                        {item.note}
                                                    </div>

                                                    {itemImages.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewImage(itemImages[0])}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer pt-0.5"
                                                        >
                                                            <ImageIcon className="w-3.5 h-3.5" />
                                                            <span>Lihat Bukti Pengiriman</span>
                                                        </button>
                                                    )}

                                                    {item.time && (
                                                        <div className="text-[11px] text-muted-foreground font-normal">
                                                            {formatDateIndo(item.time)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>

            {/* LIGHTBOX FOR PROOF OF DELIVERY IMAGE */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-lg w-full bg-card text-card-foreground rounded-2xl overflow-hidden shadow-2xl border border-border/80"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between">
                            <span className="font-extrabold text-sm text-foreground tracking-tight">Bukti Pengiriman (POD)</span>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 bg-muted/20 flex items-center justify-center max-h-[70vh] overflow-hidden">
                            <img
                                src={previewImage}
                                alt="Bukti Pengiriman"
                                className="max-w-full max-h-[65vh] object-contain rounded-lg"
                            />
                        </div>
                        <div className="p-3.5 border-t border-border/80 flex justify-end">
                            <a
                                href={previewImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-[#4A070B] hover:bg-[#360407] text-white shadow-xs transition"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka Gambar Asli</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
}
