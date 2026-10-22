import React, { useState, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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

export default function AdminPaymentMethodCreate() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        code: string;
        icon: File | string | null;
    }>({
        name: '',
        code: '',
        icon: null,
    });

    const slugifyCode = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w_]+/g, '');
    };

    const handleNameChange = (val: string) => {
        setData((prev) => ({
            ...prev,
            name: val,
            code: prev.code === '' || prev.code === slugifyCode(prev.name) ? slugifyCode(val) : prev.code,
        }));
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

    const handleRemoveImage = () => {
        setData('icon', null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/manajemen-pembayaran', {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout
            title="Tambah Metode Pembayaran"
            subtitle="Tambahkan kanal pembayaran baru, virtual account bank, e-wallet, atau QRIS."
        >
            <Head title="Tambah Metode Pembayaran - Admin Panel" />

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link
                            href="/manajemen-pembayaran"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
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
                            <span>{processing ? 'Menyimpan...' : 'Simpan Metode'}</span>
                        </Button>
                    </div>
                </div>

                {/* 1. Logo / Icon Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ImageIcon className="size-4 text-primary" />
                                    <span>Logo Kanal / Bank (Icon)</span>
                                </CardTitle>
                                <CardDescription>
                                    Format PNG, SVG, atau JPG transparan disarankan (maks. 2MB).
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className="text-xs cursor-pointer"
                            >
                                {showUrlInput ? 'Unggah dari Perangkat' : 'Gunakan URL Gambar'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {showUrlInput ? (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">URL Gambar Logo</label>
                                <Input
                                    type="url"
                                    placeholder="https://... atau /images/payment/bca.png"
                                    value={typeof data.icon === 'string' ? data.icon : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setData('icon', val);
                                        setPreviewUrl(val || null);
                                    }}
                                    className="text-xs font-mono"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Cantumkan URL tautan langsung ke logo pembayaran.
                                </p>
                            </div>
                        ) : (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                    isDragging
                                        ? 'border-primary bg-primary/5 scale-[0.99]'
                                        : 'border-border hover:border-primary/60 hover:bg-muted/40'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                        <Upload className="size-6" />
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                        Klik untuk memilih atau seret logo ke sini
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Mendukung PNG transparan, SVG, JPG, WEBP
                                    </p>
                                </div>
                            </div>
                        )}

                        {errors.icon && (
                            <p className="text-xs text-destructive font-medium">{errors.icon}</p>
                        )}

                        {/* Logo Preview Box */}
                        {previewUrl && (
                            <div className="relative mt-4 rounded-xl overflow-hidden border bg-muted/30 group max-w-xs mx-auto p-4 flex items-center justify-center shadow-xs">
                                <img
                                    src={previewUrl}
                                    alt="Pratinjau Logo"
                                    className="max-h-20 max-w-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveImage();
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Trash2 className="size-4 mr-1.5" />
                                        <span>Hapus Logo</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Detail Metode Pembayaran */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CreditCard className="size-4 text-primary" />
                            <span>Detail Metode Pembayaran</span>
                        </CardTitle>
                        <CardDescription>
                            Nama tampilan untuk pelanggan dan kode teknis identifikasi saluran pembayaran.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground flex items-center gap-1">
                                <span>Nama Metode Pembayaran</span>
                                <span className="text-destructive">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="cth. BCA Virtual Account, QRIS, Bank Mandiri"
                                value={data.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="text-xs font-semibold"
                                required
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive font-medium">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                                    <span>Kode Teknis (Unik)</span>
                                    <span className="text-destructive">*</span>
                                </label>
                                <span className="text-[11px] text-muted-foreground font-mono">Format slug huruf kecil &amp; underscore</span>
                            </div>
                            <Input
                                type="text"
                                placeholder="bca_va, qris, mandiri"
                                value={data.code}
                                onChange={(e) => setData('code', slugifyCode(e.target.value))}
                                className="text-xs font-mono"
                                required
                            />
                            {errors.code && (
                                <p className="text-xs text-destructive font-medium">{errors.code}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" size="default" asChild>
                        <Link href="/manajemen-pembayaran">Batal</Link>
                    </Button>
                    <Button type="submit" size="default" disabled={processing} className="cursor-pointer">
                        <Save className="size-4 mr-2" />
                        <span>{processing ? 'Menyimpan...' : 'Simpan Metode'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
