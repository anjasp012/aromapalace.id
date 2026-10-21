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

export default function AdminVoucherCreate() {
    const { data, setData, post, processing, errors } = useForm<{
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
    }>({
        code: '',
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        type: 'percentage',
        value: '',
        min_order_amount: 0,
        max_discount_amount: '',
        usage_limit: '',
        starts_at: '',
        expires_at: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/vouchers');
    };

    return (
        <AdminLayout
            title="Tambah Voucher Promo Baru"
            subtitle="Buat kupon potongan belanja baru dengan skema diskon dan informasi dwibahasa."
        >
            <Head title="Tambah Voucher - Admin Panel" />

            <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link href="/vouchers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Voucher</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/vouchers">Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Voucher'}</span>
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
                                        placeholder="Contoh: Diskon Pelanggan Baru 20% Koleksi Eau de Parfum"
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
                                        placeholder="e.g. New Patron Welcome 20% Off Fine Fragrance"
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
                                <label className="text-xs font-medium text-foreground">Batas Total Penggunaan</label>
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
                                Aktifkan voucher ini segera setelah disimpan
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Save Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/vouchers">Batal</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                        <Save className="size-4 mr-1.5" />
                        <span>{processing ? 'Menyimpan...' : 'Simpan Voucher'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
