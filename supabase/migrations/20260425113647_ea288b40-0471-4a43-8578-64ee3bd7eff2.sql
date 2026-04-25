-- Community-published items shared from personal gallery
CREATE TABLE public.community_published (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  source_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  title TEXT,
  prompt TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_type, source_id)
);

CREATE INDEX idx_community_published_created_at ON public.community_published(created_at DESC);
CREATE INDEX idx_community_published_user ON public.community_published(user_id);
CREATE INDEX idx_community_published_source ON public.community_published(source_id);

ALTER TABLE public.community_published ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated visitors) can browse the community gallery
CREATE POLICY "Community items are publicly viewable"
ON public.community_published
FOR SELECT
USING (true);

-- Only the owner of the source media may publish it
CREATE POLICY "Users can publish their own items to community"
ON public.community_published
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only the owner may unpublish (delete) their community item
CREATE POLICY "Users can unpublish their own community items"
ON public.community_published
FOR DELETE
USING (auth.uid() = user_id);
