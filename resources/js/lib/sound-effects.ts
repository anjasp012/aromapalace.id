/**
 * Tactile Sound & Haptic Effects for Aroma Palace Mobile UI
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return null;
        if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
            sharedAudioCtx = new AudioCtxClass();
        }
        if (sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume().catch(() => {});
        }
        return sharedAudioCtx;
    } catch {
        return null;
    }
}

/**
 * Play a subtle, tactile UI tap sound when tapping the mobile bottom menubar
 */
export function playMenuTapSound(): void {
    if (typeof window === 'undefined') return;

    // 1. Subtle mobile haptic vibration (10ms)
    try {
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            navigator.vibrate(10);
        }
    } catch {
        // Ignore if unsupported
    }

    // 2. Play subtle mechanical bubble/key click sound via Web Audio API (instant, 0ms latency)
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // High to low frequency drop generates a very natural mechanical "tick/tap"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

        // Soft volume envelope that decays rapidly to prevent clicks/pops
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    } catch {
        // Silently catch if audio context is blocked
    }
}
