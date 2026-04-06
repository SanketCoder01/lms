/**
 * config/db.js — Supabase Admin Client
 * All database access via Supabase service_role (bypasses RLS).
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Track if we have valid credentials
const hasCredentials = SUPABASE_URL && SERVICE_KEY;

if (!hasCredentials) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('    Make sure these are set in Vercel Environment Variables');
}

// Create client (will be null if credentials missing)
const supabase = hasCredentials 
  ? createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      db:   { schema: 'public' },
    })
  : null;

// Export a wrapper that checks for valid client
module.exports = new Proxy({}, {
  get(target, prop) {
    if (!supabase) {
      // Return a function that returns an error for any Supabase method call
      return () => Promise.resolve({ 
        data: null, 
        error: { 
          message: 'Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.',
          code: 'MISSING_CONFIG'
        } 
      });
    }
    return supabase[prop];
  }
});
