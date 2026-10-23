/**
 * Mobile Browser to Native App / App Store / Play Store Auto-Redirect
 *
 * Directs mobile browser visitors to open the native Aroma Palace app.
 * If the app is not installed, seamlessly falls back to App Store (iOS)
 * or Play Store (Android).
 */
import { Capacitor } from '@capacitor/core';

export const APP_STORE_URL = 'https://apps.apple.com/id/app/aroma-palace/id6825154655';
export const PLAY_STORE_URL = 'https://play.google.com/id/app/aroma-palace/id6825154655';
export const PLAY_STORE_FALLBACK_URL = 'https://play.google.com/store/apps/details?id=com.aromapalace.app';
export const ANDROID_PACKAGE_ID = 'com.aromapalace.app';
export const CUSTOM_SCHEME = 'com.aromapalace.app';

/**
 * Checks if running inside the native Capacitor app shell.
 */
export function isRunningInNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (Capacitor.isNativePlatform()) return true;
    } catch {
        // ignore
    }
    const ua = navigator.userAgent || '';
    return ua.includes('AromaPalaceApp');
}

/**
 * Detects mobile platform (iOS, Android, or other).
 */
export function getMobilePlatform(): 'ios' | 'android' | null {
    if (typeof window === 'undefined') return null;
    const ua = navigator.userAgent || navigator.vendor || '';

    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        return 'ios';
    }
    if (/Android/i.test(ua)) {
        return 'android';
    }
    return null;
}

/**
 * Redirects the mobile browser to the native app, or to the store if not installed.
 *
 * @param force If true, bypasses the session-check (e.g. when user clicks a button)
 */
export function redirectToAppOrStore(force = false): void {
    if (typeof window === 'undefined') return;

    // Do nothing if already inside the native app
    if (isRunningInNativeApp()) return;

    // Do nothing on desktop
    const platform = getMobilePlatform();
    if (!platform) return;

    // Do nothing on admin pages
    if (window.location.pathname.startsWith('/admin')) return;

    // Check if user specifically requested web version or already attempted in this session
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('web') === '1' || urlParams.get('no_app') === '1') return;

    const SESSION_KEY = 'aroma_palace_app_redirect_handled';
    if (!force && sessionStorage.getItem(SESSION_KEY)) {
        return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');

    const cleanPath = window.location.pathname.replace(/^\/+/, '');
    const search = window.location.search || '';
    const currentHost = window.location.host || 'aromapalace.id';

    if (platform === 'ios') {
        const appUrl = `${CUSTOM_SCHEME}://${cleanPath}${search}`;
        const startTime = Date.now();

        // Attempt to open the installed app
        window.location.href = appUrl;

        // Fallback to App Store if the app is not installed
        setTimeout(() => {
            const timeElapsed = Date.now() - startTime;
            if (!document.hidden && timeElapsed < 2500) {
                window.location.href = APP_STORE_URL;
            }
        }, 1200);
    } else if (platform === 'android') {
        // Intent URI format standard for Android Chrome & mobile browsers
        const fallbackEncoded = encodeURIComponent(PLAY_STORE_URL);
        const intentUrl = `intent://${currentHost}/${cleanPath}${search}#Intent;scheme=https;package=${ANDROID_PACKAGE_ID};S.browser_fallback_url=${fallbackEncoded};end`;

        const startTime = Date.now();
        window.location.href = intentUrl;

        // Fallback for browsers that do not process intent URLs
        setTimeout(() => {
            const timeElapsed = Date.now() - startTime;
            if (!document.hidden && timeElapsed < 2500) {
                window.location.href = PLAY_STORE_URL;
            }
        }, 1200);
    }
}

/**
 * Initialize automatic redirection on page load.
 */
export function initAppRedirect(): void {
    if (typeof window === 'undefined') return;

    // Run automatically when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            redirectToAppOrStore(false);
        });
    } else {
        // Delay slightly so the page starts rendering before browser handles the redirect/app switch
        setTimeout(() => {
            redirectToAppOrStore(false);
        }, 300);
    }
}
