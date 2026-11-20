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

import { autoRequestNotificationPermission } from '@/lib/push-notification';

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

    // Native app feel: no long-press context menu, no dragging images/links.
    document.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });

    setupStatusBar();
    hideSplashWhenReady();
    setupLifecycle();
    setupNetworkWatcher();
    autoRequestNotificationPermission();
}

function setupStatusBar(): void {
    // Burgundy bar with white text (#4A070B matches the luxury top announcement bar and iOS status bar).
    StatusBar.setStyle({ style: Style.Dark }).catch(() => { });
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => { });
    if (Capacitor.getPlatform() === 'android') {
        StatusBar.setBackgroundColor({ color: '#4A070B' }).catch(() => { });
    }
}

/**
 * Dynamically adapt status bar style and background when scrolling past the top announcement bar.
 * At top: Maroon #4A070B background with light (white) status bar text.
 * Scrolled: White #FFFFFF background (or #09090b in dark mode) with dark status bar text.
 */
export function updateStatusBarForScroll(isScrolledPastTopbar: boolean): void {
    if (typeof window === 'undefined') return;

    const isDark = document.documentElement.classList.contains('dark');
    const targetColor = isScrolledPastTopbar ? (isDark ? '#09090b' : '#FFFFFF') : '#4A070B';

    // Update <meta name="theme-color"> for Safari & Chrome
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.setAttribute('name', 'theme-color');
        document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', targetColor);
    const parent = themeColorMeta.parentNode;
    if (parent) {
        const clone = themeColorMeta.cloneNode(true);
        parent.replaceChild(clone, themeColorMeta);
    }

    if (Capacitor.isNativePlatform()) {
        // Style.Light = dark text for light background (iOS darkContent for white header)
        // Style.Dark = light/white text for dark background (iOS lightContent for #4A070B)
        const targetStyle = isScrolledPastTopbar ? (isDark ? Style.Dark : Style.Light) : Style.Dark;
        StatusBar.setStyle({ style: targetStyle }).catch(() => { });
        if (Capacitor.getPlatform() === 'android') {
            StatusBar.setBackgroundColor({ color: targetColor }).catch(() => { });
        }
    }
}

/**
 * Apply seamless full-bleed Maroon #4A070B status bar for auth pages (login, register, forgot-password).
 * Ensures status bar, notch, and HTML/body seamlessly match the auth background.
 */
export function applyAuthPageStatusBar(): () => void {
    if (typeof window === 'undefined') return () => { };

    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;

    document.documentElement.style.backgroundColor = '#4A070B';
    document.body.style.backgroundColor = '#4A070B';

    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.setAttribute('name', 'theme-color');
        document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', '#4A070B');
    const parent = themeColorMeta.parentNode;
    if (parent) {
        const clone = themeColorMeta.cloneNode(true);
        parent.replaceChild(clone, themeColorMeta);
    }

    if (Capacitor.isNativePlatform()) {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => { });
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => { });
        if (Capacitor.getPlatform() === 'android') {
            StatusBar.setBackgroundColor({ color: '#4A070B' }).catch(() => { });
        }
    }

    return () => {
        document.documentElement.style.backgroundColor = prevHtmlBg;
        document.body.style.backgroundColor = prevBodyBg;
    };
}

/**
 * Keep the native splash visible until the first Inertia page is painted,
 * so users never see a blank white WebView while the site loads.
 */
function hideSplashWhenReady(): void {
    const hide = () => {
        window.requestAnimationFrame(() => {
            SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => { });
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
        .catch(() => { });
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
        background: '#4A070B',
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
