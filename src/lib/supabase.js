/**
 * src/lib/supabase.js
 * -------------------
 * Frontend Supabase client using the ANON (public) key.
 * Used for:
 *  - Auth state management (session, token refresh)
 *  - Reading public data with RLS applied
 *  - Listening to real-time changes
 *
 * DO NOT use service_role key here — this runs in the browser.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://dpohejqepiyqpauycvyb.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb2hlanFlcGl5cXBhdXljdnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjE5MjAsImV4cCI6MjA5MDkzNzkyMH0.TZENlDA9jzqR8rQlVmiV62BmmHLTvB3Dw1TsG5jUGOc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export default supabase;
