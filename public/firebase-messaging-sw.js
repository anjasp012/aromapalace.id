// Firebase Messaging Service Worker for Aroma Palace Web Push Notifications
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCAH9VrcFa6Cc05lElZuDi6GYG1RmED-5c",
    authDomain: "aroma-palace-c2aa6.firebaseapp.com",
    projectId: "aroma-palace-c2aa6",
    storageBucket: "aroma-palace-c2aa6.firebasestorage.app",
    messagingSenderId: "561926755536",
    appId: "1:561926755536:web:dc135d6ef361865b387ad5",
    measurementId: "G-VL9B9XD3Q8"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

function notifyOpenWindows(payload) {
    if (self.clients && self.clients.matchAll) {
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                client.postMessage({
                    type: 'FCM_PUSH_RECEIVED',
                    payload: payload,
                });
            }
        });
    }
}

// Handle Background Message from Firebase
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Aroma Palace';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'Anda memiliki notifikasi baru.',
        icon: payload.notification?.icon || payload.data?.icon || '/images/logo.png',
        badge: '/images/logo.png',
        data: {
            url: payload.data?.url || payload.notification?.click_action || '/',
        },
        vibrate: [200, 100, 200],
        tag: payload.data?.type || 'aroma-palace-notification',
        renotify: true,
    };

    notifyOpenWindows(payload);
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Direct Web Push Fallback Handler
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = {
            notification: {
                title: 'Aroma Palace',
                body: event.data.text(),
            },
        };
    }

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Aroma Palace';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'Anda memiliki notifikasi baru dari Aroma Palace.',
        icon: payload.notification?.icon || payload.data?.icon || '/images/logo.png',
        badge: '/images/logo.png',
        data: {
            url: payload.data?.url || payload.notification?.click_action || '/',
        },
        vibrate: [200, 100, 200],
        tag: payload.data?.type || 'aroma-palace-notification',
        renotify: true,
    };

    notifyOpenWindows(payload);
    event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
    );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
