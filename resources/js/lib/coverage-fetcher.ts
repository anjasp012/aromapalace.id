/**
 * Utility to fetch coverage data (provinces, cities, districts, subdistricts).
 * Automatically retries requesting if the API returns empty data or encounters a temporary error,
 * until non-empty data is received or the operation is cancelled via AbortSignal.
 */

const sleep = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((resolve) => {
        if (signal?.aborted) return resolve();
        const timer = setTimeout(() => resolve(), ms);
        signal?.addEventListener(
            'abort',
            () => {
                clearTimeout(timer);
                resolve();
            },
            { once: true }
        );
    });

export async function fetchCoverageUntilNotEmpty<T = any>(
    url: string,
    onSuccess: (data: T[]) => void,
    signal?: AbortSignal,
    delayMs = 2000
): Promise<void> {
    while (!signal?.aborted) {
        try {
            const res = await fetch(url, { signal });
            if (res.ok) {
                const json = await res.json();
                if (json?.status && Array.isArray(json?.data) && json.data.length > 0) {
                    if (!signal?.aborted) {
                        onSuccess(json.data);
                    }
                    return;
                }
            }
        } catch (err: any) {
            if (err?.name === 'AbortError' || signal?.aborted) {
                return;
            }
            console.warn(`[CoverageAutoRetry] Request to ${url} encountered an error:`, err);
        }

        if (signal?.aborted) return;
        await sleep(delayMs, signal);
    }
}
