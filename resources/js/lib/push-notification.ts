/**
 * Web Push Notification Manager for Aroma Palace
 * Integrates with Firebase Cloud Messaging (FCM) & Browser Notification API
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported as isMessagingSupported } from 'firebase/messaging';

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

        if (!fcmToken) {
            fcmToken = localStorage.getItem('aromapalace_fcm_token');
            if (!fcmToken) {
                fcmToken = 'fcm_web_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            }
        }

        localStorage.setItem('aromapalace_fcm_token', fcmToken);

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

            // Trigger instant welcome notification so user sees it right away
            try {
                await registration.showNotification('🎉 Notifikasi Aroma Palace Aktif!', {
                    body: 'Browser ini sekarang siap menerima update pesanan dan promo wewangian.',
                    icon: '/images/logo.png',
                    badge: '/images/logo.png',
                    tag: 'welcome-notification',
                });
            } catch (e) {
                console.log('Local notification display:', e);
            }

            return {
                success: true,
                message: 'Notifikasi berhasil diaktifkan! Anda akan menerima update langsung di browser ini.',
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
 * Trigger a test notification locally on the registered service worker
 */
export async function sendLocalTestNotification(
    title = '🔔 Tes Notifikasi Aroma Palace',
    body = 'Notifikasi browser Anda aktif dan berjalan dengan baik!'
): Promise<boolean> {
    if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            body,
            icon: '/images/logo.png',
            badge: '/images/logo.png',
            tag: 'test-notification-' + Date.now(),
            data: {
                url: window.location.href,
            },
        });
        return true;
    } catch (err) {
        console.warn('Failed to show test notification:', err);
        return false;
    }
}
