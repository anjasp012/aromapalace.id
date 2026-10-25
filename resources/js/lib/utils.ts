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
        return `${str}ml`;
    }
    return str;
}

