import React, { useState, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Save,
    Image as ImageIcon,
    Upload,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function AdminBrandCreate() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        slug: string;
        thumbnail: File | string | null;
        description: string;
        description_en: string;
    }>({
        name: '',
        slug: '',
        thumbnail: null,
        description: '',
        description_en: '',
    });

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    };

    const handleNameChange = (val: string) => {
        setData((prev) => ({
            ...prev,
            name: val,
            slug: prev.slug === '' || prev.slug === slugify(prev.name) ? slugify(val) : prev.slug,
        }));
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Silakan pilih file gambar (JPG, PNG, WEBP).');
            return;
        }
        setData('thumbnail', file);
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
        post('/brands', {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout
            title="Tambah Brand Baru"
            subtitle="Tambahkan rumah parfum (maison de parfum) baru dengan logo dan narasi dwibahasa."
        >
            <Head title="Tambah Brand - Admin Panel" />

            <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link href="/brands" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Brand</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/brands">Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Brand'}</span>
                        </Button>
                    </div>
                </div>

                {/* 1. Logo / Thumbnail Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Logo / Foto Brand</CardTitle>
                                <CardDescription>Upload lambang atau foto signature maison de parfum.</CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className="text-xs text-muted-foreground hover:text-primary"
                            >
                                {showUrlInput ? 'Gunakan Upload File' : 'Gunakan URL Gambar'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {showUrlInput ? (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">URL Gambar Langsung</label>
                                <Input
                                    type="url"
                                    placeholder="https://images.unsplash.com/photo-..."
                                    value={typeof data.thumbnail === 'string' ? data.thumbnail : ''}
                                    onChange={(e) => {
                                        setData('thumbnail', e.target.value);
                                        setPreviewUrl(e.target.value || null);
                                    }}
                                    className="h-9 text-xs"
                                />
                            </div>
                        ) : null}

                        {previewUrl ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`group relative w-full h-56 rounded-xl border-2 overflow-hidden bg-muted/40 transition-all ${
                                    isDragging ? 'border-primary ring-4 ring-primary/20 scale-[1.01]' : 'border-border/80'
                                }`}
                            >
                                <img
                                    src={previewUrl}
                                    alt="Preview Brand"
                                    className="size-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                                {isDragging && (
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center text-primary-foreground font-semibold text-sm z-20">
                                        <Upload className="size-10 mb-2 animate-bounce" />
                                        <span>Lepaskan file untuk mengganti foto</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                                    <span className="text-xs font-medium text-white truncate drop-shadow-sm">
                                        Foto Logo Brand Aktif
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
                                            <span>Ganti Foto</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                setPreviewUrl(null);
                                                setData('thumbnail', null);
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
                                className={`w-full h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-colors ${
                                    isDragging
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30 text-muted-foreground'
                                }`}
                            >
                                <div className="p-3 rounded-full bg-muted/60 border border-border/60">
                                    <ImageIcon className="size-6 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium text-foreground">
                                        Klik untuk upload atau tarik &amp; lepas gambar di sini
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Mendukung format PNG, JPG, atau WEBP (Maks. 2MB)
                                    </p>
                                </div>
                            </div>
                        )}
                        {errors.thumbnail && <p className="text-destructive text-xs">{errors.thumbnail}</p>}
                    </CardContent>
                </Card>

                {/* 2. Informasi Brand Dwibahasa */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Informasi Konten Dwibahasa</CardTitle>
                        <CardDescription>
                            Gunakan tab bahasa di bawah ini untuk mengisi teks narasi dalam Bahasa Indonesia dan Bahasa Inggris.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
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
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2 text-xs text-primary mb-2">
                                    <Sparkles className="size-4 shrink-0" />
                                    <span>Konten versi Bahasa Indonesia akan ditampilkan kepada pelanggan lokal secara default.</span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            Nama Brand / Maison *
                                        </label>
                                        <Badge variant="outline" className="text-[10px] py-0">🇮🇩 ID</Badge>
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Contoh: Maison Francis Kurkdjian, Creed, Tom Ford"
                                        value={data.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="h-9 text-xs"
                                        required
                                    />
                                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-foreground">
                                            Deskripsi Brand (Indonesia)
                                        </label>
                                        <Badge variant="outline" className="text-[10px] py-0">🇮🇩 ID</Badge>
                                    </div>
                                    <Textarea
                                        rows={4}
                                        placeholder="Tuliskan latar belakang warisan aroma, keahlian kurasi, atau sejarah brand..."
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="text-xs"
                                    />
                                    {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
                                </div>
                            </TabsContent>

                            {/* Tab English */}
                            <TabsContent value="en" className="space-y-4">
                                <div className="p-3 rounded-lg bg-muted/60 border border-border flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                    <Sparkles className="size-4 shrink-0 text-amber-500" />
                                    <span>English version content will be displayed when visitors switch to international language.</span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-foreground">
                                            Brand Description (English)
                                        </label>
                                        <Badge variant="outline" className="text-[10px] py-0">🇬🇧 EN</Badge>
                                    </div>
                                    <Textarea
                                        rows={4}
                                        placeholder="Write the heritage, luxury legacy, or story of the perfume house in English..."
                                        value={data.description_en}
                                        onChange={(e) => setData('description_en', e.target.value)}
                                        className="text-xs"
                                    />
                                    {errors.description_en && <p className="text-destructive text-xs">{errors.description_en}</p>}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* URL Slug (Shared) */}
                        <div className="pt-2 border-t border-border">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-foreground">
                                        URL Slug (Permalink)
                                    </label>
                                    <span className="text-[11px] text-muted-foreground">Otomatis terisi dari nama</span>
                                </div>
                                <Input
                                    type="text"
                                    placeholder="maison-francis-kurkdjian"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', slugify(e.target.value))}
                                    className="h-9 text-xs font-mono"
                                />
                                {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Save Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/brands">Batal</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                        <Save className="size-4 mr-1.5" />
                        <span>{processing ? 'Menyimpan...' : 'Simpan Brand'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
