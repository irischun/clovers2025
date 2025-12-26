-- Create a table for content rewrites history
CREATE TABLE public.content_rewrites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'website',
  original_content TEXT,
  rewritten_content TEXT,
  output_language TEXT NOT NULL DEFAULT 'zh-TW',
  style TEXT NOT NULL,
  custom_style TEXT,
  target_word_count INTEGER,
  geo_optimized BOOLEAN DEFAULT false,
  custom_ending BOOLEAN DEFAULT false,
  custom_ending_text TEXT,
  is_batch BOOLEAN DEFAULT false,
  batch_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content_rewrites ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own content rewrites" 
ON public.content_rewrites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content rewrites" 
ON public.content_rewrites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content rewrites" 
ON public.content_rewrites 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content rewrites" 
ON public.content_rewrites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_content_rewrites_updated_at
BEFORE UPDATE ON public.content_rewrites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();