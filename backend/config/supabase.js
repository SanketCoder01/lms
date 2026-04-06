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

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
}

// Admin client — full access, bypass RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabaseAdmin;
