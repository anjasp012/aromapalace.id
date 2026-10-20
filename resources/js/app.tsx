import { createInertiaApp } from '@inertiajs/react';
import { initNativeApp } from '@/lib/native-app';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#4B5563',
    },
});

// No-op on the website; only runs inside the iOS/Android app shell.
initNativeApp();
