import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

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
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-gray-900 py-6 sm:py-10 px-4 sm:px-6 print:bg-white print:p-0 print:m-0">
            <Head title={`Invoice #${order.order_number} • Aroma Palace`} />

            {/* Top Toolbar (Hidden on Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <Link
                    href="/account/orders"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Riwayat Pesanan</span>
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-[#FFD100] hover:bg-[#E6BC00] text-gray-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer select-none"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Unduh</span>
                    </button>
                </div>
            </div>

            {/* Main Printable Invoice Paper */}
            <div className="max-w-4xl mx-auto bg-white border border-gray-200/80 rounded-xl p-6 sm:p-12 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-200">
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 font-serif">
                            aroma<span className="font-light text-gray-600">palace</span>
                        </div>
                        <div className="text-[11px] text-gray-500 tracking-wider uppercase mt-1 font-medium">
                            Parfums de Luxe &bull; Boutique Resmi
                        </div>
                    </div>

                    <div className="text-right">
                        <h1 className="text-xl sm:text-2xl font-black tracking-wide text-gray-900">
                            INVOICE
                        </h1>
                        <p className="text-xs text-gray-600 font-mono font-medium mt-1">
                            {order.invoice_number}
                        </p>
                    </div>
                </div>

                {/* Two Columns: Diterbitkan Atas Nama & Ditujukan Untuk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 py-6 border-b border-gray-200 text-xs">
                    {/* Left Column: Penjual */}
                    <div>
                        <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Diterbitkan Atas Nama
                        </div>
                        <div className="space-y-1">
                            <div className="flex">
                                <span className="text-gray-500 w-20">Penjual:</span>
                                <span className="font-bold text-gray-900">{seller.name}</span>
                            </div>
                            <div className="flex">
                                <span className="text-gray-500 w-20">Butik:</span>
                                <span className="text-gray-700">{seller.store_name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pembeli & Tanggal */}
                    <div>
                        <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Ditunjukan Untuk
                        </div>
                        <div className="space-y-1">
                            <div className="flex">
                                <span className="text-gray-500 w-32">Pembeli:</span>
                                <span className="font-bold text-gray-900">{buyer.name}</span>
                            </div>
                            <div className="flex">
                                <span className="text-gray-500 w-32">Tanggal Pembelian:</span>
                                <span className="text-gray-900 font-medium">{order.created_at}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="py-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700 font-bold border-y border-gray-200">
                                    <th className="py-2.5 px-3 text-left font-bold w-1/2">Informasi Pesanan</th>
                                    <th className="py-2.5 px-3 text-right font-bold">Harga Satuan</th>
                                    <th className="py-2.5 px-3 text-center font-bold">Kuantitas</th>
                                    <th className="py-2.5 px-3 text-right font-bold">Subtotal</th>
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
                                                {item.variant_name && <span>Varian: {item.variant_name} &bull; </span>}
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

                {/* Payment & Financial Breakdown with Watermark Stamp */}
                <div className="relative pt-2 pb-6 border-t border-gray-200">
                    {/* Watermark Stamp Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                        {order.is_paid ? (
                            <div className="border-[3px] border-emerald-500/35 text-emerald-600/40 font-black text-4xl sm:text-6xl uppercase tracking-[0.25em] px-8 sm:px-12 py-3 rounded-2xl rotate-[-14deg]">
                                LUNAS
                            </div>
                        ) : (
                            <div className="border-[3px] border-rose-500/35 text-rose-600/40 font-black text-4xl sm:text-6xl uppercase tracking-[0.25em] px-8 sm:px-12 py-3 rounded-2xl rotate-[-14deg]">
                                BELUM LUNAS
                            </div>
                        )}
                    </div>

                    {/* Breakdown Content Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 relative z-10 text-xs">
                        {/* Left: Payment Method Info */}
                        <div className="sm:col-span-5 space-y-1">
                            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Metode Pembayaran
                            </div>
                            <div className="font-bold text-gray-900 text-sm">
                                {order.payment_channel}
                            </div>
                            <div className="text-[11px] text-gray-500">
                                Status: <strong className={order.is_paid ? 'text-emerald-700' : 'text-amber-700'}>
                                    {order.is_paid ? 'Terkonfirmasi Lunas' : 'Menunggu Pembayaran'}
                                </strong>
                            </div>
                        </div>

                        {/* Right: Calculations Breakdown */}
                        <div className="sm:col-span-7 space-y-2">
                            <div className="flex items-center justify-between text-gray-600">
                                <span>Total Harga ({order.items_count} produk)</span>
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
                                <div className="flex items-center justify-between text-emerald-700 font-medium">
                                    <span>Total Voucher Diskon {order.voucher_code ? `(${order.voucher_code})` : ''}</span>
                                    <span>- {order.discount_amount_formatted}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-gray-600">
                                <span>Diskon Ongkos Kirim</span>
                                <span className="font-medium text-gray-900">Rp 0</span>
                            </div>

                            <div className="flex items-center justify-between text-gray-600">
                                <span>Ongkos Pembayaran</span>
                                <span className="font-medium text-gray-900">Rp 0</span>
                            </div>

                            <div className="flex items-center justify-between text-gray-600">
                                <span>Biaya Layanan</span>
                                <span className="font-medium text-gray-900">Rp 0</span>
                            </div>

                            <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                                <span className="font-bold text-gray-900 text-sm">Total Tagihan</span>
                                <span className="font-black text-gray-950 text-base">
                                    {order.total_amount_formatted}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Shipping Information Box (Matching Screenshot) */}
                <div className="bg-[#F8F9FA] border border-gray-200/80 rounded-lg p-4 sm:p-5 mt-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-4">
                            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Metode Pengiriman
                            </div>
                            <div className="font-bold text-gray-900">
                                {order.courier}
                            </div>
                        </div>

                        <div className="sm:col-span-8">
                            <div className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Alamat Pengiriman
                            </div>
                            <div className="space-y-0.5">
                                <div className="font-bold text-gray-900">
                                    {order.recipient_name} ({order.recipient_phone})
                                </div>
                                <div className="text-gray-600 leading-relaxed">
                                    {order.shipping_address}{order.city ? `, ${order.city}` : ''}{order.postal_code ? `, ${order.postal_code}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Note (Matching Screenshot) */}
                <div className="pt-10 pb-2 text-center text-[11px] text-gray-500 space-y-1">
                    <p>Invoice ini sah dan diproses oleh komputer</p>
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
        </div>
    );
}
