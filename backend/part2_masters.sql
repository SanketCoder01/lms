-- Issue 22: Create States and Cities Masters
CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  state_id INT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(state_id, name)
);

-- Seed some simple data for functionality
INSERT INTO states (name) VALUES ('Maharashtra'), ('Karnataka'), ('Delhi'), ('Gujarat') ON CONFLICT DO NOTHING;
INSERT INTO cities (state_id, name) 
SELECT id, 'Mumbai' FROM states WHERE name = 'Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO cities (state_id, name) 
SELECT id, 'Pune' FROM states WHERE name = 'Maharashtra'
ON CONFLICT DO NOTHING;
INSERT INTO cities (state_id, name) 
SELECT id, 'Bangalore' FROM states WHERE name = 'Karnataka'
ON CONFLICT DO NOTHING;
INSERT INTO cities (state_id, name) 
SELECT id, 'Ahmedabad' FROM states WHERE name = 'Gujarat'
ON CONFLICT DO NOTHING;

-- Issue 27: Remove 'Possession Handover' from ownership_document_types
DELETE FROM ownership_document_types WHERE name ILIKE '%Possession Handover%';
