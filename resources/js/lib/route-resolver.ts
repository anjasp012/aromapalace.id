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
        pathname.startsWith('/webhook')
    ) {
        return null;
    }

    const clean = pathname.replace(/\/+$/, '') || '/';

    if (clean === '/') return 'home';
    if (clean === '/products') return 'products';
    if (clean === '/brands') return 'brands';
    if (clean === '/categories') return 'categories';
    if (clean.startsWith('/products/')) return 'product-detail';
    if (clean === '/cart') return 'cart';
    if (clean === '/checkout') return 'checkout';
    if (clean === '/orders' || clean === '/account/orders' || (clean.startsWith('/orders/') && !clean.includes('/download'))) return 'orders';
    if (clean.startsWith('/payment/')) return 'payment';
    if (clean === '/account') return 'account';
    if (clean === '/wishlist') return 'wishlist';
    if (clean === '/membership') return 'membership';
    if (clean === '/stores') return 'stores';
    if (clean === '/about') return 'about';
    if (clean === '/articles') return 'articles';
    if (clean === '/support') return 'support';
    if (clean === '/privacy-policy') return 'privacy-policy';
    if (clean === '/login') return 'login';
    if (clean === '/register') return 'register';

    return null;
}

/**
 * Returns the fully qualified URL to the Admin CMS subdomain (e.g. https://admin.aromapalace.id/dashboard)
 */
export function getAdminUrl(path = '/dashboard', serverPropUrl?: string): string {
    const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

    if (serverPropUrl) {
        return `${serverPropUrl.replace(/\/+$/, '')}${cleanPath}`;
    }

    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol;

        if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.test')) {
            return `${protocol}//admin.aromapalace.id${port}${cleanPath}`;
        }

        if (host === 'aromapalace.id' || host === 'www.aromapalace.id') {
            return `https://admin.aromapalace.id${cleanPath}`;
        }

        if (!host.startsWith('admin.')) {
            return `${protocol}//admin.${host}${port}${cleanPath}`;
        }
    }

    return `https://admin.aromapalace.id${cleanPath}`;
}

/**
 * Returns the fully qualified URL to the customer Storefront (e.g. https://aromapalace.id/)
 */
export function getStorefrontUrl(path = '/', serverPropUrl?: string): string {
    const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

    if (serverPropUrl) {
        return `${serverPropUrl.replace(/\/+$/, '')}${cleanPath}`;
    }

    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol;

        if (host.startsWith('admin.')) {
            const cleanHost = host.replace(/^admin\./, '');
            return `${protocol}//${cleanHost}${port}${cleanPath}`;
        }

        return `${protocol}//${host}${port}${cleanPath}`;
    }

    return `https://aromapalace.id${cleanPath}`;
}

