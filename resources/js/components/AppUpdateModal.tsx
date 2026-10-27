import React, { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Download,
    ShieldAlert,
    Sparkles,
    Loader2,
} from 'lucide-react';

export interface AppUpdateConfig {
    min_version?: string;
    latest_version?: string;
    force_update?: boolean;
    title?: string;
    message?: string;
    playstore_url?: string;
    appstore_url?: string;
}

/**
 * Compare two SemVer strings (e.g., '1.0.2' vs '1.1.0').
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 == v2
 */
export function compareSemVer(v1: string = '0.0.0', v2: string = '0.0.0'): number {
    const parse = (v: string) =>
        v
            .replace(/^v/i, '')
            .split('-')[0]
            .split('.')
            .map((part) => parseInt(part, 10) || 0);

    const p1 = parse(v1);
    const p2 = parse(v2);
    const len = Math.max(p1.length, p2.length);

    for (let i = 0; i < len; i++) {
        const num1 = p1[i] ?? 0;
        const num2 = p2[i] ?? 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

export default function AppUpdateModal() {
    const pageProps = usePage().props as { app_update?: AppUpdateConfig };
    const initialConfig = pageProps.app_update;

    const [isOpen, setIsOpen] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
    const [config, setConfig] = useState<AppUpdateConfig>(initialConfig || {});
    const [isMandatory, setIsMandatory] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    // Synchronize config when page props change
    useEffect(() => {
        if (pageProps.app_update) {
            setConfig(pageProps.app_update);
        }
    }, [pageProps.app_update]);

    /**
     * Check update status against backend policy and native version
     */
    const evaluateUpdate = useCallback(
        async (customConfig?: AppUpdateConfig) => {
            const activeConfig = customConfig || config;
            const isNative = Capacitor.isNativePlatform();

            // Support developer URL testing in browser (?test_update=1 or ?test_force_update=1)
            let testMode = false;
            let forceTestMandatory = false;
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                if (params.get('test_force_update') === '1') {
                    testMode = true;
                    forceTestMandatory = true;
                } else if (params.get('test_update') === '1') {
                    testMode = true;
                }
            }

            if (!isNative && !testMode) {
                return;
            }

            let installedVer = '1.0.0';
            if (isNative) {
                try {
                    const info = await CapApp.getInfo();
                    installedVer = info.version || '1.0.0';
                } catch (e) {
                    console.warn('[AppUpdate] Failed to get app info:', e);
                }
            } else if (testMode) {
                installedVer = '1.0.0';
            }

            setCurrentVersion(installedVer);

            const minVer = activeConfig.min_version || '1.0.0';
            const latestVer = activeConfig.latest_version || installedVer;

            // Determine if below minimum or below latest
            const isBelowMin = compareSemVer(installedVer, minVer) < 0;
            const isBelowLatest = compareSemVer(installedVer, latestVer) < 0;

            const mandatory = forceTestMandatory || Boolean(activeConfig.force_update) || isBelowMin;
            const needsUpdate = testMode || isBelowLatest || isBelowMin;

            setIsMandatory(mandatory);

            if (needsUpdate) {
                // If not mandatory, verify if user already dismissed for this session
                if (!mandatory) {
                    try {
                        const dismissed = sessionStorage.getItem('ap_dismissed_update_version');
                        if (dismissed === latestVer) {
                            setIsOpen(false);
                            setHasChecked(true);
                            return;
                        }
                    } catch {
                        // ignore storage errors
                    }
                }
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }

            setHasChecked(true);
        },
        [config]
    );

    // Initial check on mount
    useEffect(() => {
        evaluateUpdate();
    }, [evaluateUpdate]);

    // Handle resume lifecycle (appStateChange) to re-verify latest policy from API
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let stateListener: any;
        CapApp.addListener('appStateChange', async ({ isActive }) => {
            if (isActive) {
                try {
                    const res = await fetch('/api/app-update', {
                        headers: { Accept: 'application/json' },
                    });
                    if (res.ok) {
                        const freshConfig = await res.json();
                        setConfig(freshConfig);
                        evaluateUpdate(freshConfig);
                    } else {
                        evaluateUpdate();
                    }
                } catch {
                    evaluateUpdate();
                }
            }
        }).then((handle) => {
            stateListener = handle;
        });

        return () => {
            stateListener?.remove?.();
        };
    }, [evaluateUpdate]);

    // Intercept hardware back button on Android when mandatory update is active
    useEffect(() => {
        if (!isOpen || !isMandatory || !Capacitor.isNativePlatform()) return;

        let backListener: any;
        CapApp.addListener('backButton', () => {
            // Screen is locked for mandatory update
        }).then((handle) => {
            backListener = handle;
        });

        return () => {
            backListener?.remove?.();
        };
    }, [isOpen, isMandatory]);

    /**
     * Launch in-app update or redirect to Play Store / App Store
     */
    const handleUpdate = async () => {
        setIsUpdating(true);
        const platform = Capacitor.getPlatform();

        try {
            if (Capacitor.isNativePlatform()) {
                if (platform === 'android') {
                    try {
                        // Attempt Google Play In-App Immediate Update
                        await AppUpdate.performImmediateUpdate();
                    } catch (err) {
                        console.warn('[AppUpdate] performImmediateUpdate failed, falling back to openAppStore / URL', err);
                        try {
                            await AppUpdate.openAppStore();
                        } catch {
                            const fallbackUrl =
                                config.playstore_url ||
                                'https://play.google.com/store/apps/details?id=com.aromapalace.app';
                            window.open(fallbackUrl, '_system');
                        }
                    }
                } else if (platform === 'ios') {
                    try {
                        await AppUpdate.openAppStore();
                    } catch {
                        const fallbackUrl =
                            config.appstore_url ||
                            'https://apps.apple.com/app/aromapalace/id6740000000';
                        window.open(fallbackUrl, '_system');
                    }
                } else {
                    const fallbackUrl = config.playstore_url || config.appstore_url || '#';
                    window.open(fallbackUrl, '_system');
                }
            } else {
                // Browser preview fallback
                const targetUrl = config.playstore_url || config.appstore_url || 'https://aromapalace.id';
                window.open(targetUrl, '_blank');
            }
        } catch (e) {
            console.error('[AppUpdate] Launch failed:', e);
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * Handle user dismissing optional update
     */
    const handleDismiss = () => {
        if (isMandatory) return;
        try {
            const verToSave = config.latest_version || currentVersion;
            sessionStorage.setItem('ap_dismissed_update_version', verToSave);
        } catch {}
        setIsOpen(false);
    };

    if (!isOpen) return null;

    const displayTitle =
        config.title ||
        (isMandatory ? 'Pembaruan Wajib Tersedia' : 'Pembaruan Aplikasi Tersedia');

    const displayMessage =
        config.message ||
        'Versi baru aplikasi Aroma Palace telah tersedia dengan peningkatan stabilitas dan fitur belanja terbaik. Mohon perbarui aplikasi Anda.';

    const targetVersion = config.latest_version || '1.1.0';

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && !isMandatory) {
                    handleDismiss();
                }
            }}
        >
            <DialogContent
                showCloseButton={!isMandatory}
                onEscapeKeyDown={(e) => {
                    if (isMandatory) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    if (isMandatory) e.preventDefault();
                }}
                onInteractOutside={(e) => {
                    if (isMandatory) e.preventDefault();
                }}
                className="max-w-[92vw] sm:max-w-md p-0 overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#250305] via-[#1a0204] to-[#120102] text-white shadow-2xl z-[9999]"
            >
                {/* Decorative Top Luxury Glow */}
                <div className="absolute -top-16 -left-16 size-48 rounded-full bg-gradient-to-br from-amber-500/20 to-red-600/30 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 size-48 rounded-full bg-gradient-to-tl from-amber-500/10 to-[#4A070B]/40 blur-2xl pointer-events-none" />

                <div className="relative p-6 sm:p-7 space-y-5">
                    {/* Header Icon & Badges */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="relative flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-amber-400/20 via-[#4A070B] to-[#360407] border border-amber-400/30 shadow-inner">
                            {isMandatory ? (
                                <ShieldAlert className="size-7 text-amber-400 animate-pulse" />
                            ) : (
                                <Sparkles className="size-7 text-amber-300 animate-spin-slow" />
                            )}
                            <span className="absolute -top-1 -right-1 flex size-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
                            </span>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                            {isMandatory ? (
                                <Badge className="bg-red-500/20 text-red-200 border border-red-500/40 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 shadow-sm">
                                    Wajib Diperbarui
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/20 text-amber-200 border border-amber-500/40 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 shadow-sm">
                                    Versi Baru
                                </Badge>
                            )}

                            {/* Version Comparison Pill */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-mono text-zinc-300">
                                <span className="text-zinc-400">v{currentVersion}</span>
                                <span className="text-amber-400 font-bold">&rarr;</span>
                                <span className="text-amber-300 font-bold">v{targetVersion}</span>
                            </div>
                        </div>
                    </div>

                    {/* Dialog Title & Message */}
                    <div className="space-y-2">
                        <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                            {displayTitle}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-zinc-300/90 leading-relaxed font-sans whitespace-pre-line">
                            {displayMessage}
                        </DialogDescription>
                    </div>

                    {/* Mandatory Notice Banner */}
                    {isMandatory && (
                        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200/90">
                            <ShieldAlert className="size-4 shrink-0 text-red-400 mt-0.5" />
                            <div className="leading-relaxed">
                                Versi yang Anda gunakan saat ini sudah tidak didukung. Mohon perbarui aplikasi untuk melanjutkan berbelanja di Aroma Palace.
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                        <Button
                            type="button"
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-[#250305] font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 border-0 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="size-4 animate-spin text-[#250305]" />
                                    <span>Membuka Toko Aplikasi...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="size-4.5 text-[#250305]" />
                                    <span>Perbarui Aplikasi Sekarang</span>
                                </>
                            )}
                        </Button>

                        {!isMandatory && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleDismiss}
                                disabled={isUpdating}
                                className="w-full h-10 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Nanti Saja / Ingatkan Nanti
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
