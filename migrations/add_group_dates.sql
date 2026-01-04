-- Migration: Add start_date and end_date to groups table
-- Allows admin to manage programme timeline per squad

ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add constraint: end_date must be after start_date
ALTER TABLE groups 
ADD CONSTRAINT valid_date_range 
CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date);

-- Update existing groups with default values if needed
-- Uncomment and adjust dates as needed:
-- UPDATE groups SET start_date = '2026-01-06' WHERE start_date IS NULL;
-- UPDATE groups SET end_date = start_date + INTERVAL '56 days' WHERE end_date IS NULL AND start_date IS NOT NULL;
