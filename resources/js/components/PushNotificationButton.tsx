import React from 'react';

interface PushNotificationButtonProps {
    variant?: 'admin' | 'customer_menu' | 'customer_header';
    csrfToken?: string;
    className?: string;
}

/**
 * PushNotificationButton (Deprecated - notifications are now auto-requested on browser entry)
 */
export default function PushNotificationButton(_props: PushNotificationButtonProps) {
    return null;
}
