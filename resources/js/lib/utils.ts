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

export function formatProductName(name: string | null | undefined): string {
    if (!name) return '';
    const trimmed = String(name).trim();
    if (!trimmed) return '';

    const alwaysUpper = new Set([
        'EDP', 'EDT', 'EDC', 'PDB', 'EXT', 'OG',
        'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    ]);

    const alwaysLower = new Set([
        'by', 'de', 'du', 'la', 'le', 'des', 'di', 'del', 'della',
        'von', 'van', 'and', 'for', 'in', 'of', 'the', 'pour', 'avec', 'et',
    ]);

    const tokens = trimmed.split(/(\s+)/);
    let wordIndex = 0;

    return tokens
        .map((token) => {
            if (/^\s+$/.test(token)) {
                return token;
            }

            const match = token.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
            if (!match) return token;

            const [, prefix, core, suffix] = match;
            if (!core) return token;

            if (/^\d+\s*ml$/i.test(core)) {
                wordIndex++;
                return prefix + core.toLowerCase() + suffix;
            }

            const cleanAlpha = core.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

            if (alwaysUpper.has(cleanAlpha)) {
                wordIndex++;
                return prefix + core.toUpperCase() + suffix;
            }

            const lowerCore = core.toLowerCase();
            if (wordIndex > 0 && alwaysLower.has(lowerCore)) {
                wordIndex++;
                return prefix + lowerCore + suffix;
            }

            const parts = core.split(/([-–—'’])/);
            const transformedCore = parts
                .map((part, pIdx) => {
                    if (/^[-–—'’]$/.test(part) || !part) return part;
                    const partUpper = part.toUpperCase();
                    if (alwaysUpper.has(partUpper)) return partUpper;
                    const partLower = part.toLowerCase();
                    if (wordIndex > 0 && pIdx > 0 && alwaysLower.has(partLower)) {
                        return partLower;
                    }
                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                })
                .join('');

            wordIndex++;
            return prefix + transformedCore + suffix;
        })
        .join('');
}

