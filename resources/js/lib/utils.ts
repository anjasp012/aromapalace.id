import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatVolume(volume: number | string | null | undefined): string {
    if (volume === null || volume === undefined || volume === '') {
        return '';
    }
    const str = String(volume).trim();
    if (/^\d+$/.test(str)) {
        return `${str} ml`;
    }
    const match = str.match(/^(\d+)\s*(ml|l|oz|g)?$/i);
    if (match) {
        return `${match[1]} ${match[2] ? match[2].toLowerCase() : 'ml'}`;
    }
    return str;
}

export function isVideoUrl(url?: string | null): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl) || cleanUrl.startsWith('data:video/');
}

export function isGifUrl(url?: string | null): boolean {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
    return /\.gif$/i.test(cleanUrl) || cleanUrl.startsWith('data:image/gif');
}

