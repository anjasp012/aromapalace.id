import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
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
    const { t, isEn } = useTranslation();
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={`min-h-screen text-gray-900 ${isEmbed ? 'bg-white p-2 sm:p-6' : 'bg-[#F8F9FA] py-4 sm:py-10 px-3 sm:px-6'} print:bg-white print:p-0 print:m-0`}>
            <Head title={`Invoice #${order.order_number} • Aroma Palace`} />

            {/* Top Toolbar (Hidden on Print and in Embed Mode) */}
            {!isEmbed && (
                <div className="max-w-4xl mx-auto mb-4 sm:mb-6 flex items-center justify-between print:hidden">
                    <Link
                        href="/account/orders"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t('invoice.back_to_history')}</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg bg-[#FFD100] hover:bg-[#E6BC00] text-gray-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer select-none"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{t('invoice.download_btn')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Printable Invoice Paper */}
            <div className={`max-w-4xl mx-auto bg-white ${isEmbed ? 'border-0 shadow-none p-2 sm:p-6' : 'border border-gray-200/80 rounded-xl p-4 sm:p-10 shadow-xs'} print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-200">
                    <div>
                        <div className="text-xl sm:text-3xl font-extrabold tracking-tight text-gray-900 font-serif">
                            aroma<span className="font-light text-gray-600">palace</span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-gray-500 tracking-wider uppercase mt-0.5 font-medium">
                            {t('invoice.official_boutique')}
                        </div>
                    </div>

                    <div className="text-right">
                        <h1 className="text-lg sm:text-2xl font-black tracking-wide text-gray-900">
                            INVOICE
                        </h1>
                        <p className="text-[11px] sm:text-xs text-gray-600 font-mono font-medium mt-0.5 break-all">
                            {order.invoice_number}
                        </p>
                    </div>
                </div>

                {/* Two Columns: Diterbitkan Atas Nama & Ditujukan Untuk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 py-5 border-b border-gray-200 text-xs">
                    {/* Left Column: Penjual */}
                    <div>
                        <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            {isEn ? 'Issued By' : 'Diterbitkan Atas Nama'}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline">
                                <span className="text-gray-500 w-20 shrink-0">{t('invoice.seller')}:</span>
                                <span className="font-bold text-gray-900">{seller.name}</span>
                            </div>
                            <div className="flex items-baseline">
                                <span className="text-gray-500 w-20 shrink-0">{isEn ? 'Boutique:' : 'Butik:'}</span>
                                <span className="text-gray-700">{seller.store_name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pembeli & Tanggal */}
                    <div>
                        <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            {isEn ? 'Billed To' : 'Ditujukan Untuk'}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline">
                                <span className="text-gray-500 w-20 sm:w-28 shrink-0">{t('invoice.buyer')}:</span>
                                <span className="font-bold text-gray-900">{buyer.name}</span>
                            </div>
                            <div className="flex items-baseline">
                                <span className="text-gray-500 w-20 sm:w-28 shrink-0">{t('invoice.date')}:</span>
                                <span className="text-gray-900 font-medium">{order.created_at}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Mobile Receipt List (Clean, non-squashed on small screens) */}
                <div className="py-4 sm:hidden print:hidden">
                    <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {isEn ? 'Order Items' : 'Daftar Produk'}
                    </div>
                    <div className="divide-y divide-gray-100 border-y border-gray-100">
                        {order.items.map((item) => (
                            <div key={item.id} className="py-3 space-y-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-xs text-gray-900 leading-snug">
                                            {item.product_name}
                                        </div>
                                        {(item.variant_name || item.volume) && (
                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                                {item.variant_name && <span>{isEn ? 'Variant' : 'Varian'}: {item.variant_name}</span>}
                                                {item.variant_name && item.volume && <span> &bull; </span>}
                                                {item.volume && <span>{item.volume}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs font-bold text-gray-900 shrink-0 text-right">
                                        {item.total_price_formatted}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                                    <span>{item.quantity} × {item.price_formatted}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Products Table (Desktop & Print) */}
                <div className="py-6 hidden sm:block print:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700 font-bold border-y border-gray-200">
                                    <th className="py-2.5 px-3 text-left font-bold w-1/2">{isEn ? 'Order Information' : 'Informasi Pesanan'}</th>
                                    <th className="py-2.5 px-3 text-right font-bold">{t('invoice.price')}</th>
                                    <th className="py-2.5 px-3 text-center font-bold">{t('invoice.quantity')}</th>
                                    <th className="py-2.5 px-3 text-right font-bold">{t('invoice.subtotal')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items.map((item) => (
                                    <tr key={item.id} className="align-top">
                                        <td className="py-3 px-3">
                                            <div className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                                {item.product_name}
                                            </div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                                {item.variant_name && <span>{isEn ? 'Variant' : 'Varian'}: {item.variant_name} &bull; </span>}
                                                {item.volume && <span>Volume: {item.volume}</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-right text-gray-800 font-medium">
                                            {item.price_formatted}
                                        </td>
                                        <td className="py-3 px-3 text-center text-gray-800 font-medium">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 px-3 text-right text-gray-900 font-bold">
                                            {item.total_price_formatted}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment & Financial Breakdown with Contained Watermark Stamp */}
                <div className="relative pt-3 pb-6 border-t border-gray-200 overflow-hidden">
                    {/* Watermark Stamp Overlay (Contained with overflow-hidden and responsive sizing) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                        {order.is_paid ? (
                            <div className="border-2 sm:border-[3px] border-emerald-500/35 text-emerald-600/40 font-black text-3xl sm:text-6xl uppercase tracking-[0.2em] sm:tracking-[0.25em] px-6 sm:px-12 py-2 sm:py-3 rounded-xl sm:rounded-2xl rotate-[-12deg] max-w-[85%] text-center">
                                {isEn ? 'PAID' : 'LUNAS'}
                            </div>
                        ) : (
                            <div className="border-2 sm:border-[3px] border-rose-500/35 text-rose-600/40 font-black text-2xl sm:text-5xl uppercase tracking-[0.15em] sm:tracking-[0.25em] px-4 sm:px-12 py-2 sm:py-3 rounded-xl sm:rounded-2xl rotate-[-12deg] max-w-[85%] text-center">
                                {isEn ? 'UNPAID' : 'BELUM LUNAS'}
                            </div>
                        )}
                    </div>

                    {/* Breakdown Content Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 relative z-10 text-xs">
                        {/* Left: Payment Method Info */}
                        <div className="sm:col-span-5 space-y-1">
                            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                {t('invoice.payment_method')}
                            </div>
                            <div className="font-bold text-gray-900 text-sm">
                                {order.payment_channel}
                            </div>
                            <div className="text-[11px] text-gray-500">
                                {isEn ? 'Status:' : 'Status:'} <strong className={order.is_paid ? 'text-emerald-700' : 'text-amber-700'}>
                                    {order.is_paid ? t('invoice.paid') : t('invoice.unpaid')}
                                </strong>
                            </div>
                        </div>

                        {/* Right: Calculations Breakdown */}
                        <div className="sm:col-span-7 space-y-2">
                            <div className="flex items-center justify-between text-gray-600">
                                <span>{isEn ? `Subtotal (${order.items_count} items)` : `Total Harga (${order.items_count} produk)`}</span>
                                <span className="font-medium text-gray-900">{order.subtotal_formatted}</span>
                            </div>

                            <div className="flex items-center justify-between text-gray-600">
                                <span>{t('invoice.shipping_cost')}</span>
                                <span className="font-medium text-gray-900">{order.shipping_cost_formatted}</span>
                            </div>

                            <div className="flex items-center justify-between text-gray-600">
                                <span>{isEn ? 'Shipping Insurance' : 'Total Asuransi Pengiriman'}</span>
                                <span className="font-medium text-gray-900">Rp 0</span>
                            </div>

                            {order.discount_amount > 0 && (
                                <div className="flex items-center justify-between text-emerald-700 font-medium">
                                    <span>{t('invoice.discount')} {order.voucher_code ? `(${order.voucher_code})` : ''}</span>
                                    <span>- {order.discount_amount_formatted}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-gray-600">
                                <span>{isEn ? 'Shipping Discount' : 'Diskon Ongkos Kirim'}</span>
                                <span className="font-medium text-gray-900">Rp 0</span>
                            </div>

                            <div className="flex items-center justify-between text-gray-600">
                                <span>{isEn ? 'Payment Fee' : 'Ongkos Pembayaran'}</span>
                                <span className="font-medium text-gray-900">Rp 0</span>
                            </div>

                            <div className="flex items-center justify-between text-gray-600">
                                <span>{isEn ? 'Service Fee' : 'Biaya Layanan'}</span>
                                <span className="font-medium text-gray-900">Rp 0</span>
                            </div>

                            <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                                <span className="font-bold text-gray-900 text-sm">{isEn ? 'Total Due' : 'Total Tagihan'}</span>
                                <span className="font-black text-gray-950 text-base">
                                    {order.total_amount_formatted}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Shipping Information Box */}
                <div className="bg-[#F8F9FA] border border-gray-200/80 rounded-lg p-3.5 sm:p-5 mt-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                        <div className="sm:col-span-4">
                            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                {t('invoice.shipping_method')}
                            </div>
                            <div className="font-bold text-gray-900">
                                {order.courier}
                            </div>
                        </div>

                        <div className="sm:col-span-8">
                            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                {t('invoice.shipping_address')}
                            </div>
                            <div className="space-y-0.5">
                                <div className="font-bold text-gray-900">
                                    {order.recipient_name} ({order.recipient_phone})
                                </div>
                                <div className="text-gray-600 leading-relaxed text-[11px] sm:text-xs">
                                    {order.shipping_address}{order.city ? `, ${order.city}` : ''}{order.postal_code ? `, ${order.postal_code}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="pt-6 sm:pt-10 pb-2 text-center text-[10.5px] sm:text-[11px] text-gray-500 space-y-1">
                    <p>{isEn ? 'This is a computer-generated invoice and valid without signature.' : 'Invoice ini sah dan diproses oleh komputer.'}</p>
                    <p>
                        {isEn ? 'Need help? Contact ' : 'Jika butuh bantuan, silakan hubungi '}
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
        </div>
    );
}
