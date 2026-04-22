-- ============================================================================
--  PROJECT_USERS: Project-specific user access with granular permissions
--  Allows admin/super-admin to assign users to specific projects with 
--  view, edit, delete permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_users (
  id              SERIAL PRIMARY KEY,
  company_id      INT          NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  project_id      INT          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  permissions     JSONB DEFAULT '{"view": true, "edit": false, "delete": false}',
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ,
  
  -- One user per project per company
  CONSTRAINT uq_company_project_user UNIQUE (company_id, project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_pu_company ON project_users(company_id);
CREATE INDEX IF NOT EXISTS idx_pu_project ON project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_pu_email ON project_users(email);

ALTER TABLE project_users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
--  COMMENTS
-- ============================================================================

COMMENT ON TABLE project_users IS 'Project-specific users with limited access to assigned projects';
COMMENT ON COLUMN project_users.company_id IS 'Reference to the company that owns the project';
COMMENT ON COLUMN project_users.project_id IS 'Reference to the specific project this user can access';
COMMENT ON COLUMN project_users.permissions IS 'JSON object with view, edit, delete boolean flags';
COMMENT ON COLUMN project_users.status IS 'active or suspended';
