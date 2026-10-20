import { createInertiaApp } from '@inertiajs/react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Detect if running inside Capacitor (native Android/iOS wrapper)
const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();

if (isNative || document.referrer === '') {
    // Mark body so CSS can target native context
    document.documentElement.classList.add('native-app');

    // Disable context menu (long-press on Android shows browser context)
    document.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });

    // Disable drag on all images and links (looks native)
    document.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });

    // Prevent pull-to-refresh gesture on Android WebView
    document.addEventListener(
        'touchmove',
        (e) => {
            if ((e as any)._isScroller) return;
            if (document.scrollingElement && document.scrollingElement.scrollTop <= 0) {
                e.preventDefault();
            }
        },
        { passive: false }
    );
}

// Native-only: StatusBar & SplashScreen (only runs inside Capacitor)
if (isNative) {
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
