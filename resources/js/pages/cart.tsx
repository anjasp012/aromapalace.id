import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn, formatVolume } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Loader2, Ticket } from 'lucide-react';
import VoucherSelectorModal, { AvailableVoucher } from '@/components/VoucherSelectorModal';

interface FragranceProduct {
    id: number;
    name: string;
    slug: string;
    brand: string;
    family: string;
    category: string;
    volume: string | number;
    price: string;
    raw_price?: number;
    image: string;
}

interface CartItemData {
    id: number;
    product_id: number;
    variant_id?: number | null;
    quantity: number;
    volume: string | number;
    variant_name?: string | null;
    unit_price: number;
    unit_price_formatted: string;
    total_price: number;
    total_price_formatted: string;
    product: FragranceProduct;
}

interface CartPageProps {
    items: CartItemData[];
    subtotal: number;
    subtotal_formatted: string;
    shipping_fee?: number;
    shipping_fee_formatted?: string;
    total: number;
    total_formatted: string;
    initial_voucher?: string;
    available_vouchers?: AvailableVoucher[];
}

export default function CartPage({
    items,
    subtotal = 0,
    subtotal_formatted = 'Rp 0',
    total = 0,
    total_formatted = 'Rp 0',
    initial_voucher = '',
    available_vouchers = [],
}: Partial<CartPageProps>) {
    const { t, isEn } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    // Voucher code state
    const [voucherCode, setVoucherCode] = useState(() => {
        if (initial_voucher) return initial_voucher;
        if (typeof window !== 'undefined') {
            return localStorage.getItem('aromapalace_applied_voucher') || '';
        }
        return '';
    });
    const [voucherApplied, setVoucherApplied] = useState(false);
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
    const [showVoucherModal, setShowVoucherModal] = useState(false);

    // Auto apply saved voucher on initial load or prop change
    useEffect(() => {
        const codeToApply = (
            initial_voucher ||
            voucherCode ||
            (typeof window !== 'undefined' ? localStorage.getItem('aromapalace_applied_voucher') || '' : '')
        ).toUpperCase().trim();

        if (codeToApply && available_vouchers && available_vouchers.length > 0) {
            const found = available_vouchers.find((v) => v.code.toUpperCase() === codeToApply);
            if (found) {
                let applicableSubtotal = subtotal;
                if (found.applicable_type === 'specific' && found.applicable_product_ids && found.applicable_product_ids.length > 0) {
                    const matchingItems = (items || []).filter((it) => found.applicable_product_ids?.includes(it.product_id));
                    if (matchingItems.length === 0) return;
                    applicableSubtotal = matchingItems.reduce((acc, it) => acc + it.total_price, 0);
                }

                if (applicableSubtotal >= found.min_order_amount) {
                    let disc = 0;
                    if (found.type === 'fixed') {
                        disc = Math.min(applicableSubtotal, found.value);
                    } else {
                        disc = Math.round(applicableSubtotal * (found.value / 100));
                        if (found.max_discount_amount && found.max_discount_amount > 0) {
                            disc = Math.min(disc, found.max_discount_amount);
                        }
                    }
                    setVoucherCode(found.code);
                    setVoucherApplied(true);
                    setVoucherDiscount(disc);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('aromapalace_applied_voucher', found.code);
                    }
                }
            }
        }
    }, [initial_voucher, available_vouchers, subtotal, items]);

    const handleUpdateQuantity = (item: CartItemData, newQty: number) => {
        if (newQty < 1 || newQty > 20) return;
        setUpdatingId(item.id);
        router.patch(
            `/cart/${item.id}`,
            { quantity: newQty },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingId(null),
            }
        );
    };

    const handleRemove = (id: number) => {
        setRemovingId(id);
        router.delete(`/cart/${id}`, {
            preserveScroll: true,
            onFinish: () => setRemovingId(null),
        });
    };

    const handleClearCart = () => {
        const msg = isEn
            ? 'Are you sure you want to empty your entire shopping cart?'
            : 'Apakah Anda yakin ingin mengosongkan seluruh isi keranjang belanja?';
        if (!confirm(msg)) {
            return;
        }
        setIsClearing(true);
        router.delete('/cart', {
            preserveScroll: true,
            onFinish: () => setIsClearing(false),
        });
    };

    const [isNavigatingCheckout, setIsNavigatingCheckout] = useState(false);

    const handleApplyVoucher = (e?: React.FormEvent, explicitCode?: string) => {
        if (e) e.preventDefault();
        setVoucherError(null);
        setVoucherSuccess(null);

        const code = (explicitCode || voucherCode).trim().toUpperCase();
        if (!code) {
            setVoucherDiscount(0);
            setVoucherApplied(false);
            setVoucherError(isEn ? 'Please enter a voucher code.' : 'Silakan masukkan kode voucher.');
            return;
        }

        const vouchers = available_vouchers || [];
        const found = vouchers.find((v) => v.code.toUpperCase() === code);

        if (!found) {
            setVoucherApplied(false);
            setVoucherDiscount(0);
            const errMsg = isEn
                ? `Voucher "${code}" is invalid or expired.`
                : `Kode voucher "${code}" tidak valid atau telah kedaluwarsa.`;
            setVoucherError(errMsg);
            return;
        }

        let applicableSubtotal = subtotal;
        if (found.applicable_type === 'specific' && found.applicable_product_ids && found.applicable_product_ids.length > 0) {
            const matchingItems = (items || []).filter((it) => found.applicable_product_ids?.includes(it.product_id));
            if (matchingItems.length === 0) {
                setVoucherApplied(false);
                setVoucherDiscount(0);
                const errMsg = isEn
                    ? 'Voucher only applies to specific products that are not currently in your cart.'
                    : `Voucher "${found.code}" hanya berlaku untuk produk tertentu yang belum ada di keranjang.`;
                setVoucherError(errMsg);
                return;
            }
            applicableSubtotal = matchingItems.reduce((acc, it) => acc + it.total_price, 0);
        }

        if (applicableSubtotal < found.min_order_amount) {
            setVoucherApplied(false);
            setVoucherDiscount(0);
            const errMsg = isEn
                ? `Minimum spend for voucher ${found.code} is ${found.min_order_amount_formatted}.`
                : `Minimal belanja untuk voucher ${found.code} adalah ${found.min_order_amount_formatted}.`;
            setVoucherError(errMsg);
            return;
        }

        // Calculate discount amount immediately
        let disc = 0;
        if (found.type === 'fixed') {
            disc = Math.min(applicableSubtotal, found.value);
        } else {
            disc = Math.round(applicableSubtotal * (found.value / 100));
            if (found.max_discount_amount && found.max_discount_amount > 0) {
                disc = Math.min(disc, found.max_discount_amount);
            }
        }

        setVoucherCode(found.code);
        setVoucherApplied(true);
        setVoucherDiscount(disc);
        if (typeof window !== 'undefined') {
            localStorage.setItem('aromapalace_applied_voucher', found.code);
        }

        // Also sync to backend session asynchronously
        router.post('/cart/voucher', { code: found.code }, {
            preserveScroll: true,
            preserveState: true,
            only: ['initial_voucher'],
        });

        const successMsg = isEn
            ? `Voucher ${found.code} applied! You save Rp ${disc.toLocaleString('id-ID')}.`
            : `Voucher ${found.code} berhasil dipasang! Anda hemat Rp ${disc.toLocaleString('id-ID')}.`;
        setVoucherSuccess(successMsg);
    };

    const handleRemoveVoucher = () => {
        setVoucherApplied(false);
        setVoucherDiscount(0);
        setVoucherCode('');
        setVoucherError(null);
        setVoucherSuccess(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('aromapalace_applied_voucher');
        }
        router.delete('/cart/voucher', {
            preserveScroll: true,
            preserveState: true,
            only: ['initial_voucher'],
        });
    };

    const handleProceedToCheckout = () => {
        setIsNavigatingCheckout(true);
        const code = (
            (voucherApplied && voucherCode ? voucherCode : '') ||
            (typeof window !== 'undefined' ? localStorage.getItem('aromapalace_applied_voucher') || '' : '')
        ).trim().toUpperCase();

        if (code && typeof window !== 'undefined') {
            localStorage.setItem('aromapalace_applied_voucher', code);
        }
        const targetUrl = code
            ? `/checkout?voucher=${encodeURIComponent(code)}`
            : '/checkout';
        router.visit(targetUrl);
    };

    const finalTotal = Math.max(0, total - voucherDiscount);
    const finalTotalFormatted = 'Rp ' + finalTotal.toLocaleString('id-ID');
    const totalItemsCount = items?.length ?? 0;

    return (
        <Layout showBottomNav={!items || items.length === 0}>
            <Head title={isEn ? 'My Shopping Cart • Aroma Palace' : 'Keranjang Belanja Saya • Aroma Palace'} />

            {/* PAGE HEADER BANNER (Matches products.tsx style) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'My Shopping' : 'Keranjang'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Cart' : 'Belanja Saya'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isEn
                            ? 'Review your selected fragrances and sizes before proceeding to checkout with full shipping insurance.'
                            : 'Periksa racikan wewangian dan ukuran produk pilihan Anda sebelum melanjutkan ke proses checkout dengan perlindungan asuransi pengiriman penuh.'}
                    </p>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12", items && items.length > 0 && "pb-52 sm:pb-56 lg:pb-12")}>
                {!items ? (
                    /* SKELETON LOADING STATE FOR INSTANT VISITS */
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {[1, 2].map((n) => (
                            <div key={n} className="rounded-xl border border-border/80 bg-card p-4 flex gap-4 items-center animate-pulse">
                                <div className="h-20 w-20 bg-muted/80 rounded-lg shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-40 bg-muted/80 rounded" />
                                    <div className="h-3 w-20 bg-muted/80 rounded" />
                                    <div className="h-4 w-28 bg-muted/80 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    /* EMPTY STATE (Matches products.tsx empty state design) */
                    <div className="py-16 px-6 text-center space-y-4">
                        <h3 className="text-base font-bold text-foreground">
                            {isEn ? 'Your Shopping Bag is Empty' : 'Keranjang Belanja Anda Masih Kosong'}
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                            {isEn
                                ? 'No fragrances added yet. Discover signature perfumes to complete your collection.'
                                : 'Belum ada wewangian yang ditambahkan ke keranjang. Temukan aroma berkarakter kuat dari Dubai untuk melengkapi koleksi Anda.'}
                        </p>
                        <div className="pt-2">
                            <Link href="/products">
                                <Button
                                    size="sm"
                                    className="bg-[#4A070B] hover:bg-[#360407] text-white rounded-md px-6 h-10 text-xs font-semibold cursor-pointer shadow-none"
                                >
                                    {isEn ? 'Start Shopping' : 'Mulai Berbelanja'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* TWO COLUMN LAYOUT */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: ITEMS LIST */}
                        <div className="lg:col-span-8 space-y-4">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between pb-3 border-b border-border/80">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {isEn ? (
                                            <>Total <strong className="text-foreground font-bold">{totalItemsCount}</strong> items in cart</>
                                        ) : (
                                            <>Total <strong className="text-foreground font-bold">{totalItemsCount}</strong> produk dalam keranjang</>
                                        )}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isClearing}
                                    onClick={handleClearCart}
                                    className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer flex items-center gap-1.5"
                                >
                                    {isClearing && <Loader2 className="w-3 h-3 animate-spin text-destructive" />}
                                    <span>{isClearing ? (isEn ? 'Clearing...' : 'Mengosongkan...') : (isEn ? 'Clear Cart' : 'Kosongkan Keranjang')}</span>
                                </Button>
                            </div>

                            {/* Item Cards */}
                            <div className="space-y-3">
                                {items.map((item) => {
                                    const { product } = item;
                                    const isItemUpdating = updatingId === item.id;
                                    const isItemRemoving = removingId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-none hover:border-border transition-colors"
                                        >
                                            {/* Thumbnail & Product Info */}
                                            <div className="flex items-center gap-4">
                                                <Link
                                                    href={`/products/${product.slug}`}
                                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-md border border-border/80 bg-muted/30 overflow-hidden shrink-0 group block"
                                                >
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                </Link>

                                                <div className="space-y-1.5">
                                                    <Link
                                                        href={`/products/${product.slug}`}
                                                        className="block font-semibold text-xs sm:text-sm text-foreground hover:text-[#4A070B] transition-colors line-clamp-1"
                                                    >
                                                        {product.name}
                                                    </Link>

                                                    <div className="flex flex-col flex-wrap gap-2 text-xs text-muted-foreground pt-0.5">
                                                        <span className="inline-flex items-center gap-1 text-[11px] bg-muted/40 border border-border/70 px-2 py-0.5 rounded-md">
                                                            <span>{isEn ? 'Size:' : 'Ukuran:'}</span>
                                                            <strong className="text-foreground">{formatVolume(item.volume)}</strong>
                                                        </span>
                                                        <span className="text-[11px]">
                                                            {isEn ? 'Unit Price:' : 'Harga Satuan:'} <strong className="text-[#4A070B] dark:text-[#E8D0BA]">{item.unit_price_formatted}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stepper, Subtotal, and Delete Action */}
                                            <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
                                                {/* Stepper (Matches product-detail.tsx stepper style) */}
                                                <div className="flex items-center border border-border/80 rounded-md bg-background px-1 h-9 shrink-0 shadow-none">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={item.quantity <= 1 || isItemUpdating}
                                                        onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                                        className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground text-xs"
                                                        aria-label={isEn ? 'Decrease quantity' : 'Kurangi jumlah'}
                                                    >
                                                        &minus;
                                                    </Button>
                                                    <span className="w-8 text-center font-bold text-xs text-foreground">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={item.quantity >= 20 || isItemUpdating}
                                                        onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                                                        className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground text-xs"
                                                        aria-label={isEn ? 'Increase quantity' : 'Tambah jumlah'}
                                                    >
                                                        &#43;
                                                    </Button>
                                                </div>

                                                {/* Item Total */}
                                                <div className="text-right min-w-[90px]">
                                                    <div className="font-extrabold text-xs sm:text-sm text-[#4A070B] dark:text-[#E8D0BA]">
                                                        {item.total_price_formatted}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        Subtotal
                                                    </div>
                                                </div>

                                                {/* Trash Button */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isItemRemoving}
                                                    onClick={() => handleRemove(item.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                                                    title={isEn ? 'Remove from bag' : 'Hapus dari keranjang'}
                                                >
                                                    {isItemRemoving ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                                                    ) : (
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="1.8"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Continue Shopping Link */}
                            <div className="pt-4 pb-8">
                                <Link
                                    href="/products"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] hover:text-[#360407] hover:underline transition-colors"
                                >
                                    <span>←</span> {isEn ? 'Continue Shopping' : 'Lanjut Pilih Wewangian Lain'}
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ORDER SUMMARY (DESKTOP ONLY - lg:block) */}
                        <div className="hidden lg:block lg:col-span-4">
                            <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none sticky top-28 space-y-4">
                                <h2 className="font-bold text-base text-foreground tracking-tight pb-3 border-b border-border/80">
                                    {isEn ? 'Order Summary' : 'Ringkasan Pesanan'}
                                </h2>

                                {/* Line items */}
                                <div className="space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>{isEn ? 'Product Subtotal' : 'Subtotal Produk'}</span>
                                        <span className="font-bold text-foreground">{subtotal_formatted}</span>
                                    </div>

                                    {voucherApplied && voucherDiscount > 0 && (
                                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-md text-xs">
                                            <div className="flex items-center gap-2">
                                                <span>{isEn ? 'Discount' : 'Diskon'} ({voucherCode.toUpperCase()})</span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveVoucher}
                                                    className="text-[11px] text-destructive hover:underline cursor-pointer font-medium"
                                                    title={isEn ? 'Remove voucher' : 'Hapus voucher'}
                                                >
                                                    {isEn ? '(Remove)' : '(Hapus)'}
                                                </button>
                                            </div>
                                            <span className="font-bold">- Rp {voucherDiscount.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Voucher input form (hanya muncul jika belum pasang voucher) */}
                                {(!voucherApplied || voucherDiscount <= 0) && (
                                    <div className="pt-3 border-t border-border/70 space-y-1.5">
                                        <div className="flex gap-2">
                                            <div
                                                onClick={() => setShowVoucherModal(true)}
                                                className="relative flex-1 cursor-pointer"
                                            >
                                                <Input
                                                    type="text"
                                                    placeholder={isEn ? 'Choose Promo / Reward Voucher' : 'Pilih Voucher Promo / Reward'}
                                                    value={voucherCode}
                                                    readOnly
                                                    className="h-9 pr-8 rounded-md border border-border/80 bg-background/80 text-xs uppercase tracking-wider focus:border-[#4A070B] focus:ring-1 focus:ring-[#4A070B]/25 shadow-none cursor-pointer"
                                                />
                                                <Ticket className="w-4 h-4 text-[#4A070B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => setShowVoucherModal(true)}
                                                variant="outline"
                                                className="h-9 px-3 rounded-md border border-[#4A070B] text-[#4A070B] hover:bg-[#4A070B] hover:text-white text-xs font-semibold shadow-none cursor-pointer shrink-0 transition-colors"
                                            >
                                                {isEn ? 'Choose Voucher' : 'Pilih Voucher'}
                                            </Button>
                                        </div>
                                        {voucherError && (
                                            <p className="text-[11px] text-destructive font-medium flex items-center gap-1 animate-in fade-in duration-150">
                                                <span>⚠</span> {voucherError}
                                            </p>
                                        )}
                                        {voucherSuccess && (
                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in duration-150">
                                                <span>✓</span> {voucherSuccess}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <Separator className="bg-border/80" />

                                {/* Total */}
                                <div className="flex items-baseline justify-between pt-1">
                                    <div>
                                        <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                            {isEn ? 'Total Payment' : 'Total Pembayaran'}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {isEn ? 'Shipping calculated at checkout' : 'Ongkos kirim dihitung saat checkout'}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                        {finalTotalFormatted}
                                    </div>
                                </div>

                                {/* Checkout Primary Button with Loading State */}
                                <Button
                                    size="lg"
                                    disabled={isNavigatingCheckout}
                                    onClick={handleProceedToCheckout}
                                    className="w-full bg-[#4A070B] hover:bg-[#360407] text-white font-semibold rounded-md h-11 text-xs sm:text-sm shadow-none transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-85"
                                >
                                    {isNavigatingCheckout ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-[#E5A844]" />
                                    ) : (
                                        <svg
                                            className="w-4 h-4 text-[#E5A844]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    )}
                                    <span>
                                        {isNavigatingCheckout
                                            ? (isEn ? 'Preparing Checkout...' : 'Menyiapkan Checkout...')
                                            : (isEn ? 'Proceed to Checkout' : 'Lanjut ke Pembayaran')}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MOBILE FLOATING BOTTOM SUMMARY BAR (Voucher + Sticky Checkout, portaled to document.body) */}
                {items && items.length > 0 && (() => {
                    const mobileCartBar = (
                        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-[max(env(safe-area-inset-bottom),0px)]">
                            {/* Attached Voucher Bar */}
                            <div className="px-4 py-2 border-b border-border/60 bg-muted/20">
                                {voucherApplied && voucherDiscount > 0 ? (
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                                            <svg className="w-3.5 h-3.5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span className="truncate">
                                                Voucher <strong className="font-bold">{voucherCode.toUpperCase()}</strong>: -Rp {voucherDiscount.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveVoucher}
                                            className="text-[11px] text-destructive hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                                        >
                                            {isEn ? 'Remove' : 'Hapus'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <div
                                            onClick={() => setShowVoucherModal(true)}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <div className="relative flex-1">
                                                <Ticket className="w-3.5 h-3.5 text-[#E5A844] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <Input
                                                    type="text"
                                                    placeholder={isEn ? 'Choose Promo Voucher' : 'Pilih Voucher Promo / Reward'}
                                                    value={voucherCode}
                                                    readOnly
                                                    className="h-8.5 pl-8 pr-2.5 rounded-md border border-border/80 bg-background text-xs uppercase tracking-wider focus:border-[#4A070B] focus:ring-1 focus:ring-[#4A070B]/25 shadow-none cursor-pointer"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => setShowVoucherModal(true)}
                                                variant="outline"
                                                size="sm"
                                                className="h-8.5 px-3 rounded-md border border-[#4A070B] text-[#4A070B] hover:bg-[#4A070B] hover:text-white text-xs font-semibold shadow-none cursor-pointer shrink-0 transition-colors"
                                            >
                                                {isEn ? 'Choose' : 'Pilih'}
                                            </Button>
                                        </div>
                                        {voucherError && (
                                            <p className="text-[10.5px] text-destructive font-medium flex items-center gap-1">
                                                <span>⚠</span> {voucherError}
                                            </p>
                                        )}
                                        {voucherSuccess && (
                                            <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                <span>✓</span> {voucherSuccess}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Primary Bottom Bar */}
                            <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3">
                                {/* Summary info: Total Pembayaran */}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10.5px] font-medium text-muted-foreground truncate">
                                        {isEn ? `Total (${totalItemsCount} items)` : `Total (${totalItemsCount} produk)`}
                                    </span>
                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-lg font-black text-[#4A070B] dark:text-[#E8D0BA] tracking-tight">
                                            {finalTotalFormatted}
                                        </span>
                                    </div>
                                </div>

                                {/* Checkout Action Button */}
                                <Button
                                    size="default"
                                    disabled={isNavigatingCheckout}
                                    onClick={handleProceedToCheckout}
                                    className="h-10.5 px-5 sm:px-6 bg-[#4A070B] hover:bg-[#360407] text-white font-semibold rounded-md text-xs sm:text-sm shadow-none transition active:scale-[0.98] cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-80"
                                >
                                    {isNavigatingCheckout ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E5A844]" />
                                    ) : (
                                        <svg
                                            className="w-3.5 h-3.5 text-[#E5A844]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    )}
                                    <span>{isNavigatingCheckout ? (isEn ? 'Preparing Checkout...' : 'Menyiapkan Checkout...') : (isEn ? `Proceed (${totalItemsCount})` : `Lanjut ke Pembayaran (${totalItemsCount})`)}</span>
                                </Button>
                            </div>
                        </div>
                    );
                    return isMounted && typeof document !== 'undefined'
                        ? createPortal(mobileCartBar, document.body)
                        : mobileCartBar;
                })()}
            </div>

            {/* Voucher Selection Modal */}
            <VoucherSelectorModal
                open={showVoucherModal}
                onOpenChange={setShowVoucherModal}
                vouchers={available_vouchers}
                appliedVoucherCode={voucherApplied ? voucherCode : ''}
                onSelectVoucher={(code) => {
                    handleApplyVoucher(undefined, code);
                }}
                onApplyManualCode={(code) => {
                    handleApplyVoucher(undefined, code);
                }}
                subtotal={subtotal}
            />
        </Layout>
    );
}
