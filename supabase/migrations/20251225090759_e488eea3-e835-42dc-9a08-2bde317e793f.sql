-- Create subtitle_conversions table for tracking conversion history
CREATE TABLE public.subtitle_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'upload', -- 'upload', 'video_library', 'voice_library'
  source_url TEXT,
  languages TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  subtitle_urls JSONB DEFAULT '{}', -- { "zh-TW": "url", "en": "url" }
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subtitle_conversions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own conversions" 
ON public.subtitle_conversions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversions" 
ON public.subtitle_conversions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversions" 
ON public.subtitle_conversions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversions" 
ON public.subtitle_conversions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subtitle_conversions_updated_at
BEFORE UPDATE ON public.subtitle_conversions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();