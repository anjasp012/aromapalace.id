import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface VoucherItem {
    code: string;
    badge: string;
    expiry: string;
    title: string;
    desc: string;
    minSpend: string;
    maxDiscount?: string;
    terms: string[];
}

interface VoucherCardProps {
    voucher: VoucherItem;
    isCopied?: boolean;
    onCopy?: (code: string) => void;
    onSelect?: (voucher: VoucherItem) => void;
    className?: string;
}

export default function VoucherCard({
    voucher,
    isCopied = false,
    onCopy,
    onSelect,
    className,
}: VoucherCardProps) {
    return (
        <Card className={cn('flex flex-col justify-between shadow-none rounded-lg py-0 gap-0', className)}>
            <CardHeader className="p-3.5 sm:p-5 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between gap-1">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5 whitespace-nowrap font-medium">
                        {voucher.badge}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">s/d {voucher.expiry}</span>
                </div>
                <CardTitle
                    onClick={() => onSelect?.(voucher)}
                    className={cn(
                        'text-xs sm:text-base font-bold line-clamp-1 sm:line-clamp-none',
                        onSelect ? 'cursor-pointer hover:text-primary transition-colors' : ''
                    )}
                >
                    {voucher.title}
                </CardTitle>
                <CardDescription className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {voucher.desc}
                </CardDescription>
            </CardHeader>

            <CardFooter className="flex flex-row items-center justify-between border-t p-3 sm:px-5 sm:!py-3 mt-auto gap-2">
                <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-muted-foreground block leading-tight">
                        Kode Promo
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
                        {isCopied ? 'Tersalin' : 'Salin Kode'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
