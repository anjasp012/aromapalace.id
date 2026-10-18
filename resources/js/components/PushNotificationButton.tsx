import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, CheckCircle2 } from 'lucide-react';
import {
    isPushNotificationSupported,
    getNotificationPermission,
    enablePushNotifications,
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
        setPermission(getNotificationPermission());
    }, []);

    const handleEnable = async () => {
        setLoading(true);
        setFeedback(null);

        const res = await enablePushNotifications(csrfToken);
        setPermission(getNotificationPermission());
        setLoading(false);
        setFeedback(res.message);

        setTimeout(() => setFeedback(null), 4000);
    };

    if (!supported) {
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
                    onClick={handleEnable}
                    disabled={loading}
                    className={`h-8 text-xs font-medium cursor-pointer ${
                        isGranted
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                            : 'text-muted-foreground hover:text-foreground'
                    } ${className}`}
                    title={isGranted ? 'Notifikasi Pesanan Masuk Aktif' : 'Aktifkan Notifikasi Pesanan Masuk di Browser'}
                >
                    {isGranted ? (
                        <>
                            <BellRing className="size-3.5 mr-1.5 text-emerald-600 animate-pulse" />
                            <span className="hidden sm:inline">Notif Pesanan Aktif</span>
                        </>
                    ) : (
                        <>
                            <Bell className="size-3.5 mr-1.5" />
                            <span className="hidden sm:inline">{loading ? 'Memproses...' : 'Aktifkan Notif Pesanan'}</span>
                        </>
                    )}
                </Button>

                {feedback && (
                    <div className="absolute right-0 top-10 z-50 p-2.5 rounded-lg border bg-popover text-popover-foreground text-xs shadow-lg w-64 animate-in fade-in duration-200">
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
                onClick={handleEnable}
                disabled={loading}
                className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-muted/70 rounded-md transition-colors text-left"
            >
                <div className="flex items-center gap-2.5">
                    {isGranted ? (
                        <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                        <Bell className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                    )}
                    <span>{isGranted ? 'Notifikasi Browser Aktif' : 'Aktifkan Notifikasi'}</span>
                </div>
                {isGranted && <span className="size-2 rounded-full bg-emerald-500 shrink-0"></span>}
            </button>
        );
    }

    return null;
}
