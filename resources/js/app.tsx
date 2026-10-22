import { createInertiaApp, router } from '@inertiajs/react';
import { initNativeApp } from '@/lib/native-app';
import { resolveComponentForUrl } from '@/lib/route-resolver';
import { configureEcho } from '@laravel/echo-react';

configureEcho({
    broadcaster: 'reverb',
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

