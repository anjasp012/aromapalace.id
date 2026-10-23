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

let cachedNoiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
        return cachedNoiseBuffer;
    }
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    cachedNoiseBuffer = noiseBuffer;
    return noiseBuffer;
}

/**
 * Play a smooth, tactile swipe/whoosh sound when swiping down to refresh
 */
export function playSwipeRefreshSound(): void {
    if (typeof window === 'undefined') return;

    // 1. Subtle mobile haptic feedback
    try {
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            navigator.vibrate([12, 35, 10]);
        }
    } catch {
        // Ignore if unsupported
    }

    // 2. Synthesize an aerodynamic swipe whoosh with a crisp tactile catch
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.18;

        // Layer A: Aerodynamic air whoosh (bandpass filtered white noise)
        const noiseBuffer = getNoiseBuffer(ctx, duration);
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(2.2, now);
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.exponentialRampToValueAtTime(1350, now + 0.06);
        filter.frequency.exponentialRampToValueAtTime(260, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + duration);

        // Layer B: Subtle tactile bubble/snap when the threshold is engaged
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();

        popOsc.type = 'sine';
        popOsc.frequency.setValueAtTime(540, now + 0.02);
        popOsc.frequency.exponentialRampToValueAtTime(190, now + 0.07);

        popGain.gain.setValueAtTime(0.001, now);
        popGain.gain.setValueAtTime(0.12, now + 0.02);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        popOsc.connect(popGain);
        popGain.connect(ctx.destination);

        popOsc.start(now + 0.02);
        popOsc.stop(now + 0.09);
    } catch {
        // Silently catch if audio context is blocked
    }
}

