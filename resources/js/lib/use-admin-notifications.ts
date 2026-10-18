import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { initFirebaseForegroundListener, autoRequestNotificationPermission } from '@/lib/push-notification';

/**
 * Pure Firebase FCM Real-time Order Notifier for Admin CMS
 * ZERO polling - listens directly to Google Firebase Cloud Messaging push events.
 * Automatically prompts / registers push notifications in any browser.
 */
export function useAdminOrderNotifier(enabled = true): void {
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Auto request permission on new browser or sync token
        autoRequestNotificationPermission().catch(() => {});

        let cleanupFn: (() => void) | null = null;

        initFirebaseForegroundListener((payload) => {
            // If on Admin Orders or Dashboard, refresh list automatically
            if (
                window.location.pathname.startsWith('/admin/orders') ||
                window.location.pathname.startsWith('/admin/dashboard')
            ) {
                router.reload({ preserveScroll: true, preserveState: true });
            }
        }).then((unsubscribe) => {
            if (unsubscribe) {
                cleanupFn = unsubscribe;
            }
        });

        return () => {
            if (cleanupFn) {
                cleanupFn();
            }
        };
    }, [enabled]);
}
