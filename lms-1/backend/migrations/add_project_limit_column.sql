-- ============================================================================
-- ADD PROJECT_LIMIT, USER_LIMIT AND COMPANY_ID COLUMNS
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add project_limit and user_limit columns to company_users table
ALTER TABLE company_users 
ADD COLUMN IF NOT EXISTS project_limit INT DEFAULT NULL;

ALTER TABLE company_users 
ADD COLUMN IF NOT EXISTS user_limit INT DEFAULT NULL;

COMMENT ON COLUMN company_users.project_limit IS 'Maximum number of active projects allowed for this company. NULL means unlimited.';
COMMENT ON COLUMN company_users.user_limit IS 'Maximum number of users (module_users + project_users) allowed for this company. NULL means unlimited.';

-- 2. Add company_id column to projects table for multi-tenant support
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);

-- 3. Verify the columns were added
SELECT 'company_users.project_limit' as check_item, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'company_users' AND column_name = 'project_limit'
UNION ALL
SELECT 'company_users.user_limit' as check_item, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'company_users' AND column_name = 'user_limit'
UNION ALL
SELECT 'projects.company_id' as check_item, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'company_id';
