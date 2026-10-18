import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import ProductCard, { type ProductItem } from '@/components/ProductCard';
import ProductQuickViewModal from '@/components/ProductQuickViewModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FragranceProduct extends ProductItem {
    id: number;
    name: string;
    slug: string;
    brand: string;
    family: string;
    category: string;
    volume: string;
    concentration?: string;
    price: string;
    originalPrice?: string;
    discountBadge?: string;
    raw_price: number;
    rating: number;
    reviews_count: number;
    in_stock: boolean;
    image: string;
    description?: string;
}

interface WishlistItem {
    id: number;
    product_id: number;
    created_at?: string;
    product: FragranceProduct;
}

interface WishlistPageProps {
    items: WishlistItem[];
}

export default function WishlistPage({ items = [] }: WishlistPageProps) {
    const [selectedBottle, setSelectedBottle] = useState<ProductItem | null>(null);

    const handleToggleWishlist = (productId: number) => {
        router.post(
            '/wishlist/toggle',
            { product_id: productId },
            { preserveScroll: true }
        );
    };

    const handleAddToCart = (product: ProductItem) => {
        router.post(
            '/cart',
            {
                product_id: product.id,
                quantity: 1,
                volume: product.volume || '50ml',
            },
            { preserveScroll: true }
        );
    };

    return (
        <Layout>
            <Head title="Wishlist Wewangian Saya • Aroma Palace" />

            {/* PAGE HEADER BANNER (Matches products.tsx style) */}
            <div className="border-b border-border/70 bg-gradient-to-b from-muted/30 via-background to-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">Wishlist</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">Wewangian Saya</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Daftar aroma mewah Dubai pilihan yang Anda simpan. Pantau ketersediaan produk dan pindahkan ke keranjang kapan pun Anda siap memiliki.
                    </p>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {items.length === 0 ? (
                    /* EMPTY STATE (Matches products.tsx empty state design) */
                    <div className="py-16 px-6 text-center space-y-4">
                        <h3 className="text-base font-bold text-foreground">
                            Wishlist Anda Masih Kosong
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Belum ada wewangian yang Anda simpan. Jelajahi katalog mahakarya parfum kami dan klik ikon hati untuk menyimpan aroma impian Anda.
                        </p>
                        <div className="pt-2">
                            <Link href="/products">
                                <Button
                                    size="sm"
                                    className="bg-[#4A070B] hover:bg-[#360407] text-white rounded-md px-6 h-10 text-xs font-semibold cursor-pointer shadow-none"
                                >
                                    Jelajahi Koleksi Parfum
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* TOOLBAR */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    Menampilkan <strong className="text-foreground font-bold">{items.length}</strong> wewangian tersimpan
                                </span>
                                <Badge variant="secondary" className="text-[10px] bg-[#4A070B]/10 text-[#4A070B] border-0 rounded-md">
                                    Tersimpan
                                </Badge>
                            </div>

                            <Link
                                href="/products"
                                className="text-xs font-semibold text-[#4A070B] hover:text-[#360407] transition-colors"
                            >
                                + Cari Wewangian Lain
                            </Link>
                        </div>

                        {/* PRODUCT GRID USING THE EXACT SAME ProductCard COMPONENT AS PRODUCTS.TSX */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex flex-col justify-between">
                                    <ProductCard
                                        product={item.product}
                                        isWishlisted={true}
                                        onToggleWishlist={() => handleToggleWishlist(item.product_id)}
                                        onQuickView={(p) => setSelectedBottle(item.product)}
                                        onAddToCart={() => handleAddToCart(item.product)}
                                        className="transition-all duration-300 hover:-translate-y-1"
                                    />
                                    {/* Action button below card */}
                                    <div className="pt-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleAddToCart(item.product)}
                                            className="w-full h-8 text-[11px] font-semibold bg-[#4A070B] hover:bg-[#360407] text-white rounded-md shadow-none cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            <span>Masuk Keranjang</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* UNIFIED QUICK VIEW MODAL (Matches products.tsx) */}
            <ProductQuickViewModal
                product={selectedBottle}
                open={!!selectedBottle}
                onOpenChange={(open) => !open && setSelectedBottle(null)}
                onAddToCart={(prod, qty) => {
                    router.post(
                        '/cart',
                        {
                            product_id: prod.id,
                            quantity: qty,
                            volume: prod.volume || '50ml',
                        },
                        { preserveScroll: true }
                    );
                }}
            />
        </Layout>
    );
}
