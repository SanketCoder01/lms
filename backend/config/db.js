/**
 * config/db.js — Supabase Admin Client
 * All database access via Supabase service_role (bypasses RLS).
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('    Make sure these are set in Vercel Environment Variables');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db:   { schema: 'public' },
});

module.exports = supabase;
