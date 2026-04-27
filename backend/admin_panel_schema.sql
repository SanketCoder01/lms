-- ============================================================================
--  COMPLETE SCHEMA — Run in Supabase SQL Editor > New Query > Run
--  Safe to run multiple times (IF NOT EXISTS / IF NOT EXIST)
-- ============================================================================

-- ─── 1. COMPANY USERS (each approved company = isolated tenant) ───────────────
CREATE TABLE IF NOT EXISTS company_users (
  id              SERIAL PRIMARY KEY,
  company_name    VARCHAR(255) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  address         TEXT,
  role            VARCHAR(20)  DEFAULT 'user',
  password_hash   VARCHAR(255) NOT NULL,
  status          VARCHAR(20)  DEFAULT 'active',
  modules_access  JSONB        DEFAULT '{
    "dashboard":true,"projects":true,"units":true,"leases":true,
    "parties":true,"ownership":true,"filters":true,
    "reports":true,"notifications":true,"settings":false
  }',
  created_by      VARCHAR(100) DEFAULT 'super_admin',
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── 2. SELF-REGISTRATION REQUESTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_registrations (
  id              SERIAL PRIMARY KEY,
  company_name    VARCHAR(255) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  address         TEXT,
  role            VARCHAR(20)  DEFAULT 'user',
  proof_document  VARCHAR(255),
  password_hash   VARCHAR(255) NOT NULL,
  status          VARCHAR(20)  DEFAULT 'pending',
  rejection_note  TEXT,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  approved_at     TIMESTAMPTZ,
  approved_by     VARCHAR(100)
);

-- ─── 3. LIVE USER SESSIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id              SERIAL PRIMARY KEY,
  company_user_id INT          REFERENCES company_users(id) ON DELETE CASCADE,
  email           VARCHAR(150),
  company_name    VARCHAR(255),
  ip_address      VARCHAR(50),
  user_agent      TEXT,
  current_page    VARCHAR(255) DEFAULT '/',
  logged_in_at    TIMESTAMPTZ  DEFAULT NOW(),
  last_seen       TIMESTAMPTZ  DEFAULT NOW(),
  is_active       BOOLEAN      DEFAULT TRUE,
  killed_at       TIMESTAMPTZ,
  killed_by       VARCHAR(100)
);

-- ─── 4. SYSTEM ANNOUNCEMENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  message         TEXT         NOT NULL,
  type            VARCHAR(20)  DEFAULT 'info',
  is_active       BOOLEAN      DEFAULT TRUE,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

-- ─── 5. SESSION KILL NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_kill_notifications (
  id              SERIAL PRIMARY KEY,
  company_user_id INT          REFERENCES company_users(id) ON DELETE CASCADE,
  session_id      INT,
  message         TEXT,
  is_read         BOOLEAN      DEFAULT FALSE,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── 6. ADD company_id TO EXISTING TABLES ────────────────────────────────────
ALTER TABLE projects         ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
ALTER TABLE units             ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
ALTER TABLE leases            ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
ALTER TABLE parties           ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
ALTER TABLE filter_options    ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
ALTER TABLE unit_ownerships   ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
ALTER TABLE activity_logs     ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
ALTER TABLE notifications     ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;

-- (only if tables exist; these are optional)
DO $$ BEGIN
  ALTER TABLE owners ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ─── 7. INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cu_email           ON company_users(email);
CREATE INDEX IF NOT EXISTS idx_cu_status          ON company_users(status);
CREATE INDEX IF NOT EXISTS idx_cr_status          ON company_registrations(status);
CREATE INDEX IF NOT EXISTS idx_us_active          ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_us_company         ON user_sessions(company_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_cid       ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_units_cid          ON units(company_id);
CREATE INDEX IF NOT EXISTS idx_leases_cid         ON leases(company_id);
CREATE INDEX IF NOT EXISTS idx_parties_cid        ON parties(company_id);
CREATE INDEX IF NOT EXISTS idx_filter_options_cid ON filter_options(company_id);

-- ─── 8. DISABLE RLS (backend uses service_role) ───────────────────────────────
ALTER TABLE company_users             DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_registrations     DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions             DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements             DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_kill_notifications DISABLE ROW LEVEL SECURITY;

-- ─── 9. STALE SESSION CLEANUP ─────────────────────────────────────────────────
-- Run periodically or via a Supabase pg_cron job:
-- UPDATE user_sessions SET is_active = FALSE WHERE last_seen < NOW() - INTERVAL '24 hours';

-- ============================================================================
--  DONE — Copy this entire script into Supabase SQL Editor and click RUN
-- ============================================================================
