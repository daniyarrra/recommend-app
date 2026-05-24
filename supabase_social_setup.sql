-- 1. Create the follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can read all follows" 
ON public.follows FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own follows" 
ON public.follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" 
ON public.follows FOR DELETE 
USING (auth.uid() = follower_id);
