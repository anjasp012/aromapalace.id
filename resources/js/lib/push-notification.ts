/**
 * Push Notification Manager for Aroma Palace
 * Supports both:
 * 1. Native Mobile App (Capacitor on Android with FCM & iOS with APNs)
 * 2. Web Push (Firebase Cloud Messaging with Service Worker)
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import {
    PushNotifications,
    type Token,
    type PushNotificationSchema,
    type ActionPerformed,
} from '@capacitor/push-notifications';
import { router } from '@inertiajs/react';

export const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCAH9VrcFa6Cc05lElZuDi6GYG1RmED-5c",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aroma-palace-c2aa6.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aroma-palace-c2aa6",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aroma-palace-c2aa6.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "561926755536",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:561926755536:web:dc135d6ef361865b387ad5",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VL9B9XD3Q8",
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BL8Wzw00aogGxi94eh5X3ytYlZHzkGKGNSQgxZLq0j1mVVumHxM1qgNv_cLyRgDcfOnTcSqMFZsRPIX0WSmdIow";

function getFirebaseApp() {
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function isPushNotificationSupported(): boolean {
    if (typeof window === 'undefined') return false;
    if (isNative) return true;
    return 'Notification' in window && 'serviceWorker' in navigator;
}

export async function getNotificationPermission(): Promise<string> {
    if (!isPushNotificationSupported()) return 'denied';
    if (isNative) {
        try {
            const check = await PushNotifications.checkPermissions();
            return check.receive;
        } catch {
            return 'denied';
        }
    }
    return Notification.permission;
}

/**
 * Register Service Worker in web browser
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (isNative || !isPushNotificationSupported()) return null;

    try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
        });
        const readyRegistration = await navigator.serviceWorker.ready;
        return readyRegistration;
    } catch (error) {
        console.warn('Failed to register service worker for notifications:', error);
        return null;
    }
}

export function isCurrentLocaleEn(): boolean {
    if (typeof window === 'undefined') return false;
    const fromStorage = localStorage.getItem('aromapalace_locale');
    if (fromStorage) return fromStorage === 'en';
    const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    return match ? match[1] === 'en' : false;
}

export function translatePushTitle(title: string): string {
    if (!title) return 'Aroma Palace';
    const t = title.trim();
    if (t.includes('Pesanan Baru Masuk')) return t.replace('Pesanan Baru Masuk', 'New Order Received');
    if (t.includes('Pesanan Berhasil Dibuat')) return t.replace('Pesanan Berhasil Dibuat', 'Order Created Successfully');
    if (t.includes('Pembayaran Berhasil')) return t.replace('Pembayaran Berhasil', 'Payment Successful');
    if (t.includes('Pembayaran Diterima')) return t.replace('Pembayaran Diterima', 'Payment Received');
    if (t.includes('Pesanan Anda Sedang Dikirim') || t.includes('Pesanan Sedang Dikirim')) return 'Your Order is On the Way!';
    if (t.includes('Pesanan Siap Diambil di Butik')) return 'Your Order is Ready for Boutique Pickup!';
    if (t.includes('Pesanan Telah Sampai')) return t.replace('Pesanan Telah Sampai', 'Your Order Has Arrived');
    if (t.includes('Pesanan Selesai')) return t.replace('Pesanan Selesai', 'Order Completed');
    if (t.includes('Pesanan Dibatalkan')) return t.replace('Pesanan Dibatalkan', 'Order Canceled');
    if (t.includes('Voucher Spesial Baru')) return t.replace('Voucher Spesial Baru', 'New Special Voucher');
    if (t.includes('Promo Spesial')) return t.replace('Promo Spesial', 'Special Promo');
    return t;
}

export function translatePushBody(body: string): string {
    if (!body) return 'You have a new notification.';
    let b = body;
    if (b.includes('sedang menunggu pembayaran')) {
        b = b.replace(/Pesanan #(\S+) sedang menunggu pembayaran (.+)\./, 'Order #$1 is awaiting payment of $2.');
    }
    if (b.includes('telah lunas. Pesanan Anda sedang disiapkan dan dikemas.')) {
        b = b.replace(/Pembayaran (.+) telah lunas\. Pesanan Anda sedang disiapkan dan dikemas\./, 'Payment of $1 is confirmed. Your luxury order is being prepared and packed.');
    }
    if (b.includes('telah diserahkan kepada')) {
        b = b.replace(/Pesanan #(\S+) telah diserahkan kepada (.+)\. Nantikan aroma mewah Anda segera tiba\./, 'Order #$1 has been handed over to $2. Look forward to your luxury fragrance soon.');
    }
    if (b.includes('sudah siap diambil di')) {
        b = b.replace(/Wewangian mewah pesanan Anda #(\S+) sudah siap diambil di (.+)\./, 'Your luxury fragrance order #$1 is ready for pickup at $2.');
    }
    if (b.includes('telah sampai di tujuan')) {
        b = b.replace(/Paket pesanan #(\S+) telah sampai di tujuan\. Pesanan otomatis selesai pada (.+)\. Silakan periksa produk Anda\./, 'Package for order #$1 has arrived at destination. Automatically completes on $2. Please check your products.');
    }
    if (b.includes('telah selesai. Terima kasih telah berbelanja di Aroma Palace!')) {
        b = b.replace(/Pesanan wewangian mewah #(\S+) telah selesai\. Terima kasih telah berbelanja di Aroma Palace!/, 'Your luxury fragrance order #$1 has been completed. Thank you for shopping with Aroma Palace!');
    }
    if (b.includes('telah dibatalkan otomatis karena')) {
        b = b.replace(/Pesanan wewangian Anda telah dibatalkan otomatis karena (.+)/, 'Your fragrance order was automatically canceled due to: $1');
    }
    if (b.includes('Gunakan kode')) {
        b = b.replace(/Gunakan kode (\S+) untuk (.+) di Aroma Palace\. Jangan lewatkan!/, 'Use code $1 for $2 at Aroma Palace. Don\'t miss out!');
    }
    return b;
}

let nativeListenersRegistered = false;

function setupNativePushListeners(csrfToken?: string, onNotificationReceived?: (payload: any) => void) {
    if (!isNative || nativeListenersRegistered) return;
    nativeListenersRegistered = true;

    // Create Android Notification Channel with custom sound
    if (Capacitor.getPlatform() === 'android') {
        PushNotifications.createChannel({
            id: 'aroma_palace_channel',
            name: 'Aroma Palace Notifications',
            description: 'Notifikasi pesanan dan promo Aroma Palace',
            importance: 5,
            visibility: 1,
            sound: 'notif',
            vibration: true,
        }).catch((e) => console.warn('[Native Push] createChannel error:', e));
    }

    // 1. Success getting device FCM / APNs token
    PushNotifications.addListener('registration', async (token: Token) => {
        console.log('[Native Push] Registered with token:', token.value);
        localStorage.setItem('aromapalace_fcm_token', token.value);

        try {
            const platform = Capacitor.getPlatform(); // 'android' or 'ios'
            const csrf = csrfToken || (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            await fetch('/api/device-tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({
                    token: token.value,
                    device_type: platform,
                    browser: `Aroma Palace Mobile App (${platform.toUpperCase()})`,
                }),
            });
            localStorage.setItem('aromapalace_notifications_enabled', 'true');
        } catch (e) {
            console.warn('[Native Push] Failed to register token on backend:', e);
        }
    });

    // 2. Registration error
    PushNotifications.addListener('registrationError', (error) => {
        console.error('[Native Push] Registration error:', error);
    });

    // 3. Notification received while app is open in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        playNotificationChime();

        if (onNotificationReceived) {
            onNotificationReceived(notification);
        }

        const isEn = isCurrentLocaleEn();
        const data = notification.data || {};
        let title = isEn && data?.title_en ? data.title_en : (notification.title || 'Aroma Palace');
        let body = isEn && data?.body_en ? data.body_en : (notification.body || (isEn ? 'You have a new notification.' : 'Anda memiliki notifikasi baru.'));

        if (isEn && !data?.title_en) {
            title = translatePushTitle(title);
        }
        if (isEn && !data?.body_en) {
            body = translatePushBody(body);
        }

        // Show in-app banner/toast if helper available
        window.showPromoToast?.(`${title}: ${body}`);
    });

    // 4. User clicked / tapped notification from system tray
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        const data = action.notification.data;
        const targetUrl = data?.url || (data?.order_id ? `/account/orders?id=${data.order_id}` : '/');
        if (targetUrl) {
            router.visit(targetUrl);
        }
    });
}

/**
 * Listen for push events in foreground
 */
export async function initFirebaseForegroundListener(
    onNotificationReceived?: (payload: any) => void
): Promise<(() => void) | null> {
    if (!isPushNotificationSupported()) return null;

    // Native Mobile App
    if (isNative) {
        setupNativePushListeners(undefined, onNotificationReceived);
        return () => {
            // Capacitor listeners are persistent per app lifecycle
        };
    }

    // Web Browser
    try {
        const hasSupport = await isMessagingSupported();
        if (!hasSupport) return null;

        const app = getFirebaseApp();
        const messaging = getMessaging(app);

        const unsubscribe = onMessage(messaging, (payload) => {
            const isEn = isCurrentLocaleEn();
            const data = payload.data || {};
            let title = isEn && data?.title_en ? data.title_en : (payload.notification?.title || data?.title || 'Aroma Palace');
            let body = isEn && data?.body_en ? data.body_en : (payload.notification?.body || data?.body || (isEn ? 'You have a new notification.' : 'Anda memiliki notifikasi baru.'));

            if (isEn && !data?.title_en) {
                title = translatePushTitle(title);
            }
            if (isEn && !data?.body_en) {
                body = translatePushBody(body);
            }

            const url = payload.data?.url || payload.notification?.click_action || '/';
            const tag = payload.data?.order_number
                ? 'order-' + payload.data.order_number
                : (payload.data?.order_id ? 'order-id-' + payload.data.order_id : (payload.data?.type || 'notif-msg'));

            // Deduplication across multiple open tabs
            const dedupKey = 'aromapalace_notif_seen_' + tag;
            const lastShown = Number(sessionStorage.getItem(dedupKey) || localStorage.getItem(dedupKey) || 0);
            if (Date.now() - lastShown < 4000) {
                if (onNotificationReceived) {
                    onNotificationReceived(payload);
                }
                return;
            }

            try {
                localStorage.setItem(dedupKey, String(Date.now()));
                sessionStorage.setItem(dedupKey, String(Date.now()));
            } catch (e) {}

            showSystemNotification(title, body, url, tag);

            // Also show real-time in-app toast banner
            window.showPromoToast?.(`${title}: ${body}`);

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
 * Request notification permission, obtain token, and send to Laravel backend
 */
export async function enablePushNotifications(csrfToken?: string): Promise<{ success: boolean; message: string }> {
    const isEn = isCurrentLocaleEn();
    if (!isPushNotificationSupported()) {
        return {
            success: false,
            message: isEn
                ? 'Your device or browser does not support push notifications.'
                : 'Perangkat atau browser Anda belum mendukung notifikasi push.',
        };
    }

    // A. Native Mobile App Flow
    if (isNative) {
        try {
            setupNativePushListeners(csrfToken);

            let perm = await PushNotifications.requestPermissions();
            if (perm.receive !== 'granted') {
                perm = await PushNotifications.checkPermissions();
            }

            if (perm.receive !== 'granted') {
                return {
                    success: false,
                    message: isEn
                        ? 'Notification permission is not enabled. Please open Settings > Aroma Palace > Notifications.'
                        : 'Izin notifikasi belum diaktifkan di iPhone Anda. Silakan buka Pengaturan iPhone > Aroma Palace > Pemberitahuan.',
                };
            }

            await PushNotifications.register();

            return {
                success: true,
                message: 'Notifikasi aplikasi berhasil diaktifkan.',
            };
        } catch (err: any) {
            console.error('Error enabling native push notifications:', err);
            return {
                success: false,
                message: err?.message || 'Gagal mengaktifkan notifikasi perangkat.',
            };
        }
    }

    // B. Web Browser Flow
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

        try {
            const hasSupport = await isMessagingSupported();
            if (hasSupport) {
                const app = getFirebaseApp();
                const messaging = getMessaging(app);

                // Check for stale subscription from previous VAPID key / project and unsubscribe
                if (registration.pushManager) {
                    try {
                        const existingSub = await registration.pushManager.getSubscription();
                        if (existingSub) {
                            const lastProject = localStorage.getItem('aromapalace_fcm_project');
                            if (lastProject !== firebaseConfig.projectId) {
                                await existingSub.unsubscribe();
                            }
                        }
                    } catch (subErr) {
                        console.warn('Subscription check error:', subErr);
                    }
                }

                try {
                    fcmToken = await getToken(messaging, {
                        vapidKey: VAPID_KEY,
                        serviceWorkerRegistration: registration,
                    });
                } catch (firstErr: any) {
                    // Push service error happens when old VAPID subscription is still registered in browser
                    if (registration.pushManager) {
                        try {
                            const staleSub = await registration.pushManager.getSubscription();
                            if (staleSub) {
                                await staleSub.unsubscribe();
                            }
                            fcmToken = await getToken(messaging, {
                                vapidKey: VAPID_KEY,
                                serviceWorkerRegistration: registration,
                            });
                        } catch (retryErr) {
                            console.warn('FCM getToken retry error:', retryErr);
                            throw firstErr;
                        }
                    } else {
                        throw firstErr;
                    }
                }

                if (fcmToken) {
                    localStorage.setItem('aromapalace_fcm_project', firebaseConfig.projectId);
                }
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
                localStorage.removeItem('aromapalace_fcm_token');
                return {
                    success: false,
                    message: isEn
                        ? 'Failed to obtain notification token from Firebase.'
                        : 'Gagal memperoleh token notifikasi dari Firebase.',
                };
            }
        }

        const synced = await syncDeviceTokenToBackend(fcmToken, csrfToken);
        if (synced) {
            return {
                success: true,
                message: isEn ? 'Notifications enabled successfully.' : 'Notifikasi berhasil diaktifkan.',
            };
        }

        return {
            success: true,
            message: isEn ? 'Browser notification permission active.' : 'Izin notifikasi browser aktif.',
        };
    } catch (err: any) {
        return {
            success: false,
            message: err?.message || (isEn ? 'An error occurred while enabling notifications.' : 'Terjadi kesalahan saat mengaktifkan notifikasi.'),
        };
    }
}

/**
 * Synchronize an FCM device token with the Laravel backend.
 */
export async function syncDeviceTokenToBackend(
    fcmToken: string,
    csrfToken?: string
): Promise<boolean> {
    if (!fcmToken || fcmToken.startsWith('fcm_web_')) {
        return false;
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let browser = 'Chrome';
    let detectedDeviceType: 'web' | 'android' | 'ios' = 'web';

    if (/iPhone|iPad|iPod/i.test(ua)) {
        detectedDeviceType = 'ios';
        browser = 'Safari Mobile (iOS)';
    } else if (/Android/i.test(ua)) {
        detectedDeviceType = 'android';
        browser = 'Chrome Mobile (Android)';
    } else if (ua.includes('Firefox')) {
        browser = 'Firefox';
    } else if (ua.includes('Edg/')) {
        browser = 'Edge';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browser = 'Safari';
    }

    try {
        const csrf = csrfToken || (typeof document !== 'undefined' ? (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content : '') || '';

        const response = await fetch('/api/device-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrf,
            },
            body: JSON.stringify({
                token: fcmToken,
                device_type: detectedDeviceType,
                browser: browser,
            }),
        });

        if (response.ok) {
            localStorage.setItem('aromapalace_notifications_enabled', 'true');
            localStorage.setItem('aromapalace_fcm_token', fcmToken);
            return true;
        }
    } catch (e) {
        console.warn('Failed to sync device token to backend:', e);
    }

    return false;
}

/**
 * Disable push notifications and unregister token on backend
 */
export async function disablePushNotifications(csrfToken?: string): Promise<{ success: boolean; message: string }> {
    try {
        const token = localStorage.getItem('aromapalace_fcm_token');
        if (token) {
            await fetch('/api/device-tokens', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ token }),
            });
        }
        localStorage.setItem('aromapalace_notifications_enabled', 'false');
        return {
            success: true,
            message: isEn ? 'Notifications disabled successfully.' : 'Notifikasi berhasil dinonaktifkan.',
        };
    } catch (err: any) {
        return {
            success: false,
            message: err?.message || (isEn ? 'Failed to disable notifications.' : 'Gagal menonaktifkan notifikasi.'),
        };
    }
}

/**
 * Play a high quality luxury notification chime sound using Web Audio API
 */
export function playNotificationChime(): void {
    if (typeof window === 'undefined') return;

    try {
        const audio = new Audio('/sounds/notif.wav');
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                playSynthesizedChime();
            });
            return;
        }
    } catch {
        playSynthesizedChime();
        return;
    }

    playSynthesizedChime();
}

function playSynthesizedChime(): void {
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
    } catch {
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
    if (isNative) {
        playNotificationChime();
        return true;
    }

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
                tag: tag || 'notif-single',
                renotify: false,
                data: {
                    url: url || window.location.href,
                },
            });
            return true;
        }

        new Notification(title, {
            body,
            icon: '/images/logo.png',
            tag: tag || 'notif-single',
        });
        return true;
    } catch (err) {
        console.warn('Failed to show notification:', err);
        return false;
    }
}

/**
 * Automatically requests notification permission
 */
export async function autoRequestNotificationPermission(csrfToken?: string): Promise<void> {
    if (!isPushNotificationSupported()) return;

    if (isNative) {
        try {
            const perm = await PushNotifications.checkPermissions();
            if (perm.receive === 'granted') {
                setupNativePushListeners(csrfToken);
                await PushNotifications.register();
            } else if (perm.receive === 'prompt') {
                // Give native splash screen 1.5s to completely finish and reveal WebView
                setTimeout(() => {
                    enablePushNotifications(csrfToken).catch(() => {});
                }, 1500);
            }
        } catch (err) {
            console.warn('[Native Push] Auto request error:', err);
        }
        return;
    }

    // Always re-sync existing token to associate with current user session if already stored
    const existingToken = typeof localStorage !== 'undefined' ? localStorage.getItem('aromapalace_fcm_token') : null;
    if (existingToken && !existingToken.startsWith('fcm_web_')) {
        syncDeviceTokenToBackend(existingToken, csrfToken).catch(() => {});
    }

    try {
        const currentPermission = Notification.permission;
        if (currentPermission === 'granted') {
            await enablePushNotifications(csrfToken);
        } else if (currentPermission === 'default') {
            // Trigger browser notification permission prompt on first user gesture
            const onFirstGesture = async () => {
                document.removeEventListener('click', onFirstGesture);
                document.removeEventListener('touchend', onFirstGesture);

                if (sessionStorage.getItem('aromapalace_prompted_push')) return;
                sessionStorage.setItem('aromapalace_prompted_push', '1');

                try {
                    const result = await Notification.requestPermission();
                    if (result === 'granted') {
                        await enablePushNotifications(csrfToken);
                    }
                } catch {}
            };

            document.addEventListener('click', onFirstGesture, { once: true });
            document.addEventListener('touchend', onFirstGesture, { once: true });
        }
    } catch (err) {
        console.warn('[Web Push] Auto notification request error:', err);
    }
}

export async function sendLocalTestNotification(): Promise<boolean> {
    return false;
}
