-- Migration: Delete deprecated wods table
-- This table is no longer used - scheduled_workouts is the active table

-- Step 1: Drop the deprecated table
DROP TABLE IF EXISTS wods CASCADE;

-- Verification: This should return an error (table doesn't exist)
-- SELECT COUNT(*) FROM wods;
