import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Tag } from 'lucide-react';
import { Link } from '@inertiajs/react';

export interface AvailableVoucher {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    terms?: string[];
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount: number;
    min_order_amount_formatted: string;
    max_discount_amount?: number | null;
    formatted_discount?: string;
    expires_at?: string | null;
    voucher_type?: 'biasa' | 'reward';
    category?: 'voucher_biasa' | 'hanya_untuk_anda';
    category_label?: string;
    applicable_type?: 'all' | 'specific';
    applicable_product_ids?: number[] | null;
    applicable_product_names?: string[];
    is_eligible?: boolean;
    shortage_amount?: number;
    reason_ineligible?: string | null;
}

interface VoucherSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vouchers: AvailableVoucher[];
    appliedVoucherCode?: string;
    onSelectVoucher: (code: string) => void;
    onApplyManualCode?: (code: string) => void;
    subtotal?: number;
}

export default function VoucherSelectorModal({
    open,
    onOpenChange,
    vouchers = [],
    appliedVoucherCode = '',
    onSelectVoucher,
    onApplyManualCode,
}: VoucherSelectorModalProps) {
    const [manualCode, setManualCode] = useState('');
    const [activeTab, setActiveTab] = useState<'biasa' | 'reward'>('biasa');

    const normalizedApplied = (appliedVoucherCode || '').trim().toUpperCase();

    // Separate into 2 categories
    const biasaVouchers = vouchers.filter(
        (v) => (v.voucher_type || v.category) !== 'reward' && v.category !== 'hanya_untuk_anda' && !v.code.startsWith('REW-')
    );
    const rewardVouchers = vouchers.filter(
        (v) => (v.voucher_type || v.category) === 'reward' || v.category === 'hanya_untuk_anda' || v.code.startsWith('REW-')
    );

    const displayedVouchers = activeTab === 'biasa' ? biasaVouchers : rewardVouchers;

    const handleApplyManual = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = manualCode.trim().toUpperCase();
        if (!trimmed) return;

        if (onApplyManualCode) {
            onApplyManualCode(trimmed);
        } else {
            onSelectVoucher(trimmed);
        }
        setManualCode('');
        onOpenChange(false);
    };

    const handleSelect = (code: string) => {
        onSelectVoucher(code);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-lg p-5 sm:p-6 bg-background rounded-2xl border border-border/80 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                {/* Header identical to other modals */}
                <DialogHeader className="pb-3 border-b border-border/70 space-y-1">
                    <div className="flex items-center gap-2 text-[#4A070B] dark:text-[#E8D0BA]">
                        <div className="w-7 h-7 rounded-full bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15 flex items-center justify-center shrink-0">
                            <Ticket className="w-4 h-4" />
                        </div>
                        <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                            Pilih Voucher
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Pilih voucher yang tersedia atau masukkan kode promo Anda.
                    </DialogDescription>
                </DialogHeader>

                {/* Manual Code Input Form */}
                <form onSubmit={handleApplyManual} className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Masukkan kode voucher..."
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                            className="h-9 pl-8 pr-3 text-xs font-mono uppercase tracking-wider"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!manualCode.trim()}
                        className="h-9 px-4 text-xs font-semibold bg-[#4A070B] hover:bg-[#360407] text-white shrink-0 cursor-pointer shadow-none"
                    >
                        Terapkan
                    </Button>
                </form>

                {/* Tabs / Filter Pills */}
                <div className="flex rounded-md border p-0.5 bg-muted/40">
                    <button
                        type="button"
                        onClick={() => setActiveTab('biasa')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded transition text-center cursor-pointer ${
                            activeTab === 'biasa'
                                ? 'bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Voucher Biasa
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('reward')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded transition text-center cursor-pointer ${
                            activeTab === 'reward'
                                ? 'bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Hanya Untuk Anda
                    </button>
                </div>

                {/* Voucher Cards List */}
                <div className="space-y-2.5 pt-1">
                    {displayedVouchers.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-lg">
                            {activeTab === 'biasa' ? (
                                'Belum ada voucher promo toko yang tersedia saat ini.'
                            ) : (
                                <div className="space-y-1.5">
                                    <p>Belum ada voucher penukaran reward Royale Club untuk akun Anda.</p>
                                    <Link
                                        href="/membership"
                                        onClick={() => onOpenChange(false)}
                                        className="inline-block text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] underline"
                                    >
                                        Tukar Poin di Royale Club &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        displayedVouchers.map((v) => {
                            const isApplied = normalizedApplied === v.code.toUpperCase();
                            const isEligible = v.is_eligible !== false;
                            const isReward = activeTab === 'reward' || (v.voucher_type || v.category) === 'reward' || v.code.startsWith('REW-');

                            return (
                                <div
                                    key={v.id}
                                    onClick={() => isEligible && handleSelect(v.code)}
                                    className={`p-3.5 rounded-lg border transition relative ${
                                        isApplied
                                            ? 'border-[#4A070B] bg-[#4A070B]/5 shadow-xs'
                                            : isEligible
                                            ? 'border-border/80 hover:border-[#4A070B]/50 bg-card/60 cursor-pointer'
                                            : 'border-border/50 bg-muted/20 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-mono font-bold text-xs text-primary px-1.5 py-0.5 bg-muted rounded border border-border/60">
                                                    {v.code}
                                                </span>
                                                {isReward && (
                                                    <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 py-0 h-4 font-semibold">
                                                        Hanya Untuk Anda
                                                    </Badge>
                                                )}
                                                {v.applicable_type === 'specific' ? (
                                                    <Badge variant="outline" className="text-[10px] text-indigo-600 dark:text-indigo-400 border-indigo-200 py-0 h-4">
                                                        Khusus Produk Tertentu
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">Semua Produk</span>
                                                )}
                                            </div>

                                            <div className="font-semibold text-xs sm:text-sm text-foreground pt-0.5">
                                                {v.formatted_discount || (v.type === 'percentage' ? `Diskon ${v.value}%` : `Potongan Rp ${new Intl.NumberFormat('id-ID').format(v.value)}`)}
                                                {v.name && <span className="font-normal text-muted-foreground text-xs ml-1.5">({v.name})</span>}
                                            </div>

                                            {v.applicable_type === 'specific' && v.applicable_product_names && v.applicable_product_names.length > 0 && (
                                                <div className="text-[11px] text-muted-foreground">
                                                    Khusus: <span className="font-medium text-foreground">{v.applicable_product_names.join(', ')}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5 flex-wrap">
                                                {v.min_order_amount > 0 ? (
                                                    <span>Min. belanja {v.min_order_amount_formatted || `Rp ${new Intl.NumberFormat('id-ID').format(v.min_order_amount)}`}</span>
                                                ) : (
                                                    <span>Tanpa min. belanja</span>
                                                )}
                                                {v.expires_at && (
                                                    <span>&bull; s/d {new Date(v.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                )}
                                            </div>

                                            {!isEligible && v.reason_ineligible && (
                                                <p className="text-[11px] text-destructive font-medium pt-0.5">
                                                    {v.reason_ineligible}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={!isEligible}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isEligible) handleSelect(v.code);
                                            }}
                                            className={`h-7 px-3 text-xs shrink-0 cursor-pointer ${
                                                isApplied
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    : 'bg-[#4A070B] hover:bg-[#360407] text-white'
                                            }`}
                                        >
                                            {isApplied ? 'Digunakan' : 'Gunakan'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
