-- ============================================================================
-- FIX MODULE_USERS CONSTRAINTS TO ALLOW MULTIPLE USERS PER MODULE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Drop the constraint that limits one user per module per company
ALTER TABLE module_users DROP CONSTRAINT IF EXISTS uq_company_module;

-- 2. Drop the unique constraint on email (allows same email across modules)
ALTER TABLE module_users DROP CONSTRAINT IF EXISTS module_users_email_key;

-- 3. Add composite unique constraint: one user-email per module per company
-- This allows:
--   - Multiple users for the same module in same company (different emails)
--   - Same user (email) for multiple modules in same company
ALTER TABLE module_users ADD CONSTRAINT uq_company_module_email 
  UNIQUE (company_id, module_name, email);

-- 4. Optionally: allow same email across different companies
-- If you want the same email to work in multiple companies, 
-- keep only the composite constraint above.
-- If you want to prevent cross-company email reuse, add:
-- ALTER TABLE module_users ADD CONSTRAINT uq_email_unique UNIQUE (email);

-- ============================================================================
-- VERIFICATION - Run after to check constraints
-- ============================================================================
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'module_users'::regclass;

-- ============================================================================
-- EXPECTED RESULT:
-- - uq_company_module_email: UNIQUE (company_id, module_name, email)
-- - This allows: 
--   Company A, Module "leases", user1@email.com
--   Company A, Module "leases", user2@email.com  (different user, same module)
--   Company A, Module "masters", user1@email.com (same user, different module)
-- ============================================================================
