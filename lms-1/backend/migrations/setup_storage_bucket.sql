-- ============================================================================
-- SETUP SUPABASE STORAGE BUCKET FOR FILE UPLOADS
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lms-storage',
  'lms-storage',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up public access policy for the bucket
-- Allow anyone to read files from the bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'lms-storage');

-- 3. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'lms-storage' AND auth.role() = 'authenticated');

-- 4. Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'lms-storage' AND auth.role() = 'authenticated');

-- 5. Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'lms-storage' AND auth.role() = 'authenticated');

-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'lms-storage';
