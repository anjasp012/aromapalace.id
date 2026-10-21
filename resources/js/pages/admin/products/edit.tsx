import React, { useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Image,
    Boxes,
    Save,
    ExternalLink,
    Upload,
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

interface CategoryOption {
    id: number;
    name: string;
}

interface BrandOption {
    id: number;
    name: string;
}

interface VariantFormItem {
    id?: number;
    name: string;
    volume: string;
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
    category_id: number | null;
    brand_id: number | null;
    description: string | null;
    description_en?: string | null;
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

    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        name: string;
        slug: string;
        category_id: string;
        brand_id: string;
        description: string;
        description_en: string;
        existing_images: string[];
        images: File[];
        variants: VariantFormItem[];
    }>({
        _method: 'put',
        name: product.name || '',
        slug: product.slug || '',
        category_id: product.category_id ? String(product.category_id) : '',
        brand_id: product.brand_id ? String(product.brand_id) : '',
        description: product.description || '',
        description_en: product.description_en || '',
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

    const handleAddVariant = () => {
        const vol = `${(data.variants.length + 1) * 50}ml`;
        const newVariant: VariantFormItem = {
            name: `Edisi Koleksi (${vol})`,
            volume: vol,
            price: 1500000,
            original_price: '',
            discount_percent: '',
            sku: '',
            stock: 20,
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

    const handleNameChange = (nameValue: string) => {
        setData((prev) => ({
            ...prev,
            name: nameValue,
            slug: prev.slug === '' || prev.slug === slugify(prev.name) ? slugify(nameValue) : prev.slug,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/products/${product.id}`, {
            forceFormData: true,
        });
    };

    const handleDeleteProduct = () => {
        setIsDeleting(true);
        router.delete(`/products/${product.id}`, {
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
                        <Link href="/products" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Katalog</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={`/products/${product.slug}`}
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

                            <div className="space-y-1.5 lg:col-span-2">
                                <label className="font-medium text-foreground">Kategori</label>
                                <Select
                                    value={data.category_id || undefined}
                                    onValueChange={(val) => setData('category_id', val)}
                                >
                                    <SelectTrigger className="h-9 w-full text-xs">
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && <p className="text-destructive text-[11px]">{errors.category_id}</p>}
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

                            <div className="space-y-1.5 lg:col-span-2">
                                <div className="flex items-center justify-between">
                                    <label className="font-medium text-foreground">Deskripsi Parfum (Indonesia)</label>
                                    <Badge variant="outline" className="text-[10px] py-0">🇮🇩 ID</Badge>
                                </div>
                                <Textarea
                                    rows={4}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Penjelasan aroma, piramida notes wewangian, dan karakter parfum dalam Bahasa Indonesia..."
                                    className="min-h-24 text-xs"
                                />
                                {errors.description && <p className="text-destructive text-[11px]">{errors.description}</p>}
                            </div>

                            <div className="space-y-1.5 lg:col-span-2">
                                <div className="flex items-center justify-between">
                                    <label className="font-medium text-foreground">Deskripsi Parfum (English)</label>
                                    <Badge variant="outline" className="text-[10px] py-0">🇬🇧 EN</Badge>
                                </div>
                                <Textarea
                                    rows={4}
                                    value={data.description_en}
                                    onChange={(e) => setData('description_en', e.target.value)}
                                    placeholder="Fragrance notes pyramid, olfactory character, and inspiration in English..."
                                    className="min-h-24 text-xs"
                                />
                                {errors.description_en && <p className="text-destructive text-[11px]">{errors.description_en}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2: Galeri Foto */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">2. Galeri Foto Produk</CardTitle>
                            <CardDescription>Upload file foto botol parfum (JPG, PNG, WEBP). Foto pertama akan menjadi foto utama produk.</CardDescription>
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFilesSelected(e.target.files)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-8"
                            >
                                <Upload className="size-3.5 mr-1" />
                                <span>Pilih File Foto</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {totalImagesCount === 0 ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer bg-muted/10 hover:bg-muted/20"
                            >
                                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
                                    <Upload className="size-6" />
                                </div>
                                <div className="text-sm font-semibold text-foreground">Klik di sini untuk upload foto parfum</div>
                                <div className="text-xs text-muted-foreground mt-1">Bisa memilih beberapa file foto sekaligus (JPG, PNG, WEBP)</div>
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
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors rounded-lg flex flex-col items-center justify-center aspect-square text-muted-foreground hover:text-foreground bg-muted/10 hover:bg-muted/20 cursor-pointer"
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
                                            Varian #{idx + 1} ({variant.volume || 'Volume'}) {variant.id ? `(ID: ${variant.id})` : '(Varian Baru)'}
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
                                                value={variant.name}
                                                onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                                                className="h-8 text-xs"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-medium text-foreground">Volume Botol *</label>
                                            <Input
                                                type="text"
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
                        <Link href="/products">Batal</Link>
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
