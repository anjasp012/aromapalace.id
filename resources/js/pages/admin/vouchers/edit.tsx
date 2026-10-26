import React from 'react';
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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface VoucherData {
    id: number;
    code: string;
    name: string;
    name_en?: string | null;
    description?: string | null;
    description_en?: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount: number;
    max_discount_amount?: number | null;
    usage_limit?: number | null;
    used_count: number;
    starts_at?: string | null;
    expires_at?: string | null;
    is_active: boolean;
    voucher_type?: 'biasa' | 'reward';
    user_id?: number | null;
    applicable_type?: 'all' | 'specific';
    applicable_product_ids?: number[] | null;
}

interface AdminVoucherEditProps {
    voucher: VoucherData;
    products?: { id: number; name: string }[];
    users?: { id: number; name: string; email: string }[];
}

export default function AdminVoucherEdit({ voucher, products = [], users = [] }: AdminVoucherEditProps) {
    const formatDateForInput = (dateString?: string | null) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
        } catch {
            return '';
        }
    };

    const { data, setData, put, processing, errors } = useForm<{
        code: string;
        name: string;
        name_en: string;
        description: string;
        description_en: string;
        type: 'percentage' | 'fixed';
        value: number | string;
        min_order_amount: number | string;
        max_discount_amount: number | string;
        usage_limit: number | string;
        starts_at: string;
        expires_at: string;
        is_active: boolean;
        voucher_type: 'biasa' | 'reward';
        user_id: number | string;
        applicable_type: 'all' | 'specific';
        applicable_product_ids: number[];
    }>({
        code: voucher.code || '',
        name: voucher.name || '',
        name_en: voucher.name_en || '',
        description: voucher.description || '',
        description_en: voucher.description_en || '',
        type: voucher.type || 'percentage',
        value: voucher.value || '',
        min_order_amount: voucher.min_order_amount || 0,
        max_discount_amount: voucher.max_discount_amount || '',
        usage_limit: voucher.usage_limit || '',
        starts_at: formatDateForInput(voucher.starts_at),
        expires_at: formatDateForInput(voucher.expires_at),
        is_active: voucher.is_active ?? true,
        voucher_type: voucher.voucher_type || 'biasa',
        user_id: voucher.user_id || '',
        applicable_type: voucher.applicable_type || 'all',
        applicable_product_ids: voucher.applicable_product_ids ? voucher.applicable_product_ids.map(Number) : [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/manajemen-voucher/${voucher.id}`);
    };

    return (
        <AdminLayout
            title={`Edit Voucher: ${voucher.code}`}
            subtitle="Perbarui nilai diskon, syarat belanja, masa berlaku, dan deskripsi promo dwibahasa."
        >
            <Head title={`Edit Voucher: ${voucher.code} - Admin Panel`} />

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
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
                        <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Perbarui Voucher'}</span>
                        </Button>
                    </div>
                </div>

                {/* 1. Informasi Konten Dwibahasa */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">1. Judul &amp; Deskripsi Dwibahasa</CardTitle>
                        <CardDescription>
                            Pilih tab bahasa di bawah untuk mengisi nama promo dan ketentuan dalam Bahasa Indonesia dan Bahasa Inggris.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs defaultValue="id" className="w-full">
                            <TabsList className="grid grid-cols-2 max-w-sm mb-4">
                                <TabsTrigger value="id" className="flex items-center gap-2 text-xs">
                                    <span className="text-base leading-none">🇮🇩</span>
                                    <span>Bahasa Indonesia</span>
                                </TabsTrigger>
                                <TabsTrigger value="en" className="flex items-center gap-2 text-xs">
                                    <span className="text-base leading-none">🇬🇧</span>
                                    <span>English</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab Bahasa Indonesia */}
                            <TabsContent value="id" className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            Nama Promo Voucher (Indonesia) *
                                        </label>
                                        <Badge variant="outline" className="text-[10px] py-0">🇮🇩 ID</Badge>
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Contoh: Diskon Pelanggan Baru 20%"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="h-9 text-xs"
                                        required
                                    />
                                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-foreground">
                                            Deskripsi / Syarat &amp; Ketentuan (Indonesia)
                                        </label>
                                        <Badge variant="outline" className="text-[10px] py-0">🇮🇩 ID</Badge>
                                    </div>
                                    <Textarea
                                        rows={3}
                                        placeholder="Berlaku untuk pembelian pertama tanpa minimum belanja..."
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="text-xs"
                                    />
                                    {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
                                </div>
                            </TabsContent>

                            {/* Tab English */}
                            <TabsContent value="en" className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            Voucher Campaign Name (English)
                                        </label>
                                        <Badge variant="outline" className="text-[10px] py-0">🇬🇧 EN</Badge>
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="e.g. New Patron Welcome 20% Off"
                                        value={data.name_en}
                                        onChange={(e) => setData('name_en', e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                    {errors.name_en && <p className="text-destructive text-xs">{errors.name_en}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-foreground">
                                            Terms &amp; Conditions (English)
                                        </label>
                                        <Badge variant="outline" className="text-[10px] py-0">🇬🇧 EN</Badge>
                                    </div>
                                    <Textarea
                                        rows={3}
                                        placeholder="Valid for first purchase with no minimum order required..."
                                        value={data.description_en}
                                        onChange={(e) => setData('description_en', e.target.value)}
                                        className="text-xs"
                                    />
                                    {errors.description_en && <p className="text-destructive text-xs">{errors.description_en}</p>}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* 2. Parameter Voucher & Diskon */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">2. Konfigurasi Kode &amp; Nilai Diskon</CardTitle>
                        <CardDescription>Tentukan kode voucher, tipe persentase/nominal, kuota dan batas tanggal promo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Kode Voucher *</label>
                                <Input
                                    type="text"
                                    placeholder="AROMA20"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    className="h-9 font-mono uppercase tracking-wider text-xs font-bold"
                                    required
                                />
                                {errors.code && <p className="text-destructive text-xs">{errors.code}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Tipe Diskon *</label>
                                <Select
                                    value={data.type}
                                    onValueChange={(val: 'percentage' | 'fixed') => setData('type', val)}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Persentase (%)</SelectItem>
                                        <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    {data.type === 'percentage' ? 'Persen Diskon (%) *' : 'Nominal Diskon (Rp) *'}
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={data.type === 'percentage' ? 100 : undefined}
                                    placeholder={data.type === 'percentage' ? '20' : '50000'}
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                />
                                {errors.value && <p className="text-destructive text-xs">{errors.value}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Kategori Tipe Voucher *</label>
                                <Select
                                    value={data.voucher_type}
                                    onValueChange={(val: 'biasa' | 'reward') => {
                                        setData((prev) => ({
                                            ...prev,
                                            voucher_type: val,
                                            user_id: val === 'reward' ? prev.user_id : '',
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="biasa">Voucher Biasa (Promo Toko Umum)</SelectItem>
                                        <SelectItem value="reward">Voucher Reward (Penukaran Membership)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">Voucher Biasa dapat digunakan semua pelanggan, sedangkan Voucher Reward khusus penukaran reward Royale Club.</p>
                                {data.voucher_type === 'reward' && (
                                    <div className="pt-2 space-y-1">
                                        <label className="text-[11px] font-medium text-foreground">Pemilik Voucher (Opsional)</label>
                                        <select
                                            value={data.user_id}
                                            onChange={(e) => setData('user_id', e.target.value)}
                                            className="w-full h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="">Semua Anggota (Bebas Ditukar)</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-muted-foreground">Kosongkan jika voucher reward ini bisa ditukarkan oleh semua member.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Jangkauan Produk *</label>
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
                                <p className="text-[11px] text-muted-foreground">Tentukan apakah voucher dapat dipakai untuk semua produk atau parfum tertentu.</p>
                            </div>
                        </div>

                        {data.applicable_type === 'specific' && (
                            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/30 space-y-2">
                                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                    <span>Pilih Produk yang Berlaku ({data.applicable_product_ids.length} dipilih)</span>
                                    <span className="text-[11px] text-muted-foreground font-normal">Centang produk yang ingin disertakan</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {products.map((prod) => {
                                        const isChecked = data.applicable_product_ids.includes(prod.id);
                                        return (
                                            <label
                                                key={prod.id}
                                                className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                                    isChecked
                                                        ? 'border-[#4A070B] bg-[#4A070B]/5 font-medium text-foreground'
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
                                    })}
                                </div>
                                {errors.applicable_product_ids && (
                                    <p className="text-destructive text-xs">{errors.applicable_product_ids}</p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Min. Belanja (Rp)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={data.min_order_amount}
                                    onChange={(e) => setData('min_order_amount', e.target.value)}
                                    className="h-9 text-xs"
                                />
                                {errors.min_order_amount && <p className="text-destructive text-xs">{errors.min_order_amount}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Maks. Potongan (Rp)</label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="Opsional (Misal: 100000)"
                                    value={data.max_discount_amount}
                                    onChange={(e) => setData('max_discount_amount', e.target.value)}
                                    className="h-9 text-xs"
                                />
                                {errors.max_discount_amount && <p className="text-destructive text-xs">{errors.max_discount_amount}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-foreground">Batas Kuota Penggunaan</label>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        Terpakai: {voucher.used_count || 0}
                                    </span>
                                </div>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="Kosongkan jika tak terbatas"
                                    value={data.usage_limit}
                                    onChange={(e) => setData('usage_limit', e.target.value)}
                                    className="h-9 text-xs"
                                />
                                {errors.usage_limit && <p className="text-destructive text-xs">{errors.usage_limit}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Mulai Berlaku (Opsional)</label>
                                <Input
                                    type="datetime-local"
                                    value={data.starts_at}
                                    onChange={(e) => setData('starts_at', e.target.value)}
                                    className="h-9 text-xs"
                                />
                                {errors.starts_at && <p className="text-destructive text-xs">{errors.starts_at}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Kadaluarsa (Opsional)</label>
                                <Input
                                    type="datetime-local"
                                    value={data.expires_at}
                                    onChange={(e) => setData('expires_at', e.target.value)}
                                    className="h-9 text-xs"
                                />
                                {errors.expires_at && <p className="text-destructive text-xs">{errors.expires_at}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                id="voucher-active-toggle"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor="voucher-active-toggle" className="text-xs font-medium text-foreground cursor-pointer">
                                Status Voucher Aktif (Dapat diklaim dan digunakan oleh pelanggan)
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Save Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/manajemen-voucher">Batal</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                        <Save className="size-4 mr-1.5" />
                        <span>{processing ? 'Menyimpan...' : 'Perbarui Voucher'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
