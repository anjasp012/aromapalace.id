import React, { useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Save,
    CreditCard,
    Upload,
    Trash2,
    Image as ImageIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaymentMethodData {
    id: number;
    code: string;
    name: string;
    icon?: string | null;
}

interface AdminPaymentMethodEditProps {
    paymentMethod: PaymentMethodData;
}

export default function AdminPaymentMethodEdit({ paymentMethod }: AdminPaymentMethodEditProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(paymentMethod.icon || null);
    const [isDragging, setIsDragging] = useState(false);

    const { data, setData, processing, errors } = useForm<{
        name: string;
        code: string;
        icon: File | string | null;
    }>({
        name: paymentMethod.name || '',
        code: paymentMethod.code || '',
        icon: paymentMethod.icon || null,
    });

    const slugifyCode = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w_]+/g, '');
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Silakan pilih file gambar logo (JPG, PNG, WEBP, SVG).');
            return;
        }
        setData('icon', file);
        setPreviewUrl(URL.createObjectURL(file));
        setShowUrlInput(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(`/manajemen-pembayaran/${paymentMethod.id}`, {
            _method: 'put',
            ...data,
        }, {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout
            title={`Edit Metode: ${paymentMethod.name}`}
            subtitle="Perbarui logo icon, nama tampilan, atau kode kanal pembayaran."
        >
            <Head title={`Edit Metode: ${paymentMethod.name} - Admin Panel`} />

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link href="/manajemen-pembayaran" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Metode</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/manajemen-pembayaran">Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Perbarui Metode'}</span>
                        </Button>
                    </div>
                </div>

                {/* 1. Logo Icon Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Logo Kanal / Bank (Icon)</CardTitle>
                        <CardDescription>Ganti atau perbarui icon resmi bank atau dompet digital.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {previewUrl ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`group relative w-full h-44 rounded-xl border-2 overflow-hidden bg-muted/40 transition-all flex items-center justify-center p-6 ${
                                    isDragging ? 'border-primary ring-4 ring-primary/20 scale-[1.01]' : 'border-border/80'
                                }`}
                            >
                                <img
                                    src={previewUrl}
                                    alt={paymentMethod.name}
                                    className="max-h-24 max-w-xs object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                                {isDragging && (
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center text-primary-foreground font-semibold text-sm z-20">
                                        <Upload className="size-8 mb-1 animate-bounce" />
                                        <span>Lepaskan file untuk ganti icon</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                                    <span className="text-xs font-medium text-white truncate drop-shadow-sm">
                                        Icon Pembayaran Aktif
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-8 text-xs bg-white/90 hover:bg-white text-black cursor-pointer shadow-sm"
                                        >
                                            <Upload className="size-3.5 mr-1.5" />
                                            <span>Ganti Icon</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                setPreviewUrl(null);
                                                setData('icon', '');
                                            }}
                                            className="h-8 text-xs cursor-pointer shadow-sm"
                                        >
                                            <Trash2 className="size-3.5 mr-1" />
                                            <span>Hapus</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                                    isDragging
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30 text-muted-foreground'
                                }`}
                            >
                                <div className="p-2.5 rounded-full bg-muted/60 border border-border/60">
                                    <ImageIcon className="size-5 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium text-foreground">
                                        Klik untuk upload logo pembayaran
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Format PNG, SVG, atau JPG transparan direkomendasikan
                                    </p>
                                </div>
                            </div>
                        )}
                        {errors.icon && <p className="text-destructive text-xs">{errors.icon}</p>}
                    </CardContent>
                </Card>

                {/* 2. Informasi Nama & Kode */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Detail Metode Pembayaran</CardTitle>
                        <CardDescription>Nama yang dilihat pembeli dan kode identifikasi kanal pembayaran.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Nama Metode Pembayaran *</label>
                            <Input
                                type="text"
                                placeholder="Contoh: BCA Virtual Account"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-foreground">Kode Kanal Pembayaran (Unik) *</label>
                                <span className="text-[11px] text-muted-foreground font-mono">Format slug huruf kecil &amp; underscore</span>
                            </div>
                            <Input
                                type="text"
                                placeholder="bca_va"
                                value={data.code}
                                onChange={(e) => setData('code', slugifyCode(e.target.value))}
                                className="h-9 text-xs font-mono"
                                required
                            />
                            {errors.code && <p className="text-destructive text-xs">{errors.code}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Save Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/manajemen-pembayaran">Batal</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                        <Save className="size-4 mr-1.5" />
                        <span>{processing ? 'Menyimpan...' : 'Perbarui Metode'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
