import React, { useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ShippingLabel, { ShippingLabelOrder } from '@/components/ShippingLabel';
import { Printer, ExternalLink, X, Download } from 'lucide-react';

interface ShippingLabelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: ShippingLabelOrder;
}

export default function ShippingLabelModal({
    open,
    onOpenChange,
    order,
}: ShippingLabelModalProps) {
    const printContainerRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        // Trigger print dialog
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="max-w-2xl w-full max-h-[92vh] p-0 gap-0 rounded-2xl bg-card text-card-foreground border border-border/80 shadow-2xl flex flex-col overflow-hidden outline-none"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/80 shrink-0 bg-card">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Printer className="size-4" />
                        </div>
                        <div>
                            <DialogTitle className="font-extrabold text-base sm:text-lg text-foreground tracking-tight m-0 p-0">
                                Cetak Label Pengiriman
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">
                                Format Thermal 100 x 150 mm (KiriminAja Standard)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Direct Print Button */}
                        <Button
                            size="sm"
                            onClick={handlePrint}
                            className="bg-[#4A070B] hover:bg-[#360407] text-white shadow-xs font-semibold text-xs h-8 px-3"
                        >
                            <Printer className="size-3.5 mr-1.5" />
                            <span>Cetak Label</span>
                        </Button>

                        {/* Open in Standalone Tab */}
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs h-8 px-2.5 hidden sm:inline-flex"
                        >
                            <a
                                href={`/manajemen-pesanan/${order.order_number}/shipping-label`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Buka di tab baru"
                            >
                                <ExternalLink className="size-3.5" />
                            </a>
                        </Button>

                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                            aria-label="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body: Scrollable Preview */}
                <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto bg-muted/30 flex items-center justify-center">
                    <div
                        ref={printContainerRef}
                        id="printable-shipping-label"
                        className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-border/60 max-w-sm w-full mx-auto"
                    >
                        <ShippingLabel order={order} />
                    </div>
                </div>

                {/* Print Styles for clean 100x150mm printing */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-shipping-label,
                        #printable-shipping-label * {
                            visibility: visible;
                        }
                        #printable-shipping-label {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 100mm;
                            margin: 0;
                            padding: 0;
                            border: none;
                            box-shadow: none;
                            background: transparent;
                        }
                        @page {
                            size: 100mm 150mm;
                            margin: 0;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
