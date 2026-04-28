-- ============================================================================
-- FIX LEASES FOREIGN KEYS FOR PROPER DATA RELATIONSHIPS
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Ensure foreign keys exist for leases table
-- These are required for the Supabase query to join parties correctly

-- Check if foreign keys exist, if not create them
DO $$
BEGIN
    -- Foreign key for party_tenant_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leases_party_tenant_id_fkey' 
        AND table_name = 'leases'
    ) THEN
        ALTER TABLE leases 
        ADD CONSTRAINT leases_party_tenant_id_fkey 
        FOREIGN KEY (party_tenant_id) REFERENCES parties(id) ON DELETE SET NULL;
    END IF;

    -- Foreign key for party_owner_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leases_party_owner_id_fkey' 
        AND table_name = 'leases'
    ) THEN
        ALTER TABLE leases 
        ADD CONSTRAINT leases_party_owner_id_fkey 
        FOREIGN KEY (party_owner_id) REFERENCES parties(id) ON DELETE SET NULL;
    END IF;

    -- Foreign key for sub_tenant_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leases_sub_tenant_id_fkey' 
        AND table_name = 'leases'
    ) THEN
        ALTER TABLE leases 
        ADD CONSTRAINT leases_sub_tenant_id_fkey 
        FOREIGN KEY (sub_tenant_id) REFERENCES parties(id) ON DELETE SET NULL;
    END IF;

    -- Foreign key for project_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leases_project_id_fkey' 
        AND table_name = 'leases'
    ) THEN
        ALTER TABLE leases 
        ADD CONSTRAINT leases_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;

    -- Foreign key for unit_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leases_unit_id_fkey' 
        AND table_name = 'leases'
    ) THEN
        ALTER TABLE leases 
        ADD CONSTRAINT leases_unit_id_fkey 
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(party_tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_owner_id ON leases(party_owner_id);
CREATE INDEX IF NOT EXISTS idx_leases_sub_tenant_id ON leases(sub_tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_project_id ON leases(project_id);
CREATE INDEX IF NOT EXISTS idx_leases_unit_id ON leases(unit_id);

-- 3. Verify the foreign keys
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'leases';
