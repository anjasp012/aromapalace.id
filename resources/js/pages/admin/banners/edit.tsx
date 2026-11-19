import React, { useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Save,
    Image as ImageIcon,
    Upload,
    SlidersHorizontal,
    Trash2,
    Link as LinkIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { isVideoUrl, isGifUrl } from '@/lib/utils';

interface BannerData {
    id: number;
    subtitle?: string | null;
    subtitle_en?: string | null;
    title: string;
    title_en?: string | null;
    description?: string | null;
    description_en?: string | null;
    button_text?: string | null;
    button_text_en?: string | null;
    button_link?: string | null;
    secondary_button_text?: string | null;
    secondary_button_text_en?: string | null;
    secondary_button_link?: string | null;
    image: string;
    is_active: boolean;
}

interface AdminBannerEditProps {
    banner: BannerData;
}

export default function AdminBannerEdit({ banner }: AdminBannerEditProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(banner.image || null);
    const [isMediaVideo, setIsMediaVideo] = useState<boolean>(() => isVideoUrl(banner.image || ''));
    const [isDragging, setIsDragging] = useState(false);

    const { data, setData, processing, errors, setError, clearErrors } = useForm<{
        subtitle: string;
        subtitle_en: string;
        title: string;
        title_en: string;
        description: string;
        description_en: string;
        button_text: string;
        button_text_en: string;
        button_link: string;
        secondary_button_text: string;
        secondary_button_text_en: string;
        secondary_button_link: string;
        image: File | string | null;
        is_active: boolean;
    }>({
        subtitle: banner.subtitle || '',
        subtitle_en: banner.subtitle_en || '',
        title: banner.title || '',
        title_en: banner.title_en || '',
        description: banner.description || '',
        description_en: banner.description_en || '',
        button_text: banner.button_text || 'Belanja Promo',
        button_text_en: banner.button_text_en || 'Shop Promo',
        button_link: banner.button_link || '/products?discount=1',
        secondary_button_text: banner.secondary_button_text || 'Cek Keranjang',
        secondary_button_text_en: banner.secondary_button_text_en || 'View Cart',
        secondary_button_link: banner.secondary_button_link || '/cart',
        image: banner.image || null,
        is_active: Boolean(banner.is_active),
    });

    const handleFile = (file: File) => {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v)$/i.test(file.name);
        const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(file.name);

        if (!isVideo && !isImg) {
            alert('Silakan pilih file gambar, GIF, atau video yang valid (JPG, PNG, WEBP, GIF, MP4, WEBM).');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            alert('Ukuran file maksimal adalah 50MB.');
            return;
        }

        clearErrors('image');
        setData('image', file);
        setPreviewUrl(URL.createObjectURL(file));
        setIsMediaVideo(isVideo);
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

    const handleResetImage = () => {
        setData('image', banner.image);
        setPreviewUrl(banner.image);
        setIsMediaVideo(isVideoUrl(banner.image || ''));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.image && !previewUrl) {
            setError('image', 'Banner media (gambar, animasi GIF, atau video) wajib diunggah.');
            const dropzone = document.getElementById('media-dropzone');
            dropzone?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        router.post(`/manajemen-banner/${banner.id}`, {
            _method: 'put',
            ...data,
        }, {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout
            title={`Edit Banner: ${banner.title}`}
            subtitle="Perbarui subtitle, judul, narasi promosi, arahan tombol, atau media visual banner."
        >
            <Head title={`Edit Banner: ${banner.title} - Admin Panel`} />

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link
                            href="/manajemen-banner"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Banner</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/manajemen-banner">Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Perbarui Banner'}</span>
                        </Button>
                    </div>
                </div>

                {/* 1. Media Upload Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <ImageIcon className="size-4 text-primary" />
                                <span>Gambar / Video Banner</span>
                                <span className="text-destructive font-bold text-xs">* (Wajib diunggah)</span>
                            </span>
                        </CardTitle>
                        <CardDescription>
                            Format landscape disarankan (16:9 atau 4:3). Unggah berkas Gambar, GIF Animasi, atau Video loop dari perangkat Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif,video/mp4,video/webm,video/ogg,video/quicktime"
                            className="hidden"
                            onChange={handleFileChange}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div
                            id="media-dropzone"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                errors.image
                                    ? 'border-destructive bg-destructive/5 ring-2 ring-destructive/20'
                                    : isDragging
                                    ? 'border-primary bg-primary/5 scale-[0.99]'
                                    : 'border-border hover:border-primary/60 hover:bg-muted/40'
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div
                                    className={`size-12 rounded-full flex items-center justify-center ${
                                        errors.image
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-primary/10 text-primary'
                                    }`}
                                >
                                    <Upload className="size-6" />
                                </div>
                                <div className="text-sm font-semibold text-foreground">
                                    Klik untuk mengganti media atau seret berkas ke sini
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Mendukung Gambar (JPG, PNG, WEBP, GIF) &amp; Video (MP4, WEBM, MOV) Maks. 50MB
                                </p>
                            </div>
                        </div>

                        {errors.image && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium flex items-center gap-2">
                                <span>⚠️ {errors.image}</span>
                            </div>
                        )}

                        {/* Media Preview Box */}
                        {previewUrl && (
                            <div className="relative mt-4 rounded-xl overflow-hidden border bg-muted group max-w-xl mx-auto shadow-sm">
                                <div className="aspect-[16/9] w-full overflow-hidden flex items-center justify-center bg-black/5 dark:bg-black/40">
                                    {isMediaVideo ? (
                                        <video
                                            src={previewUrl}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            controls
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={previewUrl}
                                            alt={data.title || 'Pratinjau Banner'}
                                            className="size-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                                    <Badge className="bg-black/75 backdrop-blur-md text-white text-[10px] border-none font-medium px-2 py-0.5">
                                        {isMediaVideo
                                            ? 'Video (Looping)'
                                            : isGifUrl(previewUrl)
                                            ? 'GIF Animasi'
                                            : 'Gambar Banner'}
                                    </Badge>
                                </div>
                                {data.image instanceof File && (
                                    <div className="px-3 py-2 bg-background/90 border-t flex items-center justify-between text-xs">
                                        <span className="truncate max-w-[280px] font-medium text-foreground">
                                            {data.image.name}
                                        </span>
                                        <span className="text-muted-foreground font-mono text-[11px]">
                                            {(data.image.size / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="bg-white/90 text-foreground hover:bg-white cursor-pointer"
                                    >
                                        <Upload className="size-4 mr-1.5" />
                                        <span>Ganti File</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleResetImage();
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Trash2 className="size-4 mr-1.5" />
                                        <span>Reset Semula</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Bilingual Content Tabs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <SlidersHorizontal className="size-4 text-primary" />
                            <span>Konten Banner (Teks Dwibahasa)</span>
                        </CardTitle>
                        <CardDescription>
                            Isi subtitle (badge label), judul tajuk, dan deskripsi promo dalam Bahasa Indonesia &amp; Inggris.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="id" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-xs mb-4">
                                <TabsTrigger value="id">Bahasa Indonesia</TabsTrigger>
                                <TabsTrigger value="en">English (Opsional)</TabsTrigger>
                            </TabsList>

                            {/* Indonesian Fields */}
                            <TabsContent value="id" className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Subtitle / Label Badge (ID)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Contoh: Penawaran Eksklusif"
                                        value={data.subtitle}
                                        onChange={(e) => setData('subtitle', e.target.value)}
                                        className="text-xs"
                                    />
                                    {errors.subtitle && (
                                        <p className="text-xs text-destructive">{errors.subtitle}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Judul Utama (ID) <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Contoh: Promo Spesial Hari Ini!"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="text-xs text-destructive">{errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Deskripsi Promo (ID)
                                    </label>
                                    <Textarea
                                        placeholder="Tuliskan deskripsi lengkap mengenai promo atau penawaran menarik..."
                                        rows={3}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="text-xs resize-none"
                                    />
                                    {errors.description && (
                                        <p className="text-xs text-destructive">{errors.description}</p>
                                    )}
                                </div>
                            </TabsContent>

                            {/* English Fields */}
                            <TabsContent value="en" className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Subtitle / Badge Label (EN)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Exclusive Offer"
                                        value={data.subtitle_en}
                                        onChange={(e) => setData('subtitle_en', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Headline Title (EN)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Today's Special Deals!"
                                        value={data.title_en}
                                        onChange={(e) => setData('title_en', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Description (EN)
                                    </label>
                                    <Textarea
                                        placeholder="Provide brief English description for international customers..."
                                        rows={3}
                                        value={data.description_en}
                                        onChange={(e) => setData('description_en', e.target.value)}
                                        className="text-xs resize-none"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* 3. Action Buttons & Links */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <LinkIcon className="size-4 text-primary" />
                            <span>Arahan Tombol &amp; Tautan (Call-to-Action)</span>
                        </CardTitle>
                        <CardDescription>
                            Atur teks dan URL tujuan saat tombol di banner diklik pengunjung.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">
                                    Teks Tombol Utama (ID)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Belanja Promo"
                                    value={data.button_text}
                                    onChange={(e) => setData('button_text', e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">
                                    Teks Tombol Utama (EN)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Shop Promo"
                                    value={data.button_text_en}
                                    onChange={(e) => setData('button_text_en', e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">
                                Arahan Tautan Tombol Utama (Link URL)
                            </label>
                            <Input
                                type="text"
                                placeholder="/products?discount=1 atau /categories/sale"
                                value={data.button_link}
                                onChange={(e) => setData('button_link', e.target.value)}
                                className="text-xs font-mono"
                            />
                            {errors.button_link && (
                                <p className="text-xs text-destructive">{errors.button_link}</p>
                            )}
                        </div>

                        <div className="pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-3">
                                Tombol Sekunder (Opsional):
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Teks Sekunder (ID)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Cek Keranjang"
                                        value={data.secondary_button_text}
                                        onChange={(e) => setData('secondary_button_text', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Teks Sekunder (EN)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="View Cart"
                                        value={data.secondary_button_text_en}
                                        onChange={(e) => setData('secondary_button_text_en', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Arahan Tautan Sekunder
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="/cart"
                                        value={data.secondary_button_link}
                                        onChange={(e) => setData('secondary_button_link', e.target.value)}
                                        className="text-xs font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t flex items-center gap-2">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor="is_active" className="text-xs font-medium text-foreground cursor-pointer">
                                Aktifkan banner ini di halaman beranda
                            </label>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AdminLayout>
    );
}

