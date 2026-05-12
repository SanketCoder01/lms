-- Run this in your Supabase SQL Editor to update the tables with company_id

ALTER TABLE leaseos_invoices 
ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;

ALTER TABLE leaseos_collections 
ADD COLUMN IF NOT EXISTS company_id INT REFERENCES company_users(id) ON DELETE SET NULL;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, reload_schema;
