import React, { useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { getStorefrontUrl } from '@/lib/route-resolver';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Image,
    Boxes,
    Save,
    ExternalLink,
    Upload,
    Check,
    Tags,
    Sparkles,
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
    id?: number;
    name: string;
    volume: number | string;
    price: number | string;
    original_price: number | string;
    discount_percent: number | string;
    sku: string;
    stock: number | string;
}

interface ProductDetailProps {
    id: number;
    name: string;
    slug: string;
    category_id?: number | null;
    category_ids?: number[];
    categories?: Array<{ id: number; name: string; type?: string }>;
    brand_id: number | null;
    description: string | null;
    description_en?: string | null;
    is_new_arrivals?: boolean;
    is_best_sellers?: boolean;
    is_special_offers?: boolean;
    images: string[];
    variants: VariantFormItem[];
}

interface UploadedPreview {
    file: File;
    previewUrl: string;
}

interface ProductEditProps {
    product: ProductDetailProps;
    categories: CategoryOption[];
    brands: BrandOption[];
}

export default function AdminProductEdit({
    product,
    categories = [],
    brands = [],
}: ProductEditProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [newImagePreviews, setNewImagePreviews] = useState<UploadedPreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        name: string;
        slug: string;
        category_ids: number[];
        brand_id: string;
        description: string;
        description_en: string;
        is_new_arrivals: boolean;
        is_best_sellers: boolean;
        is_special_offers: boolean;
        existing_images: string[];
        images: File[];
        variants: VariantFormItem[];
    }>({
        _method: 'put',
        name: product.name || '',
        slug: product.slug || '',
        category_ids: product.category_ids && product.category_ids.length > 0
            ? product.category_ids
            : (product.categories ? product.categories.map((c) => c.id) : (product.category_id ? [product.category_id] : [])),
        brand_id: product.brand_id ? String(product.brand_id) : '',
        description: product.description || '',
        description_en: product.description_en || '',
        is_new_arrivals: Boolean(product.is_new_arrivals),
        is_best_sellers: Boolean(product.is_best_sellers),
        is_special_offers: Boolean(product.is_special_offers),
        existing_images: product.images || [],
        images: [],
        variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            volume: v.volume,
            price: v.price,
            original_price: v.original_price ?? '',
            discount_percent: v.discount_percent ?? '',
            sku: v.sku ?? '',
            stock: v.stock,
        })),
    });

    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleFilesSelected = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newPreviews: UploadedPreview[] = [];
        const newFilesList: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            newPreviews.push({
                file,
                previewUrl: URL.createObjectURL(file),
            });
            newFilesList.push(file);
        }
        setNewImagePreviews((prev) => [...prev, ...newPreviews]);
        setData('images', [...data.images, ...newFilesList]);
    };

    const handleRemoveExistingImage = (index: number) => {
        const updated = data.existing_images.filter((_, i) => i !== index);
        setData('existing_images', updated);
    };

    const handleRemoveNewFile = (index: number) => {
        const updatedPreviews = [...newImagePreviews];
        const removed = updatedPreviews.splice(index, 1);
        if (removed[0]) {
            URL.revokeObjectURL(removed[0].previewUrl);
        }
        setNewImagePreviews(updatedPreviews);

        const updatedFiles = [...data.images];
        updatedFiles.splice(index, 1);
        setData('images', updatedFiles);
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

        // Auto-calculate discount if original_price & price change
        if (field === 'price' || field === 'original_price') {
            const p = parseInt(String(field === 'price' ? value : currentVariant.price)) || 0;
            const op = parseInt(String(field === 'original_price' ? value : currentVariant.original_price)) || 0;
            if (op > p && p > 0) {
                currentVariant.discount_percent = Math.round(((op - p) / op) * 100);
            } else if (op <= p) {
                currentVariant.discount_percent = '';
            }
        }

        newVariants[index] = currentVariant;
        setData('variants', newVariants);
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

    const handleNameChange = (nameValue: string) => {
        setData((prev) => ({
            ...prev,
            name: nameValue,
            slug: prev.slug === '' || prev.slug === slugify(prev.name) ? slugify(nameValue) : prev.slug,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/manajemen-produk/${product.id}`, {
            forceFormData: true,
        });
    };

    const handleDeleteProduct = () => {
        setIsDeleting(true);
        router.delete(`/manajemen-produk/${product.id}`, {
            onFinish: () => setIsDeleting(false),
        });
    };

    const totalImagesCount = data.existing_images.length + newImagePreviews.length;

    return (
        <AdminLayout
            title={`Edit Produk: ${product.name}`}
            subtitle="Perbarui data parfum, foto galeri, serta varian ukuran dan stok."
        >
            <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link href="/manajemen-produk" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Katalog</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={getStorefrontUrl(`/products/${product.slug}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5"
                            >
                                <span>Lihat di Toko</span>
                                <ExternalLink className="size-3.5" />
                            </a>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteModal(true)}
                            className="text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                            <Trash2 className="size-3.5 mr-1" />
                            <span>Hapus</span>
                        </Button>

                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Perbarui Produk'}</span>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5 lg:col-span-2">
                                <label className="font-medium text-foreground">Nama Parfum *</label>
                                <Input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="h-9"
                                    required
                                />
                                {errors.name && <p className="text-destructive text-[11px]">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5 lg:col-span-2">
                                <label className="font-medium text-foreground">URL Slug</label>
                                <Input
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', slugify(e.target.value))}
                                    className="h-9 font-mono"
                                />
                                {errors.slug && <p className="text-destructive text-[11px]">{errors.slug}</p>}
                            </div>

                            <div className="space-y-3 lg:col-span-4 p-4 rounded-xl border border-border bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                            <Tags className="size-4 text-primary" />
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
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                                            isSelected
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
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                                            isSelected
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
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                                            isSelected
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
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                                            isSelected
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

                            <div className="space-y-1.5 lg:col-span-2">
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

                            {/* Section: Tag & Highlight Produk */}
                            <div className="space-y-3 lg:col-span-6 pt-3 border-t border-border/70">
                                <div>
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="size-3.5 text-amber-500" />
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
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                                            data.is_new_arrivals
                                                ? 'bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/20'
                                                : 'bg-card hover:bg-muted/40 border-border/70'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.is_new_arrivals}
                                            onChange={(e) => setData('is_new_arrivals', e.target.checked)}
                                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-xs text-foreground">New Arrivals</span>
                                                <Badge className="text-[9px] bg-emerald-600 hover:bg-emerald-600 text-white border-0 py-0 h-4">
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
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                                            data.is_best_sellers
                                                ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-950/20'
                                                : 'bg-card hover:bg-muted/40 border-border/70'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.is_best_sellers}
                                            onChange={(e) => setData('is_best_sellers', e.target.checked)}
                                            className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-xs text-foreground">Best Sellers</span>
                                                <Badge className="text-[9px] bg-amber-500 hover:bg-amber-500 text-amber-950 font-bold border-0 py-0 h-4">
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
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                                            data.is_special_offers
                                                ? 'bg-[#4A070B]/10 border-[#4A070B]/40 dark:bg-rose-950/20'
                                                : 'bg-card hover:bg-muted/40 border-border/70'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.is_special_offers}
                                            onChange={(e) => setData('is_special_offers', e.target.checked)}
                                            className="mt-0.5 rounded text-[#4A070B] focus:ring-[#4A070B]"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-xs text-foreground">Special Offers</span>
                                                <Badge className="text-[9px] bg-[#4A070B] hover:bg-[#4A070B] text-white border-0 py-0 h-4">
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

                            <div className="lg:col-span-4 pt-2 border-t border-border">
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

                {/* Card 2: Galeri Foto */}
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
                        {totalImagesCount === 0 ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                                    isDragging
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
                                {/* Existing Images */}
                                {data.existing_images.map((imgUrl, idx) => (
                                    <div
                                        key={`existing-${idx}`}
                                        className="group relative rounded-lg border bg-muted overflow-hidden aspect-square flex items-center justify-center"
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`Foto tersimpan ${idx + 1}`}
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
                                            onClick={() => handleRemoveExistingImage(idx)}
                                            className="absolute top-2 right-2 size-7 opacity-90 hover:opacity-100 shadow-sm"
                                            title="Hapus foto ini"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white px-2 py-1 truncate">
                                            Tersimpan #{idx + 1}
                                        </div>
                                    </div>
                                ))}

                                {/* New Uploaded Previews */}
                                {newImagePreviews.map((img, idx) => (
                                    <div
                                        key={`new-${idx}`}
                                        className="group relative rounded-lg border bg-muted overflow-hidden aspect-square flex items-center justify-center border-primary/40 ring-1 ring-primary/20"
                                    >
                                        <img
                                            src={img.previewUrl}
                                            alt={`Foto baru ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {data.existing_images.length === 0 && idx === 0 && (
                                            <Badge className="absolute top-2 left-2 text-[10px] bg-primary text-primary-foreground font-semibold shadow-xs">
                                                Utama
                                            </Badge>
                                        )}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleRemoveNewFile(idx)}
                                            className="absolute top-2 right-2 size-7 opacity-90 hover:opacity-100 shadow-sm"
                                            title="Hapus foto baru ini"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                        <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-[10px] text-primary-foreground px-2 py-1 truncate">
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
                                    className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center aspect-square transition-all cursor-pointer ${
                                        isDragging
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
                        {errors.existing_images && <p className="text-destructive text-xs">{errors.existing_images}</p>}
                    </CardContent>
                </Card>

                {/* Card 3: Varian Ukuran & Stok */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">3. Varian Ukuran &amp; Stok</CardTitle>
                            <CardDescription>Atur volume, harga jual, harga coret, dan stok tiap varian.</CardDescription>
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
                                <div key={idx} className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold">
                                            Varian #{idx + 1}{variant.name ? ` - ${variant.name}` : ''}{variant.volume ? ` (${variant.volume}ml)` : ''} {variant.id ? `(ID: ${variant.id})` : '(Varian Baru)'}
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
                                            <label className="font-medium text-foreground">Harga Coret (Rp)</label>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="cth: 1800000 (opsional)"
                                                value={variant.original_price}
                                                onChange={(e) => handleVariantChange(idx, 'original_price', e.target.value)}
                                                className="h-8 text-xs"
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

                {/* Bottom Actions */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/manajemen-produk">Batal</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing}>
                        <Save className="size-4 mr-1.5" />
                        <span>{processing ? 'Menyimpan...' : 'Perbarui Produk'}</span>
                    </Button>
                </div>
            </form>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    onClick={() => setShowDeleteModal(false)}
                >
                    <Card
                        className="max-w-sm w-full p-6 space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                            <Trash2 className="size-5" />
                        </div>

                        <div className="text-center space-y-1.5">
                            <h3 className="font-semibold text-sm text-foreground">
                                Hapus Produk Ini?
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Apakah Anda yakin ingin menghapus <span className="font-medium text-foreground">"{product.name}"</span>? Seluruh varian dan foto galeri akan dihapus permanen.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                                onClick={handleDeleteProduct}
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </AdminLayout>
    );
}
