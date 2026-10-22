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

interface SliderPromoData {
    id: number;
    title: string;
    title_en?: string | null;
    description?: string | null;
    description_en?: string | null;
    link?: string | null;
    thumbnail: string;
}

interface AdminSliderPromoEditProps {
    sliderPromo: SliderPromoData;
}

export default function AdminSliderPromoEdit({ sliderPromo }: AdminSliderPromoEditProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(sliderPromo.thumbnail || null);
    const [isDragging, setIsDragging] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);

    const { data, setData, processing, errors } = useForm<{
        title: string;
        title_en: string;
        description: string;
        description_en: string;
        link: string;
        thumbnail: File | string | null;
    }>({
        title: sliderPromo.title || '',
        title_en: sliderPromo.title_en || '',
        description: sliderPromo.description || '',
        description_en: sliderPromo.description_en || '',
        link: sliderPromo.link || '/products',
        thumbnail: sliderPromo.thumbnail || null,
    });

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Silakan pilih file gambar yang valid (JPG, PNG, WEBP).');
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

    const handleResetImage = () => {
        setData('thumbnail', sliderPromo.thumbnail);
        setPreviewUrl(sliderPromo.thumbnail);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(`/manajemen-slider-promo/${sliderPromo.id}`, {
            _method: 'put',
            ...data,
        }, {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout
            title={`Edit Slider: ${sliderPromo.title}`}
            subtitle="Perbarui banner visual, narasi dwibahasa, atau tautan promosi."
        >
            <Head title={`Edit Slider: ${sliderPromo.title} - Admin Panel`} />

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link
                            href="/manajemen-slider-promo"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Slider</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/manajemen-slider-promo">Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Perbarui Slider Promo'}</span>
                        </Button>
                    </div>
                </div>

                {/* 1. Banner Image Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ImageIcon className="size-4 text-primary" />
                                    <span>Gambar Banner / Thumbnail</span>
                                </CardTitle>
                                <CardDescription>
                                    Format landscape disarankan (16:9 atau 21:9, min. 1200x600px).
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
                                <label className="text-xs font-medium text-foreground">URL Gambar Banner</label>
                                <Input
                                    type="url"
                                    placeholder="https://images.unsplash.com/... atau /images/banner.jpg"
                                    value={typeof data.thumbnail === 'string' ? data.thumbnail : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setData('thumbnail', val);
                                        setPreviewUrl(val || null);
                                    }}
                                    className="text-xs"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Tempelkan tautan HTTPS langsung ke gambar banner.
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
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                        <Upload className="size-6" />
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                        Klik untuk mengganti gambar atau seret file ke sini
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Mendukung format WEBP, PNG, JPG (Maks. 5MB)
                                    </p>
                                </div>
                            </div>
                        )}

                        {errors.thumbnail && (
                            <p className="text-xs text-destructive font-medium">{errors.thumbnail}</p>
                        )}

                        {/* Image Preview Box */}
                        {previewUrl && (
                            <div className="relative mt-4 rounded-xl overflow-hidden border bg-muted group max-w-xl mx-auto shadow-sm">
                                <div className="aspect-[16/7] w-full overflow-hidden flex items-center justify-center">
                                    <img
                                        src={previewUrl}
                                        alt={data.title || 'Pratinjau Banner'}
                                        className="size-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                </div>
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
                            <span>Teks Banner Dwibahasa</span>
                        </CardTitle>
                        <CardDescription>
                            Isi judul tajuk dan deskripsi singkat dalam Bahasa Indonesia &amp; Inggris.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="id" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-xs mb-4">
                                <TabsTrigger value="id" className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[10px] py-0 px-1">ID</Badge>
                                    <span>Bahasa Indonesia</span>
                                </TabsTrigger>
                                <TabsTrigger value="en" className="flex items-center gap-1.5">
                                    <Badge variant="secondary" className="text-[10px] py-0 px-1">EN</Badge>
                                    <span>English</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Bahasa Indonesia Content */}
                            <TabsContent value="id" className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                                        <span>Judul Banner (ID)</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="cth. Koleksi Eksklusif Oud & Amber"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="text-xs font-semibold"
                                    />
                                    {errors.title && (
                                        <p className="text-xs text-destructive font-medium">{errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Deskripsi Subtitle (ID)
                                    </label>
                                    <Textarea
                                        rows={3}
                                        placeholder="cth. Jelajahi keharuman mewah khas Timur Tengah yang diracik khusus untuk memikat setiap indra."
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="text-xs"
                                    />
                                    {errors.description && (
                                        <p className="text-xs text-destructive font-medium">{errors.description}</p>
                                    )}
                                </div>
                            </TabsContent>

                            {/* English Content */}
                            <TabsContent value="en" className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Judul Banner (EN)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Exclusive Oud & Amber Collection"
                                        value={data.title_en}
                                        onChange={(e) => setData('title_en', e.target.value)}
                                        className="text-xs font-semibold"
                                    />
                                    {errors.title_en && (
                                        <p className="text-xs text-destructive font-medium">{errors.title_en}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-foreground">
                                        Deskripsi Subtitle (EN)
                                    </label>
                                    <Textarea
                                        rows={3}
                                        placeholder="e.g. Explore the luxurious Middle Eastern scents crafted exclusively to captivate every sense."
                                        value={data.description_en}
                                        onChange={(e) => setData('description_en', e.target.value)}
                                        className="text-xs"
                                    />
                                    {errors.description_en && (
                                        <p className="text-xs text-destructive font-medium">{errors.description_en}</p>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* 3. Link / Action Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <LinkIcon className="size-4 text-primary" />
                            <span>Tautan Tujuan (Link Tombol)</span>
                        </CardTitle>
                        <CardDescription>
                            Halaman yang akan dibuka saat pengunjung menekan tombol &ldquo;Belanja Sekarang&rdquo; atau mengklik banner.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">URL atau Path Tujuan</label>
                            <Input
                                type="text"
                                placeholder="/products atau /products?discount=1"
                                value={data.link}
                                onChange={(e) => setData('link', e.target.value)}
                                className="text-xs font-mono"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Gunakan path relatif seperti <code>/products</code>, <code>/products?discount=1</code>, atau URL lengkap.
                            </p>
                            {errors.link && (
                                <p className="text-xs text-destructive font-medium">{errors.link}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" size="default" asChild>
                        <Link href="/manajemen-slider-promo">Batal</Link>
                    </Button>
                    <Button type="submit" size="default" disabled={processing} className="cursor-pointer">
                        <Save className="size-4 mr-2" />
                        <span>{processing ? 'Menyimpan...' : 'Perbarui Slider Promo'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
