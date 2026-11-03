/**
 * Utility to fetch coverage data (provinces, cities, districts, subdistricts).
 * Performs requests without infinite loops to prevent exceeding RajaOngkir API rate limits.
 */
export async function fetchCoverageUntilNotEmpty<T = any>(
    url: string,
    onSuccess: (data: T[]) => void,
    signal?: AbortSignal,
    onComplete?: () => void
): Promise<void> {
    try {
        const res = await fetch(url, { signal });
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json?.data) && json.data.length > 0) {
                if (!signal?.aborted) {
                    onSuccess(json.data);
                }
            }
        }
    } catch (err: any) {
        if (err?.name === 'AbortError' || signal?.aborted) {
            return;
        }
        console.warn(`[CoverageFetcher] Request to ${url} encountered an error:`, err);
    } finally {
        if (!signal?.aborted && onComplete) {
            onComplete();
        }
    }
}
