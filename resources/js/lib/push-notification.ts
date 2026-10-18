/**
 * Web Push Notification Manager for Aroma Palace
 * Integrates with Firebase Cloud Messaging (FCM) & Browser Notification API
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD0dKjEP6f_nn-VixqdUx6oav0KeX26n5c",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aromapalace-89175.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aromapalace-89175",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aromapalace-89175.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "761758190951",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:761758190951:web:bd43d75ba74eb176b573c2",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9S5GD1XYVX",
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BC8JtPpG6vSyFx1Uyion3i-jKbQZZxou2hwShhFLpvVBwx6k6KSlNCTIT4Qy6YOWKl2IrYGQ2CIf3bu28POedTY";

function getFirebaseApp() {
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function isPushNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission {
    if (!isPushNotificationSupported()) return 'denied';
    return Notification.permission;
}

/**
 * Register the Service Worker in the browser
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!isPushNotificationSupported()) return null;

    try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
        });
        return registration;
    } catch (error) {
        console.warn('Failed to register service worker for notifications:', error);
        return null;
    }
}

/**
 * Listen for Firebase Cloud Messaging push events in the foreground (when tab is active)
 * ZERO polling - 100% Google FCM push-driven.
 */
export async function initFirebaseForegroundListener(
    onNotificationReceived?: (payload: any) => void
): Promise<(() => void) | null> {
    if (!isPushNotificationSupported()) return null;

    try {
        const hasSupport = await isMessagingSupported();
        if (!hasSupport) return null;

        const app = getFirebaseApp();
        const messaging = getMessaging(app);

        const unsubscribe = onMessage(messaging, (payload) => {
            const title = payload.notification?.title || payload.data?.title || 'Aroma Palace';
            const body = payload.notification?.body || payload.data?.body || 'Anda memiliki notifikasi baru.';
            const url = payload.data?.url || payload.notification?.click_action || '/';

            showSystemNotification(title, body, url, payload.data?.type || 'fcm-foreground-' + Date.now());

            if (onNotificationReceived) {
                onNotificationReceived(payload);
            }
        });

        return unsubscribe;
    } catch (err) {
        console.warn('FCM foreground listener setup:', err);
        return null;
    }
}

/**
 * Request notification permission from the user, get FCM token and register with backend
 */
export async function enablePushNotifications(csrfToken?: string): Promise<{ success: boolean; message: string }> {
    if (!isPushNotificationSupported()) {
        return {
            success: false,
            message: 'Browser Anda belum mendukung notifikasi web push.',
        };
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            return {
                success: false,
                message: 'Izin notifikasi belum diberikan atau diblokir di browser.',
            };
        }

        const registration = await registerNotificationServiceWorker();
        if (!registration) {
            return {
                success: false,
                message: 'Gagal mengaktifkan service worker notifikasi.',
            };
        }

        let fcmToken: string | null = null;

        // Try getting real Firebase FCM token using VAPID key
        try {
            const hasSupport = await isMessagingSupported();
            if (hasSupport) {
                const app = getFirebaseApp();
                const messaging = getMessaging(app);
                fcmToken = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: registration,
                });
            }
        } catch (fcmError) {
            console.warn('FCM getToken fallback to local token:', fcmError);
        }

        if (fcmToken) {
            localStorage.setItem('aromapalace_fcm_token', fcmToken);
        } else {
            const existing = localStorage.getItem('aromapalace_fcm_token');
            if (existing && !existing.startsWith('fcm_web_')) {
                fcmToken = existing;
            } else {
                fcmToken = 'fcm_web_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem('aromapalace_fcm_token', fcmToken);
            }
        }

        // Detect browser name
        const ua = navigator.userAgent;
        let browser = 'Chrome';
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg/')) browser = 'Edge';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

        // Send token to Laravel backend
        const response = await fetch('/api/device-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken || (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            body: JSON.stringify({
                token: fcmToken,
                device_type: 'web',
                browser: browser,
            }),
        });

        if (response.ok) {
            localStorage.setItem('aromapalace_notifications_enabled', 'true');
            return {
                success: true,
                message: 'Notifikasi berhasil diaktifkan.',
            };
        }

        return {
            success: true,
            message: 'Izin notifikasi browser aktif.',
        };
    } catch (err: any) {
        return {
            success: false,
            message: err?.message || 'Terjadi kesalahan saat mengaktifkan notifikasi.',
        };
    }
}

/**
 * Play a high quality luxury notification chime sound using Web Audio API
 */
export function playNotificationChime(): void {
    if (typeof window === 'undefined') return;

    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const now = audioCtx.currentTime;

        // Two-tone bell chime (Note 1: D5, Note 2: A5)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.connect(gain);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now + 0.12); // A5
        osc2.connect(gain);

        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc1.start(now);
        osc1.stop(now + 0.3);

        osc2.start(now + 0.12);
        osc2.stop(now + 0.9);
    } catch (e) {
        // AudioContext might be blocked until user gesture, ignore silently
    }
}

/**
 * Show a native system notification banner
 */
export async function showSystemNotification(
    title: string,
    body: string,
    url?: string,
    tag?: string
): Promise<boolean> {
    if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
        return false;
    }

    try {
        playNotificationChime();

        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body,
                icon: '/images/logo.png',
                badge: '/images/logo.png',
                tag: tag || 'notif-' + Date.now(),
                renotify: true,
                data: {
                    url: url || window.location.href,
                },
            });
            return true;
        }

        // Fallback to standard Window Notification
        new Notification(title, {
            body,
            icon: '/images/logo.png',
            tag: tag || 'notif-' + Date.now(),
        });
        return true;
    } catch (err) {
        console.warn('Failed to show notification:', err);
        return false;
    }
}

/**
 * Automatically requests notification permission in new browsers (when permission is 'default'),
 * and registers FCM device token with the backend.
 * If permission is already 'granted', silently refreshes/registers the device token.
 */
export async function autoRequestNotificationPermission(csrfToken?: string): Promise<void> {
    if (!isPushNotificationSupported()) return;

    try {
        const currentPermission = Notification.permission;

        if (currentPermission === 'default') {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                await enablePushNotifications(csrfToken);
            }
        } else if (currentPermission === 'granted') {
            await enablePushNotifications(csrfToken);
        }
    } catch (err) {
        console.warn('Auto notification request error:', err);
    }
}

/**
 * Send local test notification (deprecated, test notifications removed)
 */
export async function sendLocalTestNotification(): Promise<boolean> {
    return false;
}
