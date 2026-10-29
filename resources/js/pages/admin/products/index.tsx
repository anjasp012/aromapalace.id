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
    RotateCcw,
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
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
    is_new_arrivals?: boolean;
    is_best_sellers?: boolean;
    is_special_offers?: boolean;
    is_draft?: boolean;
    created_at?: string;
    is_deleted?: boolean;
    deleted_at?: string;
    deleted_at_human?: string;
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
        status?: string;
    };
    metrics: {
        total_products: number;
        draft_count?: number;
        published_count?: number;
        total_variants: number;
        low_stock_count: number;
        out_of_stock_count: number;
        trashed_count?: number;
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
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const [quickStockTarget, setQuickStockTarget] = useState<{
        productId: number;
        productName: string;
        variant: ProductVariantItem;
    } | null>(null);
    const [newStockValue, setNewStockValue] = useState<number>(0);
    const [isSavingStock, setIsSavingStock] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
    const [forceDeleteTarget, setForceDeleteTarget] = useState<ProductItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isForceDeleting, setIsForceDeleting] = useState(false);
    const [restoringId, setRestoringId] = useState<number | null>(null);

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
                status: newValues.status !== undefined ? (newValues.status !== 'all' ? newValues.status : undefined) : (selectedStatus !== 'all' ? selectedStatus : undefined),
            },
            { preserveState: true }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        setSelectedBrand('all');
        setSelectedStockFilter('all');
        setSelectedStatus('all');
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

    const handleRestoreProduct = (product: ProductItem) => {
        setRestoringId(product.id);
        router.post(`/manajemen-produk/${product.id}/pulihkan`, {}, {
            onFinish: () => setRestoringId(null),
        });
    };

    const handleForceDeleteProduct = () => {
        if (!forceDeleteTarget) return;

        setIsForceDeleting(true);
        router.delete(`/manajemen-produk/${forceDeleteTarget.id}/hapus-permanen`, {
            onSuccess: () => setForceDeleteTarget(null),
            onFinish: () => setIsForceDeleting(false),
        });
    };

    return (
        <AdminLayout
            title="Katalog Produk"
            subtitle="Kelola koleksi parfum, harga varian, dan inventaris stok."
        >
            <Head title="Katalog Produk - Admin Panel" />

            <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Produk</span>
                                <Package className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_products}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.published_count ?? metrics.total_products} Terbit &bull; {metrics.draft_count ?? 0} Draft
                                {(metrics.trashed_count ?? 0) > 0 && (
                                    <span className="text-destructive font-semibold"> &bull; {metrics.trashed_count} Sampah</span>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="py-4">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Total Varian</span>
                                <Boxes className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">{metrics.total_variants}</div>
                            <p className="text-xs text-muted-foreground mt-1">Volume 50ml, 100ml, dll</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`py-4 cursor-pointer transition-all hover:border-amber-500/50 ${selectedStockFilter === 'low_stock' ? 'border-amber-500 ring-1 ring-amber-500' : ''}`}
                        onClick={() => {
                            const val = selectedStockFilter === 'low_stock' ? 'all' : 'low_stock';
                            setSelectedStockFilter(val);
                            applyFilters({ stock_filter: val });
                        }}
                    >
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Stok Menipis (&le; 10)</span>
                                <AlertTriangle className="size-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">{metrics.low_stock_count}</div>
                            <p className="text-xs text-muted-foreground mt-1">Perlu ditambah</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`py-4 cursor-pointer transition-all hover:border-destructive/50 ${selectedStockFilter === 'out_of_stock' ? 'border-destructive ring-1 ring-destructive' : ''}`}
                        onClick={() => {
                            const val = selectedStockFilter === 'out_of_stock' ? 'all' : 'out_of_stock';
                            setSelectedStockFilter(val);
                            applyFilters({ stock_filter: val });
                        }}
                    >
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-destructive">Stok Habis (0)</span>
                                <XCircle className="size-4 text-destructive" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-destructive">{metrics.out_of_stock_count}</div>
                            <p className="text-xs text-muted-foreground mt-1">Tidak dapat dibeli</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Tabs Navigation */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                        { key: 'all', label: 'Semua Produk', count: metrics.total_products },
                        { key: 'published', label: 'Publikasi', count: metrics.published_count ?? 0 },
                        { key: 'draft', label: 'Draft', count: metrics.draft_count ?? 0 },
                        ...((metrics.trashed_count && metrics.trashed_count > 0) || selectedStatus === 'trashed' ? [{
                            key: 'trashed',
                            label: 'Sampah',
                            count: metrics.trashed_count ?? 0,
                            isTrashed: true,
                        }] : []),
                    ].map((tab) => {
                        const isActive = selectedStatus === tab.key;
                        return (
                            <Button
                                key={tab.key}
                                type="button"
                                variant={isActive ? (tab.isTrashed ? 'destructive' : 'default') : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setSelectedStatus(tab.key);
                                    applyFilters({ status: tab.key });
                                }}
                                className={`h-8 gap-2 whitespace-nowrap text-xs cursor-pointer ${
                                    !isActive && tab.isTrashed ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : ''
                                }`}
                            >
                                {tab.isTrashed && <Trash2 className="size-3" />}
                                <span>{tab.label}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                                        isActive
                                            ? 'bg-primary-foreground text-primary'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </Button>
                        );
                    })}
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
                            <Button type="submit" size="sm" className="h-9 cursor-pointer">
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

                            <Select
                                value={selectedStockFilter}
                                onValueChange={(val) => {
                                    setSelectedStockFilter(val);
                                    applyFilters({ stock_filter: val });
                                }}
                            >
                                <SelectTrigger className="h-9 w-[160px] text-xs">
                                    <SelectValue placeholder="Semua Stok" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Stok</SelectItem>
                                    <SelectItem value="out_of_stock">Stok Habis ({metrics.out_of_stock_count ?? 0})</SelectItem>
                                    <SelectItem value="low_stock">Stok Menipis ({metrics.low_stock_count ?? 0})</SelectItem>
                                </SelectContent>
                            </Select>

                            {(search !== '' || selectedCategory !== 'all' || selectedBrand !== 'all' || selectedStockFilter !== 'all' || selectedStatus !== 'all') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-9 cursor-pointer"
                                    title="Reset Filter"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    <span>Reset</span>
                                </Button>
                            )}

                            <Button size="sm" asChild className="h-9 cursor-pointer">
                                <Link href="/manajemen-produk/create">
                                    <Plus className="size-4 mr-1.5" />
                                    <span>Tambah Produk</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Table Card */}
                <Card className="py-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="border-b bg-muted/50 text-muted-foreground">
                                <tr className="border-b transition-colors text-xs">
                                    <th className="h-10 px-4 text-left font-medium">Parfum &amp; Foto</th>
                                    <th className="h-10 px-4 text-left font-medium">Brand</th>
                                    <th className="h-10 px-4 text-left font-medium">Kategori</th>
                                    <th className="h-10 px-4 text-left font-medium">Label Produk</th>
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
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {product.is_draft ? (
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic">
                                                                (Draft &bull; Tidak tampil di toko)
                                                            </span>
                                                        ) : (
                                                            <a
                                                                href={getStorefrontUrl(`/products/${product.slug}`)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                                                            >
                                                                <span>Lihat Toko</span>
                                                                <ExternalLink className="size-2.5" />
                                                            </a>
                                                        )}
                                                    </div>
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

                                        <td className="p-4 align-middle whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div>
                                                    {product.is_deleted ? (
                                                        <Badge variant="destructive" className="text-[10px] gap-1 font-semibold">
                                                            <Trash2 className="size-3" />
                                                            Terhapus
                                                        </Badge>
                                                    ) : product.is_draft ? (
                                                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800 font-semibold gap-1">
                                                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            Draft
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800 font-semibold gap-1">
                                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                                            Publik
                                                        </Badge>
                                                    )}
                                                </div>
                                                {(product.is_new_arrivals || product.is_best_sellers || product.is_special_offers) && (
                                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                        {product.is_new_arrivals && (
                                                            <Badge className="text-[9px] bg-[#176b62] hover:bg-[#176b62] text-white border-0 py-0 h-4 font-medium">
                                                                New Arrival
                                                            </Badge>
                                                        )}
                                                        {product.is_best_sellers && (
                                                            <Badge className="text-[9px] bg-[#c29a4a] hover:bg-[#c29a4a] text-white border-0 py-0 h-4 font-medium">
                                                                Best Seller
                                                            </Badge>
                                                        )}
                                                        {product.is_special_offers && (
                                                            <Badge className="text-[9px] bg-[#8c263e] hover:bg-[#8c263e] text-white border-0 py-0 h-4 font-medium">
                                                                Special Offer
                                                            </Badge>
                                                        )}
                                                    </div>
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
                                                            <span className={v.discount_percent ? "font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1 py-0.2 rounded" : "font-medium"}>
                                                                {v.price_formatted}
                                                            </span>
                                                            {v.discount_percent && (
                                                                <Badge variant="destructive" className="px-1 py-0 text-[9px]">
                                                                    -{v.discount_percent}%
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={product.is_deleted}
                                                            onClick={() => {
                                                                setQuickStockTarget({
                                                                    productId: product.id,
                                                                    productName: product.name,
                                                                    variant: v,
                                                                });
                                                                setNewStockValue(v.stock);
                                                            }}
                                                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${product.is_deleted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${v.stock <= 0
                                                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                                    : v.stock <= 10
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            title={product.is_deleted ? "Produk di sampah" : "Klik untuk ubah stok"}
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
                                            {product.is_deleted ? (
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={restoringId === product.id}
                                                        onClick={() => handleRestoreProduct(product)}
                                                        className="h-8 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                                                        title="Pulihkan Produk"
                                                    >
                                                        <RotateCcw className={`size-3.5 mr-1 ${restoringId === product.id ? 'animate-spin' : ''}`} />
                                                        <span>Pulihkan</span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setForceDeleteTarget(product)}
                                                        className="h-8 text-xs cursor-pointer"
                                                        title="Hapus Total dari Database"
                                                    >
                                                        <Trash2 className="size-3.5 mr-1" />
                                                        <span>Hapus Total</span>
                                                    </Button>
                                                </div>
                                            ) : (
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
                                                        className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                        title="Hapus ke Sampah"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {products.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Package className="size-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium text-foreground">Tidak ada produk ditemukan</p>
                                                <p className="text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau filter yang dipilih.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products.links && products.links.length > 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t px-4 py-3 gap-3">
                            <div className="text-xs text-muted-foreground">
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
                                                className="px-2.5 py-1 text-xs text-muted-foreground/40 rounded border border-transparent"
                                            />
                                        );
                                    }
                                    return (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            asChild
                                            className="h-8 min-w-8 px-2.5 text-xs cursor-pointer"
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
            <Dialog open={Boolean(quickStockTarget)} onOpenChange={(open) => !open && setQuickStockTarget(null)}>
                <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold">Ubah Stok Varian</DialogTitle>
                        {quickStockTarget && (
                            <DialogDescription className="text-xs">
                                {quickStockTarget.variant.name} ({formatVolume(quickStockTarget.variant.volume)})
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    {quickStockTarget && (
                        <form onSubmit={handleQuickStockSave} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">Stok Unit:</label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={newStockValue}
                                    onChange={(e) => setNewStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="h-9 text-xs"
                                    autoFocus
                                />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" size="sm" onClick={() => setQuickStockTarget(null)} className="h-8 text-xs cursor-pointer">
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" disabled={isSavingStock} className="h-8 text-xs cursor-pointer">
                                    {isSavingStock ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Soft Delete Modal */}
            <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pindahkan ke Sampah?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus parfum "{deleteTarget?.name}"? Produk akan dipindahkan ke folder Sampah dan dapat dipulihkan kapan saja.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-8 text-xs cursor-pointer">
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleDeleteProduct}
                            className="h-8 text-xs cursor-pointer"
                        >
                            {isDeleting ? 'Memindahkan...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Force Delete Modal */}
            <Dialog open={Boolean(forceDeleteTarget)} onOpenChange={(open) => !open && setForceDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md border-destructive/50">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive mb-1">
                            <AlertTriangle className="size-5" />
                            <DialogTitle className="text-destructive">Hapus Permanen Produk?</DialogTitle>
                        </div>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus parfum "<strong>{forceDeleteTarget?.name}</strong>" secara <strong>PERMANEN</strong> dari database?
                            <span className="block mt-2 text-rose-600 font-medium">
                                PERINGATAN: Seluruh varian dan file foto produk akan dihapus selamanya dan TIDAK DAPAT dipulihkan kembali!
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setForceDeleteTarget(null)} className="h-8 text-xs cursor-pointer">
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isForceDeleting}
                            onClick={handleForceDeleteProduct}
                            className="h-8 text-xs cursor-pointer"
                        >
                            {isForceDeleting ? 'Menghapus Total...' : 'Ya, Hapus Permanen'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
