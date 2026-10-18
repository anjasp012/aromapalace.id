import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { showSystemNotification } from '@/lib/push-notification';

interface PollOrder {
    id: number;
    order_number: string;
    recipient_name: string;
    total_amount: number;
    total_amount_formatted: string;
    delivery_type: string;
    url: string;
}

/**
 * Real-time order notification poller for Admin CMS
 * Checks for incoming orders and triggers native browser push notifications with audio chime
 */
export function useAdminOrderNotifier(enabled = true): void {
    const lastOrderIdRef = useRef<number | null>(null);
    const isPollingRef = useRef(false);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Load baseline from sessionStorage if available
        const stored = sessionStorage.getItem('ap_admin_last_order_id');
        if (stored) {
            lastOrderIdRef.current = parseInt(stored, 10);
        }

        const poll = async () => {
            if (isPollingRef.current) return;
            isPollingRef.current = true;

            try {
                const lastId = lastOrderIdRef.current ?? 0;
                const res = await fetch(`/api/notifications/admin/orders?last_order_id=${lastId}`, {
                    headers: { Accept: 'application/json' },
                });

                if (!res.ok) {
                    isPollingRef.current = false;
                    return;
                }

                const data = await res.json();

                if (lastOrderIdRef.current === null) {
                    // First call: set baseline without triggering false notifications for past orders
                    lastOrderIdRef.current = data.latest_order_id ?? 0;
                    sessionStorage.setItem('ap_admin_last_order_id', String(lastOrderIdRef.current));
                } else if (data.has_new && Array.isArray(data.orders) && data.orders.length > 0) {
                    lastOrderIdRef.current = data.latest_order_id;
                    sessionStorage.setItem('ap_admin_last_order_id', String(data.latest_order_id));

                    // Fire native OS notification and chime sound
                    for (const order of data.orders as PollOrder[]) {
                        await showSystemNotification(
                            `🛍️ Pesanan Baru Masuk! #${order.order_number}`,
                            `Pesanan baru dari ${order.recipient_name} senilai ${order.total_amount_formatted}.`,
                            order.url,
                            `order-new-${order.id}`
                        );
                    }

                    // Auto-refresh order table/stats if user is on Admin Orders or Dashboard
                    if (
                        window.location.pathname.startsWith('/admin/orders') ||
                        window.location.pathname.startsWith('/admin/dashboard')
                    ) {
                        router.reload({ preserveScroll: true, preserveState: true });
                    }
                }
            } catch (err) {
                // Silently ignore network aborts
            } finally {
                isPollingRef.current = false;
            }
        };

        // Initial poll to set baseline immediately
        poll();

        // Poll every 4 seconds for real-time reactivity
        const interval = setInterval(poll, 4000);

        return () => clearInterval(interval);
    }, [enabled]);
}
