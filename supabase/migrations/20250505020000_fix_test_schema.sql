-- Fix missing columns needed for tests
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending';
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

-- Add videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    price NUMERIC DEFAULT 0,
    instructor_id UUID REFERENCES auth.users(id),
    lesson_id UUID REFERENCES public.lessons(id),
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for the videos table
CREATE POLICY "Users can view published videos" ON public.videos FOR SELECT USING (is_published = true);
CREATE POLICY "Instructors can view their own videos" ON public.videos FOR SELECT USING (auth.uid() = instructor_id);
CREATE POLICY "Instructors can update their own videos" ON public.videos FOR UPDATE USING (auth.uid() = instructor_id);
CREATE POLICY "Instructors can delete their own videos" ON public.videos FOR DELETE USING (auth.uid() = instructor_id);
CREATE POLICY "Instructors can insert videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = instructor_id);

-- Add video access verification function
CREATE OR REPLACE FUNCTION public.verify_video_access(p_user_id uuid, p_video_id uuid)
RETURNS boolean AS $$
DECLARE
  v_instructor_id uuid;
  v_is_published boolean;
  v_has_purchase boolean;
BEGIN
  -- Get video information
  SELECT 
    instructor_id,
    is_published
  INTO
    v_instructor_id,
    v_is_published
  FROM videos
  WHERE id = p_video_id;
  
  -- If video doesn't exist, return false
  IF v_instructor_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- If user is the instructor, always grant access
  IF p_user_id = v_instructor_id THEN
    RETURN true;
  END IF;
  
  -- Check if user has purchased the video
  SELECT EXISTS (
    SELECT 1
    FROM purchases
    WHERE user_id = p_user_id
    AND video_id = p_video_id
  ) INTO v_has_purchase;
  
  -- Return true if user has purchased or video is published and free
  RETURN v_has_purchase OR (v_is_published AND (
    SELECT price = 0 FROM videos WHERE id = p_video_id
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.verify_video_access IS 'Verifies if a user has access to a video based on ownership, purchase, or free status';