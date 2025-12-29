-- Phase 3 Enhancement: Add YouTube video link support to WODs
-- Migration: Add video_url field to wods table

ALTER TABLE wods ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add video_url to workout_library as well for templates
ALTER TABLE workout_library ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Optional: Add comment for documentation
COMMENT ON COLUMN wods.video_url IS 'YouTube or video URL for exercise demonstration';
COMMENT ON COLUMN workout_library.video_url IS 'YouTube or video URL for exercise demonstration template';
