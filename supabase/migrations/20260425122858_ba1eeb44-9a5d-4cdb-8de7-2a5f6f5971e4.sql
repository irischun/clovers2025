-- Create admin_uploads table to store admin-uploaded showcase media
CREATE TABLE public.admin_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('manga', 'cover', 'product')),
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  storage_path TEXT,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_uploads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can view admin uploads — they appear on the public landing page
CREATE POLICY "Admin uploads are publicly viewable"
ON public.admin_uploads FOR SELECT
USING (true);

-- Only the designated admin email can insert
CREATE POLICY "Only admin can insert uploads"
ON public.admin_uploads FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND (auth.jwt() ->> 'email') = 'irischun2018@gmail.com'
);

-- Only the designated admin email can delete
CREATE POLICY "Only admin can delete uploads"
ON public.admin_uploads FOR DELETE
USING (
  (auth.jwt() ->> 'email') = 'irischun2018@gmail.com'
);

CREATE INDEX idx_admin_uploads_category_created ON public.admin_uploads (category, created_at DESC);

-- Create storage bucket for admin uploads (public so URLs work directly on landing page)
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-uploads', 'admin-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin-only write/delete
CREATE POLICY "Admin uploads bucket public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-uploads');

CREATE POLICY "Only admin can upload to admin-uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'admin-uploads'
  AND (auth.jwt() ->> 'email') = 'irischun2018@gmail.com'
);

CREATE POLICY "Only admin can delete admin-uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'admin-uploads'
  AND (auth.jwt() ->> 'email') = 'irischun2018@gmail.com'
);