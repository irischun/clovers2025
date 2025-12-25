-- Create voice_generations table for history
CREATE TABLE public.voice_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text_content TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  voice_id VARCHAR(100) NOT NULL,
  voice_name VARCHAR(100) NOT NULL,
  model VARCHAR(50) NOT NULL,
  speed DECIMAL(3,2) DEFAULT 1.0,
  volume DECIMAL(3,2) DEFAULT 1.0,
  pitch INTEGER DEFAULT 0,
  emotion VARCHAR(50) DEFAULT 'neutral',
  sample_rate INTEGER DEFAULT 44100,
  bitrate INTEGER DEFAULT 128000,
  format VARCHAR(10) DEFAULT 'mp3',
  audio_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own voice generations"
ON public.voice_generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice generations"
ON public.voice_generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice generations"
ON public.voice_generations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice generations"
ON public.voice_generations FOR DELETE
USING (auth.uid() = user_id);