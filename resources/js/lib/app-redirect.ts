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
 * Detects if the current page/environment is within the Admin CMS Panel.
 */
export function isAdminContext(): boolean {
    if (typeof window === 'undefined') return false;

    const hostname = (window.location.hostname || '').toLowerCase();
    const pathname = (window.location.pathname || '').toLowerCase();

    // 1. Admin subdomain or admin hostname (e.g. admin.aromapalace.id, admin.aromapalace.test, admin.localhost)
    if (
        hostname.startsWith('admin.') ||
        hostname === 'admin' ||
        hostname.split('.')[0] === 'admin' ||
        hostname.includes('admin')
    ) {
        return true;
    }

    // 2. Admin URL path patterns
    if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/manajemen-') ||
        pathname.startsWith('/pengaturan') ||
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/')
    ) {
        return true;
    }

    // 3. Admin meta tag indicator
    if (document.querySelector('meta[name="admin-cms"]')) {
        return true;
    }

    // 4. Inertia dataset page inspection
    try {
        const pageEl = document.getElementById('app');
        if (pageEl?.dataset?.page) {
            const pageData = JSON.parse(pageEl.dataset.page);
            if (pageData?.component && typeof pageData.component === 'string') {
                if (pageData.component.startsWith('admin/') || pageData.component.startsWith('Admin/')) {
                    return true;
                }
            }
            if (pageData?.props?.auth?.is_admin || pageData?.props?.is_admin_page) {
                return true;
            }
        }
    } catch {
        // ignore
    }

    return false;
}

/**
 * Redirects the mobile browser to the native app, or to the store if not installed.
 *
 * @param force If true, bypasses the session-check (e.g. when user clicks a button)
 */
export function redirectToAppOrStore(force = false): void {
    if (typeof window === 'undefined') return;

    // Do nothing on admin panel
    if (isAdminContext()) return;

    // Do nothing if already inside the native app
    if (isRunningInNativeApp()) return;

    // Do nothing on desktop
    const platform = getMobilePlatform();
    if (!platform) return;

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
        // Android browser auto-redirect to Play Store is disabled in favor of in-app APK download confirmation popup
        return;
    }
}

/**
 * Initialize automatic redirection on page load.
 */
export function initAppRedirect(): void {
    if (typeof window === 'undefined') return;

    // Do nothing on admin panel
    if (isAdminContext()) return;

    // Run automatically when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isAdminContext()) return;
            redirectToAppOrStore(false);
        });
    } else {
        // Delay slightly so the page starts rendering before browser handles the redirect/app switch
        setTimeout(() => {
            if (isAdminContext()) return;
            redirectToAppOrStore(false);
        }, 300);
    }
}
