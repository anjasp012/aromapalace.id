/**
 * Utilities to clear client-side state and caches upon login, logout, or user session change.
 */
export function clearUserClientCache() {
    if (typeof window === 'undefined') return;

    try {
        // Clear user-specific storage keys
        localStorage.removeItem('aromapalace_applied_voucher');
        localStorage.removeItem('aromapalace_cached_home');
        localStorage.removeItem('aromapalace_search_history');
        localStorage.removeItem('aromapalace_prompted_push');

        // Clear all temporary session storage data
        sessionStorage.clear();
    } catch (e) {
        console.warn('Failed to clear client user cache:', e);
    }
}
