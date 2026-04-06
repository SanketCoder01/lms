/**
 * config/db.js — Supabase Admin Client
 * All database access via Supabase service_role (bypasses RLS).
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('    SUPABASE_URL =', SUPABASE_URL ? '✅ set' : '❌ MISSING');
  console.error('    SERVICE_KEY  =', SERVICE_KEY  ? '✅ set' : '❌ MISSING');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db:   { schema: 'public' },
});

// Quick connection smoke-test
(async () => {
  try {
    const { data, error } = await supabase.from('filter_options').select('id').limit(1);
    if (error) {
      console.error('❌  Supabase connection test failed:', error.message);
      console.error('    → Did you run supabase_schema.sql in the Supabase SQL Editor?');
    } else {
      console.log('✅  Supabase connected. filter_options table found.');
    }
  } catch (err) {
    console.error('❌  Supabase error:', err.message);
  }
})();

module.exports = supabase;
