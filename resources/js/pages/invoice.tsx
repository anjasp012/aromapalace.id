import React from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface InvoiceItem {
    id: number;
    product_name: string;
    variant_name?: string | null;
    volume?: string;
    price: number;
    price_formatted: string;
    quantity: number;
    total_price: number;
    total_price_formatted: string;
}

interface InvoiceProps {
    order: {
        id: number;
        order_number: string;
        invoice_number: string;
        created_at: string;
        delivery_type: string;
        recipient_name: string;
        recipient_phone: string;
        shipping_address: string;
        city: string;
        postal_code?: string | null;
        courier: string;
        tracking_number?: string | null;
        shipping_cost: number;
        shipping_cost_formatted: string;
        payment_method: string;
        payment_channel: string;
        payment_status: string;
        order_status: string;
        is_paid: boolean;
        subtotal: number;
        subtotal_formatted: string;
        discount_amount: number;
        discount_amount_formatted: string;
        voucher_code?: string | null;
        total_amount: number;
        total_amount_formatted: string;
        items_count: number;
        items: InvoiceItem[];
    };
    seller: {
        name: string;
        store_name: string;
    };
    buyer: {
        name: string;
        email: string;
    };
}

export default function InvoicePage({ order, seller, buyer }: InvoiceProps) {
    const { isEn } = useTranslation();
    const [isEmbed, setIsEmbed] = React.useState(false);

    React.useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('embed') === '1' || window.self !== window.top) {
                setIsEmbed(true);
            }
        } catch {
            setIsEmbed(true);
        }
    }, []);

    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const downloadUrl = `/orders/${order.order_number}/invoice/download`;
            const response = await fetch(downloadUrl);
            if (response.ok) {
                const blob = await response.blob();
                const fileName = `Invoice-${order.order_number}.pdf`;
                const file = new File([blob], fileName, { type: 'application/pdf' });

                const isMobileDevice = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

                // Hanya di perangkat mobile (iPhone/iPad/Android) gunakan native share sheet
                if (isMobileDevice && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Invoice #${order.order_number}`,
                        });
                    } catch {
                        // User menutup/membatalkan share sheet
                    }
                    setIsDownloading(false);
                    return;
                }

                // Download murni ke perangkat tanpa navigasi
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
                setIsDownloading(false);
                return;
            }
        } catch (err) {
            console.error('Download failed:', err);
        }
        setIsDownloading(false);
    };

    const handleClose = () => {
        try {
            if (window.self !== window.top) {
                window.parent.postMessage({ type: 'CLOSE_INVOICE_MODAL' }, '*');
                return;
            }
        } catch {
            // fallback
        }
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/orders';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col print:bg-white print:p-0 print:m-0">
            <Head title={`Invoice #${order.order_number} • Aroma Palace`} />

            {/* STANDALONE TOP APP BAR (Consistent Aroma Palace Burgundy Theme, Hidden in Embed & Print) */}
            {!isEmbed && (
                <header className="sticky top-0 z-30 bg-[#4A070B] text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+0.6rem)] pb-3 sm:py-3.5 shadow-md print:hidden flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-1 -ml-1 rounded-full hover:bg-white/10 transition cursor-pointer active:scale-95 text-white"
                            title="Kembali ke Pesanan"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <span className="text-sm sm:text-base font-bold tracking-tight text-white select-none">
                            Invoice #{order.order_number}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-[#F7D070] to-[#E5A844] hover:from-[#E5A844] hover:to-[#C98A2C] text-[#360407] shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-70"
                            title="Download Invoice (PDF)"
                            aria-label="Download Invoice"
                        >
                            {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </header>
            )}

            {/* PREVIEW CANVAS WITH SCROLLABLE WHITE PAPER */}
            <main className={`flex-1 overflow-x-auto ${isEmbed ? 'p-2 sm:p-6' : 'py-4 sm:py-8 px-2 sm:px-6'} flex flex-col items-center justify-start print:p-0 print:overflow-visible`}>
                {/* Printable Invoice Paper Sheet (Consistent Receipt Structure) */}
                <div className={`w-full max-w-2xl min-w-[340px] sm:min-w-[560px] bg-white rounded-xl ${isEmbed ? 'border border-gray-200/80 shadow-xs' : 'border border-gray-200/80 shadow-md'} p-5 sm:p-8 text-[11px] sm:text-xs leading-normal print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none`}>
                    {/* Header Row: Logo & Invoice Title */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 font-serif">
                                aroma<span className="font-light text-gray-600">palace</span>
                            </div>
                            <div className="text-[10px] sm:text-[10.5px] text-gray-500 tracking-wider uppercase mt-0.5 font-medium">
                                Official Luxury Boutique
                            </div>
                        </div>

                        <div className="text-right">
                            <h2 className="text-base sm:text-lg font-black tracking-wide text-gray-900">
                                INVOICE
                            </h2>
                            <p className="text-[10px] sm:text-[11px] text-gray-600 font-mono mt-0.5">
                                {order.invoice_number}
                            </p>
                        </div>
                    </div>

                    {/* Metadata: Diterbitkan Atas Nama & Ditujukan Untuk */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-[10.5px] sm:text-xs">
                        {/* Penjual */}
                        <div>
                            <div className="text-[9.5px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                DITERBITKAN ATAS NAMA
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-gray-500">Penjual:</div>
                                <div className="font-bold text-gray-900">{seller.name}</div>
                                <div className="text-gray-600 text-[10px]">{seller.store_name}</div>
                            </div>
                        </div>

                        {/* Pembeli & Tanggal Pembelian */}
                        <div>
                            <div className="text-[9.5px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                DITUJUKAN UNTUK
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-gray-500">Pembeli:</div>
                                    <div className="font-bold text-gray-900 truncate">{buyer.name}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Tanggal Pembelian:</div>
                                    <div className="font-medium text-gray-900">{order.created_at}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table (4 Columns: Informasi Pesanan, Harga Satuan, Kuantitas, Subtotal) */}
                    <div className="py-4">
                        <table className="w-full text-[10.5px] sm:text-xs">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-700 font-bold bg-gray-50/70">
                                    <th className="py-2 px-2 text-left font-bold w-[45%]">Informasi Pesanan</th>
                                    <th className="py-2 px-2 text-right font-bold w-[23%]">Harga Satuan</th>
                                    <th className="py-2 px-2 text-center font-bold w-[12%]">Kuantitas</th>
                                    <th className="py-2 px-2 text-right font-bold w-[20%]">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items.map((item) => (
                                    <tr key={item.id} className="align-top">
                                        <td className="py-2.5 px-2">
                                            <div className="font-semibold text-blue-600 hover:underline">
                                                {item.product_name}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5 space-x-1">
                                                {item.variant_name && <span>Varian: {item.variant_name}</span>}
                                                {item.variant_name && item.volume && <span>&bull;</span>}
                                                {item.volume && <span>Volume: {item.volume}</span>}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-2 text-right text-gray-800 font-medium whitespace-nowrap">
                                            {item.price_formatted}
                                        </td>
                                        <td className="py-2.5 px-2 text-center text-gray-800 font-medium">
                                            {item.quantity}
                                        </td>
                                        <td className="py-2.5 px-2 text-right text-gray-900 font-bold whitespace-nowrap">
                                            {item.total_price_formatted}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Breakdown with Contained Watermark Stamp */}
                    <div className="relative pt-3 pb-4 border-t border-gray-200 overflow-hidden">
                        {/* Rotated Watermark Stamp (2 lines "BELUM LUNAS" or 1 line "LUNAS") */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                            {order.is_paid ? (
                                <div className="border-[2.5px] border-emerald-500/25 text-emerald-600/30 font-black text-2xl sm:text-4xl uppercase tracking-[0.2em] px-8 py-2.5 rounded-xl rotate-[-15deg] leading-tight text-center">
                                    LUNAS
                                </div>
                            ) : (
                                <div className="border-[2.5px] border-rose-500/20 text-rose-500/25 font-black text-2xl sm:text-4xl uppercase tracking-[0.2em] px-8 py-2.5 rounded-xl rotate-[-15deg] leading-tight text-center">
                                    <div>BELUM</div>
                                    <div>LUNAS</div>
                                </div>
                            )}
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-12 gap-4 relative z-10 text-[10.5px] sm:text-xs">
                            {/* Left: Metode Pembayaran */}
                            <div className="col-span-5 space-y-1">
                                <div className="text-gray-500 font-medium">Metode Pembayaran</div>
                                <div className="font-bold text-gray-900">{order.payment_channel}</div>
                            </div>

                            {/* Right: Line Items Calculation */}
                            <div className="col-span-7 space-y-1.5">
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Total Harga ( {order.items_count} produk )</span>
                                    <span className="font-medium text-gray-900">{order.subtotal_formatted}</span>
                                </div>

                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Total Ongkos Kirim</span>
                                    <span className="font-medium text-gray-900">{order.shipping_cost_formatted}</span>
                                </div>

                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Total Asuransi Pengiriman</span>
                                    <span className="font-medium text-gray-900">Rp 0</span>
                                </div>

                                {order.discount_amount > 0 && (
                                    <div className="flex items-center justify-between text-rose-600 font-medium">
                                        <span>Voucher Diskon {order.voucher_code ? `(${order.voucher_code})` : ''}</span>
                                        <span>- {order.discount_amount_formatted}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Voucher Diskon Ongkos Kirim</span>
                                    <span className="font-medium text-gray-900">Rp 0</span>
                                </div>

                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Pajak</span>
                                    <span className="font-medium text-gray-900">Rp 0</span>
                                </div>

                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Biaya Layanan</span>
                                    <span className="font-medium text-gray-900">Rp 0</span>
                                </div>

                                <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between">
                                    <span className="font-bold text-gray-900 text-xs sm:text-sm">Total Tagihan</span>
                                    <span className="font-black text-gray-950 text-xs sm:text-sm">
                                        {order.total_amount_formatted}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Gray Rounded Box: Metode Pengiriman & Alamat Pengiriman */}
                    <div className="bg-[#F8F9FA] border border-gray-200/80 rounded-md p-3 sm:p-4 mt-3 text-[10.5px] sm:text-xs">
                        <div className="grid grid-cols-12 gap-3 sm:gap-4">
                            <div className="col-span-4">
                                <div className="text-[9.5px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Metode Pengiriman
                                </div>
                                <div className="font-bold text-gray-900">
                                    {order.courier}
                                </div>
                                {order.tracking_number && (
                                    <div className="text-[10px] text-gray-600 font-mono mt-1">
                                        No. Resi: <span className="font-bold text-gray-900">{order.tracking_number}</span>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-8">
                                <div className="text-[9.5px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Alamat Pengiriman
                                </div>
                                <div className="space-y-0.5">
                                    <div className="font-bold text-gray-900">
                                        {order.recipient_name} ({order.recipient_phone})
                                    </div>
                                    <div className="text-gray-600 leading-relaxed text-[10px] sm:text-[11px]">
                                        {order.shipping_address}{order.city ? `, ${order.city}` : ''}{order.postal_code ? `, ${order.postal_code}` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="pt-6 pb-1 text-center text-[10px] sm:text-[10.5px] text-gray-500 space-y-0.5">
                        <p>Invoice ini sah dan diproses oleh komputer.</p>
                        <p>
                            Jika butuh bantuan, silakan hubungi{' '}
                            <a
                                href="https://wa.me/6289529591732"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-blue-600 hover:underline"
                            >
                                Admin Aroma Palace
                            </a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
