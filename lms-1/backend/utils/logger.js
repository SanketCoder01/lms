const supabase = require('../config/db');

/**
 * Logs an activity to the database via Supabase.
 * @param {number|null} userId - The ID of the user performing the action.
 * @param {string} action - Short description of the action.
 * @param {string} module - The module where it happened.
 * @param {string|object} details - Detailed info. Can be an object.
 * @param {string} ipAddress - Optional IP address.
 */
const logActivity = async (userId, action, module, details, ipAddress = null) => {
    try {
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;

        await supabase.from('activity_logs').insert({
            user_id: userId || null,
            action,
            module,
            details: detailsStr,
            ip_address: ipAddress
        });
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
};

module.exports = { logActivity };
