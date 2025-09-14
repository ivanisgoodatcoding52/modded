/**
 * Parse duration string to milliseconds
 * @param {string} duration - Duration string (e.g., '10m', '1h', '2d')
 * @returns {number|null} - Duration in milliseconds or null if invalid
 */
function parseDuration(duration) {
    if (!duration || typeof duration !== 'string') return null;
    
    const match = duration.match(/^(\d+)([smhdwSMHDW])$/);
    if (!match) return null;
    
    const [, amount, unit] = match;
    const multipliers = { 
        s: 1000, S: 1000,           // seconds
        m: 60000, M: 60000,         // minutes  
        h: 3600000, H: 3600000,     // hours
        d: 86400000, D: 86400000,   // days
        w: 604800000, W: 604800000  // weeks
    };
    
    const result = parseInt(amount) * multipliers[unit];
    
    // Minimum 1 second, maximum 28 days (Discord limit)
    if (result < 1000) return null;
    if (result > 2419200000) return null; // 28 days
    
    return result;
}

/**
 * Format milliseconds to human readable string
 * @param {number} ms - Milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

/**
 * Get relative time string
 * @param {Date|number} timestamp - Date or timestamp
 * @returns {string} - Relative time string
 */
function getRelativeTime(timestamp) {
    const now = Date.now();
    const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
    const diff = now - time;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 2592000000) return `${Math.floor(diff / 86400000)} days ago`;
    
    return new Date(time).toLocaleDateString();
}

module.exports = {
    parseDuration,
    formatDuration,
    getRelativeTime
};