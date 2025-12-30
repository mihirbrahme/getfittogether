-- Migration: Remove redundant biometric columns from profiles table
-- These columns are now managed in biometric_logs table

-- Step 1: First ensure biometric_logs has all necessary data
-- (Data was already migrated in create_biometrics_audit_tables.sql)

-- Step 2: Drop the redundant columns from profiles
-- Note: Keep 'height' as it's a relatively static measurement often needed for BMI calculation
-- Remove: weight, body_fat_percentage, muscle_mass_percentage, bmi

ALTER TABLE profiles DROP COLUMN IF EXISTS weight;
ALTER TABLE profiles DROP COLUMN IF EXISTS body_fat_percentage;
ALTER TABLE profiles DROP COLUMN IF EXISTS muscle_mass_percentage;
ALTER TABLE profiles DROP COLUMN IF EXISTS bmi;

-- Verification: After running, profiles should only have:
-- id, first_name, last_name, full_name, display_name, height, age,
-- avatar_url, fitness_level, injuries, role, status, total_points, created_at, updated_at
