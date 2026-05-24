-- 1. Create review_likes table
CREATE TABLE IF NOT EXISTS public.review_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id bigint REFERENCES public.ratings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(rating_id, user_id)
);

ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read likes" ON public.review_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.review_likes FOR DELETE USING (auth.uid() = user_id);

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- recipient
  actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- who did the action
  type text NOT NULL, -- 'like'
  entity_id bigint, -- e.g., rating_id
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System/Users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
