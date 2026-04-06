-- CREATE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lms-storage', 'lms-storage', true) 
ON CONFLICT (id) DO NOTHING;

-- CREATE STORAGE POLICIES
-- Allow SELECT for all users (public)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'lms-storage');

-- Allow INSERT for authenticated or anon logic depending on setup
-- Assuming we use the service role key from backend, it bypasses RLS. 
-- However, if frontend uploads directly, we need INSERT policy. We are uploading via backend, so service_role bypasses this.
-- Just in case we move it to frontend later:
CREATE POLICY "Enable Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lms-storage');
CREATE POLICY "Enable Update" ON storage.objects FOR UPDATE USING (bucket_id = 'lms-storage');
CREATE POLICY "Enable Delete" ON storage.objects FOR DELETE USING (bucket_id = 'lms-storage');


-- ENABLE REALTIME
-- Create publication if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE leases;
ALTER PUBLICATION supabase_realtime ADD TABLE unit_ownerships;
ALTER PUBLICATION supabase_realtime ADD TABLE parties;
ALTER PUBLICATION supabase_realtime ADD TABLE states;
ALTER PUBLICATION supabase_realtime ADD TABLE cities;
