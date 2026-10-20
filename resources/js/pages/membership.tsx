import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Crown,
    Gift,
    History,
    Copy,
    Check,
    TrendingUp,
    TrendingDown,
    Sparkles,
    Coins,
    Loader2,
    Info,
    ChevronRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface MembershipData {
    id: number;
    membership_number: string;
    points: number;
    points_formatted: string;
    lifetime_points: number;
    lifetime_points_formatted: string;
    joined_at: string;
}

interface PointHistoryData {
    id: number;
    type: 'earned' | 'redeemed' | 'bonus' | string;
    category?: 'masuk' | 'berkurang';
    type_label?: string;
    points: number;
    points_formatted: string;
    balance_after: number;
    balance_after_formatted: string;
    description: string;
    reference_id?: string | null;
    created_at: string;
    is_positive: boolean;
}

interface RewardData {
    id: number;
    name: string;
    name_en?: string;
    description: string;
    description_en?: string;
    points_required: number;
    reward_type: string;
    reward_value: number;
    formatted_discount: string;
    min_order_formatted: string;
    can_redeem: boolean;
    shortage: number;
}

interface UserVoucherData {
    id: number;
    code: string;
    name: string;
    name_en?: string;
    description: string | null;
    description_en?: string | null;
    type: string;
    formatted_discount: string;
    min_order_amount_formatted: string;
    expires_at: string | null;
    is_valid: boolean;
    status_label: string;
}

interface MembershipPageProps {
    is_member: boolean;
    membership: MembershipData | null;
    histories: PointHistoryData[];
    total_points_in?: number;
    total_points_in_formatted?: string;
    total_points_out?: number;
    total_points_out_formatted?: string;
    rewards: RewardData[];
    user_vouchers: UserVoucherData[];
}

export default function MembershipPage({
    is_member,
    membership,
    histories = [],
    total_points_in_formatted = '0',
    total_points_out_formatted = '0',
    rewards = [],
    user_vouchers = [],
}: MembershipPageProps) {
    const { auth } = usePage<{ auth?: { user?: { id: number; name: string; email: string } } }>().props;
    const user = auth?.user;
    const { t, pickText, isEn } = useTranslation();

    const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'masuk' | 'berkurang'>('all');
    const [selectedReward, setSelectedReward] = useState<RewardData | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const displayName = user?.name
        ? user.name
            .trim()
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ')
        : (user?.email?.split('@')[0] || 'Member');

    const initial = displayName.charAt(0).toUpperCase();

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        if (window.showPromoToast) {
            window.showPromoToast(
                isEn
                    ? `Code "${code}" copied successfully!`
                    : `Kode "${code}" berhasil disalin!`
            );
        }
        setTimeout(() => setCopiedCode(null), 2500);
    };

    const handleJoin = () => {
        if (!user) {
            router.get('/login', {
                notice: isEn
                    ? 'Please log in first to activate your Royale Points.'
                    : 'Silakan masuk terlebih dahulu untuk mengaktifkan Royale Points Anda.',
            });
            return;
        }

        setIsJoining(true);
        router.post(
            '/membership/join',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsJoining(false),
            }
        );
    };

    const handleConfirmRedeem = () => {
        if (!selectedReward) return;

        setIsRedeeming(true);
        router.post(
            `/membership/redeem/${selectedReward.id}`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setSelectedReward(null),
                onFinish: () => setIsRedeeming(false),
            }
        );
    };

    const filteredHistories = histories.filter((item) => {
        if (historyFilter === 'masuk') return item.points > 0;
        if (historyFilter === 'berkurang') return item.points < 0;
        return true;
    });

    return (
        <Layout showFooter={false}>
            <Head title={`Royale Points & Rewards • Aroma Palace`} />

            <div className="min-h-screen bg-[#F8F9FA] dark:bg-background">
                {/* CONSISTENT CONTAINER MATCHING ACCOUNT PAGE */}
                <div className="max-w-xl mx-auto px-4 pt-4 sm:pt-6 pb-20">

                    {/* NON-MEMBER PROMO CARD */}
                    {!is_member ? (
                        <div className="rounded-2xl border border-[#F3E7C4] dark:border-amber-800/30 bg-[#FDF8EE] dark:bg-amber-950/25 p-5 mb-3.5 shadow-2xs space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-[#E5A844]/20 text-[#4A070B] dark:text-[#E8D0BA] flex items-center justify-center shrink-0">
                                    <Crown className="w-5 h-5 text-[#E5A844]" />
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-amber-900 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/40 px-2 py-0.5 rounded-full mb-1">
                                        <Sparkles className="w-3 h-3 text-[#E5A844]" />
                                        <span>{isEn ? 'Welcome Bonus 100 Points' : 'Bonus Selamat Datang 100 Poin'}</span>
                                    </div>
                                    <h2 className="text-sm sm:text-base font-bold text-foreground">
                                        {isEn ? 'Activate Royale Points (Free)' : 'Aktifkan Royale Points (Gratis)'}
                                    </h2>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {isEn
                                    ? 'Earn 1 point for every Rp 10,000 spent on Aroma Palace luxury fragrances, then redeem your points for discount vouchers.'
                                    : 'Dapatkan 1 poin untuk setiap pembelanjaan Rp 10.000 wewangian mewah Aroma Palace, lalu tukarkan poin Anda dengan voucher diskon belanja.'}
                            </p>

                            <Button
                                size="lg"
                                onClick={handleJoin}
                                disabled={isJoining}
                                className="w-full bg-[#4A070B] hover:bg-[#360407] text-white font-bold text-xs sm:text-sm h-10 rounded-xl shadow-xs cursor-pointer"
                            >
                                {isJoining ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Crown className="w-4 h-4 mr-2 text-[#E5A844]" />
                                )}
                                {isEn ? 'Join Now (Free)' : 'Gabung Sekarang (Gratis)'}
                            </Button>
                        </div>
                    ) : (
                        /* MEMBER STATUS & POINTS SUMMARY CARD (MATCHES ACCOUNT.TSX LOOK & FEEL) */
                        <div className="rounded-2xl bg-card border border-border/80 shadow-xs p-4 sm:p-5 mb-3.5 space-y-4">
                            {/* Profile Row: Avatar, Name, Member ID */}
                            <div className="flex items-center gap-3.5 pb-3 border-b border-border/60">
                                <div className="relative shrink-0">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E5A844] via-[#F3CE7A] to-[#8C1D24] p-0.5 shadow-xs">
                                        <div className="w-full h-full rounded-full bg-[#4A070B] flex items-center justify-center text-white text-xl font-serif font-bold uppercase select-none">
                                            {initial}
                                        </div>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-foreground truncate">{displayName}</h2>
                                        <Badge variant="outline" className="text-[10px] font-semibold border-[#E5A844]/60 text-[#4A070B] dark:text-[#E8D0BA] bg-[#FDF8EE] dark:bg-amber-950/30">
                                            Member
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                        <span>{isEn ? 'Member ID:' : 'No. Member:'} <strong className="font-mono text-foreground font-semibold">{membership?.membership_number}</strong></span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(membership?.membership_number || '')}
                                            className="text-muted-foreground hover:text-foreground transition p-0.5 cursor-pointer"
                                            title={isEn ? 'Copy Member ID' : 'Salin No. Member'}
                                        >
                                            {copiedCode === membership?.membership_number ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Saldo Poin Display (Styled like the warm pill on account.tsx) */}
                            <div className="rounded-xl sm:rounded-2xl bg-[#FDF8EE] dark:bg-amber-950/25 border border-[#F3E7C4] dark:border-amber-800/30 p-4 text-center">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                    {isEn ? 'Your Points Balance' : 'Saldo Poin Anda'}
                                </span>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <Crown className="w-6 h-6 text-[#E5A844]" />
                                    <span className="text-3xl sm:text-4xl font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                        {membership?.points_formatted}
                                    </span>
                                    <span className="text-sm font-bold text-foreground/80">{isEn ? 'Points' : 'Poin'}</span>
                                </div>
                            </div>

                            {/* Poin Masuk & Poin Berkurang Quick Stats */}
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                                    <span className="text-[11px] text-muted-foreground font-medium block">{isEn ? 'Points Earned' : 'Poin Masuk'}</span>
                                    <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                        +{total_points_in_formatted}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                                    <span className="text-[11px] text-muted-foreground font-medium block">{isEn ? 'Points Redeemed' : 'Poin Berkurang'}</span>
                                    <span className="text-sm sm:text-base font-extrabold text-red-600 dark:text-red-400">
                                        -{total_points_out_formatted}
                                    </span>
                                </div>
                            </div>

                            {/* Point Earning Rule Notice */}
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-2 leading-relaxed">
                                <Info className="w-4 h-4 text-[#E5A844] shrink-0" />
                                <span>
                                    {isEn ? (
                                        <>Every <strong>Rp 10,000</strong> spent earns <strong>1 Point</strong>. Points can be directly redeemed for discount vouchers below.</>
                                    ) : (
                                        <>Tiap belanja <strong>Rp 10.000</strong> mendapat <strong>1 Poin</strong>. Poin dapat langsung ditukar dengan voucher belanja di bawah.</>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* SEGMENTED TAB SWITCHER (CONSISTENT WITH APP FEEL) */}
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/70 border border-border/60 mb-3.5 gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('rewards')}
                            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'rewards'
                                    ? 'bg-card text-foreground shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Gift className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Redeem Vouchers' : 'Tukar Voucher'}</span>
                            <span className="text-[10px] px-1.5 py-0 rounded-full bg-muted font-normal">{rewards.length}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            disabled={!is_member}
                            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'history'
                                    ? 'bg-card text-foreground shadow-2xs'
                                    : !is_member
                                        ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <History className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Points History' : 'Riwayat Poin'}</span>
                            {histories.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0 rounded-full bg-muted font-normal">{histories.length}</span>
                            )}
                        </button>
                    </div>

                    {/* TAB CONTENT 1: REWARDS CATALOG */}
                    {activeTab === 'rewards' && (
                        <div className="space-y-3.5">
                            {/* Active Vouchers Claimed by User */}
                            {user_vouchers.length > 0 && (
                                <div className="rounded-2xl border border-amber-300/60 dark:border-amber-800/40 bg-[#FDF8EE] dark:bg-amber-950/20 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-amber-600" />
                                            <h3 className="text-xs sm:text-sm font-bold text-foreground">
                                                {isEn ? 'Your Active Vouchers' : 'Voucher Aktif Anda'} ({user_vouchers.length})
                                            </h3>
                                        </div>
                                        <Link href="/products" className="text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] hover:underline flex items-center gap-0.5">
                                            <span>{isEn ? 'Shop' : 'Belanja'}</span>
                                            <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>

                                    <div className="space-y-2">
                                        {user_vouchers.map((v) => (
                                            <div
                                                key={v.id}
                                                className="p-3 rounded-xl border border-border/80 bg-card text-card-foreground shadow-2xs flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Badge className="text-[10px] px-2 py-0 bg-[#4A070B] text-white font-bold">
                                                            {v.formatted_discount}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground truncate">
                                                            {isEn ? 'until' : 's/d'} {v.expires_at || (isEn ? 'Lifetime' : 'Selamanya')}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs font-bold text-foreground truncate">{pickText(v.name, v.name_en)}</h4>
                                                    <p className="text-[11px] text-muted-foreground truncate">{v.min_order_amount_formatted}</p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <div className="font-mono text-xs font-bold text-foreground mb-1">{v.code}</div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleCopy(v.code)}
                                                        className="h-7 text-xs px-2.5 cursor-pointer"
                                                    >
                                                        {copiedCode === v.code ? (
                                                            <>
                                                                <Check className="w-3 h-3 mr-1 text-emerald-500" />
                                                                {isEn ? 'Copied' : 'Tersalin'}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3 h-3 mr-1" />
                                                                {isEn ? 'Copy' : 'Salin'}
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available Catalog Rewards */}
                            <div className="space-y-2.5">
                                <div className="px-1 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{isEn ? 'Select rewards to redeem:' : 'Pilih reward untuk ditukarkan:'}</span>
                                    {is_member && <span>{isEn ? 'Balance:' : 'Saldo:'} <strong className="text-foreground">{membership?.points_formatted} {isEn ? 'Points' : 'Poin'}</strong></span>}
                                </div>

                                {rewards.map((reward) => (
                                    <div
                                        key={reward.id}
                                        className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs flex flex-col justify-between space-y-3"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge className="bg-[#4A070B] text-white text-[11px] font-bold px-2 py-0.5">
                                                    {reward.formatted_discount}
                                                </Badge>
                                                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                                    <Coins className="w-3.5 h-3.5" />
                                                    <span>{reward.points_required} {isEn ? 'Points' : 'Poin'}</span>
                                                </div>
                                            </div>

                                            <h4 className="text-xs sm:text-sm font-bold text-foreground pt-0.5">{pickText(reward.name, reward.name_en)}</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{pickText(reward.description, reward.description_en)}</p>
                                            <p className="text-[11px] text-muted-foreground font-medium">{reward.min_order_formatted}</p>
                                        </div>

                                        <div className="pt-2.5 border-t border-border/60">
                                            {!is_member ? (
                                                <Button
                                                    onClick={handleJoin}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs font-semibold h-8 cursor-pointer rounded-xl"
                                                >
                                                    {isEn ? 'Activate to Redeem' : 'Aktifkan untuk Menukar'}
                                                </Button>
                                            ) : reward.can_redeem ? (
                                                <Button
                                                    onClick={() => setSelectedReward(reward)}
                                                    size="sm"
                                                    className="w-full bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-semibold h-8 cursor-pointer shadow-none rounded-xl"
                                                >
                                                    <Gift className="w-3.5 h-3.5 mr-1" />
                                                    {isEn ? `Redeem (${reward.points_required} Points)` : `Tukar (${reward.points_required} Poin)`}
                                                </Button>
                                            ) : (
                                                <Button
                                                    disabled
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full text-xs font-medium h-8 opacity-60 rounded-xl"
                                                >
                                                    {isEn ? `Need ${reward.shortage} More Points` : `Kurang ${reward.shortage} Poin`}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT 2: POINT HISTORIES */}
                    {activeTab === 'history' && is_member && (
                        <div className="space-y-3">
                            {/* Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                <Button
                                    variant={historyFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setHistoryFilter('all')}
                                    className={`text-xs h-7 px-3 rounded-full cursor-pointer ${historyFilter === 'all' ? 'bg-[#4A070B] text-white' : ''
                                        }`}
                                >
                                    {isEn ? `All (${histories.length})` : `Semua (${histories.length})`}
                                </Button>
                                <Button
                                    variant={historyFilter === 'masuk' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setHistoryFilter('masuk')}
                                    className={`text-xs h-7 px-3 rounded-full cursor-pointer ${historyFilter === 'masuk' ? 'bg-emerald-700 text-white' : ''
                                        }`}
                                >
                                    {isEn ? 'Points In (+)' : 'Poin Masuk (+)'}
                                </Button>
                                <Button
                                    variant={historyFilter === 'berkurang' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setHistoryFilter('berkurang')}
                                    className={`text-xs h-7 px-3 rounded-full cursor-pointer ${historyFilter === 'berkurang' ? 'bg-red-700 text-white' : ''
                                        }`}
                                >
                                    {isEn ? 'Points Out (-)' : 'Poin Berkurang (-)'}
                                </Button>
                            </div>

                            {/* Ledger List Card */}
                            {filteredHistories.length === 0 ? (
                                <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-2">
                                    <History className="w-8 h-8 mx-auto text-muted-foreground/40" />
                                    <div className="text-xs font-semibold text-foreground">{isEn ? 'No Points History' : 'Tidak Ada Riwayat Poin'}</div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {isEn ? 'No points activity recorded in this category.' : 'Belum ada transaksi poin pada kategori ini.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60 shadow-2xs">
                                    {filteredHistories.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.is_positive
                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                            : 'bg-red-500/10 text-red-600'
                                                        }`}
                                                >
                                                    {item.is_positive ? (
                                                        <TrendingUp className="w-4 h-4" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="text-xs font-semibold text-foreground truncate">
                                                        {item.description}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                                        <span>{item.created_at}</span>
                                                        {item.reference_id && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="font-mono">{item.reference_id}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div
                                                    className={`text-xs sm:text-sm font-extrabold ${item.is_positive
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                        }`}
                                                >
                                                    {item.points_formatted} {isEn ? 'Points' : 'Poin'}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {isEn ? 'Balance:' : 'Saldo:'} {item.balance_after_formatted}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* CONFIRMATION DIALOG FOR REWARD REDEMPTION */}
            <Dialog open={Boolean(selectedReward)} onOpenChange={(open) => !open && setSelectedReward(null)}>
                {selectedReward && (
                    <DialogContent className="w-[calc(100vw-32px)] max-w-md p-5 rounded-2xl">
                        <DialogHeader className="text-left space-y-2">
                            <Badge className="w-fit bg-[#4A070B] text-white text-xs">
                                {selectedReward.formatted_discount}
                            </Badge>
                            <DialogTitle className="text-base font-bold">
                                {isEn ? 'Confirm Points Redemption' : 'Konfirmasi Penukaran Poin'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {isEn ? (
                                    <>
                                        You are about to redeem <strong>{selectedReward.points_required} Points</strong> for the voucher <strong>{pickText(selectedReward.name, selectedReward.name_en)}</strong>. Your points balance will be deducted and your voucher will become immediately active.
                                    </>
                                ) : (
                                    <>
                                        Anda akan menukarkan <strong>{selectedReward.points_required} Poin</strong> untuk voucher <strong>{selectedReward.name}</strong>. Saldo poin Anda akan berkurang dan kode voucher langsung aktif.
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReward(null)}
                                className="cursor-pointer rounded-xl text-xs"
                            >
                                {isEn ? 'Cancel' : 'Batal'}
                            </Button>
                            <Button
                                size="sm"
                                disabled={isRedeeming}
                                onClick={handleConfirmRedeem}
                                className="bg-[#4A070B] hover:bg-[#360407] text-white cursor-pointer rounded-xl text-xs"
                            >
                                {isRedeeming ? (isEn ? 'Processing...' : 'Memproses...') : (isEn ? 'Redeem Now' : 'Tukarkan Sekarang')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </Layout>
    );
}
