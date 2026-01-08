-- Make the media bucket private
UPDATE storage.buckets SET public = false WHERE id = 'media';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;

-- Create authenticated SELECT policy so users can only view their own files
CREATE POLICY "Users can view their own files" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );