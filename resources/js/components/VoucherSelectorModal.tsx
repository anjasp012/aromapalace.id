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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Ticket,
    Crown,
    Sparkles,
    Check,
    AlertCircle,
    ArrowRight,
    Tag,
    Clock,
    Package,
} from 'lucide-react';
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
    subtotal = 0,
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
            <DialogContent className="w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] sm:w-full sm:max-w-2xl p-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl bg-card">
                {/* Header */}
                <DialogHeader className="p-5 pb-4 border-b border-border/70 bg-gradient-to-r from-[#4A070B]/5 via-background to-[#E8D0BA]/10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#4A070B] text-white flex items-center justify-center shadow-md shadow-[#4A070B]/20">
                            <Ticket className="w-5 h-5 text-[#E8D0BA]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-serif font-bold text-foreground tracking-tight">
                                Pilih Voucher Promo &amp; Reward
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Dapatkan potongan belanja wewangian istimewa Aroma Palace.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Manual Code Input Form */}
                    <form onSubmit={handleApplyManual} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Tag className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Punya kode voucher lain? Masukkan di sini..."
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                className="h-10 pl-9 pr-3 rounded-lg text-xs font-mono uppercase tracking-wider border-border/80 bg-background focus:border-[#4A070B]"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!manualCode.trim()}
                            className="h-10 px-4 rounded-lg bg-[#4A070B] hover:bg-[#380508] text-white text-xs font-semibold shadow-none cursor-pointer shrink-0 transition-colors"
                        >
                            Terapkan
                        </Button>
                    </form>

                    {/* Tabs: Voucher Biasa vs Hanya Untuk Anda */}
                    <Tabs
                        value={activeTab}
                        onValueChange={(val) => setActiveTab(val as 'biasa' | 'reward')}
                        className="w-full"
                    >
                        <TabsList className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl h-10 border border-border/60">
                            <TabsTrigger
                                value="biasa"
                                className="text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-[#4A070B] data-[state=active]:font-semibold data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                                <Ticket className="w-3.5 h-3.5 text-[#4A070B]" />
                                <span>Voucher Biasa</span>
                                <Badge
                                    variant="secondary"
                                    className="ml-1 px-1.5 py-0 text-[10px] h-4 min-w-4 bg-muted text-muted-foreground font-semibold rounded-full"
                                >
                                    {biasaVouchers.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="reward"
                                className="text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-[#4A070B] data-[state=active]:font-semibold data-[state=active]:shadow-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                                <span>Hanya Untuk Anda</span>
                                <Badge
                                    variant="secondary"
                                    className="ml-1 px-1.5 py-0 text-[10px] h-4 min-w-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold rounded-full border border-amber-500/20"
                                >
                                    {rewardVouchers.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        {/* Content Tab 1: Voucher Biasa */}
                        <TabsContent value="biasa" className="mt-3.5 space-y-3 focus:outline-none">
                            {biasaVouchers.length === 0 ? (
                                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2.5">
                                        <Ticket className="w-6 h-6 stroke-1" />
                                    </div>
                                    <p className="text-xs font-medium text-foreground">
                                        Saat ini belum ada voucher promo umum yang tersedia.
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Nantikan promo dan diskon spesial wewangian kami selanjutnya.
                                    </p>
                                </div>
                            ) : (
                                biasaVouchers.map((voucher) => (
                                    <VoucherCardItem
                                        key={voucher.id}
                                        voucher={voucher}
                                        isApplied={normalizedApplied === voucher.code.toUpperCase()}
                                        onSelect={() => handleSelect(voucher.code)}
                                    />
                                ))
                            )}
                        </TabsContent>

                        {/* Content Tab 2: Hanya Untuk Anda (Reward) */}
                        <TabsContent value="reward" className="mt-3.5 space-y-3 focus:outline-none">
                            {rewardVouchers.length === 0 ? (
                                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent">
                                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2.5 border border-amber-500/20">
                                        <Crown className="w-6 h-6 stroke-1" />
                                    </div>
                                    <p className="text-xs font-semibold text-foreground">
                                        Belum Ada Voucher Khusus Akun Anda
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                                        Voucher di kategori ini diperoleh dari penukaran poin membership Royale Club Anda. Kumpulkan poin dari setiap belanja dan tukarkan reward eksklusif!
                                    </p>
                                    <div className="mt-3.5">
                                        <Button
                                            size="sm"
                                            asChild
                                            className="h-8 px-3.5 text-xs bg-gradient-to-r from-[#4A070B] to-[#6B0F15] hover:from-[#380508] hover:to-[#4A070B] text-[#E8D0BA] font-medium rounded-lg shadow-sm"
                                        >
                                            <Link href="/membership" onClick={() => onOpenChange(false)}>
                                                <span>Tukar Poin Membership</span>
                                                <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                rewardVouchers.map((voucher) => (
                                    <VoucherCardItem
                                        key={voucher.id}
                                        voucher={voucher}
                                        isApplied={normalizedApplied === voucher.code.toUpperCase()}
                                        onSelect={() => handleSelect(voucher.code)}
                                        isReward
                                    />
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function VoucherCardItem({
    voucher,
    isApplied,
    onSelect,
    isReward = false,
}: {
    voucher: AvailableVoucher;
    isApplied: boolean;
    onSelect: () => void;
    isReward?: boolean;
}) {
    const isEligible = voucher.is_eligible !== false;

    return (
        <div
            className={`relative rounded-xl border transition-all overflow-hidden ${
                isApplied
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30'
                    : isReward
                    ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/5 via-background to-card hover:border-amber-500/60'
                    : 'border-border/80 bg-card hover:border-[#4A070B]/40'
            }`}
        >
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Badges Header */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {isReward ? (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Hanya Untuk Anda</span>
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] font-medium py-0.5 px-1.5 text-muted-foreground border-border/70">
                                Voucher Promo
                            </Badge>
                        )}

                        {voucher.applicable_type === 'specific' ? (
                            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-[10px] font-medium py-0.5 px-1.5 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                <span>Produk Tertentu</span>
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] font-normal py-0.5 px-1.5 text-muted-foreground border-border/70">
                                Semua Produk
                            </Badge>
                        )}

                        <span className="text-[11px] font-mono font-bold tracking-wider text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/60">
                            {voucher.code}
                        </span>
                    </div>

                    {/* Voucher Title / Name */}
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                            {voucher.name}
                        </h4>
                        {voucher.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                {voucher.description}
                            </p>
                        )}
                    </div>

                    {/* Applicable Products Note if specific */}
                    {voucher.applicable_type === 'specific' && voucher.applicable_product_names && voucher.applicable_product_names.length > 0 && (
                        <p className="text-[10.5px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <span className="font-semibold">Berlaku untuk:</span> {voucher.applicable_product_names.join(', ')}
                        </p>
                    )}

                    {/* Requirements & Expiration */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-0.5">
                        <span>
                            {voucher.min_order_amount > 0 ? (
                                <>Min. Belanja: <strong className="text-foreground">{voucher.min_order_amount_formatted}</strong></>
                            ) : (
                                <strong className="text-emerald-600 dark:text-emerald-400">Tanpa Min. Belanja</strong>
                            )}
                        </span>
                        {voucher.expires_at && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                s/d {voucher.expires_at}
                            </span>
                        )}
                    </div>

                    {/* Ineligibility notice if not eligible */}
                    {!isEligible && voucher.reason_ineligible && (
                        <p className="text-[10.5px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{voucher.reason_ineligible}</span>
                        </p>
                    )}
                </div>

                {/* Right Action Button */}
                <div className="sm:self-center shrink-0 flex items-center gap-2">
                    {isApplied ? (
                        <Button
                            size="sm"
                            disabled
                            className="h-8.5 px-3.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-none cursor-default opacity-90 flex items-center gap-1.5"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>Terpasang</span>
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            disabled={!isEligible}
                            onClick={onSelect}
                            className={`h-8.5 px-4 rounded-lg text-xs font-semibold shadow-none transition-colors cursor-pointer ${
                                isEligible
                                    ? 'bg-[#4A070B] hover:bg-[#380508] text-white'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted opacity-60'
                            }`}
                        >
                            Gunakan
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
