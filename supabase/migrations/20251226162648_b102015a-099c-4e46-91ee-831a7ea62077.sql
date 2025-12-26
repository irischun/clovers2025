-- Create user_points table to track user point balances
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Users can view their own points
CREATE POLICY "Users can view their own points"
ON public.user_points
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own points (for demo purposes)
CREATE POLICY "Users can update their own points"
ON public.user_points
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own points record
CREATE POLICY "Users can insert their own points"
ON public.user_points
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();