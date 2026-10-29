import React, { useState, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Image,
    Boxes,
    Save,
    Upload,
    Check,
    Tags,
    Sparkles,
    Clock,
    FileEdit,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TextEditor } from '@/components/ui/text-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface CategoryOption {
    id: number;
    name: string;
    type?: string;
}

interface BrandOption {
    id: number;
    name: string;
}

interface VariantFormItem {
    name: string;
    volume: number | string;
    price: number | string;
    original_price?: number | string;
    discount_percent: number | string;
    discount_price?: number | string;
    sku: string;
    stock: number | string;
}

interface ProductCreateProps {
    categories: CategoryOption[];
    brands: BrandOption[];
}

interface UploadedPreview {
    file: File;
    previewUrl: string;
}

export default function AdminProductCreate({
    categories = [],
    brands = [],
}: ProductCreateProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [imagePreviews, setImagePreviews] = useState<UploadedPreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const { data, setData, post, processing, errors, transform } = useForm<{
        name: string;
        slug: string;
        category_ids: number[];
        brand_id: string;
        description: string;
        description_en: string;
        is_new_arrivals: boolean;
        is_best_sellers: boolean;
        is_special_offers: boolean;
        is_draft: boolean;
        images: File[];
        variants: VariantFormItem[];
    }>({
        name: '',
        slug: '',
        category_ids: [],
        brand_id: brands.length > 0 ? String(brands[0].id) : '',
        description: '',
        description_en: '',
        is_new_arrivals: false,
        is_best_sellers: false,
        is_special_offers: false,
        is_draft: false,
        images: [],
        variants: [
            {
                name: '',
                volume: '',
                price: '',
                original_price: '',
                discount_percent: '',
                discount_price: '',
                sku: '',
                stock: '',
            },
        ],
    });

    const handleFilesSelected = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newItems: UploadedPreview[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            newItems.push({
                file,
                previewUrl: URL.createObjectURL(file),
            });
        }
        const updated = [...imagePreviews, ...newItems];
        setImagePreviews(updated);
        setData('images', updated.map((item) => item.file));
    };

    const handleRemoveFile = (index: number) => {
        const updated = [...imagePreviews];
        const removed = updated.splice(index, 1);
        if (removed[0]) {
            URL.revokeObjectURL(removed[0].previewUrl);
        }
        setImagePreviews(updated);
        setData('images', updated.map((item) => item.file));
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelected(e.dataTransfer.files);
        }
    };

    const handleAddVariant = () => {
        const newVariant: VariantFormItem = {
            name: '',
            volume: '',
            price: '',
            original_price: '',
            discount_percent: '',
            discount_price: '',
            sku: '',
            stock: '',
        };
        setData('variants', [...data.variants, newVariant]);
    };

    const handleRemoveVariant = (index: number) => {
        if (data.variants.length <= 1) return;
        const newVariants = [...data.variants];
        newVariants.splice(index, 1);
        setData('variants', newVariants);
    };

    const handleVariantChange = (
        index: number,
        field: keyof VariantFormItem,
        value: string | number
    ) => {
        const newVariants = [...data.variants];
        const currentVariant = { ...newVariants[index], [field]: value };

        if (field === 'price') {
            const p = parseInt(String(value)) || 0;
            const discPercent = parseInt(String(currentVariant.discount_percent)) || 0;
            const discPrice = parseInt(String(currentVariant.discount_price)) || 0;

            if (p > 0) {
                if (discPercent > 0) {
                    currentVariant.discount_price = Math.round(p * (1 - discPercent / 100));
                } else if (discPrice > 0 && discPrice < p) {
                    currentVariant.discount_percent = Math.round(((p - discPrice) / p) * 100);
                }
            } else {
                currentVariant.discount_percent = '';
                currentVariant.discount_price = '';
            }
        } else if (field === 'discount_percent') {
            const rawVal = String(value).trim();
            if (rawVal === '') {
                currentVariant.discount_percent = '';
                currentVariant.discount_price = '';
            } else {
                const disc = Math.min(100, Math.max(0, parseInt(rawVal) || 0));
                currentVariant.discount_percent = disc > 0 ? disc : '';
                const p = parseInt(String(currentVariant.price)) || 0;
                if (p > 0 && disc > 0) {
                    currentVariant.discount_price = Math.round(p * (1 - disc / 100));
                } else {
                    currentVariant.discount_price = '';
                }
            }
        } else if (field === 'discount_price') {
            const rawVal = String(value).trim();
            if (rawVal === '') {
                currentVariant.discount_price = '';
                currentVariant.discount_percent = '';
            } else {
                const dp = parseInt(rawVal) || 0;
                currentVariant.discount_price = dp > 0 ? dp : '';
                const p = parseInt(String(currentVariant.price)) || 0;
                if (p > 0 && dp > 0 && dp < p) {
                    currentVariant.discount_percent = Math.round(((p - dp) / p) * 100);
                } else {
                    currentVariant.discount_percent = '';
                }
            }
        }

        newVariants[index] = currentVariant;
        setData('variants', newVariants);
    };

    const handleNameChange = (nameValue: string) => {
        setData((prev) => ({
            ...prev,
            name: nameValue,
            slug: prev.slug === '' || prev.slug === slugify(prev.name) ? slugify(nameValue) : prev.slug,
        }));
    };

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    };

    const toggleCategory = (id: number) => {
        setData('category_ids', data.category_ids.includes(id)
            ? data.category_ids.filter((catId) => catId !== id)
            : [...data.category_ids, id]
        );
    };

    const groupedCategories = React.useMemo(() => {
        const groups: Record<string, CategoryOption[]> = {
            genders: [],
            concentrates: [],
            scents: [],
            others: [],
        };
        categories.forEach((cat) => {
            const t = (cat.type || 'others').toLowerCase();
            if (groups[t]) {
                groups[t].push(cat);
            } else {
                groups.others.push(cat);
            }
        });
        return groups;
    }, [categories]);

    const handleSave = (asDraft: boolean) => {
        setData('is_draft', asDraft);
        transform((prev) => ({
            ...prev,
            is_draft: asDraft,
        }));
        post('/manajemen-produk', {
            forceFormData: true,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave(data.is_draft);
    };

    return (
        <AdminLayout
            title="Tambah Produk"
            subtitle="Buat produk baru beserta varian ukuran dan upload foto galeri."
        >
            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link href="/manajemen-produk" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Katalog</span>
                        </Link>
                    </Button>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/manajemen-produk">Batal</Link>
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={processing}
                            onClick={() => handleSave(true)}
                            className="border border-border text-amber-700 dark:text-amber-400"
                        >
                            <FileEdit className="size-4 mr-1.5" />
                            <span>Simpan Draft</span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={processing}
                            onClick={() => handleSave(false)}
                            className="bg-[#4A070B] hover:bg-[#380508] text-white"
                        >
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan & Publikasikan'}</span>
                        </Button>
                    </div>
                </div>

                {/* Card 1: Informasi Produk */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">1. Informasi Utama</CardTitle>
                        <CardDescription>Nama, URL slug, kategori, dan deskripsi parfum.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Nama Parfum *</label>
                                <Input
                                    type="text"
                                    placeholder="Contoh: Oud Impérial Royale"
                                    value={data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="h-9"
                                    required
                                />
                                {errors.name && <p className="text-destructive text-[11px]">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Brand</label>
                                <Select
                                    value={data.brand_id || undefined}
                                    onValueChange={(val) => setData('brand_id', val)}
                                >
                                    <SelectTrigger className="h-9 w-full text-xs">
                                        <SelectValue placeholder="Pilih Brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.brand_id && <p className="text-destructive text-[11px]">{errors.brand_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">URL Slug</label>
                                <Input
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', slugify(e.target.value))}
                                    className="h-9 font-mono"
                                    placeholder="oud-imperial-royale"
                                />
                                {errors.slug && <p className="text-destructive text-[11px]">{errors.slug}</p>}
                            </div>

                            {/* Multi-category Selector (Genders, Concentrates, Scents) */}
                            <div className="space-y-3 col-span-full pt-3 border-t border-border/70">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <span>Kategori Produk (Gender, Konsentrasi, Scent)</span>
                                        </label>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Pilih satu atau beberapa kategori untuk produk ini (bisa memilih gender, jenis konsentrasi, dan aroma).
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[11px]">
                                        {data.category_ids.length} dipilih
                                    </Badge>
                                </div>

                                {/* Section 1: Genders */}
                                {groupedCategories.genders.length > 0 && (
                                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Gender / Karakter Pengguna
                                        </span>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {groupedCategories.genders.map((c) => {
                                                const isSelected = data.category_ids.includes(c.id);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => toggleCategory(c.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected
                                                            ? 'bg-[#4A070B] text-white border-[#4A070B] shadow-xs'
                                                            : 'bg-card hover:bg-muted text-foreground border-border/80'
                                                            }`}
                                                    >
                                                        {isSelected && <Check className="size-3.5" />}
                                                        <span>{c.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Section 2: Concentrates */}
                                {groupedCategories.concentrates.length > 0 && (
                                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Konsentrasi Parfum
                                        </span>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {groupedCategories.concentrates.map((c) => {
                                                const isSelected = data.category_ids.includes(c.id);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => toggleCategory(c.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected
                                                            ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                                                            : 'bg-card hover:bg-muted text-foreground border-border/80'
                                                            }`}
                                                    >
                                                        {isSelected && <Check className="size-3.5" />}
                                                        <span>{c.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Section 3: Scents */}
                                {groupedCategories.scents.length > 0 && (
                                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Aroma / Scent Notes
                                        </span>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {groupedCategories.scents.map((c) => {
                                                const isSelected = data.category_ids.includes(c.id);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => toggleCategory(c.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected
                                                            ? 'bg-purple-800 text-white border-purple-800 shadow-xs'
                                                            : 'bg-card hover:bg-muted text-foreground border-border/80'
                                                            }`}
                                                    >
                                                        {isSelected && <Check className="size-3.5" />}
                                                        <span>{c.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Section 4: Others */}
                                {groupedCategories.others.length > 0 && (
                                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Kategori Lainnya
                                        </span>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {groupedCategories.others.map((c) => {
                                                const isSelected = data.category_ids.includes(c.id);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => toggleCategory(c.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected
                                                            ? 'bg-zinc-800 text-white border-zinc-800 shadow-xs'
                                                            : 'bg-card hover:bg-muted text-foreground border-border/80'
                                                            }`}
                                                    >
                                                        {isSelected && <Check className="size-3.5" />}
                                                        <span>{c.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {errors.category_ids && <p className="text-destructive text-[11px]">{errors.category_ids}</p>}
                            </div>

                            {/* Section: Tag & Highlight Produk */}
                            <div className="space-y-3 col-span-full pt-3 border-t border-border/70">
                                <div>
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <span>Highlight & Label Produk (Navbar & Badge)</span>
                                    </label>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Tentukan apakah produk ini masuk ke menu koleksi khusus dan mendapatkan badge label di card produk.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    {/* New Arrivals */}
                                    <div
                                        onClick={() => setData('is_new_arrivals', !data.is_new_arrivals)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${data.is_new_arrivals
                                            ? 'bg-[#176b62]/10 border-[#176b62]/50 dark:bg-[#176b62]/20'
                                            : 'bg-card hover:bg-muted/40 border-border/70'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.is_new_arrivals}
                                            onChange={(e) => setData('is_new_arrivals', e.target.checked)}
                                            className="mt-0.5 rounded text-[#176b62] focus:ring-[#176b62]"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-xs text-foreground">New Arrivals</span>
                                                <Badge className="text-[9px] bg-[#176b62] hover:bg-[#176b62] text-white border-0 py-0 h-4 font-medium">
                                                    Baru
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                Tampil di menu NEW ARRIVALS & tampilkan badge Baru pada foto produk.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Best Sellers */}
                                    <div
                                        onClick={() => setData('is_best_sellers', !data.is_best_sellers)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${data.is_best_sellers
                                            ? 'bg-[#c29a4a]/10 border-[#c29a4a]/50 dark:bg-[#c29a4a]/20'
                                            : 'bg-card hover:bg-muted/40 border-border/70'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.is_best_sellers}
                                            onChange={(e) => setData('is_best_sellers', e.target.checked)}
                                            className="mt-0.5 rounded text-[#c29a4a] focus:ring-[#c29a4a]"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-xs text-foreground">Best Sellers</span>
                                                <Badge className="text-[9px] bg-[#c29a4a] hover:bg-[#c29a4a] text-white font-medium border-0 py-0 h-4">
                                                    Terlaris
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                Tampil di menu BEST SELLERS & tampilkan badge Terlaris pada foto produk.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Special Offers */}
                                    <div
                                        onClick={() => setData('is_special_offers', !data.is_special_offers)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${data.is_special_offers
                                            ? 'bg-[#8c263e]/10 border-[#8c263e]/40 dark:bg-[#8c263e]/20'
                                            : 'bg-card hover:bg-muted/40 border-border/70'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.is_special_offers}
                                            onChange={(e) => setData('is_special_offers', e.target.checked)}
                                            className="mt-0.5 rounded text-[#8c263e] focus:ring-[#8c263e]"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-xs text-foreground">Special Offers</span>
                                                <Badge className="text-[9px] bg-[#8c263e] hover:bg-[#8c263e] text-white border-0 py-0 h-4 font-medium">
                                                    Spesial
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug">
                                                Tampil di menu SPECIAL OFFERS & tampilkan badge Spesial pada foto produk.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-full pt-2 border-t border-border">
                                <Tabs defaultValue="id" className="w-full">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="font-medium text-foreground">Deskripsi Parfum</label>
                                        <TabsList className="grid grid-cols-2 w-56 h-8">
                                            <TabsTrigger value="id" className="flex items-center gap-1.5 text-xs">
                                                <span className="text-sm">🇮🇩</span>
                                                <span>Indonesia</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="en" className="flex items-center gap-1.5 text-xs">
                                                <span className="text-sm">🇬🇧</span>
                                                <span>English</span>
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="id" className="space-y-1.5 mt-0">
                                        <TextEditor
                                            value={data.description}
                                            onChange={(val) => setData('description', val)}
                                            placeholder="Penjelasan aroma, piramida notes wewangian, dan karakter parfum dalam Bahasa Indonesia..."
                                            error={errors.description}
                                            minHeight="220px"
                                        />
                                        {errors.description && <p className="text-destructive text-[11px]">{errors.description}</p>}
                                    </TabsContent>

                                    <TabsContent value="en" className="space-y-1.5 mt-0">
                                        <TextEditor
                                            value={data.description_en}
                                            onChange={(val) => setData('description_en', val)}
                                            placeholder="Fragrance notes pyramid, olfactory character, and inspiration in English..."
                                            error={errors.description_en}
                                            minHeight="220px"
                                        />
                                        {errors.description_en && <p className="text-destructive text-[11px]">{errors.description_en}</p>}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2: Galeri Foto Produk */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">2. Galeri Foto Produk</CardTitle>
                        <CardDescription>Upload file foto botol parfum (JPG, PNG, WEBP). Foto pertama akan menjadi foto utama produk.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFilesSelected(e.target.files)}
                        />
                        {imagePreviews.length === 0 ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging
                                    ? 'border-primary bg-primary/5 scale-[0.99]'
                                    : 'border-muted-foreground/25 hover:border-primary/50 bg-muted/10 hover:bg-muted/20'
                                    }`}
                            >
                                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                                    <Upload className="size-6" />
                                </div>
                                <div className="text-sm font-semibold text-foreground">
                                    Klik atau seret foto ke sini untuk upload
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Bisa memilih atau seret beberapa file foto sekaligus (JPG, PNG, WEBP)
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {imagePreviews.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="group relative rounded-lg border bg-muted overflow-hidden aspect-square flex items-center justify-center"
                                    >
                                        <img
                                            src={img.previewUrl}
                                            alt={`Preview ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {idx === 0 && (
                                            <Badge className="absolute top-2 left-2 text-[10px] bg-primary text-primary-foreground font-semibold shadow-xs">
                                                Utama
                                            </Badge>
                                        )}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleRemoveFile(idx)}
                                            className="absolute top-2 right-2 size-7 opacity-90 hover:opacity-100 shadow-sm"
                                            title="Hapus foto ini"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white px-2 py-1 truncate">
                                            {img.file.name}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center aspect-square transition-all cursor-pointer ${isDragging
                                        ? 'border-primary bg-primary/10 text-primary scale-95'
                                        : 'border-muted-foreground/25 hover:border-primary/50 text-muted-foreground hover:text-foreground bg-muted/10 hover:bg-muted/20'
                                        }`}
                                >
                                    <Plus className="size-6 mb-1" />
                                    <span className="text-xs font-medium">Tambah Foto</span>
                                </button>
                            </div>
                        )}
                        {errors.images && <p className="text-destructive text-xs">{errors.images}</p>}
                    </CardContent>
                </Card>

                {/* Card 3: Varian Ukuran & Stok */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">3. Varian Ukuran &amp; Stok</CardTitle>
                            <CardDescription>Wajib memiliki minimal 1 varian. Volume boleh sama asalkan nama/edisi varian berbeda (cth: Varian Oren 50ml, Varian Hijau 50ml).</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddVariant} className="h-8">
                            <Plus className="size-3.5 mr-1" />
                            <span>Tambah Varian</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {errors.variants && (
                            <p className="text-xs text-destructive font-medium">{errors.variants}</p>
                        )}

                        <div className="space-y-3">
                            {data.variants.map((variant, idx) => (
                                <div key={idx} className="rounded-lg border p-4 space-y-3 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold">
                                            Varian #{idx + 1}{variant.name ? ` - ${variant.name}` : ''}{variant.volume ? ` (${variant.volume}ml)` : ''}
                                        </span>
                                        {data.variants.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveVariant(idx)}
                                                className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="size-3.5 mr-1" />
                                                <span>Hapus</span>
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                        <div className="space-y-1 lg:col-span-2">
                                            <label className="font-medium text-foreground">Label Varian *</label>
                                            <Input
                                                type="text"
                                                placeholder="cth: Varian Oren, 50ml Reguler, dll"
                                                value={variant.name}
                                                onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                                                className="h-8 text-xs"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-medium text-foreground">Volume (ml) *</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="cth: 50, 100"
                                                value={variant.volume}
                                                onChange={(e) => handleVariantChange(idx, 'volume', e.target.value)}
                                                className="h-8 text-xs font-medium"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-medium text-foreground">SKU</label>
                                            <Input
                                                type="text"
                                                placeholder="cth: SKU-001 (opsional)"
                                                value={variant.sku}
                                                onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-medium text-foreground">Harga Jual (Rp) *</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="cth: 1500000"
                                                value={variant.price}
                                                onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                                                className="h-8 text-xs font-semibold"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-medium text-foreground">Diskon (%)</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                placeholder="cth: 15"
                                                value={variant.discount_percent}
                                                onChange={(e) => handleVariantChange(idx, 'discount_percent', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-medium text-foreground">Harga Diskon (Rp)</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="cth: 1275000 (otomatis)"
                                                value={variant.discount_price ?? ''}
                                                onChange={(e) => handleVariantChange(idx, 'discount_price', e.target.value)}
                                                className="h-8 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-medium text-foreground">Stok Unit *</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="cth: 20"
                                                value={variant.stock}
                                                onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                                                className="h-8 text-xs font-semibold"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/manajemen-produk">Batal</Link>
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={processing}
                        onClick={() => handleSave(true)}
                        className="border border-border text-amber-700 dark:text-amber-400"
                    >
                        <FileEdit className="size-4 mr-1.5" />
                        <span>Simpan Draft</span>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={processing}
                        onClick={() => handleSave(false)}
                        className="bg-[#4A070B] hover:bg-[#380508] text-white"
                    >
                        <Save className="size-4 mr-1.5" />
                        <span>{processing ? 'Menyimpan...' : 'Simpan & Publikasikan'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
