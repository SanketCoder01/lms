-- ============================================================================
--  MODULE USERS TABLE — Run in Supabase SQL Editor
--  Allows Super Admin to assign one user per module per company
--  with granular per-feature permissions and lock-icon UI enforcement
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_users (
  id              SERIAL PRIMARY KEY,
  company_id      INT          NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  module_name     VARCHAR(50)  NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  permissions     JSONB        NOT NULL DEFAULT '{}',
  status          VARCHAR(20)  DEFAULT 'active',
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  -- ONE user per module per company (enforced at DB level)
  CONSTRAINT uq_company_module UNIQUE (company_id, module_name)
);

CREATE INDEX IF NOT EXISTS idx_mu_company ON module_users(company_id);
CREATE INDEX IF NOT EXISTS idx_mu_email   ON module_users(email);
CREATE INDEX IF NOT EXISTS idx_mu_module  ON module_users(module_name);

ALTER TABLE module_users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
--  DEFAULT PERMISSIONS PER MODULE (reference — set by Super Admin per user)
-- ============================================================================
-- Dashboard:  view_dashboard, view_kpis, view_charts, view_notifications, view_activity_logs
-- Masters:    view_masters, add_master, edit_master, delete_master, export_masters
-- Leases:     view_leases, add_lease, edit_lease, delete_lease, view_lease_details,
--             view_lease_reports, export_leases, view_escalations
-- Ownership:  view_ownership, add_ownership, edit_ownership, delete_ownership,
--             view_ownership_documents, upload_documents
-- Projects:   view_projects, add_project, edit_project, delete_project,
--             view_project_details, add_unit, edit_unit, delete_unit,
--             view_unit_details, view_unit_structure
-- ============================================================================
