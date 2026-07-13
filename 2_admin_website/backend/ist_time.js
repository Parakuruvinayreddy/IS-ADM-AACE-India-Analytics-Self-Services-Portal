/**
 * IST (Indian Standard Time) helper — UTC+5:30
 * Returns a timestamp string formatted for SQLite storage.
 */
function nowIST() {
    const now = new Date();
    // Offset IST = +5h 30m = 330 minutes
    const ist = new Date(now.getTime() + 330 * 60 * 1000);
    // Format as "YYYY-MM-DD HH:MM:SS" (SQLite DATETIME compatible)
    return ist.toISOString().replace('T', ' ').substring(0, 19);
}

module.exports = { nowIST };
