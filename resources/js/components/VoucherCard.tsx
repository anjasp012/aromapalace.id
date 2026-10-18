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
            <CardHeader className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                    <Badge variant="secondary">{voucher.badge}</Badge>
                    <span className="text-xs text-muted-foreground">s/d {voucher.expiry}</span>
                </div>
                <CardTitle
                    onClick={() => onSelect?.(voucher)}
                    className={cn(
                        'text-base font-bold',
                        onSelect ? 'cursor-pointer' : ''
                    )}
                >
                    {voucher.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                    {voucher.desc}
                </CardDescription>
            </CardHeader>

            <CardFooter className="flex items-center justify-between border-t px-5 !py-3 mt-auto">
                <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Kode Promo
                    </span>
                    <span className="text-sm font-mono font-bold text-foreground">
                        {voucher.code}
                    </span>
                </div>
                {onCopy && (
                    <Button
                        size="sm"
                        variant={isCopied ? 'outline' : 'default'}
                        onClick={() => onCopy(voucher.code)}
                    >
                        {isCopied ? 'Tersalin' : 'Salin Kode'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
