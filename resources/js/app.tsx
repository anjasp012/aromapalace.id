import { createInertiaApp } from '@inertiajs/react';
import { initNativeApp } from '@/lib/native-app';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: false,
});

// No-op on the website; only runs inside the iOS/Android app shell
// (status bar, splash, lifecycle, offline banner: see lib/native-app.ts).
initNativeApp();
