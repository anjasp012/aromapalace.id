import React from 'react';
import Barcode from '@/components/Barcode';
import { Truck } from 'lucide-react';

export interface ShippingLabelOrder {
    id: number;
    order_number: string;
    created_at?: string;
    recipient_name?: string;
    recipient_phone?: string;
    address?: string;
    province_name?: string | null;
    city_name?: string | null;
    district_name?: string | null;
    subdistrict_name?: string | null;
    city?: string | null;
    postal_code?: string | null;
    courier?: string | null;
    courier_service?: string | null;
    courier_service_type?: string | null;
    courier_logo?: string | null;
    tracking_number?: string | null;
    shipping_payment_code?: string | null;
    shipping?: {
        id?: number;
        shipping_payment_code?: string | null;
        awb?: string | null;
        [key: string]: any;
    } | null;
    total_amount: number;
    payment_method?: string;
    payment_channel?: string;
    notes?: string | null;
    items_count?: number;
    items?: Array<{
        id?: number;
        product_name: string;
        variant_name?: string;
        volume?: string | number;
        quantity: number;
    }>;
    sender?: {
        name?: string;
        phone?: string;
        address?: string;
        province_name?: string;
        city_name?: string;
        district_name?: string;
        subdistrict_name?: string;
        postal_code?: string;
    };
    weight_formatted?: string;
    total_qty?: number;
    is_cod?: boolean;
    sorting_code?: string;
    origin_city?: string;
    destination_city?: string;
}

interface ShippingLabelProps {
    order: ShippingLabelOrder;
    className?: string;
}

// KiriminAja Brand Logo (Official logo)
function KiriminAjaLogo() {
    return (
        <div className="flex items-center select-none">
            <img
                src="/images/kiriminajalogo.png"
                alt="KiriminAja"
                className="h-7 sm:h-8 max-h-8 w-auto max-w-[130px] object-contain"
            />
        </div>
    );
}

// Official Logistic Brand Logos
function LogisticLogo({ courier = '', logo = '' }: { courier?: string; logo?: string }) {
    let logoUrl = logo;
    if (!logoUrl && courier) {
        const clean = courier.toLowerCase().replace(/[\s\-_&]/g, '');
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
                logoUrl = `https://storage.googleapis.com/tprt0ezsggqjornc7nf1wwluvgulhr/assets/courier-logo/${code}.png`;
                break;
            }
        }
    }

    if (logoUrl) {
        return (
            <div className="flex items-center justify-end h-8 max-w-[130px]">
                <img
                    src={logoUrl}
                    alt={courier || 'Ekspedisi'}
                    className="h-7.5 max-h-8 max-w-[120px] object-contain"
                />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 font-bold text-sm text-black select-none">
            <Truck className="size-4 shrink-0" />
            <span className="uppercase">{courier || 'KURIR EKSPEDISI'}</span>
        </div>
    );
}

export default function ShippingLabel({ order, className = '' }: ShippingLabelProps) {
    // AWB / Tracking number
    const rawTracking = (order.tracking_number || '').trim();
    const isWaitingTracking = !rawTracking || rawTracking.toLowerCase().includes('menunggu');
    const hasRealAwb = !isWaitingTracking && rawTracking.length > 0;

    // Use actual courier AWB if available, fallback to order_number
    const barcodeValue = hasRealAwb ? rawTracking : order.order_number;
    const awbLabel = hasRealAwb ? rawTracking : order.order_number;

    // Sender details fallback
    const sender = order.sender || {};
    const senderName = sender.name || 'Aroma Palace Official';
    const senderPhone = sender.phone || '081288889999';
    const senderAddressParts = [
        sender.address || 'Jl. Kemang Raya No. 10',
        sender.subdistrict_name || 'Kramat Pela',
        sender.district_name || 'Kebayoran Baru',
        sender.city_name || 'Jakarta Selatan',
        sender.province_name || 'DKI Jakarta',
        sender.postal_code || '12130',
    ].filter(Boolean);
    const senderFullAddress = senderAddressParts.join(', ');

    // Recipient details
    const recipientName = order.recipient_name || 'Pelanggan Aroma Palace';
    const recipientPhone = order.recipient_phone || '-';
    const recipientAddressParts = [
        order.address,
        order.subdistrict_name,
        order.district_name,
        order.city_name || order.city,
        order.province_name,
        order.postal_code,
    ].filter(Boolean);
    const recipientFullAddress = recipientAddressParts.join(', ') || '-';

    // Service & Courier
    const courierName = order.courier || 'JNE';
    const serviceCode = (order.courier_service_type || order.courier_service || 'Standard').toUpperCase();

    // Weight and Quantity calculations
    const items = order.items || [];
    const totalQty = order.total_qty || (items.length > 0 ? items.reduce((sum, it) => sum + (it.quantity || 1), 0) : 1);
    const weightFormatted = order.weight_formatted || `${Math.max(500, totalQty * 350)}gr`;

    // Payment & COD
    const isCod = order.is_cod ?? (order.payment_method === 'cod' || (order.payment_channel || '').toLowerCase().includes('cod'));
    const codAmountFormatted = isCod ? `Rp. ${Number(order.total_amount).toLocaleString('id-ID')}` : 'Rp. 0';

    // Origin and Destination
    const originCity = (order.origin_city || sender.city_name || 'JAKARTA SELATAN')
        .replace(/^(Kota|Kabupaten|Kota Administrasi)\s+/i, '')
        .toUpperCase();
    const destCity = (order.destination_city || order.city_name || order.city || 'KOTA TUJUAN')
        .replace(/^(Kota|Kabupaten|Kota Administrasi)\s+/i, '')
        .toUpperCase();

    // Sorting Code
    const originCode = originCity.replace(/[^A-Z]/g, '').substring(0, 3) || 'JKT';
    const destCode = destCity.replace(/[^A-Z]/g, '').substring(0, 3) || 'DEST';
    const sortingCode = order.sorting_code || `${originCode} - ${originCode}2003 - ${destCode}${order.postal_code ? order.postal_code.substring(0, 4) : '4043'}`;

    // Item summary
    const itemSummary = items.length > 0
        ? items.map(it => `${it.product_name}${it.variant_name ? ` (${it.variant_name})` : ''} x${it.quantity}`).join(', ')
        : 'Parfum Mewah Aroma Palace';

    return (
        <div
            className={`bg-white text-black font-sans leading-normal select-text print:m-0 print:p-0 ${className}`}
            style={{
                width: '100%',
                maxWidth: '400px',
                color: '#000000',
            }}
        >
            {/* OUTER SOLID BLACK BORDER (100mm x 150mm standard thermal proportion) */}
            <div className="border-2 border-black rounded-xs overflow-hidden bg-white text-black">
                {/* 1. TOP HEADER: KiriminAja Logo (Left) & Logistic Logo (Right) */}
                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-white">
                    <KiriminAjaLogo />
                    <LogisticLogo courier={courierName} logo={order.courier_logo || ''} />
                </div>

                {/* 2. FULL-WIDTH HERO BARCODE & AWB NUMBER */}
                <div className="p-3 border-b-2 border-black bg-white flex flex-col items-center justify-center text-center">
                    <Barcode
                        value={barcodeValue}
                        height={54}
                        className="w-full max-w-[340px] h-14"
                        showText={false}
                    />
                    <div className="flex flex-col items-center justify-center mt-1.5">
                        <span className="font-mono text-sm sm:text-base font-black tracking-widest text-black">
                            {hasRealAwb ? rawTracking : `(OID) ${order.order_number}`}
                        </span>
                        {!hasRealAwb && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded mt-1">
                                * Resi Kurir Belum Terbit (Barcode Sementara OID)
                            </span>
                        )}
                    </div>
                </div>

                {/* 2b. SPECS ROW: SERVICE TYPE / WEIGHT / QUANTITY (3 COLUMNS) */}
                <div className="grid grid-cols-3 border-b-2 border-black divide-x-2 divide-black text-center bg-zinc-50/40">
                    <div className="p-1.5">
                        <span className="font-bold text-[9px] text-zinc-600 uppercase block leading-none">
                            Service:
                        </span>
                        <span className="font-black text-xs sm:text-sm text-black tracking-tight block mt-0.5">
                            {serviceCode}
                        </span>
                    </div>
                    <div className="p-1.5">
                        <span className="font-bold text-[9px] text-zinc-600 uppercase block leading-none">
                            Weight:
                        </span>
                        <span className="font-black text-xs sm:text-sm text-black block mt-0.5">
                            {weightFormatted}
                        </span>
                    </div>
                    <div className="p-1.5">
                        <span className="font-bold text-[9px] text-zinc-600 uppercase block leading-none">
                            Quantity:
                        </span>
                        <span className="font-black text-xs sm:text-sm text-black block mt-0.5">
                            {totalQty} Pcs
                        </span>
                    </div>
                </div>

                {/* 3. SHIPPING TYPE (COD / NON-COD) & INSURANCE */}
                <div className="grid grid-cols-[1.25fr_1fr] border-b-2 border-black items-center">
                    <div className="p-2 border-r-2 border-black text-center flex items-center justify-center">
                        <span className="font-black text-base sm:text-lg text-black tracking-tight">
                            {isCod ? `COD: ${codAmountFormatted}` : 'NON-COD'}
                        </span>
                    </div>
                    <div className="p-2 text-left">
                        <span className="text-[11px] font-bold text-black block">
                            Ins: Rp. 0
                        </span>
                    </div>
                </div>

                {/* 4. SORTING CODE BAR */}
                <div className="border-b-2 border-black py-1 px-2 text-center bg-zinc-50">
                    <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-black">
                        {sortingCode}
                    </span>
                </div>

                {/* 5. RECIPIENT & SENDER DETAILS */}
                <div className="grid grid-cols-2 border-b-2 border-black text-left">
                    {/* Penerima (Left) */}
                    <div className="p-2 border-r-2 border-black flex flex-col justify-between">
                        <div>
                            <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">
                                Penerima
                            </div>
                            <div className="font-black text-xs sm:text-sm text-black leading-tight mt-0.5">
                                {recipientName}
                            </div>
                            <div className="text-[10px] leading-tight text-zinc-900 mt-1 break-words">
                                <span className="font-bold">{recipientPhone}</span> | {recipientFullAddress}
                            </div>
                        </div>
                    </div>

                    {/* Pengirim (Right) */}
                    <div className="p-2 flex flex-col justify-between">
                        <div>
                            <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">
                                Pengirim
                            </div>
                            <div className="font-black text-xs sm:text-sm text-black leading-tight mt-0.5">
                                {senderName}
                            </div>
                            <div className="text-[10px] leading-tight text-zinc-900 mt-1 break-words">
                                <span className="font-bold">{senderPhone}</span> | {senderFullAddress}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. ORIGIN CITY TO DESTINATION CITY */}
                <div className="border-b-2 border-black px-3 py-1 flex items-center justify-between text-xs font-black uppercase text-black bg-zinc-50">
                    <span className="truncate max-w-[42%]">{originCity}</span>
                    <span className="font-normal lowercase text-[10px] text-zinc-600 px-2 shrink-0">to</span>
                    <span className="truncate max-w-[42%] text-right">{destCity}</span>
                </div>

                {/* 7. ITEM INFORMATION (ISI PAKET) */}
                <div className="p-2 border-b-2 border-black text-left">
                    <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                        Isi Paket
                    </div>
                    <div className="font-black text-[11px] sm:text-xs text-black mt-0.5 line-clamp-2 leading-snug">
                        {itemSummary}
                    </div>
                </div>

                {/* 8. CATATAN & ORDER REF INFORMATION */}
                <div className="grid grid-cols-[1.1fr_1.1fr] items-center text-left">
                    <div className="p-1.5 border-r-2 border-black text-[10px] italic text-zinc-800 truncate">
                        Catatan: {order.notes || '-'}
                    </div>
                    <div className="p-1.5 text-center font-black text-xs text-black tracking-wider truncate">
                        {order.shipping?.shipping_payment_code || order.shipping_payment_code || order.order_number}
                    </div>
                </div>
            </div>

            {/* 9. FOOTER DISCLAIMER */}
            <div className="text-[8.5px] italic text-zinc-600 leading-tight pt-1.5 px-1 space-y-0.5 text-left">
                <p>* Pengirim wajib meminta bukti serah terima paket ke kurir.</p>
                <p>* Jika paket ini retur, pengirim tetap dikenakan biaya keberangkatan dan biaya retur sesuai ekspedisi.</p>
            </div>
        </div>
    );
}
