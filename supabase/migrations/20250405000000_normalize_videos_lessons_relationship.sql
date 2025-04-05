-- Migration to normalize the videos-lessons relationship
-- This migration removes the array-based relationship and creates a proper join table

-- Step 1: Create the join table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.video_lesson_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Add a unique constraint to prevent duplicate relationships
ALTER TABLE public.video_lesson_relations 
ADD CONSTRAINT unique_video_lesson_relation UNIQUE (video_id, lesson_id);

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_lesson_relations_video_id ON public.video_lesson_relations(video_id);
CREATE INDEX IF NOT EXISTS idx_video_lesson_relations_lesson_id ON public.video_lesson_relations(lesson_id);

-- Step 4: Create trigger for updated_at
CREATE TRIGGER video_lesson_relations_updated_at_trigger
BEFORE UPDATE ON public.video_lesson_relations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 5: Migrate existing relationships to the join table
-- First, we need to ensure the data is migrated correctly from the array columns

-- Migrate videos.lessons array to join table
DO $$
DECLARE
    video_record RECORD;
    lesson_id UUID;
BEGIN
    -- Check if videos table exists and has a lessons column
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'videos'
        AND column_name = 'lessons'
    ) THEN
        -- For each video with a non-null lessons array
        FOR video_record IN 
            SELECT id, lessons FROM public.videos 
            WHERE lessons IS NOT NULL AND array_length(lessons, 1) > 0
        LOOP
            -- For each lesson ID in the array
            FOREACH lesson_id IN ARRAY video_record.lessons
            LOOP
                -- Insert into join table if the relationship doesn't exist yet
                INSERT INTO public.video_lesson_relations (video_id, lesson_id)
                VALUES (video_record.id, lesson_id)
                ON CONFLICT (video_id, lesson_id) DO NOTHING;
            END LOOP;
        END LOOP;
    END IF;
END $$;

-- Migrate lessons.video_ids array to join table
DO $$
DECLARE
    lesson_record RECORD;
    video_id UUID;
BEGIN
    -- Check if lessons table exists and has a video_ids column
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons'
        AND column_name = 'video_ids'
    ) THEN
        -- For each lesson with a non-null video_ids array
        FOR lesson_record IN 
            SELECT id, video_ids FROM public.lessons 
            WHERE video_ids IS NOT NULL AND array_length(video_ids, 1) > 0
        LOOP
            -- For each video ID in the array
            FOREACH video_id IN ARRAY lesson_record.video_ids
            LOOP
                -- Insert into join table if the relationship doesn't exist yet
                INSERT INTO public.video_lesson_relations (video_id, lesson_id)
                VALUES (video_id, lesson_record.id)
                ON CONFLICT (video_id, lesson_id) DO NOTHING;
            END LOOP;
        END LOOP;
    END IF;
END $$;

-- Step 6: Remove the array columns after migration is complete
DO $$
BEGIN
    -- Check if videos table exists and has a lessons column
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'videos'
        AND column_name = 'lessons'
    ) THEN
        -- Remove the lessons array column from videos table
        ALTER TABLE public.videos DROP COLUMN IF EXISTS lessons;
    END IF;

    -- Check if lessons table exists and has a video_ids column
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons'
        AND column_name = 'video_ids'
    ) THEN
        -- Remove the video_ids array column from lessons table
        ALTER TABLE public.lessons DROP COLUMN IF EXISTS video_ids;
    END IF;
END $$;

-- Step 7: Add Row Level Security policies for the join table
ALTER TABLE public.video_lesson_relations ENABLE ROW LEVEL SECURITY;

-- Create policy for select: Users can view relationships for videos they have access to
CREATE POLICY "Users can view video-lesson relationships"
ON public.video_lesson_relations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.videos v
        WHERE v.id = video_id AND (
            v.is_published = true OR
            v.instructor_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.purchases p
                WHERE p.user_id = auth.uid() AND p.video_id = v.id
            )
        )
    ) OR
    EXISTS (
        SELECT 1 FROM public.lessons l
        WHERE l.id = lesson_id AND (
            l.is_published = true OR
            l.instructor_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.purchases p
                WHERE p.user_id = auth.uid() AND p.lesson_id = l.id
            )
        )
    )
);

-- Create policy for insert: Only instructors can create relationships for their own content
CREATE POLICY "Instructors can create relationships for their content"
ON public.video_lesson_relations
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.videos v
        WHERE v.id = video_id AND v.instructor_id = auth.uid()
    ) AND
    EXISTS (
        SELECT 1 FROM public.lessons l
        WHERE l.id = lesson_id AND l.instructor_id = auth.uid()
    )
);

-- Create policy for delete: Only instructors can delete relationships for their own content
CREATE POLICY "Instructors can delete relationships for their content"
ON public.video_lesson_relations
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.videos v
        WHERE v.id = video_id AND v.instructor_id = auth.uid()
    ) AND
    EXISTS (
        SELECT 1 FROM public.lessons l
        WHERE l.id = lesson_id AND l.instructor_id = auth.uid()
    )
);

-- Add a comment to the table to explain its purpose
COMMENT ON TABLE public.video_lesson_relations IS 
'Join table that manages the many-to-many relationship between videos and lessons.';
