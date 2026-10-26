import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { playSwipeRefreshSound, unlockAudioContext } from '@/lib/sound-effects';

interface PullToRefreshProps {
    children: React.ReactNode;
    /** Optional custom refresh handler. Defaults to router.reload() */
    onRefresh?: () => Promise<void> | void;
    /** Disable PTR if needed */
    disabled?: boolean;
}

const THRESHOLD = 65; // Distance in px needed to trigger refresh
const MAX_PULL = 95;  // Maximum pull down distance in px
const HOLD_HEIGHT = 52; // Height to hold while refreshing

export default function PullToRefresh({
    children,
    onRefresh,
    disabled = false,
}: PullToRefreshProps) {
    if (disabled) {
        return <>{children}</>;
    }

    const [pullDistance, setPullDistance] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const startYRef = useRef<number | null>(null);
    const startXRef = useRef<number | null>(null);
    const hasVibratedRef = useRef(false);
    const isRefreshingRef = useRef(false);
    isRefreshingRef.current = isRefreshing;

    const executeRefresh = useCallback(() => {
        setIsRefreshing(true);
        setPullDistance(HOLD_HEIGHT);
        if (!hasVibratedRef.current) {
            playSwipeRefreshSound();
        }

        if (onRefresh) {
            Promise.resolve(onRefresh()).finally(() => {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 300);
            });
        } else {
            router.reload({
                preserveScroll: false,
                onFinish: () => {
                    setTimeout(() => {
                        setIsRefreshing(false);
                        setPullDistance(0);
                    }, 350);
                },
            });
        }
    }, [onRefresh]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled || isRefreshingRef.current) return;

        // Proactively wake up and unlock AudioContext on user gesture start
        unlockAudioContext();

        // Do not activate if a modal/dialog/sheet is currently open
        if (
            typeof document !== 'undefined' &&
            (document.body.style.overflow === 'hidden' ||
                document.querySelector('[data-state="open"]'))
        ) {
            return;
        }

        // Only activate if we are scrolled to the absolute top of the page
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        if (scrollY <= 1) {
            startYRef.current = e.touches[0].clientY;
            startXRef.current = e.touches[0].clientX;
            hasVibratedRef.current = false;
        } else {
            startYRef.current = null;
            startXRef.current = null;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (disabled || isRefreshingRef.current || startYRef.current === null || startXRef.current === null) {
            return;
        }

        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        if (scrollY > 1) {
            // User scrolled down, cancel pull
            startYRef.current = null;
            startXRef.current = null;
            setIsDragging(false);
            setPullDistance(0);
            return;
        }

        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const diffY = currentY - startYRef.current;
        const diffX = currentX - startXRef.current;

        // If mostly horizontal swipe (e.g. carousel), cancel PTR
        if (Math.abs(diffX) > Math.abs(diffY)) {
            return;
        }

        if (diffY > 0) {
            // Apply rubber-band damping
            const pull = Math.min(MAX_PULL, Math.pow(diffY, 0.82));
            setPullDistance(pull);
            setIsDragging(true);

            // Cancel default scrolling bounce
            if (e.cancelable) {
                e.preventDefault();
            }

            // Swipe sound & tactile haptic trigger once threshold is crossed
            if (pull >= THRESHOLD && !hasVibratedRef.current) {
                hasVibratedRef.current = true;
                playSwipeRefreshSound();
            } else if (pull < THRESHOLD && hasVibratedRef.current) {
                hasVibratedRef.current = false;
            }
        } else {
            setPullDistance(0);
            setIsDragging(false);
        }
    };

    const handleTouchEnd = () => {
        if (disabled || isRefreshingRef.current || startYRef.current === null) {
            return;
        }

        startYRef.current = null;
        startXRef.current = null;
        setIsDragging(false);

        if (pullDistance >= THRESHOLD) {
            executeRefresh();
        } else {
            setPullDistance(0);
        }
    };

    // Calculate rotation and scale based on pull progress
    const progress = Math.min(1, pullDistance / THRESHOLD);
    const rotation = progress * 280;
    const isPastThreshold = pullDistance >= THRESHOLD;

    return (
        <div
            className="relative w-full flex-1 flex flex-col bg-background"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* PULL INDICATOR BADGE (Positioned below the fixed navbar, above content) */}
            <div
                className="absolute top-0 left-0 right-0 z-20 flex justify-center pointer-events-none transition-opacity duration-200"
                style={{
                    height: `${pullDistance}px`,
                    opacity: pullDistance > 8 ? 1 : 0,
                }}
                aria-hidden="true"
            >
                <div
                    className="flex items-center justify-center"
                    style={{
                        transform: `translateY(${Math.max(8, (pullDistance - 40) / 2)}px)`,
                        transition: isDragging ? 'none' : 'transform 0.25s ease-out',
                    }}
                >
                    <div className="w-10 h-10 rounded-full bg-background/95 dark:bg-card/95 backdrop-blur-md border border-border/80 shadow-lg flex items-center justify-center text-[#4A070B] dark:text-[#E8D0BA]">
                        {isRefreshing ? (
                            /* Spinning loading animation ("muter muter") */
                            <svg
                                className="w-5 h-5 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                                <path
                                    className="opacity-90"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        ) : (
                            /* Pull progress rotating arrow / ring */
                            <svg
                                className="w-5 h-5 transition-transform duration-75"
                                style={{
                                    transform: `rotate(${rotation}deg) scale(${0.7 + progress * 0.3})`,
                                    color: isPastThreshold ? '#4A070B' : 'currentColor',
                                }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.4"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* CONTENT CONTAINER (Only this moves when pulling down; navbar remains fixed) */}
            <div
                className="w-full flex-1 flex flex-col"
                style={
                    pullDistance > 0
                        ? {
                            transform: `translate3d(0, ${pullDistance}px, 0)`,
                            transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        }
                        : undefined
                }
            >
                {children}
            </div>
        </div>
    );
}
