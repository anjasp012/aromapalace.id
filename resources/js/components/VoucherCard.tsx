import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export interface VoucherItem {
    code: string;
    badge: string;
    badge_en?: string;
    expiry: string;
    expiry_en?: string;
    expires_at?: string | null;
    title: string;
    title_en?: string;
    desc: string;
    desc_en?: string;
    minSpend: string;
    minSpend_en?: string;
    maxDiscount?: string;
    maxDiscount_en?: string;
    terms: string[];
    terms_en?: string[];
}

interface VoucherCardProps {
    voucher: VoucherItem;
    isCopied?: boolean;
    onCopy?: (code: string) => void;
    onSelect?: (voucher: VoucherItem) => void;
    className?: string;
}

/**
 * Format a human-readable voucher badge with automatic bilingual fallback.
 */
export function formatVoucherBadge(badge: string, isEn: boolean, badgeEn?: string): string {
    if (isEn && badgeEn) return badgeEn;
    if (!badge) return '';
    if (!isEn) return badge;

    // Bilingual translations when badge_en is not provided
    if (/gratis\s+ongkir\s+100%/i.test(badge)) return '100% Free Shipping';
    if (/gratis\s+ongkir\s+s\/d\s+(Rp\s*[\d.,]+)/i.test(badge)) {
        return badge.replace(/gratis\s+ongkir\s+s\/d/i, 'Free Shipping up to');
    }
    if (/diskon\s+ongkir\s+(\d+%)\s*\(Maks\.\s*(Rp\s*[\d.,]+)\)/i.test(badge)) {
        return badge.replace(/diskon\s+ongkir\s+(\d+%)\s*\(Maks\.\s*(Rp\s*[\d.,]+)\)/i, '$1 Shipping Discount (Max. $2)');
    }
    if (/diskon\s+ongkir\s+(\d+%)/i.test(badge)) {
        return badge.replace(/diskon\s+ongkir\s+(\d+%)/i, '$1 Shipping Discount');
    }
    if (/potongan\s+ongkir\s+(Rp\s*[\d.,]+)/i.test(badge)) {
        return badge.replace(/potongan\s+ongkir/i, 'Shipping Discount');
    }
    if (/bebas\s+ongkir/i.test(badge)) return 'Free Shipping';
    if (/diskon\s+(\d+%)\s*\(Maks\.\s*(Rp\s*[\d.,]+)\)/i.test(badge)) {
        return badge.replace(/diskon\s+(\d+%)\s*\(Maks\.\s*(Rp\s*[\d.,]+)\)/i, '$1 Discount (Max. $2)');
    }
    if (/diskon\s+(\d+%)/i.test(badge)) {
        return badge.replace(/diskon\s+(\d+%)/i, '$1 Discount');
    }
    if (/potongan\s+(Rp\s*[\d.,]+)/i.test(badge)) {
        return badge.replace(/potongan\s+(Rp\s*[\d.,]+)/i, '$1 Off');
    }
    return badge;
}

/**
 * Format expiry date appropriately without mixing "until Berlaku Selamanya".
 */
export function formatVoucherExpiry(expiry: string, isEn: boolean, expiresAt?: string | null, expiryEn?: string): string {
    const raw = (expiry || '').trim();
    const isForever = !expiresAt && (!raw || /selamanya|forever|no expiry/i.test(raw));

    if (isForever) {
        return isEn ? 'Valid Forever' : 'Berlaku Selamanya';
    }

    if (expiresAt) {
        const d = new Date(expiresAt);
        if (!isNaN(d.getTime())) {
            const dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
            return isEn ? `until ${dateStr}` : `s/d ${dateStr}`;
        }
    }

    if (isEn && expiryEn) {
        return expiryEn.startsWith('until') ? expiryEn : `until ${expiryEn}`;
    }

    if (isEn) {
        const enDate = raw
            .replace(/\bMei\b/i, 'May')
            .replace(/\bAgu\b/i, 'Aug')
            .replace(/\bOkt\b/i, 'Oct')
            .replace(/\bDes\b/i, 'Dec');
        return `until ${enDate}`;
    }

    return `s/d ${raw}`;
}

export default function VoucherCard({
    voucher,
    isCopied = false,
    onCopy,
    onSelect,
    className,
}: VoucherCardProps) {
    const { pickText, isEn } = useTranslation();
    const displayTitle = pickText(voucher.title, voucher.title_en);
    const displayDesc = pickText(voucher.desc, voucher.desc_en);
    const displayBadge = formatVoucherBadge(voucher.badge, isEn, voucher.badge_en);
    const displayExpiry = formatVoucherExpiry(voucher.expiry, isEn, voucher.expires_at, voucher.expiry_en);

    return (
        <Card className={cn('flex flex-col justify-between shadow-none rounded-lg py-0 gap-0', className)}>
            <CardHeader className="p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between gap-1">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5 whitespace-nowrap font-medium">
                        {displayBadge}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                        {displayExpiry}
                    </span>
                </div>
                <CardTitle
                    onClick={() => onSelect?.(voucher)}
                    className={cn(
                        'text-xs sm:text-base font-bold line-clamp-1 sm:line-clamp-none',
                        onSelect ? 'cursor-pointer hover:text-primary transition-colors' : ''
                    )}
                >
                    {displayTitle}
                </CardTitle>
                <CardDescription className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {displayDesc}
                </CardDescription>
            </CardHeader>

            <CardFooter className="flex flex-row items-center justify-between border-t p-3 sm:px-5 sm:!py-3 mt-auto gap-2">
                <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-muted-foreground block leading-tight">
                        {isEn ? 'Promo Code' : 'Kode Promo'}
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-foreground tracking-wide truncate block">
                        {voucher.code}
                    </span>
                </div>
                {onCopy && (
                    <Button
                        size="sm"
                        variant={isCopied ? 'outline' : 'default'}
                        onClick={() => onCopy(voucher.code)}
                        className="h-7.5 text-[11px] sm:h-9 sm:text-xs px-2.5 sm:px-3 shrink-0 cursor-pointer"
                    >
                        {isCopied ? (isEn ? 'Copied' : 'Tersalin') : (isEn ? 'Copy Code' : 'Salin Kode')}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
