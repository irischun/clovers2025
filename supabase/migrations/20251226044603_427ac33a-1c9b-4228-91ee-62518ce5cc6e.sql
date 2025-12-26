-- Create table for Upload-Post settings
CREATE TABLE public.upload_post_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_key TEXT NOT NULL,
  managed_user TEXT NOT NULL,
  facebook_page_ids TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.upload_post_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own upload post settings" 
ON public.upload_post_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own upload post settings" 
ON public.upload_post_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upload post settings" 
ON public.upload_post_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upload post settings" 
ON public.upload_post_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_upload_post_settings_updated_at
BEFORE UPDATE ON public.upload_post_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();