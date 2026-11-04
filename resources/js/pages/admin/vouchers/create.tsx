import React, { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Save,
    Ticket,
    Sparkles,
    Calendar,
    Percent,
    DollarSign,
    Truck,
    Coins,
    ShoppingBag,
    Tag,
    Dices,
    Search,
    CheckCircle2,
    Info,
    Check,
    X,
    Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AdminVoucherCreateProps {
    products?: { id: number; name: string }[];
    users?: { id: number; name: string; email: string }[];
}

export default function AdminVoucherCreate({ products = [], users = [] }: AdminVoucherCreateProps) {
    const { data, setData, post, processing, errors } = useForm<{
        code: string;
        name: string;
        name_en: string;
        description: string;
        description_en: string;
        type: 'percentage' | 'fixed';
        discount_target: 'subtotal' | 'shipping';
        value: number | string;
        min_order_amount: number | string;
        max_discount_amount: number | string;
        usage_limit: number | string;
        starts_at: string;
        expires_at: string;
        is_active: boolean;
        voucher_type: 'biasa' | 'ongkir' | 'reward';
        points_required: number | string;
        user_id: number | string;
        applicable_type: 'all' | 'specific';
        applicable_product_ids: number[];
    }>({
        code: '',
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        type: 'percentage',
        discount_target: 'subtotal',
        value: '20',
        min_order_amount: 0,
        max_discount_amount: '',
        usage_limit: '',
        starts_at: '',
        expires_at: '',
        is_active: true,
        voucher_type: 'biasa',
        points_required: 100,
        user_id: '',
        applicable_type: 'all',
        applicable_product_ids: [],
    });

    const [productSearch, setProductSearch] = useState('');

    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return products;
        const q = productSearch.toLowerCase();
        return products.filter((p) => p.name.toLowerCase().includes(q));
    }, [products, productSearch]);

    // Format currency helper
    const formatRp = (num: number | string) => {
        const val = Number(num) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    // Quick generator for voucher codes
    const generateRandomCode = () => {
        const prefix =
            data.voucher_type === 'ongkir'
                ? 'FREEONGKIR'
                : data.voucher_type === 'reward'
                ? 'ROYALE'
                : 'AROMA';
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        setData('code', `${prefix}-${randomStr}`);
    };

    // Fill recommended template texts
    const applyRecommendedTemplate = () => {
        if (data.voucher_type === 'ongkir') {
            const isFullFree = data.type === 'percentage' && Number(data.value) === 100;
            setData((prev) => ({
                ...prev,
                name: isFullFree ? 'Bebas Ongkir Seluruh Indonesia' : `Potongan Ongkir ${prev.type === 'percentage' ? `${prev.value}%` : formatRp(prev.value)}`,
                name_en: isFullFree ? 'Free Shipping Across Indonesia' : `Shipping Discount ${prev.type === 'percentage' ? `${prev.value}%` : formatRp(prev.value)}`,
                description: 'Gunakan voucher ini saat checkout untuk mendapatkan potongan ongkos kirim ke seluruh wilayah pengiriman.',
                description_en: 'Apply this voucher at checkout to receive shipping cost deduction to all coverage areas.',
            }));
        } else if (data.voucher_type === 'reward') {
            setData((prev) => ({
                ...prev,
                name: `Royale Club Reward: Diskon ${prev.type === 'percentage' ? `${prev.value}%` : formatRp(prev.value)}`,
                name_en: `Royale Club Reward: ${prev.type === 'percentage' ? `${prev.value}% Off` : `${formatRp(prev.value)} Off`}`,
                description: `Voucher apresiasi loyalitas khusus member Royale Club, ditukarkan dengan ${prev.points_required || 100} poin.`,
                description_en: `Exclusive loyalty appreciation voucher for Royale Club members, redeemed with ${prev.points_required || 100} points.`,
            }));
        } else {
            setData((prev) => ({
                ...prev,
                name: `Spesial Diskon Parfum ${prev.type === 'percentage' ? `${prev.value}%` : formatRp(prev.value)}`,
                name_en: `Special Fragrance Discount ${prev.type === 'percentage' ? `${prev.value}% Off` : formatRp(prev.value)}`,
                description: 'Potongan harga belanja wewangian mewah pilihan di butik resmi Aroma Palace.',
                description_en: 'Special price reduction for curated luxury fragrance collections at Aroma Palace.',
            }));
        }
    };

    const handleVoucherTypeChange = (val: 'biasa' | 'ongkir' | 'reward') => {
        setData((prev) => {
            const nextTarget = val === 'ongkir' ? 'shipping' : 'subtotal';
            let nextVal = prev.value;
            let nextType = prev.type;

            if (val === 'ongkir') {
                // Default to 100% Free Shipping for convenience
                nextType = 'percentage';
                nextVal = '100';
            } else if (val === 'biasa' && prev.voucher_type === 'ongkir' && nextVal === '100') {
                nextVal = '20';
            }

            return {
                ...prev,
                voucher_type: val,
                discount_target: nextTarget,
                type: nextType,
                value: nextVal,
                user_id: val === 'reward' ? prev.user_id : '',
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/manajemen-voucher');
    };

    return (
        <AdminLayout
            title="Tambah Voucher Promo Baru"
            subtitle="Buat kupon potongan belanja baru dengan panduan langkah yang jelas, rapi, dan mudah dikonfigurasi."
        >
            <Head title="Tambah Voucher - Admin Panel" />

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link href="/manajemen-voucher" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Voucher</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/manajemen-voucher">Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="cursor-pointer bg-[#4A070B] hover:bg-[#600A0F] text-white">
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Voucher'}</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: THE STEP-BY-STEP FORM (8 COLS) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* STEP 1: PILIH JENIS / TUJUAN VOUCHER */}
                        <Card className="border-border shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A070B] dark:text-[#E8D0BA]">
                                    <Tag className="size-4" />
                                    <span>Langkah 1: Jenis &amp; Sasaran Voucher</span>
                                </div>
                                <CardTitle className="text-base font-semibold">Tentukan Tujuan Kupon Promo</CardTitle>
                                <CardDescription className="text-xs">
                                    Pilih jenis voucher yang ingin dibuat. Setiap jenis memiliki sasaran potongan harga yang berbeda.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Option 1: Diskon Belanja Produk */}
                                    <div
                                        onClick={() => handleVoucherTypeChange('biasa')}
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                                            data.voucher_type === 'biasa'
                                                ? 'border-[#4A070B] bg-[#4A070B]/5 dark:border-amber-500/80 dark:bg-amber-500/10'
                                                : 'border-border bg-card hover:border-muted-foreground/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="size-8 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                                <ShoppingBag className="size-4" />
                                            </div>
                                            {data.voucher_type === 'biasa' && (
                                                <span className="size-5 rounded-full bg-[#4A070B] dark:bg-amber-500 text-white flex items-center justify-center text-[10px]">
                                                    <Check className="size-3" />
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-foreground">Diskon Produk</p>
                                            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                                Memotong subtotal harga produk parfum di keranjang.
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="w-fit text-[10px] px-2 py-0">
                                            Umum / Promo
                                        </Badge>
                                    </div>

                                    {/* Option 2: Potongan / Bebas Ongkir */}
                                    <div
                                        onClick={() => handleVoucherTypeChange('ongkir')}
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                                            data.voucher_type === 'ongkir'
                                                ? 'border-[#4A070B] bg-[#4A070B]/5 dark:border-amber-500/80 dark:bg-amber-500/10'
                                                : 'border-border bg-card hover:border-muted-foreground/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="size-8 rounded-lg flex items-center justify-center bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                                <Truck className="size-4" />
                                            </div>
                                            {data.voucher_type === 'ongkir' && (
                                                <span className="size-5 rounded-full bg-[#4A070B] dark:bg-amber-500 text-white flex items-center justify-center text-[10px]">
                                                    <Check className="size-3" />
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-foreground">Bebas / Diskon Ongkir</p>
                                            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                                Memotong ongkos kirim saat checkout (100% atau nominal).
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="w-fit text-[10px] px-2 py-0 border-sky-400 text-sky-600 dark:text-sky-400">
                                            Potong Ongkir
                                        </Badge>
                                    </div>

                                    {/* Option 3: Reward Royale Club */}
                                    <div
                                        onClick={() => handleVoucherTypeChange('reward')}
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                                            data.voucher_type === 'reward'
                                                ? 'border-[#4A070B] bg-[#4A070B]/5 dark:border-amber-500/80 dark:bg-amber-500/10'
                                                : 'border-border bg-card hover:border-muted-foreground/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="size-8 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                <Coins className="size-4" />
                                            </div>
                                            {data.voucher_type === 'reward' && (
                                                <span className="size-5 rounded-full bg-[#4A070B] dark:bg-amber-500 text-white flex items-center justify-center text-[10px]">
                                                    <Check className="size-3" />
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-foreground">Reward Royale Poin</p>
                                            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                                Ditukarkan oleh member menggunakan Royale Points.
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="w-fit text-[10px] px-2 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                            Tukar Poin
                                        </Badge>
                                    </div>
                                </div>

                                {/* Jika memilih tipe Reward, sediakan opsi target diskonnya */}
                                {data.voucher_type === 'reward' && (
                                    <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-foreground">
                                                Target Potongan untuk Voucher Reward Ini:
                                            </label>
                                            <Badge variant="outline" className="text-[10px]">Sasaran Diskon</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={`flex items-center gap-2 p-2.5 rounded-md border text-xs cursor-pointer ${
                                                data.discount_target === 'subtotal'
                                                    ? 'border-[#4A070B] bg-background font-bold text-foreground'
                                                    : 'border-border bg-card text-muted-foreground'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="discount_target"
                                                    checked={data.discount_target === 'subtotal'}
                                                    onChange={() => setData('discount_target', 'subtotal')}
                                                    className="size-3.5 text-[#4A070B]"
                                                />
                                                <span>Potong Subtotal Produk</span>
                                            </label>
                                            <label className={`flex items-center gap-2 p-2.5 rounded-md border text-xs cursor-pointer ${
                                                data.discount_target === 'shipping'
                                                    ? 'border-[#4A070B] bg-background font-bold text-foreground'
                                                    : 'border-border bg-card text-muted-foreground'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="discount_target"
                                                    checked={data.discount_target === 'shipping'}
                                                    onChange={() => setData('discount_target', 'shipping')}
                                                    className="size-3.5 text-[#4A070B]"
                                                />
                                                <span>Potong Ongkos Kirim</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* STEP 2: NILAI POTONGAN & SKEMA DISKON */}
                        <Card className="border-border shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A070B] dark:text-[#E8D0BA]">
                                    <DollarSign className="size-4" />
                                    <span>Langkah 2: Skema &amp; Nilai Diskon</span>
                                </div>
                                <CardTitle className="text-base font-semibold">Berapa Besar Potongan yang Diberikan?</CardTitle>
                                <CardDescription className="text-xs">
                                    Pilih bentuk diskon (persentase atau nominal rupiah) beserta batas maksimal potongannya.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Tipe Diskon */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Bentuk Potongan *</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'percentage')}
                                                className={`h-9 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    data.type === 'percentage'
                                                        ? 'border-[#4A070B] bg-[#4A070B] text-white dark:bg-amber-600'
                                                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                <Percent className="size-3.5" />
                                                <span>Persentase (%)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'fixed')}
                                                className={`h-9 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    data.type === 'fixed'
                                                        ? 'border-[#4A070B] bg-[#4A070B] text-white dark:bg-amber-600'
                                                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                <span>Rp Nominal Tetap</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Besar Nilai Potongan */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-foreground">
                                                {data.type === 'percentage' ? 'Besar Persen Diskon (%) *' : 'Nominal Potongan (Rp) *'}
                                            </label>
                                            {data.voucher_type === 'ongkir' && data.type === 'percentage' && Number(data.value) === 100 && (
                                                <Badge className="text-[10px] bg-emerald-600 text-white">Gratis Ongkir Penuh</Badge>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={data.type === 'percentage' ? 100 : undefined}
                                                placeholder={data.type === 'percentage' ? '20' : '50000'}
                                                value={data.value}
                                                onChange={(e) => setData('value', e.target.value)}
                                                className="h-9 text-xs pr-10 font-bold"
                                                required
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                                                {data.type === 'percentage' ? '%' : 'Rp'}
                                            </span>
                                        </div>
                                        {errors.value && <p className="text-destructive text-xs">{errors.value}</p>}
                                    </div>
                                </div>

                                {/* Quick Click Suggestions for Value */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[11px] text-muted-foreground mr-1">Pilihan Cepat:</span>
                                    {data.type === 'percentage' ? (
                                        <>
                                            {['10', '15', '20', '25', '50', '100'].map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setData('value', p)}
                                                    className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                                                        data.value === p
                                                            ? 'border-[#4A070B] bg-[#4A070B]/10 font-bold text-[#4A070B] dark:text-amber-300'
                                                            : 'border-border hover:bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {p === '100' ? '100% (Bebas Penuh)' : `${p}%`}
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {['10000', '20000', '25000', '50000', '100000'].map((amt) => (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    onClick={() => setData('value', amt)}
                                                    className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                                                        data.value === amt
                                                            ? 'border-[#4A070B] bg-[#4A070B]/10 font-bold text-[#4A070B] dark:text-amber-300'
                                                            : 'border-border hover:bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {formatRp(amt)}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>

                                {/* Batas Maksimal Diskon (Caps) */}
                                <div className="pt-2 border-t border-border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-semibold text-foreground">
                                                    Maksimal Potongan Diskon (Rp)
                                                </label>
                                                {data.type === 'fixed' && (
                                                    <span className="text-[10px] text-muted-foreground">(Tidak perlu untuk nominal tetap)</span>
                                                )}
                                            </div>
                                            <Input
                                                type="number"
                                                min={0}
                                                disabled={data.type === 'fixed'}
                                                placeholder={data.type === 'fixed' ? 'Otomatis sesuai nominal di atas' : 'Kosongkan jika tanpa batas (misal: 50000)'}
                                                value={data.type === 'fixed' ? '' : data.max_discount_amount}
                                                onChange={(e) => setData('max_discount_amount', e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                            <p className="text-[11px] text-muted-foreground leading-snug">
                                                {data.type === 'percentage'
                                                    ? 'Membatasi batas potongan maksimum pada diskon persen (misal: diskon 20% max Rp 50.000).'
                                                    : 'Pada diskon nominal tetap, potongan selalu bernilai pasti sesuai nominal di atas.'}
                                            </p>
                                            {errors.max_discount_amount && <p className="text-destructive text-xs">{errors.max_discount_amount}</p>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground">
                                                Minimal Belanja Pesanan (Rp) *
                                            </label>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="0 (tanpa minimum)"
                                                value={data.min_order_amount}
                                                onChange={(e) => setData('min_order_amount', e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                            <p className="text-[11px] text-muted-foreground leading-snug">
                                                Pesanan harus mencapai nilai subtotal ini sebelum voucher dapat diklaim. Isi 0 jika tanpa syarat minimal.
                                            </p>
                                            {errors.min_order_amount && <p className="text-destructive text-xs">{errors.min_order_amount}</p>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* STEP 3: KODE & INFORMASI VOUCHER (DWIBAHASA) */}
                        <Card className="border-border shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A070B] dark:text-[#E8D0BA]">
                                        <Ticket className="size-4" />
                                        <span>Langkah 3: Kode &amp; Konten Tampilan</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={applyRecommendedTemplate}
                                        className="h-7 text-[11px] text-[#4A070B] dark:text-amber-300 border-[#4A070B]/30 hover:bg-[#4A070B]/5 cursor-pointer"
                                    >
                                        <Sparkles className="size-3 mr-1" />
                                        <span>Gunakan Teks Rekomendasi</span>
                                    </Button>
                                </div>
                                <CardTitle className="text-base font-semibold">Kode Unik &amp; Keterangan Kupon</CardTitle>
                                <CardDescription className="text-xs">
                                    Tentukan kode yang akan diketik oleh pelanggan, serta nama promo dalam Bahasa Indonesia dan Bahasa Inggris.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Input Kode Voucher */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">Kode Voucher Kupon *</label>
                                        <button
                                            type="button"
                                            onClick={generateRandomCode}
                                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                                        >
                                            <Dices className="size-3" />
                                            <span>Acak Kode Otomatis</span>
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Contoh: AROMA20 atau FREESHIP"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            className="h-10 font-mono uppercase tracking-wider text-sm font-bold pl-3"
                                            required
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Huruf kapital otomatis. Kode ini dimasukkan pelanggan di kolom voucher pada halaman keranjang/checkout.
                                    </p>
                                    {errors.code && <p className="text-destructive text-xs">{errors.code}</p>}
                                </div>

                                {/* Tabs Nama & Deskripsi Dwibahasa */}
                                <div className="pt-2 border-t border-border">
                                    <Tabs defaultValue="id" className="w-full">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-semibold text-foreground">
                                                Nama Promo &amp; Deskripsi Syarat:
                                            </label>
                                            <TabsList className="h-8">
                                                <TabsTrigger value="id" className="text-xs px-2.5 py-1 flex items-center gap-1.5">
                                                    <span>🇮🇩</span>
                                                    <span>Indonesia</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="en" className="text-xs px-2.5 py-1 flex items-center gap-1.5">
                                                    <span>🇬🇧</span>
                                                    <span>English</span>
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        {/* Tab Indonesia */}
                                        <TabsContent value="id" className="space-y-3 mt-0">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-foreground">
                                                    Nama Judul Voucher (Indonesia) *
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="Contoh: Diskon Pelanggan Baru 20% Koleksi Eau de Parfum"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    className="h-9 text-xs"
                                                    required
                                                />
                                                {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-foreground">
                                                    Catatan / Syarat Singkat (Indonesia)
                                                </label>
                                                <Textarea
                                                    rows={2}
                                                    placeholder="Contoh: Berlaku untuk semua parfum tanpa minimal belanja..."
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    className="text-xs"
                                                />
                                                {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
                                            </div>
                                        </TabsContent>

                                        {/* Tab English */}
                                        <TabsContent value="en" className="space-y-3 mt-0">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-foreground">
                                                    Voucher Campaign Name (English)
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. New Patron Welcome 20% Off Fine Fragrance"
                                                    value={data.name_en}
                                                    onChange={(e) => setData('name_en', e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                                {errors.name_en && <p className="text-destructive text-xs">{errors.name_en}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-foreground">
                                                    Terms &amp; Summary (English)
                                                </label>
                                                <Textarea
                                                    rows={2}
                                                    placeholder="e.g. Valid for all fragrances with no minimum purchase required..."
                                                    value={data.description_en}
                                                    onChange={(e) => setData('description_en', e.target.value)}
                                                    className="text-xs"
                                                />
                                                {errors.description_en && <p className="text-destructive text-xs">{errors.description_en}</p>}
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </CardContent>
                        </Card>

                        {/* STEP 4: BATASAN PENGGUNAAN & JANGKAUAN PRODUK */}
                        <Card className="border-border shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A070B] dark:text-[#E8D0BA]">
                                    <ShoppingBag className="size-4" />
                                    <span>Langkah 4: Jangkauan Produk &amp; Batas Kuota</span>
                                </div>
                                <CardTitle className="text-base font-semibold">Siapa &amp; Produk Apa Saja yang Berhak?</CardTitle>
                                <CardDescription className="text-xs">
                                    Atur apakah kupon berlaku untuk seluruh katalog atau produk tertentu, serta batas total kuota pemakaian.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Batas Kuota Pemakaian</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            placeholder="Kosongkan jika tak terbatas (unlimited)"
                                            value={data.usage_limit}
                                            onChange={(e) => setData('usage_limit', e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            Berapa kali voucher ini bisa dipakai di toko secara keseluruhan.
                                        </p>
                                        {errors.usage_limit && <p className="text-destructive text-xs">{errors.usage_limit}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Jangkauan Produk Berlaku *</label>
                                        <Select
                                            value={data.applicable_type}
                                            onValueChange={(val: 'all' | 'specific') => setData('applicable_type', val)}
                                        >
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Produk (Katalog Keseluruhan)</SelectItem>
                                                <SelectItem value="specific">Hanya Produk Tertentu</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            Pilih apakah diskon berlaku universal atau dikhususkan untuk varian parfum tertentu.
                                        </p>
                                    </div>
                                </div>

                                {/* Checklist Produk Tertentu jika dipilih */}
                                {data.applicable_type === 'specific' && (
                                    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-bold text-foreground">
                                                    Pilih Produk yang Diikutsertakan ({data.applicable_product_ids.length} dipilih)
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Hanya produk yang dicentang yang akan memperoleh potongan harga kupon ini.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setData('applicable_product_ids', products.map((p) => p.id))}
                                                    className="text-[11px] text-[#4A070B] dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                                                >
                                                    Pilih Semua ({products.length})
                                                </button>
                                                <span className="text-muted-foreground text-xs">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('applicable_product_ids', [])}
                                                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                                                >
                                                    Kosongkan
                                                </button>
                                            </div>
                                        </div>

                                        {/* Product Search Box */}
                                        <div className="relative">
                                            <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="Cari nama parfum..."
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                className="h-8 text-xs pl-8 pr-8"
                                            />
                                            {productSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setProductSearch('')}
                                                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Scrollable list of products */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                                            {filteredProducts.length === 0 ? (
                                                <p className="text-xs text-muted-foreground p-3 col-span-2 text-center">
                                                    Tidak ada produk parfum yang cocok dengan &quot;{productSearch}&quot;.
                                                </p>
                                            ) : (
                                                filteredProducts.map((prod) => {
                                                    const isChecked = data.applicable_product_ids.includes(prod.id);
                                                    return (
                                                        <label
                                                            key={prod.id}
                                                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                                                isChecked
                                                                    ? 'border-[#4A070B] bg-[#4A070B]/5 font-medium text-foreground dark:border-amber-500/60 dark:bg-amber-500/10'
                                                                    : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setData('applicable_product_ids', [...data.applicable_product_ids, prod.id]);
                                                                    } else {
                                                                        setData(
                                                                            'applicable_product_ids',
                                                                            data.applicable_product_ids.filter((id) => id !== prod.id)
                                                                        );
                                                                    }
                                                                }}
                                                                className="rounded border-border text-[#4A070B] focus:ring-[#4A070B]"
                                                            />
                                                            <span className="truncate">{prod.name}</span>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                        {errors.applicable_product_ids && (
                                            <p className="text-destructive text-xs">{errors.applicable_product_ids}</p>
                                        )}
                                    </div>
                                )}

                                {/* Konfigurasi Khusus Voucher Reward Royale Club */}
                                {data.voucher_type === 'reward' && (
                                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                                            <Coins className="size-4" />
                                            <span>Konfigurasi Poin Royale Club</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">
                                                    Poin yang Dibutuhkan untuk Menukar *
                                                </label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    placeholder="Contoh: 100"
                                                    value={data.points_required}
                                                    onChange={(e) => setData('points_required', e.target.value)}
                                                    className="h-9 text-xs font-bold"
                                                    required={data.voucher_type === 'reward'}
                                                />
                                                <p className="text-[11px] text-muted-foreground">
                                                    Jumlah Royale Points yang didebet dari saldo member saat menukar voucher ini.
                                                </p>
                                                {errors.points_required && <p className="text-destructive text-xs">{errors.points_required}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">
                                                    Pemilik Voucher Khusus (Opsional)
                                                </label>
                                                <Select
                                                    value={data.user_id ? String(data.user_id) : 'all_members'}
                                                    onValueChange={(val) => setData('user_id', val === 'all_members' ? '' : val)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue placeholder="Pilih pemilik voucher..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-60">
                                                        <SelectItem value="all_members">
                                                            Semua Member (Bebas Ditukarkan Siapa Saja)
                                                        </SelectItem>
                                                        {users.map((u) => (
                                                            <SelectItem key={u.id} value={String(u.id)}>
                                                                {u.name} ({u.email})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Pilih jika kupon ini dihadiahkan khusus untuk satu member spesifik.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* STEP 5: PERIODE BERLAKU & STATUS */}
                        <Card className="border-border shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A070B] dark:text-[#E8D0BA]">
                                    <Clock className="size-4" />
                                    <span>Langkah 5: Masa Berlaku &amp; Status</span>
                                </div>
                                <CardTitle className="text-base font-semibold">Kapan Promo Ini Dapat Digunakan?</CardTitle>
                                <CardDescription className="text-xs">
                                    Atur tanggal mulai dan kadaluarsa voucher, atau kosongkan jika ingin berlaku tanpa batas waktu.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">Tanggal Mulai Berlaku (Opsional)</label>
                                        <Input
                                            type="datetime-local"
                                            value={data.starts_at}
                                            onChange={(e) => setData('starts_at', e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                        <p className="text-[11px] text-muted-foreground">Kosongkan jika langsung berlaku sekarang.</p>
                                        {errors.starts_at && <p className="text-destructive text-xs">{errors.starts_at}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">Tanggal Kadaluarsa (Opsional)</label>
                                        <Input
                                            type="datetime-local"
                                            value={data.expires_at}
                                            onChange={(e) => setData('expires_at', e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                        <p className="text-[11px] text-muted-foreground">Kosongkan jika berlaku selamanya tanpa batas kedaluwarsa.</p>
                                        {errors.expires_at && <p className="text-destructive text-xs">{errors.expires_at}</p>}
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Aktifkan Voucher Ini Segera</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {data.is_active
                                                ? 'Voucher aktif dan dapat langsung digunakan oleh pelanggan sesuai ketentuan.'
                                                : 'Voucher dalam status non-aktif (draft) dan belum dapat digunakan.'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: REAL-TIME VOUCHER PREVIEW CARD (4 COLS) */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                        <Card className="border-border shadow-xs overflow-hidden">
                            <CardHeader className="pb-3 border-b border-border bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <Sparkles className="size-3.5 text-amber-500" />
                                        <span>Live Preview Voucher</span>
                                    </div>
                                    <Badge variant={data.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                        {data.is_active ? 'Status: Aktif' : 'Status: Non-Aktif'}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Tampilan kartu voucher yang dilihat pembeli saat belanja.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {/* The Coupon Ticket Preview */}
                                <div className="relative p-4 rounded-xl border-2 border-dashed border-[#4A070B]/30 dark:border-amber-500/40 bg-gradient-to-br from-[#4A070B]/5 via-amber-500/5 to-transparent space-y-3">
                                    {/* Type badge */}
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            className={`text-[10px] font-bold uppercase tracking-wider ${
                                                data.voucher_type === 'ongkir'
                                                    ? 'bg-sky-600 text-white'
                                                    : data.voucher_type === 'reward'
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-[#4A070B] text-white'
                                            }`}
                                        >
                                            {data.voucher_type === 'ongkir'
                                                ? 'VOUCHER ONGKIR'
                                                : data.voucher_type === 'reward'
                                                ? 'ROYALE REWARD'
                                                : 'VOUCHER DISKON'}
                                        </Badge>
                                        <span className="text-[11px] font-mono font-bold text-muted-foreground">
                                            {data.discount_target === 'shipping' ? '🚚 Ongkos Kirim' : '🛍️ Subtotal Produk'}
                                        </span>
                                    </div>

                                    {/* Big Discount Value */}
                                    <div>
                                        <p className="text-2xl font-extrabold text-foreground tracking-tight font-serif">
                                            {data.type === 'percentage'
                                                ? (Number(data.value) === 100 && data.voucher_type === 'ongkir'
                                                    ? 'GRATIS ONGKIR 100%'
                                                    : `DISKON ${data.value || 0}%`)
                                                : `POTONGAN ${formatRp(data.value || 0)}`}
                                        </p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5 line-clamp-1">
                                            {data.name || 'Nama Promo Voucher Belum Diisi'}
                                        </p>
                                        {data.description && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                                                {data.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Voucher Code Box */}
                                    <div className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground font-semibold">KODE VOUCHER:</p>
                                            <p className="font-mono text-xs font-extrabold tracking-wider text-[#4A070B] dark:text-amber-300">
                                                {data.code || 'BELUM DIISI'}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                            Gunakan di Checkout
                                        </Badge>
                                    </div>

                                    {/* Terms Summary in Ticket */}
                                    <div className="pt-2 border-t border-border/80 space-y-1 text-[11px] text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Min. Belanja:</span>
                                            <span className="font-medium text-foreground">
                                                {Number(data.min_order_amount) > 0 ? formatRp(data.min_order_amount) : 'Tanpa Minimum'}
                                            </span>
                                        </div>
                                        {data.type === 'percentage' && data.max_discount_amount && (
                                            <div className="flex justify-between">
                                                <span>Maks. Potongan:</span>
                                                <span className="font-medium text-foreground">{formatRp(data.max_discount_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Jangkauan:</span>
                                            <span className="font-medium text-foreground">
                                                {data.applicable_type === 'all'
                                                    ? 'Semua Produk'
                                                    : `${data.applicable_product_ids.length} Produk Pilihan`}
                                            </span>
                                        </div>
                                        {data.voucher_type === 'reward' && (
                                            <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                                                <span>Tukar Poin:</span>
                                                <span>{data.points_required || 100} Royale Points</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary of Behavior */}
                                <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                                        <Info className="size-3.5 text-blue-500" />
                                        <span>Ringkasan Perilaku Kupon:</span>
                                    </div>
                                    <ul className="space-y-1 text-[11px] list-disc list-inside">
                                        <li>
                                            Diproses pada <strong>{data.discount_target === 'shipping' ? 'ongkos kirim' : 'subtotal produk'}</strong> saat pelanggan checkout.
                                        </li>
                                        <li>
                                            {data.type === 'percentage'
                                                ? `Diskon sebesar ${data.value || 0}% dari nilai ${data.discount_target === 'shipping' ? 'ongkir' : 'produk'}${data.max_discount_amount ? ` (maksimal ${formatRp(data.max_discount_amount)})` : ' tanpa batas maksimal'}.`
                                                : `Potongan nominal tetap sebesar ${formatRp(data.value || 0)}.`}
                                        </li>
                                        <li>
                                            {Number(data.min_order_amount) > 0
                                                ? `Hanya aktif jika keranjang mencapai ${formatRp(data.min_order_amount)}.`
                                                : 'Dapat digunakan tanpa syarat minimal belanja.'}
                                        </li>
                                    </ul>
                                </div>

                                {/* Save Button in Sidebar */}
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-10 font-bold text-xs bg-[#4A070B] hover:bg-[#600A0F] text-white cursor-pointer shadow-xs"
                                >
                                    <Save className="size-4 mr-1.5" />
                                    <span>{processing ? 'Menyimpan...' : 'Simpan & Publikasikan'}</span>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
