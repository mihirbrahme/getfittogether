-- Migration: Remove redundant biometric columns from profiles table
-- These columns are now managed in biometric_logs table

-- Step 1: Drop the BMI trigger that depends on weight column
DROP TRIGGER IF EXISTS trigger_auto_calculate_bmi_profile ON profiles;

-- Step 2: Drop the function that powered the trigger (cleanup)
DROP FUNCTION IF EXISTS calculate_bmi_on_profile_update();

-- Step 3: Drop the redundant columns from profiles
-- Note: Keep 'height' as it's a relatively static measurement often needed for display
-- Remove: weight, body_fat_percentage, muscle_mass_percentage, bmi

ALTER TABLE profiles DROP COLUMN IF EXISTS weight;
ALTER TABLE profiles DROP COLUMN IF EXISTS body_fat_percentage;
ALTER TABLE profiles DROP COLUMN IF EXISTS muscle_mass_percentage;
ALTER TABLE profiles DROP COLUMN IF EXISTS bmi;

-- Verification: After running, profiles should only have:
-- id, first_name, last_name, full_name, display_name, height, age,
-- avatar_url, fitness_level, injuries, role, status, total_points, created_at, updated_at
