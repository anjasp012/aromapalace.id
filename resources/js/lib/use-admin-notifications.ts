import { useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { playNotificationChime } from '@/lib/push-notification';

/**
 * Real-time Admin Notification via Laravel Reverb WebSocket.
 *
 * Listens to the private `admin` channel for `AdminNotificationCreated` events
 * broadcast from the server whenever a new admin notification is persisted.
 * On event received: plays a chime and reloads the notification data.
 *
 * FCM is intentionally NOT used here — FCM is reserved for web/browser push
 * and Android Capacitor native push notifications only.
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

    // Play chime when unread count increases (driven by Inertia prop reload)
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            prevUnreadRef.current = unreadCount;
            prevLatestIdRef.current = latestNotifId;
            return;
        }

        if (
            unreadCount > prevUnreadRef.current ||
            (latestNotifId > prevLatestIdRef.current && unreadCount > 0)
        ) {
            playNotificationChime();
        }

        prevUnreadRef.current = unreadCount;
        prevLatestIdRef.current = latestNotifId;
    }, [enabled, unreadCount, latestNotifId]);

    // Re-sync when admin tab becomes visible again after being backgrounded
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                router.reload({
                    only: ['admin_notifications', 'admin_unread_notifications_count'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled]);

    // WebSocket: listen for new admin notifications via Reverb private channel
    useEcho(
        enabled ? 'admin' : '',
        '.AdminNotificationCreated',
        () => {
            // New notification broadcast received — reload topbar data instantly
            router.reload({
                only: ['admin_notifications', 'admin_unread_notifications_count'],
                preserveScroll: true,
                preserveState: true,
            });
        },
        [enabled],
        'private',
    );
}
