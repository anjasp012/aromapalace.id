import React, { useState, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Save,
    Image,
    Clock,
    FileText,
    Upload,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TextEditor } from '@/components/ui/text-editor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function AdminArticleCreate() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);

    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        title_en: string;
        slug: string;
        thumbnail: File | string | null;
        read_time: string;
        excerpt: string;
        excerpt_en: string;
        content: string;
        content_en: string;
    }>({
        title: '',
        title_en: '',
        slug: '',
        thumbnail: null,
        read_time: '4 mnt',
        excerpt: '',
        excerpt_en: '',
        content: '',
        content_en: '',
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

    const handleTitleChange = (val: string) => {
        setData((prev) => ({
            ...prev,
            title: val,
            slug: prev.slug === '' || prev.slug === slugify(prev.title) ? slugify(val) : prev.slug,
        }));
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Silakan pilih file gambar (JPG, PNG, WEBP).');
            return;
        }
        setData('thumbnail', file);
        setPreviewUrl(URL.createObjectURL(file));
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
        post('/manajemen-artikel', {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout
            title="Tulis Artikel Baru"
            subtitle="Publikasikan panduan parfum, edukasi notes piramida, atau cerita di balik aroma."
        >
            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link href="/manajemen-artikel" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Jurnal</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/manajemen-artikel">Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Terbitkan Artikel'}</span>
                        </Button>
                    </div>
                </div>

                {/* Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Konten Artikel</CardTitle>
                        <CardDescription>Upload foto sampul, judul, ringkasan, dan isi narasi naskah jurnal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 text-xs">
                        {/* 1. Thumbnail Sampul Artikel (Drag & Drop Paling Atas) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-foreground text-xs">
                                    Foto Sampul Artikel (Thumbnail) *
                                </label>
                                <span className="text-[11px] text-muted-foreground">Format JPG, PNG, WEBP &bull; Tarik &amp; Lepas (Drag &amp; Drop)</span>
                            </div>

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
                                    className={`group relative w-full h-48 sm:h-64 rounded-xl border-2 overflow-hidden bg-muted transition-all ${
                                        isDragging ? 'border-primary ring-4 ring-primary/20 scale-[1.01]' : 'border-border/80'
                                    }`}
                                >
                                    <img
                                        src={previewUrl}
                                        alt="Preview Sampul"
                                        className="size-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />

                                    {/* Drag Overlay Hint when hovering with a new file */}
                                    {isDragging && (
                                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center text-primary-foreground font-semibold text-sm z-20">
                                            <Upload className="size-10 mb-2 animate-bounce" />
                                            <span>Lepaskan file untuk mengganti foto sampul</span>
                                        </div>
                                    )}

                                    {/* Hover Action Bar */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <div className="flex items-center justify-between text-white">
                                            <span className="text-xs font-medium truncate max-w-xs drop-shadow-sm">
                                                Foto Sampul Aktif &bull; Tarik file baru ke sini untuk ganti
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
                                                    <span>Pilih File Lain</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setPreviewUrl(null);
                                                        setData('thumbnail', '');
                                                    }}
                                                    className="h-8 text-xs cursor-pointer shadow-sm"
                                                >
                                                    Hapus Foto
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                                        isDragging
                                            ? 'border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01]'
                                            : 'border-muted-foreground/30 hover:border-primary/60 bg-muted/10 hover:bg-muted/20'
                                    }`}
                                >
                                    <div className={`size-14 rounded-full flex items-center justify-center mb-3 transition-transform ${
                                        isDragging ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        <Upload className="size-7" />
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                        Tarik &amp; Lepas (Drag &amp; Drop) foto sampul di sini
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Atau klik untuk memilih file dari komputer (JPG, PNG, WEBP)
                                    </div>
                                </div>
                            )}

                            {/* Optional External URL Toggle */}
                            <div className="flex items-center justify-between pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(!showUrlInput)}
                                    className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                                >
                                    {showUrlInput ? 'Sembunyikan input URL' : 'Atau gunakan tautan URL gambar online'}
                                </button>
                                {errors.thumbnail && <p className="text-destructive text-[11px]">{errors.thumbnail}</p>}
                            </div>

                            {showUrlInput && (
                                <div className="pt-1">
                                    <Input
                                        type="text"
                                        placeholder="https://images.unsplash.com/..."
                                        value={typeof data.thumbnail === 'string' ? data.thumbnail : ''}
                                        onChange={(e) => {
                                            setData('thumbnail', e.target.value);
                                            setPreviewUrl(e.target.value);
                                        }}
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 2. Permalink & Waktu Baca */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">URL Slug</label>
                                <Input
                                    type="text"
                                    placeholder="mengenal-piramida-aroma"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', slugify(e.target.value))}
                                    className="h-9 font-mono"
                                />
                                {errors.slug && <p className="text-destructive text-[11px]">{errors.slug}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Estimasi Waktu Baca</label>
                                <Input
                                    type="text"
                                    placeholder="Contoh: 4 mnt"
                                    value={data.read_time}
                                    onChange={(e) => setData('read_time', e.target.value)}
                                    className="h-9"
                                />
                                {errors.read_time && <p className="text-destructive text-[11px]">{errors.read_time}</p>}
                            </div>
                        </div>

                        {/* 3. Konten Dwibahasa (Tab Indonesia & Tab English) */}
                        <div className="pt-2 border-t border-border">
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
                                            <label className="font-medium text-foreground">Judul Artikel (Indonesia) *</label>
                                            <Badge variant="outline" className="text-[10px] py-0">🇮🇩 ID</Badge>
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="Contoh: Mengenal Piramida Aroma: Top, Heart, dan Base Notes"
                                            value={data.title}
                                            onChange={(e) => handleTitleChange(e.target.value)}
                                            className="h-9"
                                            required
                                        />
                                        {errors.title && <p className="text-destructive text-[11px]">{errors.title}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-medium text-foreground">Cuplikan Ringkasan (Indonesia) *</label>
                                            <Badge variant="outline" className="text-[10px] py-0">🇮🇩 ID</Badge>
                                        </div>
                                        <Textarea
                                            rows={2}
                                            placeholder="Ringkasan singkat 1-2 kalimat untuk kartu artikel dalam Bahasa Indonesia..."
                                            value={data.excerpt}
                                            onChange={(e) => setData('excerpt', e.target.value)}
                                            className="text-xs"
                                            required
                                        />
                                        {errors.excerpt && <p className="text-destructive text-[11px]">{errors.excerpt}</p>}
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                                        <div className="flex items-center justify-between">
                                            <label className="font-medium text-foreground">Isi Lengkap Artikel (Indonesia) *</label>
                                            <Badge variant="outline" className="text-[10px] py-0">🇮🇩 ID</Badge>
                                        </div>
                                        <TextEditor
                                            value={data.content}
                                            onChange={(val) => setData('content', val)}
                                            placeholder="Tulis narasi lengkap jurnal di sini..."
                                            error={errors.content}
                                        />
                                        {errors.content && <p className="text-destructive text-[11px]">{errors.content}</p>}
                                    </div>
                                </TabsContent>

                                {/* Tab English */}
                                <TabsContent value="en" className="space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-medium text-foreground">Article Title (English)</label>
                                            <Badge variant="outline" className="text-[10px] py-0">🇬🇧 EN</Badge>
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="e.g. Understanding The Fragrance Pyramid: Notes & Sillage"
                                            value={data.title_en}
                                            onChange={(e) => setData('title_en', e.target.value)}
                                            className="h-9"
                                        />
                                        {errors.title_en && <p className="text-destructive text-[11px]">{errors.title_en}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="font-medium text-foreground">Preview Excerpt (English)</label>
                                            <Badge variant="outline" className="text-[10px] py-0">🇬🇧 EN</Badge>
                                        </div>
                                        <Textarea
                                            rows={2}
                                            placeholder="Short 1-2 sentence preview in English..."
                                            value={data.excerpt_en}
                                            onChange={(e) => setData('excerpt_en', e.target.value)}
                                            className="text-xs"
                                        />
                                        {errors.excerpt_en && <p className="text-destructive text-[11px]">{errors.excerpt_en}</p>}
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                                        <div className="flex items-center justify-between">
                                            <label className="font-medium text-foreground">Full Article Content (English)</label>
                                            <Badge variant="outline" className="text-[10px] py-0">🇬🇧 EN</Badge>
                                        </div>
                                        <TextEditor
                                            value={data.content_en}
                                            onChange={(val) => setData('content_en', val)}
                                            placeholder="Write the full English article story here..."
                                            error={errors.content_en}
                                        />
                                        {errors.content_en && <p className="text-destructive text-[11px]">{errors.content_en}</p>}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/manajemen-artikel">Batal</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing}>
                        <Save className="size-4 mr-1.5" />
                        <span>{processing ? 'Menyimpan...' : 'Terbitkan Artikel'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
