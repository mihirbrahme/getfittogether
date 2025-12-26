-- Add start_date to groups table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT '2025-01-01';

-- Update existing groups to have a start date (if needed, though default handles it)
UPDATE groups SET start_date = '2025-01-01' WHERE start_date IS NULL;
