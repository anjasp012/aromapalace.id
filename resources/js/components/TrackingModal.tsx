import React, { useState, useEffect } from 'react';
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
        const d = new Date(dateStr.replace(' ', 'T'));
        if (isNaN(d.getTime())) return dateStr;

        const day = String(d.getDate()).padStart(2, '0');
        const month = MONTHS_ID[d.getMonth()] || '';
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        return `${day} ${month} ${year} ${hours}:${minutes}`;
    } catch {
        return dateStr;
    }
}

function CourierLogo({ courier = '' }: { courier?: string }) {
    const lower = courier.toLowerCase();

    if (lower.includes('lion')) {
        return (
            <div className="space-y-1">
                <div className="inline-flex items-center gap-1 font-black text-red-600 text-sm tracking-tight">
                    <span className="italic">Lion</span>
                    <span className="bg-red-600 text-white text-[10px] px-1 py-0.5 rounded italic font-bold">parcel</span>
                </div>
                <div className="text-xs font-semibold text-muted-foreground">Lion</div>
            </div>
        );
    }

    if (lower.includes('jne')) {
        return (
            <div className="space-y-1">
                <div className="inline-flex items-center gap-1 font-black text-blue-600 text-sm tracking-tight">
                    <span className="text-red-600">JNE</span>
                    <span className="text-blue-700 text-xs font-bold">EXPRESS</span>
                </div>
                <div className="text-xs font-semibold text-muted-foreground">{courier || 'JNE'}</div>
            </div>
        );
    }

    if (lower.includes('sicepat')) {
        return (
            <div className="space-y-1">
                <div className="inline-flex items-center gap-1 font-black text-red-600 text-sm tracking-tight">
                    <span>SICEPAT</span>
                    <span className="text-[10px] text-zinc-900 dark:text-zinc-100 font-bold">EKSPRES</span>
                </div>
                <div className="text-xs font-semibold text-muted-foreground">{courier || 'SiCepat'}</div>
            </div>
        );
    }

    if (lower.includes('j&t') || lower.includes('jnt')) {
        return (
            <div className="space-y-1">
                <div className="inline-flex items-center gap-1 font-black text-red-600 text-sm tracking-tight">
                    <span>J&T</span>
                    <span className="text-xs font-bold text-red-500">EXPRESS</span>
                </div>
                <div className="text-xs font-semibold text-muted-foreground">{courier || 'J&T'}</div>
            </div>
        );
    }

    if (lower.includes('anteraja')) {
        return (
            <div className="space-y-1">
                <div className="inline-flex items-center gap-1 font-black text-pink-600 text-sm tracking-tight">
                    <span>anteraja</span>
                </div>
                <div className="text-xs font-semibold text-muted-foreground">{courier || 'Anteraja'}</div>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 font-bold text-[#4A070B] dark:text-[#E8D0BA] text-sm">
                <Truck className="size-4" />
                <span>{courier || 'Ekspedisi Pengiriman'}</span>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">Kurir Rekanan</div>
        </div>
    );
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
        if (initialData && (initialData.awb || initialData.histories)) {
            setData({
                awb: initialData.awb || lookupCode || '',
                order_number: initialData.order_number,
                courier: initialData.courier || 'Kurir Pengiriman',
                courier_service: initialData.courier_service,
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

    const handleCopy = () => {
        const textToCopy = data?.awb || lookupCode || '';
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayAwb = data?.awb || lookupCode || '-';
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
                showCloseButton={true}
                className="max-w-2xl sm:max-w-3xl w-full p-6 sm:p-7 gap-5 rounded-2xl bg-background border-border shadow-xl max-h-[92vh] overflow-y-auto"
            >
                <DialogHeader className="p-0 pb-1 border-none text-left">
                    <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                        Lacak Pesanan
                    </DialogTitle>
                </DialogHeader>

                {error && histories.length === 0 ? (
                    <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
                        <AlertCircle className="size-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <div className="font-bold">Informasi Pelacakan Belum Tersedia</div>
                            <div className="text-xs opacity-90">{error}</div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5 items-start">
                        {/* LEFT COLUMN: COURIER & RECIPIENT INFO CARD */}
                        <div className="rounded-2xl border border-border/80 bg-muted/40 dark:bg-muted/15 p-4 sm:p-5 space-y-4 text-left">
                            {/* Courier Brand Header */}
                            <CourierLogo courier={displayCourier} />

                            {/* No. Resi with Copy Button */}
                            <div className="space-y-1 pt-1 border-t border-border/60">
                                <div className="text-xs text-muted-foreground font-medium">No. Resi</div>
                                <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-sm sm:text-base font-bold text-foreground truncate">
                                        {displayAwb}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        title="Salin nomor resi"
                                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer shrink-0"
                                    >
                                        {copied ? (
                                            <Check className="size-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Penjual */}
                            <div className="space-y-0.5 pt-1 border-t border-border/60">
                                <div className="text-xs text-muted-foreground font-medium">Penjual</div>
                                <div className="text-xs sm:text-sm font-bold text-foreground">
                                    {displaySenderName}
                                </div>
                            </div>

                            {/* Penerima */}
                            <div className="space-y-0.5 pt-1 border-t border-border/60">
                                <div className="text-xs text-muted-foreground font-medium">Penerima</div>
                                <div className="text-xs sm:text-sm font-bold text-foreground">
                                    {displayRecipientName}
                                    {displayRecipientPhone ? ` (${displayRecipientPhone})` : ''}
                                </div>
                                {displayRecipientAddress && (
                                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed break-words">
                                        {displayRecipientAddress}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: TIMELINE */}
                        <div className="min-w-0">
                            {loading && histories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                    <Loader2 className="size-6 animate-spin text-blue-600" />
                                    <span className="text-xs font-medium">Memuat riwayat pelacakan...</span>
                                </div>
                            ) : histories.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                                    <PackageCheck className="size-8 mx-auto text-muted-foreground opacity-60" />
                                    <div className="font-semibold text-sm text-foreground">
                                        Belum Ada Riwayat Perjalanan
                                    </div>
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                        Paket sedang disiapkan. Riwayat pelacakan akan otomatis muncul begitu kurir memindai paket Anda.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-[380px] sm:max-h-[420px] overflow-y-auto pr-3 space-y-0">
                                    {histories.map((item, index) => {
                                        const isLatest = index === 0;
                                        const isLast = index === histories.length - 1;

                                        // Check if this item has image or if latest item has podImages
                                        const itemImages = item.image
                                            ? (Array.isArray(item.image) ? item.image : [item.image])
                                            : (isLatest && podImages.length > 0 ? podImages : []);

                                        return (
                                            <div key={index} className="flex items-start gap-3 relative pb-6 last:pb-0">
                                                {/* Left Column: Timeline Line & Node */}
                                                <div className="flex flex-col items-center self-stretch shrink-0 relative w-5">
                                                    {/* Dashed vertical line */}
                                                    {!isLast && (
                                                        <div className="absolute top-3 bottom-0 w-0 border-l-2 border-dashed border-blue-500/80 dark:border-blue-400/80 -translate-x-[0.5px]" />
                                                    )}

                                                    {/* Node Circle */}
                                                    <div
                                                        className={`size-4 rounded-full border-2 bg-background z-10 flex items-center justify-center ${
                                                            isLatest
                                                                ? 'border-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/60'
                                                                : 'border-blue-500 dark:border-blue-400'
                                                        }`}
                                                    >
                                                        {isLatest ? (
                                                            <div className="size-1.5 rounded-full bg-blue-600" />
                                                        ) : (
                                                            <div className="size-1 rounded-full bg-blue-500/60" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Column: Milestone Note, Link, and Timestamp */}
                                                <div className="min-w-0 flex-1 pt-0.5 space-y-1 text-left">
                                                    <div className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                                                        {item.note}
                                                    </div>

                                                    {/* Proof of Delivery (POD) Link */}
                                                    {itemImages.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewImage(itemImages[0])}
                                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer pt-0.5"
                                                        >
                                                            <ImageIcon className="size-3" />
                                                            <span>Lihat Bukti Pengiriman</span>
                                                        </button>
                                                    )}

                                                    {/* Timestamp */}
                                                    {item.time && (
                                                        <div className="text-[11px] text-muted-foreground font-medium pt-0.5">
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
                )}
            </DialogContent>

            {/* LIGHTBOX FOR PROOF OF DELIVERY IMAGE */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-lg w-full bg-background rounded-2xl overflow-hidden shadow-2xl border border-border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3.5 border-b border-border flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">Bukti Pengiriman (POD)</span>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="p-4 bg-muted/30 flex items-center justify-center max-h-[70vh] overflow-hidden">
                            <img
                                src={previewImage}
                                alt="Bukti Pengiriman"
                                className="max-w-full max-h-[65vh] object-contain rounded-lg"
                            />
                        </div>
                        <div className="p-3 border-t border-border flex justify-end">
                            <a
                                href={previewImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
                            >
                                <ExternalLink className="size-3.5" />
                                <span>Buka Gambar Asli</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
}
