import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface FragranceProduct {
    id: number;
    name: string;
    slug: string;
    brand: string;
    family: string;
    category: string;
    volume: string;
    price: string;
    raw_price?: number;
    image: string;
}

interface CartItemData {
    id: number;
    product_id: number;
    variant_id?: number | null;
    quantity: number;
    volume: string;
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
    shipping_fee: number;
    shipping_fee_formatted: string;
    total: number;
    total_formatted: string;
}

export default function CartPage({
    items = [],
    subtotal = 0,
    subtotal_formatted = 'Rp 0',
    shipping_fee = 0,
    shipping_fee_formatted = 'Gratis',
    total = 0,
    total_formatted = 'Rp 0',
}: CartPageProps) {
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    // Voucher code state
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherApplied, setVoucherApplied] = useState(false);
    const [voucherDiscount, setVoucherDiscount] = useState(0);

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
        if (!confirm('Apakah Anda yakin ingin mengosongkan seluruh isi keranjang belanja?')) {
            return;
        }
        setIsClearing(true);
        router.delete('/cart', {
            preserveScroll: true,
            onFinish: () => setIsClearing(false),
        });
    };

    const handleApplyVoucher = (e: React.FormEvent) => {
        e.preventDefault();
        const code = voucherCode.trim().toUpperCase();
        if (code === 'AROMA40' || code === 'ROYALE10' || code === 'DUBAI25') {
            const discountPercent = code === 'AROMA40' ? 0.4 : code === 'DUBAI25' ? 0.25 : 0.1;
            const disc = Math.round(subtotal * discountPercent);
            setVoucherDiscount(disc);
            setVoucherApplied(true);
            window.showPromoToast?.(`Voucher ${code} berhasil dipasang! Potongan diskon Rp ${disc.toLocaleString('id-ID')}`);
        } else {
            alert('Kode voucher tidak valid. Coba gunakan: AROMA40, DUBAI25, atau ROYALE10');
        }
    };

    const finalTotal = Math.max(0, total - voucherDiscount);
    const finalTotalFormatted = 'Rp ' + finalTotal.toLocaleString('id-ID');
    const totalItemsCount = items.length;

    return (
        <Layout>
            <Head title="Keranjang Belanja Saya • Aroma Palace" />

            {/* PAGE HEADER BANNER (Matches products.tsx style) */}
            <div className="border-b border-border/70 bg-gradient-to-b from-muted/30 via-background to-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">Keranjang</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">Belanja Saya</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Periksa racikan wewangian dan ukuran produk pilihan Anda sebelum melanjutkan ke proses checkout dengan perlindungan asuransi pengiriman penuh.
                    </p>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {items.length === 0 ? (
                    /* EMPTY STATE (Matches products.tsx empty state design) */
                    <div className="py-16 px-6 text-center space-y-4">
                        <h3 className="text-base font-bold text-foreground">
                            Keranjang Belanja Anda Masih Kosong
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Belum ada wewangian yang ditambahkan ke keranjang. Temukan aroma berkarakter kuat dari Dubai untuk melengkapi koleksi Anda.
                        </p>
                        <div className="pt-2">
                            <Link href="/products">
                                <Button
                                    size="sm"
                                    className="bg-[#4A070B] hover:bg-[#360407] text-white rounded-md px-6 h-10 text-xs font-semibold cursor-pointer shadow-none"
                                >
                                    Mulai Berbelanja
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
                                        Total <strong className="text-foreground font-bold">{totalItemsCount}</strong> produk dalam keranjang
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isClearing}
                                    onClick={handleClearCart}
                                    className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
                                >
                                    {isClearing ? 'Mengosongkan...' : 'Kosongkan Keranjang'}
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
                                                            <span>Ukuran:</span>
                                                            <strong className="text-foreground">{item.volume}</strong>
                                                            {item.variant_name && (
                                                                <span className="text-[#4A070B] font-medium ml-0.5">
                                                                    ({item.variant_name})
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="text-[11px]">
                                                            Harga Satuan: <strong className="text-[#4A070B] dark:text-[#E8D0BA]">{item.unit_price_formatted}</strong>
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
                                                        aria-label="Kurangi jumlah"
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
                                                        aria-label="Tambah jumlah"
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
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer shrink-0"
                                                    title="Hapus dari keranjang"
                                                >
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
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Continue Shopping Link */}
                            <div className="pt-0">
                                <Link
                                    href="/products"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A070B] hover:text-[#360407]"
                                >
                                    <span>←</span> Lanjut Pilih Wewangian Lain
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ORDER SUMMARY (Matches product-detail.tsx purchase suite style) */}
                        <div className="lg:col-span-4">
                            <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none sticky top-28 space-y-4">
                                <h2 className="font-bold text-base text-foreground tracking-tight pb-3 border-b border-border/80">
                                    Ringkasan Pesanan
                                </h2>

                                {/* Line items */}
                                <div className="space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Subtotal Produk</span>
                                        <span className="font-bold text-foreground">{subtotal_formatted}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <span>Ongkos Kirim</span>
                                        </span>
                                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10.5px]">
                                            {shipping_fee_formatted} (Seluruh Indonesia)
                                        </span>
                                    </div>

                                    {voucherApplied && voucherDiscount > 0 && (
                                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-md text-xs">
                                            <div className="flex items-center gap-2">
                                                <span>Diskon ({voucherCode.toUpperCase()})</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVoucherApplied(false);
                                                        setVoucherDiscount(0);
                                                        setVoucherCode('');
                                                    }}
                                                    className="text-[11px] text-destructive hover:underline cursor-pointer font-medium"
                                                    title="Hapus voucher"
                                                >
                                                    (Hapus)
                                                </button>
                                            </div>
                                            <span className="font-bold">- Rp {voucherDiscount.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Voucher input form (hanya muncul jika belum pasang voucher) */}
                                {(!voucherApplied || voucherDiscount <= 0) && (
                                    <div className="pt-3 border-t border-border/70">
                                        <form onSubmit={handleApplyVoucher} className="flex gap-2">
                                            <Input
                                                type="text"
                                                placeholder="Kode Voucher Promo"
                                                value={voucherCode}
                                                onChange={(e) => setVoucherCode(e.target.value)}
                                                className="h-9 rounded-md border border-border/80 bg-background/80 text-xs uppercase tracking-wider focus:border-[#4A070B] focus:ring-1 focus:ring-[#4A070B]/25 shadow-none"
                                            />
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                className="h-9 px-3 rounded-md border border-[#4A070B] text-[#4A070B] hover:bg-[#4A070B] hover:text-white text-xs font-semibold shadow-none cursor-pointer shrink-0 transition-colors"
                                            >
                                                Terapkan
                                            </Button>
                                        </form>
                                    </div>
                                )}

                                <Separator className="bg-border/80" />

                                {/* Total */}
                                <div className="flex items-baseline justify-between pt-1">
                                    <div>
                                        <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                            Total Pembayaran
                                        </div>
                                        <div className="text-[10px] text-emerald-600 font-medium">
                                            Sudah termasuk PPN &amp; garansi aman
                                        </div>
                                    </div>
                                    <div className="text-2xl font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                        {finalTotalFormatted}
                                    </div>
                                </div>

                                {/* Checkout Primary Button (Matches product-detail.tsx primary button) */}
                                <Link
                                    href={voucherApplied && voucherCode ? `/checkout?voucher=${encodeURIComponent(voucherCode)}` : '/checkout'}
                                    className="block w-full"
                                >
                                    <Button
                                        size="lg"
                                        className="w-full bg-[#4A070B] hover:bg-[#360407] text-white font-semibold rounded-md h-11 text-xs sm:text-sm shadow-none transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                                    >
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
                                        <span>Lanjut ke Pembayaran</span>
                                    </Button>
                                </Link>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
