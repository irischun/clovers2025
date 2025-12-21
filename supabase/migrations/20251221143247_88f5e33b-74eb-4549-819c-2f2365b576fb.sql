-- =====================
-- PROMPTS TABLE
-- =====================
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompts" ON public.prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own prompts" ON public.prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompts" ON public.prompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompts" ON public.prompts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- SCHEDULED POSTS TABLE
-- =====================
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'general',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'draft', 'failed')),
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own posts" ON public.scheduled_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own posts" ON public.scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.scheduled_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.scheduled_posts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON public.scheduled_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- AI GENERATIONS TABLE
-- =====================
CREATE TABLE public.ai_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  result TEXT NOT NULL,
  tool_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generations" ON public.ai_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own generations" ON public.ai_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own generations" ON public.ai_generations FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- MEDIA FILES TABLE
-- =====================
CREATE TABLE public.media_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media" ON public.media_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own media" ON public.media_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media" ON public.media_files FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- STORAGE BUCKET FOR MEDIA
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Users can upload their own media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own media files" ON storage.objects FOR SELECT USING (
  bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media files" ON storage.objects FOR DELETE USING (
  bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');