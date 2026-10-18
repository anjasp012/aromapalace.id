// Firebase Messaging Service Worker for Aroma Palace Web Push Notifications
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyD0dKjEP6f_nn-VixqdUx6oav0KeX26n5c",
    authDomain: "aromapalace-89175.firebaseapp.com",
    projectId: "aromapalace-89175",
    storageBucket: "aromapalace-89175.firebasestorage.app",
    messagingSenderId: "761758190951",
    appId: "1:761758190951:web:bd43d75ba74eb176b573c2",
    measurementId: "G-9S5GD1XYVX"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

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
