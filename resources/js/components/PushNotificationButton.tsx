import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, AlertCircle } from 'lucide-react';
import {
    isPushNotificationSupported,
    getNotificationPermission,
    enablePushNotifications,
    sendLocalTestNotification,
} from '@/lib/push-notification';

interface PushNotificationButtonProps {
    variant?: 'admin' | 'customer_menu' | 'customer_header';
    csrfToken?: string;
    className?: string;
}

export default function PushNotificationButton({
    variant = 'customer_header',
    csrfToken,
    className = '',
}: PushNotificationButtonProps) {
    const [supported, setSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        setSupported(isPushNotificationSupported());
        const perm = getNotificationPermission();
        setPermission(perm);

        // If permission is already granted, refresh and sync real FCM token in background
        if (perm === 'granted') {
            enablePushNotifications(csrfToken).catch(() => {});
        }
    }, [csrfToken]);

    const handleClick = async () => {
        if (permission === 'granted') {
            // Test notification trigger
            const sent = await sendLocalTestNotification(
                variant === 'admin'
                    ? '🛍️ Tes Notif Admin: Pesanan Masuk!'
                    : '✨ Tes Notif Aroma Palace',
                variant === 'admin'
                    ? 'Pesanan baru #ORD-TEST berhasil disimulasikan ke browser Anda.'
                    : 'Notifikasi browser Anda berfungsi dengan sempurna.'
            );
            setFeedback(sent ? '🔔 Notifikasi uji coba telah dikirim ke layar Anda!' : 'Gagal mengirim notif uji coba.');
            setTimeout(() => setFeedback(null), 4000);
            return;
        }

        setLoading(true);
        setFeedback(null);

        const res = await enablePushNotifications(csrfToken);
        setPermission(getNotificationPermission());
        setLoading(false);
        setFeedback(res.message);

        setTimeout(() => setFeedback(null), 4000);
    };

    if (!supported) {
        if (variant === 'admin') {
            return (
                <div
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
                    title="Notifikasi browser memerlukan konteks aman (buka via http://localhost:8000, http://127.0.0.1:8000, atau aktifkan HTTPS di Laragon)"
                >
                    <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                    <span className="hidden sm:inline">Buka via localhost / HTTPS utk Notif</span>
                </div>
            );
        }
        return null;
    }

    if (variant === 'admin') {
        const isGranted = permission === 'granted';

        return (
            <div className="relative">
                <Button
                    type="button"
                    variant={isGranted ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={handleClick}
                    disabled={loading}
                    className={`h-8 text-xs font-medium cursor-pointer ${
                        isGranted
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-100'
                            : 'text-muted-foreground hover:text-foreground'
                    } ${className}`}
                    title={isGranted ? 'Klik untuk uji coba notifikasi pesanan di layar Anda' : 'Aktifkan Notifikasi Pesanan Masuk di Browser'}
                >
                    {isGranted ? (
                        <>
                            <BellRing className="size-3.5 mr-1.5 text-emerald-600 animate-pulse" />
                            <span className="hidden sm:inline">Notif Aktif (Klik utk Tes)</span>
                        </>
                    ) : (
                        <>
                            <Bell className="size-3.5 mr-1.5" />
                            <span className="hidden sm:inline">{loading ? 'Memproses...' : 'Aktifkan Notif Pesanan'}</span>
                        </>
                    )}
                </Button>

                {feedback && (
                    <div className="absolute right-0 top-10 z-50 p-2.5 rounded-lg border bg-popover text-popover-foreground text-xs shadow-lg w-72 animate-in fade-in duration-200">
                        {feedback}
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'customer_menu') {
        const isGranted = permission === 'granted';

        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-muted/70 rounded-md transition-colors text-left"
            >
                <div className="flex items-center gap-2.5">
                    {isGranted ? (
                        <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                        <Bell className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                    )}
                    <span>{isGranted ? 'Notif Aktif (Klik Tes)' : 'Aktifkan Notifikasi'}</span>
                </div>
                {isGranted && <span className="size-2 rounded-full bg-emerald-500 shrink-0"></span>}
            </button>
        );
    }

    return null;
}
