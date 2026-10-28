import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { getStorefrontUrl } from '@/lib/route-resolver';
import {
    Search,
    Plus,
    Package,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    RefreshCw,
    Edit3,
    Trash2,
    ExternalLink,
    Boxes,
    X,
} from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatVolume } from '@/lib/utils';

interface ProductVariantItem {
    id: number;
    name: string;
    volume: string | number;
    price: number;
    price_formatted: string;
    original_price?: number | null;
    original_price_formatted?: string | null;
    discount_percent?: number | null;
    sku?: string | null;
    stock: number;
    in_stock: boolean;
}

interface ProductItem {
    id: number;
    name: string;
    slug: string;
    category?: { id: number; name: string; type?: string } | null;
    categories?: Array<{ id: number; name: string; type?: string }>;
    brand?: { id: number; name: string } | null;
    description?: string | null;
    primary_image: string;
    images_count: number;
    total_stock: number;
    min_price: number;
    min_price_formatted: string;
    max_price: number;
    max_price_formatted: string;
    variants: ProductVariantItem[];
    variants_count: number;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ProductsIndexProps {
    products: {
        data: ProductItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    categories: Array<{ id: number; name: string; type?: string }>;
    brands: Array<{ id: number; name: string }>;
    filters: {
        search: string;
        category_id: string | number;
        brand_id: string | number;
        stock_filter: string;
    };
    metrics: {
        total_products: number;
        total_variants: number;
        low_stock_count: number;
        out_of_stock_count: number;
        total_categories: number;
        total_brands: number;
    };
}

export default function AdminProductsIndex({
    products,
    categories = [],
    brands = [],
    filters,
    metrics,
}: ProductsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(String(filters.category_id || 'all'));
    const [selectedBrand, setSelectedBrand] = useState(String(filters.brand_id || 'all'));
    const [selectedStockFilter, setSelectedStockFilter] = useState(filters.stock_filter || 'all');

    const [quickStockTarget, setQuickStockTarget] = useState<{
        productId: number;
        productName: string;
        variant: ProductVariantItem;
    } | null>(null);
    const [newStockValue, setNewStockValue] = useState<number>(0);
    const [isSavingStock, setIsSavingStock] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const applyFilters = (newValues: Record<string, string | number | undefined>) => {
        router.get(
            '/manajemen-produk',
            {
                search: newValues.search !== undefined ? newValues.search : (search || undefined),
                category_id: newValues.category_id !== undefined ? (newValues.category_id !== 'all' ? newValues.category_id : undefined) : (selectedCategory !== 'all' ? selectedCategory : undefined),
                brand_id: newValues.brand_id !== undefined ? (newValues.brand_id !== 'all' ? newValues.brand_id : undefined) : (selectedBrand !== 'all' ? selectedBrand : undefined),
                stock_filter: newValues.stock_filter !== undefined ? (newValues.stock_filter !== 'all' ? newValues.stock_filter : undefined) : (selectedStockFilter !== 'all' ? selectedStockFilter : undefined),
            },
            { preserveState: true }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        setSelectedBrand('all');
        setSelectedStockFilter('all');
        router.get('/manajemen-produk');
    };

    const handleQuickStockSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickStockTarget) return;

        setIsSavingStock(true);
        router.patch(
            `/manajemen-produk/${quickStockTarget.productId}/variants/${quickStockTarget.variant.id}/stock`,
            { stock: newStockValue },
            {
                onSuccess: () => setQuickStockTarget(null),
                onFinish: () => setIsSavingStock(false),
            }
        );
    };

    const handleDeleteProduct = () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        router.delete(`/manajemen-produk/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AdminLayout
            title="Katalog Produk"
            subtitle="Kelola koleksi parfum, harga varian, dan inventaris stok."
        >
            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                            <Package className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_products}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.total_categories} Kategori &bull; {metrics.total_brands} Brand
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Varian</CardTitle>
                            <Boxes className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_variants}</div>
                            <p className="text-xs text-muted-foreground mt-1">Volume 50ml, 100ml, dll</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-colors ${selectedStockFilter === 'low_stock' ? 'border-primary ring-1 ring-primary' : ''}`}
                        onClick={() => {
                            const val = selectedStockFilter === 'low_stock' ? 'all' : 'low_stock';
                            setSelectedStockFilter(val);
                            applyFilters({ stock_filter: val });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Stok Menipis (&le; 10)</CardTitle>
                            <AlertTriangle className="size-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.low_stock_count}</div>
                            <p className="text-xs text-muted-foreground mt-1">Perlu ditambah</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-colors ${selectedStockFilter === 'out_of_stock' ? 'border-destructive ring-1 ring-destructive' : ''}`}
                        onClick={() => {
                            const val = selectedStockFilter === 'out_of_stock' ? 'all' : 'out_of_stock';
                            setSelectedStockFilter(val);
                            applyFilters({ stock_filter: val });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-destructive">Stok Habis (0)</CardTitle>
                            <XCircle className="size-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{metrics.out_of_stock_count}</div>
                            <p className="text-xs text-muted-foreground mt-1">Tidak dapat dibeli</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Action Card */}
                <Card className="p-4">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearchSubmit} className="flex-1 w-full lg:max-w-md flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama parfum, slug, SKU..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9">
                                Cari
                            </Button>
                        </form>

                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                            <Select
                                value={selectedCategory}
                                onValueChange={(val) => {
                                    setSelectedCategory(val);
                                    applyFilters({ category_id: val });
                                }}
                            >
                                <SelectTrigger className="h-9 w-[180px] text-xs">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            <div className="flex items-center gap-1.5">
                                                <span>{c.name}</span>
                                                {c.type && (
                                                    <span className="text-[10px] text-muted-foreground uppercase opacity-75">
                                                        ({c.type})
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={selectedBrand}
                                onValueChange={(val) => {
                                    setSelectedBrand(val);
                                    applyFilters({ brand_id: val });
                                }}
                            >
                                <SelectTrigger className="h-9 w-[160px] text-xs">
                                    <SelectValue placeholder="Semua Brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Brand</SelectItem>
                                    {brands.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {(search !== '' || selectedCategory !== 'all' || selectedBrand !== 'all' || selectedStockFilter !== 'all') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-9"
                                    title="Reset Filter"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" asChild className="h-9">
                                <Link href="/manajemen-produk/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Produk</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Table Card */}
                <Card className='py-0'>
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium">Parfum &amp; Foto</th>
                                    <th className="h-10 px-4 text-left font-medium">Brand</th>
                                    <th className="h-10 px-4 text-left font-medium">Kategori</th>
                                    <th className="h-10 px-4 text-left font-medium">Varian &amp; Harga</th>
                                    <th className="h-10 px-4 text-center font-medium">Total Stok</th>
                                    <th className="h-10 px-4 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-xs">
                                {products.data.map((product) => (
                                    <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={product.primary_image}
                                                    alt={product.name}
                                                    className="size-12 rounded-md object-cover border bg-muted shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/manajemen-produk/${product.id}/edit`}
                                                        className="font-medium text-foreground hover:underline block"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                                        /{product.slug}
                                                    </div>
                                                    <a
                                                        href={getStorefrontUrl(`/products/${product.slug}`)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
                                                    >
                                                        <span>Lihat Toko</span>
                                                        <ExternalLink className="size-2.5" />
                                                    </a>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4 whitespace-nowrap align-middle">
                                            {product.brand?.name ? (
                                                <span className="font-medium text-foreground">
                                                    {product.brand.name}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>

                                        <td className="p-4 align-middle">
                                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                                                {product.categories && product.categories.length > 0 ? (
                                                    product.categories.map((c) => (
                                                        <Badge
                                                            key={c.id}
                                                            variant="secondary"
                                                            className={`text-[10px] px-1.5 py-0 border ${
                                                                c.type === 'genders'
                                                                    ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
                                                                    : c.type === 'concentrates'
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                                                    : c.type === 'scents'
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {c.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                        {product.category?.name || 'Tanpa Kategori'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-4 align-middle">
                                            <div className="space-y-1.5 max-w-sm">
                                                {product.variants.map((v) => (
                                                    <div
                                                        key={v.id}
                                                        className="p-1.5 rounded-md border bg-muted/30 flex items-center justify-between gap-2 text-xs"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                                                {formatVolume(v.volume)}
                                                            </Badge>
                                                            <span className="font-medium">{v.price_formatted}</span>
                                                            {v.discount_percent && (
                                                                <Badge variant="destructive" className="px-1 py-0 text-[9px]">
                                                                    -{v.discount_percent}%
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setQuickStockTarget({
                                                                    productId: product.id,
                                                                    productName: product.name,
                                                                    variant: v,
                                                                });
                                                                setNewStockValue(v.stock);
                                                            }}
                                                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${v.stock <= 0
                                                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                                    : v.stock <= 10
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            title="Klik untuk ubah stok"
                                                        >
                                                            {v.stock} unit
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>

                                        <td className="p-4 whitespace-nowrap align-middle text-center">
                                            <Badge
                                                variant={product.total_stock <= 0 ? 'destructive' : product.total_stock <= 10 ? 'outline' : 'secondary'}
                                                className={product.total_stock > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                            >
                                                {product.total_stock <= 0 ? 'Habis' : `${product.total_stock} unit`}
                                            </Badge>
                                        </td>

                                        <td className="p-4 whitespace-nowrap align-middle text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="outline" size="sm" asChild className="h-8">
                                                    <Link href={`/manajemen-produk/${product.id}/edit`}>
                                                        <Edit3 className="size-3.5 mr-1" />
                                                        <span>Edit</span>
                                                    </Link>
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteTarget(product)}
                                                    className="size-8 text-destructive hover:bg-destructive/10"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {products.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            Tidak ada produk yang sesuai filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products.links.length > 3 && (
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div>
                                Menampilkan <span className="font-medium text-foreground">{products.from || 0}</span> sampai{' '}
                                <span className="font-medium text-foreground">{products.to || 0}</span> dari{' '}
                                <span className="font-medium text-foreground">{products.total}</span> produk
                            </div>

                            <div className="flex items-center gap-1">
                                {products.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className="px-2.5 py-1 rounded border text-muted-foreground/40 text-xs"
                                            />
                                        );
                                    }
                                    return (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            asChild
                                            className="h-8 px-2.5 text-xs"
                                        >
                                            <Link
                                                href={link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Stock Modal */}
            {quickStockTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setQuickStockTarget(null)}
                >
                    <Card className="max-w-xs w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-sm font-semibold">Ubah Stok Varian</CardTitle>
                                <CardDescription className="text-xs">{quickStockTarget.variant.name} ({formatVolume(quickStockTarget.variant.volume)})</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setQuickStockTarget(null)} className="size-7">
                                <X className="size-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleQuickStockSave} className="space-y-3 text-xs">
                                <div className="space-y-1">
                                    <label className="font-medium">Stok Unit:</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={newStockValue}
                                        onChange={(e) => setNewStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="h-9"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setQuickStockTarget(null)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isSavingStock}>
                                        {isSavingStock ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
                    onClick={() => setDeleteTarget(null)}
                >
                    <Card className="max-w-sm w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Hapus Produk?</CardTitle>
                            <CardDescription>
                                Apakah Anda yakin ingin menghapus parfum "{deleteTarget.name}"? Seluruh varian dan galeri terkait akan dihapus.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                                onClick={handleDeleteProduct}
                            >
                                {isDeleting ? 'Menghapus...' : 'Hapus'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AdminLayout>
    );
}
