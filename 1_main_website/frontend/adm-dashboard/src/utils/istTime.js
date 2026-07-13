/**
 * Returns the current date-time as an ISO-8601 string in IST (UTC+5:30).
 * e.g. "2026-04-22T06:57:41+05:30"
 */
export function nowIST() {
    const now = new Date();
    const ist = new Date(now.getTime() + 330 * 60 * 1000);
    // Build "+05:30" suffix
    const str = ist.toISOString().replace('Z', '+05:30');
    return str;
}

/**
 * Formats an ISO timestamp string for display in IST locale.
 * e.g. "22 Apr 2026, 06:57 IST"
 */
export function formatIST(isoString) {
    if (!isoString) return '—';
    try {
        const d = new Date(isoString);
        return d.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
        }) + ' IST';
    } catch {
        return isoString;
    }
}
