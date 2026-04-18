
-- Create a public-read bucket for AI-generated images so the URL stored in DB is small and CDN-served
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public can read (the bucket is public, but explicit policy makes it bullet-proof)
CREATE POLICY "Public read generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users upload generated images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users delete their own
CREATE POLICY "Users delete own generated images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role bypasses RLS, but allow it explicitly for clarity (used by backfill function)
CREATE POLICY "Service role full access generated images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'generated-images')
WITH CHECK (bucket_id = 'generated-images');
