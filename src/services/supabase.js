import { createClient } from '@supabase/supabase-js';

// Fallback to empty strings if not available during initial load
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dpohejqepiyqpauycvyb.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb2hlanFlcGl5cXBhdXljdnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjE5MjAsImV4cCI6MjA5MDkzNzkyMH0.TZENlDA9jzqR8rQlVmiV62BmmHLTvB3Dw1TsG5jUGOc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
