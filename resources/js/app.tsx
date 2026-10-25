import { createInertiaApp, router } from '@inertiajs/react';
import { initNativeApp } from '@/lib/native-app';
import { initAppRedirect } from '@/lib/app-redirect';
import { resolveComponentForUrl } from '@/lib/route-resolver';
import { configureEcho } from '@laravel/echo-react';

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || defaultHost,
    wsPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : (isHttps ? 443 : 8080),
    forceTLS: isHttps || (import.meta.env.VITE_REVERB_SCHEME === 'https'),
    enabledTransports: ['ws', 'wss'],
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#80141C',
        showSpinner: false,
    },
});

// Automatic Instant Visits for seamless native app page transitions:
// When navigating to another page, immediately switch to the target component and show its layout/skeleton,
// then stream in real backend props (instead of waiting on the old page with a web progress bar).
router.on('before', (event) => {
    const visit = event.detail.visit;
    if (visit.method === 'get' && !visit.component) {
        const isPartialReload = (visit.only && visit.only.length > 0) || (visit.except && visit.except.length > 0);
        if (isPartialReload) return;

        const currentPath = typeof window !== 'undefined'
            ? window.location.pathname.replace(/\/+$/, '') || '/'
            : '';
        const targetPath = visit.url.pathname.replace(/\/+$/, '') || '/';

        if (currentPath === targetPath) return;

        const targetComponent = resolveComponentForUrl(visit.url.pathname);
        if (targetComponent) {
            visit.component = targetComponent;
        }
    }
});

// No-op on the website; only runs inside the iOS/Android app shell
// (status bar, splash, lifecycle, offline banner: see lib/native-app.ts).
initNativeApp();

// Automatically redirect mobile browser users to the native app, or App Store / Play Store.
initAppRedirect();

// Enable edge swipe-from-left to navigate back on iOS and mobile browsers
function initSwipeBack(): void {
    if (typeof window === 'undefined') return;

    let touchStartX = 0;
    let touchStartY = 0;
    let isEdgeSwipe = false;

    window.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        if (touch.clientX <= 30) {
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isEdgeSwipe = true;
        } else {
            isEdgeSwipe = false;
        }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (!isEdgeSwipe) return;
        isEdgeSwipe = false;
        if (e.changedTouches.length !== 1) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = Math.abs(touch.clientY - touchStartY);

        if (deltaX > 65 && deltaY < 50) {
            if (window.history.length > 1) {
                window.history.back();
            }
        }
    }, { passive: true });
}

initSwipeBack();

