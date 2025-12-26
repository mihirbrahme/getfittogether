-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Check if group_codes index exists, if not create it (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);
