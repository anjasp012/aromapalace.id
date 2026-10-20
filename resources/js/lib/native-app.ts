/**
 * Native app lifecycle for the Capacitor shell (iOS & Android).
 *
 * Runs only inside the native app. On the regular website every call is a no-op,
 * so web behaviour stays exactly the same.
 */
import { router } from '@inertiajs/react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Refresh page data when the app comes back after this long in the background. */
const SOFT_REFRESH_AFTER_MS = 5 * 60 * 1000;
/** Do a full reload (new assets + session check) after this long in the background. */
const HARD_RELOAD_AFTER_MS = 6 * 60 * 60 * 1000;

let initialized = false;
let backgroundedAt: number | null = null;
let offlineBanner: HTMLDivElement | null = null;

export function isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
}

export function initNativeApp(): void {
    if (initialized || typeof window === 'undefined' || !isNativeApp()) return;
    initialized = true;

    document.documentElement.classList.add('native-app', `native-${Capacitor.getPlatform()}`);

    setupStatusBar();
    hideSplashWhenReady();
    setupLifecycle();
    setupNetworkWatcher();
}

function setupStatusBar(): void {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    if (Capacitor.getPlatform() === 'android') {
        StatusBar.setBackgroundColor({ color: '#360407' }).catch(() => {});
    }
}

/**
 * Keep the native splash visible until the first Inertia page is painted,
 * so users never see a blank white WebView while the site loads.
 */
function hideSplashWhenReady(): void {
    const hide = () => {
        window.requestAnimationFrame(() => {
            SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
        });
    };

    if (document.readyState === 'complete') {
        hide();
    } else {
        window.addEventListener('load', hide, { once: true });
    }

    // Safety net: never keep the splash longer than 8 seconds.
    window.setTimeout(hide, 8000);
}

/**
 * Pause/resume handling. The WebView is kept alive in the background, so a
 * resume normally costs nothing. Only stale data gets refreshed, and only the
 * page props are reloaded (no full page reload, scroll position kept).
 */
function setupLifecycle(): void {
    CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
            backgroundedAt = Date.now();
            return;
        }

        if (backgroundedAt === null) return;
        const awayFor = Date.now() - backgroundedAt;
        backgroundedAt = null;

        if (awayFor >= HARD_RELOAD_AFTER_MS) {
            window.location.reload();
        } else if (awayFor >= SOFT_REFRESH_AFTER_MS && navigator.onLine) {
            router.reload();
        }
    });
}

function setupNetworkWatcher(): void {
    Network.addListener('networkStatusChange', ({ connected }) => {
        if (connected) {
            hideOfflineBanner();
            router.reload();
        } else {
            showOfflineBanner();
        }
    });

    Network.getStatus()
        .then(({ connected }) => {
            if (!connected) showOfflineBanner();
        })
        .catch(() => {});
}

function showOfflineBanner(): void {
    if (offlineBanner) return;

    offlineBanner = document.createElement('div');
    offlineBanner.setAttribute('role', 'status');
    offlineBanner.textContent = document.documentElement.lang.startsWith('en')
        ? 'You are offline. Check your internet connection.'
        : 'Anda sedang offline. Periksa koneksi internet Anda.';
    Object.assign(offlineBanner.style, {
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: '0',
        zIndex: '9999',
        padding: '10px 16px calc(10px + env(safe-area-inset-bottom))',
        background: '#360407',
        color: '#fff',
        fontSize: '13px',
        textAlign: 'center',
    });
    document.body.appendChild(offlineBanner);
}

function hideOfflineBanner(): void {
    offlineBanner?.remove();
    offlineBanner = null;
}
