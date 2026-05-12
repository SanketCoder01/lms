-- =======================================================================
--  LMS INVOICING & COLLECTIONS SCHEMA
--  Run this in your Supabase SQL Editor
-- =======================================================================

CREATE TABLE IF NOT EXISTS leaseos_invoices (
  id SERIAL PRIMARY KEY,
  invoice_no VARCHAR(100) UNIQUE NOT NULL,
  company_id INT REFERENCES company_users(id),
  project_id INT REFERENCES projects(id),
  unit_id INT REFERENCES units(id),
  lease_id INT REFERENCES leases(id),
  owner_party_id INT REFERENCES parties(id),
  tenant_party_id INT REFERENCES parties(id),
  billing_month VARCHAR(20), -- format: 'YYYY-MM'
  invoice_date DATE,
  due_date DATE,
  rent_amount NUMERIC(15, 2) DEFAULT 0,
  cam_amount NUMERIC(15, 2) DEFAULT 0,
  gst_amount NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  collected_amount NUMERIC(15, 2) DEFAULT 0,
  balance_amount NUMERIC(15, 2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Outstanding', -- e.g., 'Draft', 'Outstanding', 'Partial', 'Paid', 'Overdue'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaseos_collections (
  id SERIAL PRIMARY KEY,
  receipt_no VARCHAR(100) UNIQUE NOT NULL,
  company_id INT REFERENCES company_users(id),
  invoice_id INT REFERENCES leaseos_invoices(id),
  project_id INT REFERENCES projects(id),
  unit_id INT REFERENCES units(id),
  tenant_party_id INT REFERENCES parties(id),
  receipt_date DATE,
  payment_mode VARCHAR(50), -- 'NEFT', 'RTGS', 'Cheque', 'Cash', etc.
  reference_no VARCHAR(100),
  amount NUMERIC(15, 2) DEFAULT 0,
  tds_amount NUMERIC(15, 2) DEFAULT 0,
  net_amount NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security so your frontend can read/write data using the anon key.
ALTER TABLE leaseos_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaseos_collections DISABLE ROW LEVEL SECURITY;
