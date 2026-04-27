/**
 * config/supabase.js
 * ------------------
 * Supabase Admin client (service_role key).
 * Used ONLY on the backend — never expose service_role key to frontend.
 *
 * Features:
 *  - Bypasses Row Level Security (RLS)
 *  - Full database access
 *  - Supabase Auth admin operations (create/delete users, etc.)
 */

const supabase = require('./db');

module.exports = supabase;
