-- Create table for WordPress connection settings
CREATE TABLE public.wordpress_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  site_url TEXT NOT NULL,
  username TEXT NOT NULL,
  app_password TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wordpress_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own WordPress connections"
ON public.wordpress_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WordPress connections"
ON public.wordpress_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WordPress connections"
ON public.wordpress_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WordPress connections"
ON public.wordpress_connections FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wordpress_connections_updated_at
BEFORE UPDATE ON public.wordpress_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for publishing history
CREATE TABLE public.publishing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'wordpress',
  status TEXT NOT NULL DEFAULT 'published',
  published_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.publishing_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for publishing history
CREATE POLICY "Users can view their own publishing history"
ON public.publishing_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own publishing history"
ON public.publishing_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own publishing history"
ON public.publishing_history FOR DELETE
USING (auth.uid() = user_id);