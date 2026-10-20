import { createInertiaApp } from '@inertiajs/react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Detect if running inside Capacitor (native Android/iOS wrapper)
const isNative = typeof (window as any).Capacitor !== 'undefined' && Boolean((window as any).Capacitor.isNativePlatform?.());

if (isNative) {
    // Mark root element so CSS can target native context
    document.documentElement.classList.add('native-app');

    // Disable context menu on long-press (native app feel)
    document.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });

    // Disable drag on images and links
    document.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });

    // Configure StatusBar: warna burgundy, teks putih
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#4A070B' }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
}

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: false,
}).then(() => {
    // Hide SplashScreen setelah app siap (hanya di Capacitor native)
    if (isNative) {
        // Delay kecil agar halaman pertama selesai render dulu
        setTimeout(() => {
            SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {});
        }, 300);
    }
});
