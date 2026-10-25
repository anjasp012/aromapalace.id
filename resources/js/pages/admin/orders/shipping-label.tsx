import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import ShippingLabel, { ShippingLabelOrder } from '@/components/ShippingLabel';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';

interface ShippingLabelPageProps {
    order: ShippingLabelOrder;
}

export default function AdminShippingLabelPage({ order }: ShippingLabelPageProps) {
    useEffect(() => {
        // Optional: Auto trigger print when query parameter ?print=1 is present
        const params = new URLSearchParams(window.location.search);
        if (params.get('print') === '1') {
            setTimeout(() => {
                window.print();
            }, 400);
        }
    }, []);

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-8 flex flex-col items-center justify-start print:bg-white print:p-0">
            <Head title={`Shipping Label #${order.order_number} - Aroma Palace`} />

            {/* Print Toolbar (Hidden during print) */}
            <div className="w-full max-w-sm mb-4 flex items-center justify-between print:hidden">
                <Button variant="ghost" size="sm" asChild className="text-xs">
                    <Link href={`/manajemen-pesanan/${order.order_number}`} className="flex items-center gap-1.5">
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Detail Pesanan</span>
                    </Link>
                </Button>

                <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-semibold shadow-xs"
                >
                    <Printer className="size-3.5 mr-1.5" />
                    <span>Cetak Label (100x150mm)</span>
                </Button>
            </div>

            {/* Thermal Label Container */}
            <div
                id="thermal-label"
                className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-border/80 max-w-sm w-full print:shadow-none print:border-none print:p-0 print:m-0 print:w-[100mm]"
            >
                <ShippingLabel order={order} />
            </div>

            {/* Thermal Print Page Media Query */}
            <style>{`
                @media print {
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #thermal-label,
                    #thermal-label * {
                        visibility: visible;
                    }
                    #thermal-label {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100mm;
                        margin: 0;
                        padding: 0;
                        border: none;
                        box-shadow: none;
                    }
                    @page {
                        size: 100mm 150mm;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
}
