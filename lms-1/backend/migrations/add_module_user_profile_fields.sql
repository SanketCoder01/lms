-- ============================================================================
--  MIGRATION: Add profile fields to module_users
--  Run this ONCE in Supabase SQL Editor → New Query
--  Safe to run multiple times (IF NOT EXISTS / idempotent)
-- ============================================================================

ALTER TABLE public.module_users
  ADD COLUMN IF NOT EXISTS first_name    VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name     VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20) DEFAULT '';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'module_users'
  AND column_name IN ('first_name', 'last_name', 'contact_number');
