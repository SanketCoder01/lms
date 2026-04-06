-- =======================================================================
--  LMS — COMPLETE SUPABASE SCHEMA (v2)
--  Run this ENTIRE script in Supabase SQL Editor → New Query → Run
--  Project: dpohejqepiyqpauycvyb
-- =======================================================================

-- ─── CLEANUP ─────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS unit_ownership_documents  CASCADE;
DROP TABLE IF EXISTS ownership_document_types  CASCADE;
DROP TABLE IF EXISTS lease_escalations         CASCADE;
DROP TABLE IF EXISTS leases                    CASCADE;
DROP TABLE IF EXISTS unit_ownerships           CASCADE;
DROP TABLE IF EXISTS unit_images               CASCADE;
DROP TABLE IF EXISTS units                     CASCADE;
DROP TABLE IF EXISTS project_floors            CASCADE;
DROP TABLE IF EXISTS project_blocks            CASCADE;
DROP TABLE IF EXISTS sub_tenants               CASCADE;
DROP TABLE IF EXISTS owner_units               CASCADE;
DROP TABLE IF EXISTS owner_documents           CASCADE;
DROP TABLE IF EXISTS owner_messages            CASCADE;
DROP TABLE IF EXISTS owners                    CASCADE;
DROP TABLE IF EXISTS tenant_units              CASCADE;
DROP TABLE IF EXISTS tenants                   CASCADE;
DROP TABLE IF EXISTS parties                   CASCADE;
DROP TABLE IF EXISTS projects                  CASCADE;
DROP TABLE IF EXISTS activity_logs             CASCADE;
DROP TABLE IF EXISTS notifications             CASCADE;
DROP TABLE IF EXISTS settings                  CASCADE;
DROP TABLE IF EXISTS documents                 CASCADE;
DROP TABLE IF EXISTS filter_options            CASCADE;
DROP TABLE IF EXISTS users                     CASCADE;
DROP TABLE IF EXISTS roles                     CASCADE;


-- ─── 1. ROLES ────────────────────────────────────────────────────────────────
CREATE TABLE roles (
  id        SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

-- ─── 2. USERS ────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                      SERIAL PRIMARY KEY,
  role_id                 INT REFERENCES roles(id),
  first_name              VARCHAR(100),
  last_name               VARCHAR(100),
  email                   VARCHAR(150) UNIQUE NOT NULL,
  email_verified          BOOLEAN DEFAULT FALSE,
  phone                   VARCHAR(20),
  password_hash           VARCHAR(255) NOT NULL DEFAULT 'SUPABASE_AUTH',
  password_updated_at     TIMESTAMPTZ DEFAULT NOW(),
  password_reset_required BOOLEAN DEFAULT FALSE,
  job_title               VARCHAR(100),
  location                VARCHAR(100),
  profile_image           VARCHAR(255),
  status                  VARCHAR(20) DEFAULT 'active',
  last_login              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. PROJECTS ─────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id                  SERIAL PRIMARY KEY,
  project_name        VARCHAR(255) NOT NULL,
  location            VARCHAR(255),
  address             TEXT,
  project_type        VARCHAR(100),
  calculation_type    VARCHAR(200) DEFAULT 'Chargeable Area',
  total_floors        INT DEFAULT 0,
  total_project_area  NUMERIC(15,2) DEFAULT 0,
  project_image       VARCHAR(255),
  description         TEXT,
  status              VARCHAR(30) DEFAULT 'active',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. PROJECT BLOCKS (Unit Structure — Admin Managed) ──────────────────────
CREATE TABLE project_blocks (
  id           SERIAL PRIMARY KEY,
  project_id   INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  block_name   VARCHAR(100) NOT NULL,
  description  TEXT,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, block_name)
);

-- ─── 5. PROJECT FLOORS (Unit Structure — Admin Managed) ──────────────────────
CREATE TABLE project_floors (
  id           SERIAL PRIMARY KEY,
  project_id   INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  block_id     INT REFERENCES project_blocks(id) ON DELETE CASCADE,
  floor_name   VARCHAR(100) NOT NULL,
  units_count  INT DEFAULT 0,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. UNITS (VARCHAR for dynamic filter-option-driven fields) ───────────────
CREATE TABLE units (
  id               SERIAL PRIMARY KEY,
  project_id       INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_number      VARCHAR(50) NOT NULL,
  floor_number     VARCHAR(50),
  block_tower      VARCHAR(50),
  chargeable_area  NUMERIC(12,2),
  carpet_area      NUMERIC(12,2),
  covered_area     NUMERIC(12,2),
  builtup_area     NUMERIC(12,2),
  unit_condition   VARCHAR(100) DEFAULT 'bare_shell',
  plc              VARCHAR(100),
  unit_category    VARCHAR(100),
  unit_zoning_type VARCHAR(100),
  projected_rent   NUMERIC(15,2),
  status           VARCHAR(30) DEFAULT 'vacant',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. UNIT IMAGES ──────────────────────────────────────────────────────────
CREATE TABLE unit_images (
  id         SERIAL PRIMARY KEY,
  unit_id    INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. PARTIES (unified owners + tenants) ───────────────────────────────────
CREATE TABLE parties (
  id                         SERIAL PRIMARY KEY,
  type                       VARCHAR(30) DEFAULT 'Individual',
  party_type                 VARCHAR(30) DEFAULT 'Tenant',
  company_name               VARCHAR(255),
  brand_name                 VARCHAR(255),
  brand_category             VARCHAR(100),
  legal_entity_type          VARCHAR(100),
  title                      VARCHAR(20),
  first_name                 VARCHAR(100),
  last_name                  VARCHAR(100),
  email                      VARCHAR(150),
  phone                      VARCHAR(50),
  alt_phone                  VARCHAR(50),
  identification_type        VARCHAR(50),
  identification_number      VARCHAR(100),
  address_line1              VARCHAR(255),
  address_line2              VARCHAR(255),
  city                       VARCHAR(100),
  state                      VARCHAR(100),
  postal_code                VARCHAR(20),
  country                    VARCHAR(100),
  representative_designation VARCHAR(100),
  owner_group                VARCHAR(100),
  status                     VARCHAR(20) DEFAULT 'active',
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. UNIT OWNERSHIPS ──────────────────────────────────────────────────────
CREATE TABLE unit_ownerships (
  id               SERIAL PRIMARY KEY,
  unit_id          INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  party_id         INT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  start_date       DATE,
  end_date         DATE,
  ownership_status VARCHAR(30) DEFAULT 'Active',
  share_percentage NUMERIC(5,2) DEFAULT 100,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. OWNERSHIP DOCUMENT TYPES ────────────────────────────────────────────
CREATE TABLE ownership_document_types (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. UNIT OWNERSHIP DOCUMENTS ────────────────────────────────────────────
CREATE TABLE unit_ownership_documents (
  id               SERIAL PRIMARY KEY,
  unit_id          INT REFERENCES units(id) ON DELETE CASCADE,
  party_id         INT REFERENCES parties(id) ON DELETE CASCADE,
  document_type_id INT REFERENCES ownership_document_types(id),
  document_date    DATE,
  file_path        VARCHAR(255),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 12. LEGACY OWNERS ───────────────────────────────────────────────────────
CREATE TABLE owners (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(150),
  phone        VARCHAR(50),
  company_name VARCHAR(255),
  tax_id       VARCHAR(100),
  address      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE owner_units (
  id          SERIAL PRIMARY KEY,
  owner_id    INT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  unit_id     INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE owner_documents (
  id            SERIAL PRIMARY KEY,
  owner_id      INT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  document_type VARCHAR(100),
  document_path VARCHAR(255),
  status        VARCHAR(20) DEFAULT 'pending',
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE owner_messages (
  id       SERIAL PRIMARY KEY,
  owner_id INT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  subject  VARCHAR(255),
  message  TEXT NOT NULL,
  is_read  BOOLEAN DEFAULT FALSE,
  sent_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 13. LEGACY TENANTS ──────────────────────────────────────────────────────
CREATE TABLE tenants (
  id                   SERIAL PRIMARY KEY,
  company_name         VARCHAR(255) NOT NULL,
  brand_name           VARCHAR(255),
  legal_entity_type    VARCHAR(100),
  registration_no      VARCHAR(100),
  industry             VARCHAR(100),
  tax_id               VARCHAR(100),
  id_type              VARCHAR(50),
  contact_person_name  VARCHAR(150),
  contact_person_email VARCHAR(150),
  contact_person_phone VARCHAR(50),
  website              VARCHAR(255),
  address              TEXT,
  city                 VARCHAR(100),
  state                VARCHAR(100),
  zip_code             VARCHAR(50),
  country              VARCHAR(100),
  status               VARCHAR(20) DEFAULT 'active',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_units (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id     INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 14. SUB TENANTS ─────────────────────────────────────────────────────────
CREATE TABLE sub_tenants (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name    VARCHAR(255) NOT NULL,
  registration_no VARCHAR(100),
  industry        VARCHAR(100),
  contact_person  VARCHAR(150),
  email           VARCHAR(150),
  phone           VARCHAR(50),
  allotted_area   NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 15. LEASES ──────────────────────────────────────────────────────────────
CREATE TABLE leases (
  id                          SERIAL PRIMARY KEY,
  project_id                  INT REFERENCES projects(id),
  unit_id                     INT REFERENCES units(id),
  party_owner_id              INT REFERENCES parties(id),
  party_tenant_id             INT REFERENCES parties(id),
  sub_tenant_id               INT REFERENCES sub_tenants(id),
  lease_type                  VARCHAR(30) DEFAULT 'Direct lease',
  rent_model                  VARCHAR(30) DEFAULT 'Fixed',
  sub_lease_area_sqft         NUMERIC(12,2),

  lease_start                 DATE,
  lease_end                   DATE,
  rent_commencement_date      DATE,
  fitout_period_start         DATE,
  fitout_period_end           DATE,
  unit_handover_date          DATE,
  opening_date                DATE,
  notice_vacation_date        DATE,
  rent_free_start_date        DATE,
  rent_free_end_date          DATE,
  loi_date                    DATE,
  agreement_date              DATE,
  deposit_payment_date        DATE,
  registration_date           DATE,

  tenure_months               INT,
  lockin_period_months        INT DEFAULT 0,
  notice_period_months        INT DEFAULT 0,
  lessee_lockin_period_months INT DEFAULT 0,
  lessor_lockin_period_months INT DEFAULT 0,
  lessee_notice_period_months INT DEFAULT 0,
  lessor_notice_period_months INT DEFAULT 0,

  monthly_rent                NUMERIC(15,2) DEFAULT 0,
  monthly_net_sales           NUMERIC(15,2) DEFAULT 0,
  rent_amount_option          VARCHAR(50),
  mg_amount_sqft              NUMERIC(12,2) DEFAULT 0,
  mg_amount                   NUMERIC(15,2) DEFAULT 0,
  cam_charges                 NUMERIC(15,2) DEFAULT 0,
  billing_frequency           VARCHAR(50) DEFAULT 'Monthly',
  payment_due_day             VARCHAR(50) DEFAULT '1st of Month',
  currency_code               VARCHAR(10) DEFAULT 'INR',
  security_deposit            NUMERIC(15,2) DEFAULT 0,
  utility_deposit             NUMERIC(15,2) DEFAULT 0,
  deposit_type                VARCHAR(50) DEFAULT 'Cash',
  revenue_share_percentage    NUMERIC(6,2),
  revenue_share_applicable_on VARCHAR(50),

  status                      VARCHAR(30) DEFAULT 'draft',
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 16. LEASE ESCALATIONS ───────────────────────────────────────────────────
CREATE TABLE lease_escalations (
  id             SERIAL PRIMARY KEY,
  lease_id       INT NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  sequence_no    INT,
  effective_from DATE,
  effective_to   DATE,
  increase_type  VARCHAR(30) DEFAULT 'Percentage',
  value          NUMERIC(12,2),
  escalation_on  VARCHAR(50),
  rate_per_sqft  NUMERIC(10,2),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 17. NOTIFICATIONS ───────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT,
  title      VARCHAR(255),
  message    TEXT,
  type       VARCHAR(30) DEFAULT 'info',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 18. ACTIVITY LOGS ───────────────────────────────────────────────────────
CREATE TABLE activity_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INT,
  action     VARCHAR(255),
  module     VARCHAR(100),
  details    TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 19. SETTINGS ────────────────────────────────────────────────────────────
CREATE TABLE settings (
  id           SERIAL PRIMARY KEY,
  company_name VARCHAR(255),
  company_logo VARCHAR(255),
  theme_color  VARCHAR(50),
  currency     VARCHAR(10) DEFAULT 'INR',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 20. DOCUMENTS ───────────────────────────────────────────────────────────
CREATE TABLE documents (
  id            SERIAL PRIMARY KEY,
  entity_type   VARCHAR(30),
  entity_id     INT,
  document_type VARCHAR(100),
  file_path     VARCHAR(255) NOT NULL,
  uploaded_by   INT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 21. FILTER OPTIONS ──────────────────────────────────────────────────────
CREATE TABLE filter_options (
  id           SERIAL PRIMARY KEY,
  category     VARCHAR(100) NOT NULL,
  option_value VARCHAR(255) NOT NULL,
  status       VARCHAR(20) DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category, option_value)
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_units_project         ON units(project_id);
CREATE INDEX idx_proj_blocks_project   ON project_blocks(project_id);
CREATE INDEX idx_proj_floors_block     ON project_floors(block_id);
CREATE INDEX idx_leases_unit           ON leases(unit_id);
CREATE INDEX idx_leases_status         ON leases(status);
CREATE INDEX idx_leases_tenant         ON leases(party_tenant_id);
CREATE INDEX idx_unit_ownerships_unit  ON unit_ownerships(unit_id);
CREATE INDEX idx_filter_options_cat    ON filter_options(category, status);


-- =======================================================================
--  SEED DATA
-- =======================================================================

-- Roles
INSERT INTO roles (role_name) VALUES
('Admin'), ('Lease Manager'), ('Data Entry'), ('Management Rep'), ('Viewer');

-- Settings
INSERT INTO settings (company_name, currency) VALUES ('Cusec Consulting LLP', 'INR');

-- Ownership Document Types
INSERT INTO ownership_document_types (name) VALUES
('Sale Deed'), ('Agreement to Sale'), ('Possession Letter'),
('NOC'), ('Power of Attorney'), ('Registration Certificate');

-- ─── FILTER OPTIONS — ALL APP DROPDOWNS ─────────────────────────────────────
INSERT INTO filter_options (category, option_value) VALUES
-- Project Types
('project_type', 'Retail / Shop'),
('project_type', 'Commercial'),
('project_type', 'Industrial'),
('project_type', 'Mixed Use'),
('project_type', 'Office'),
('project_type', 'Warehouse'),
('project_type', 'Mall'),

-- Unit Conditions (was ENUM → now VARCHAR admin-managed)
('unit_condition', 'Bare Shell'),
('unit_condition', 'Warm Shell'),
('unit_condition', 'Semi Fitted'),
('unit_condition', 'Fully Fitted'),
('unit_condition', 'Vacant'),
('unit_condition', 'Under Maintenance'),

-- PLC / Premium on Lease (was ENUM → now admin-managed)
('plc', 'None'),
('plc', 'Front Facing'),
('plc', 'Corner'),
('plc', 'Park Facing'),
('plc', 'Road Facing'),
('plc', 'Garden Facing'),

-- Unit Categories
('unit_category', 'Anchor Store'),
('unit_category', 'Fashion & Apparel'),
('unit_category', 'Food & Beverage'),
('unit_category', 'Electronics'),
('unit_category', 'Lifestyle'),
('unit_category', 'Entertainment'),
('unit_category', 'Services'),
('unit_category', 'Bank / ATM'),
('unit_category', 'Multiplex'),
('unit_category', 'Hypermarket'),

-- Unit Zoning Types
('unit_zoning_type', 'Ground Level'),
('unit_zoning_type', 'Upper Level'),
('unit_zoning_type', 'Basement'),
('unit_zoning_type', 'Terrace'),
('unit_zoning_type', 'Mezzanine'),

-- Block / Tower (also managed via project_blocks table now)
('block_tower', 'Block A'),
('block_tower', 'Block B'),
('block_tower', 'Block C'),
('block_tower', 'Tower 1'),
('block_tower', 'Tower 2'),
('block_tower', 'North Wing'),
('block_tower', 'South Wing'),

-- Floor Numbers (also managed via project_floors table now)
('floor_number', 'Basement'),
('floor_number', 'GF'),
('floor_number', '1F'),
('floor_number', '2F'),
('floor_number', '3F'),
('floor_number', '4F'),
('floor_number', '5F'),
('floor_number', 'Terrace'),

-- Lease Statuses
('lease_status', 'Active'),
('lease_status', 'Draft'),
('lease_status', 'Expired'),
('lease_status', 'Terminated'),
('lease_status', 'Pending Approval'),

-- Brand Categories
('brand_category', 'Luxury'),
('brand_category', 'Premium'),
('brand_category', 'Mass Market'),
('brand_category', 'Value'),
('brand_category', 'International'),
('brand_category', 'Domestic');

-- =======================================================================
--  Disable RLS for all tables (since backend uses service_role key)
--  This ensures the backend can always read/write without RLS issues.
-- =======================================================================
ALTER TABLE roles                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE users                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_blocks           DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_floors           DISABLE ROW LEVEL SECURITY;
ALTER TABLE units                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE unit_images              DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE unit_ownerships          DISABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_document_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE unit_ownership_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE owners                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE owner_units              DISABLE ROW LEVEL SECURITY;
ALTER TABLE owner_documents          DISABLE ROW LEVEL SECURITY;
ALTER TABLE owner_messages           DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_units             DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_tenants              DISABLE ROW LEVEL SECURITY;
ALTER TABLE leases                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE lease_escalations        DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs            DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents                DISABLE ROW LEVEL SECURITY;
ALTER TABLE filter_options           DISABLE ROW LEVEL SECURITY;
