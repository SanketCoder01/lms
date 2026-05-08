-- ============================================================
-- Migration: Add all missing period columns to leases table
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

ALTER TABLE leases
  ADD COLUMN IF NOT EXISTS lessee_lockin_period_days    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessor_lockin_period_days    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessee_notice_period_days    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessor_notice_period_days    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessee_notice_period_months  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lessor_notice_period_months  INTEGER DEFAULT 0;

-- ============================================================
-- IMPORTANT: After running this SQL, you MUST reload the
-- Supabase schema cache so PostgREST recognises the new columns:
--
--   Supabase Dashboard → Settings → API → Reload Schema
--   (or just call: POST /rest/v1/ with apikey to force reload)
-- ============================================================

-- Verify all period columns now exist:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'leases'
  AND column_name LIKE '%lockin%' OR column_name LIKE '%notice%'
ORDER BY column_name;
