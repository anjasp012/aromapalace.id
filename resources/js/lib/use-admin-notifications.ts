import { useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    initFirebaseForegroundListener,
    autoRequestNotificationPermission,
    playNotificationChime,
} from '@/lib/push-notification';

/**
 * Real-time Order & Notification Notifier for Admin CMS
 * Combines Firebase FCM instant push notifications + robust 10s smart polling fallback.
 * Automatically refreshes unread count & topbar dropdown in real-time, and plays chime on new events.
 */
export function useAdminOrderNotifier(enabled = true): void {
    const { props } = usePage<{
        admin_unread_notifications_count?: number;
        admin_notifications?: Array<{ id: number; is_read: boolean; title: string }>;
    }>();

    const unreadCount = props.admin_unread_notifications_count ?? 0;
    const latestNotifId = props.admin_notifications?.[0]?.id ?? 0;

    const prevUnreadRef = useRef<number>(unreadCount);
    const prevLatestIdRef = useRef<number>(latestNotifId);
    const isFirstMountRef = useRef<boolean>(true);

    // Watch for new notifications to play chime sound
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            prevUnreadRef.current = unreadCount;
            prevLatestIdRef.current = latestNotifId;
            return;
        }

        // If unread count increased or a new notification ID appeared
        if (
            unreadCount > prevUnreadRef.current ||
            (latestNotifId > prevLatestIdRef.current && unreadCount > 0)
        ) {
            playNotificationChime();
        }

        prevUnreadRef.current = unreadCount;
        prevLatestIdRef.current = latestNotifId;
    }, [enabled, unreadCount, latestNotifId]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Auto request permission for Firebase web push
        autoRequestNotificationPermission().catch(() => {});

        const isOrderOrDashboardPage = () => {
            const p = window.location.pathname;
            return (
                p.startsWith('/manajemen-pesanan') ||
                p === '/dashboard' ||
                p.startsWith('/dashboard') ||
                p.startsWith('/orders') ||
                p.startsWith('/admin/orders')
            );
        };

        const reloadData = (fullReload = false) => {
            if (fullReload || isOrderOrDashboardPage()) {
                router.reload({ preserveScroll: true, preserveState: true });
            } else {
                router.reload({
                    only: ['admin_notifications', 'admin_unread_notifications_count'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        };

        // 1. Firebase FCM listener for instantaneous (0ms) push notifications
        let cleanupFcm: (() => void) | null = null;
        initFirebaseForegroundListener(() => {
            playNotificationChime();
            reloadData(true);
        }).then((unsubscribe) => {
            if (unsubscribe) {
                cleanupFcm = unsubscribe;
            }
        });

        // 2. Smart Polling fallback (every 10 seconds when tab is active)
        const pollInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                reloadData(false);
            }
        }, 10000);

        // 3. Re-check immediately when tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                reloadData(false);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (cleanupFcm) cleanupFcm();
            clearInterval(pollInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled]);
}
