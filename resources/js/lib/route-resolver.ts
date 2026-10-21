/**
 * Maps frontend application URLs to Inertia page component names.
 * Used for Instant Visits to immediately transition to the target page component
 * without waiting for backend network response, giving a native mobile app feel.
 */
export function resolveComponentForUrl(pathname: string): string | null {
    if (!pathname) return null;

    // Never instant-swap non-page endpoints or admin paths
    if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api') ||
        pathname.includes('/download') ||
        pathname.startsWith('/storage') ||
        pathname.startsWith('/payment') ||
        pathname.startsWith('/webhook')
    ) {
        return null;
    }

    const clean = pathname.replace(/\/+$/, '') || '/';

    if (clean === '/') return 'home';
    if (clean === '/products') return 'products';
    if (clean.startsWith('/products/')) return 'product-detail';
    if (clean === '/cart') return 'cart';
    if (clean === '/checkout') return 'checkout';
    if (clean === '/orders' || (clean.startsWith('/orders/') && !clean.includes('/download'))) return 'orders';
    if (clean === '/account') return 'account';
    if (clean === '/wishlist') return 'wishlist';
    if (clean === '/membership') return 'membership';
    if (clean === '/stores') return 'stores';
    if (clean === '/about') return 'about';
    if (clean === '/articles') return 'articles';
    if (clean.startsWith('/articles/')) return 'article-detail';
    if (clean === '/support') return 'support';
    if (clean === '/privacy-policy') return 'privacy-policy';
    if (clean === '/login') return 'login';
    if (clean === '/register') return 'register';

    return null;
}
