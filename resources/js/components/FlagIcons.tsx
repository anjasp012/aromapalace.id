import React from 'react';

interface FlagIconProps {
    className?: string;
}

/**
 * Pixel-perfect SVG Flag Icon for Indonesia (ID).
 * Works reliably across iOS, Android, macOS, Windows desktop, and modern web browsers.
 */
export function FlagIndonesiaIcon({ className = 'w-4 h-3' }: FlagIconProps) {
    return (
        <span
            className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[2px] shadow-2xs border border-black/15 dark:border-white/20 ${className}`}
            aria-label="Bendera Indonesia"
        >
            <svg
                viewBox="0 0 60 40"
                className="w-full h-full block"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="60" height="20" fill="#E11D48" />
                <rect y="20" width="60" height="20" fill="#FFFFFF" />
            </svg>
        </span>
    );
}

/**
 * Pixel-perfect SVG Flag Icon for English / United Kingdom (EN).
 * Works reliably across iOS, Android, macOS, Windows desktop, and modern web browsers.
 */
export function FlagEnglishIcon({ className = 'w-4 h-3' }: FlagIconProps) {
    return (
        <span
            className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[2px] shadow-2xs border border-black/15 dark:border-white/20 ${className}`}
            aria-label="English / UK Flag"
        >
            <svg
                viewBox="0 0 60 36"
                className="w-full h-full block"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="60" height="36" fill="#012169" />
                <path d="M0,0 L60,36 M60,0 L0,36" stroke="#FFFFFF" strokeWidth="6.5" />
                <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" strokeWidth="3.5" />
                <path d="M30,0 v36 M0,18 h60" stroke="#FFFFFF" strokeWidth="10" />
                <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6" />
            </svg>
        </span>
    );
}

/**
 * Convenience helper to render flag by locale code ('id' | 'en')
 */
export function FlagLocaleIcon({ locale, className = 'w-4 h-3' }: { locale: 'id' | 'en' | string; className?: string }) {
    if (locale === 'en') {
        return <FlagEnglishIcon className={className} />;
    }
    return <FlagIndonesiaIcon className={className} />;
}
