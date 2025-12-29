-- ================================================
-- Supabase Cleanup Script - Remove Redundant Tables
-- ================================================
-- This script removes old WOD system tables that have been
-- replaced by the new workout library system
-- ================================================

-- ⚠️ IMPORTANT: This script will DELETE data permanently
-- Make sure you have created and tested the new system before running this
-- Consider backing up data if you need historical records

-- ================================================
-- OLD vs NEW TABLE MAPPING
-- ================================================
-- OLD: wods → NEW: scheduled_workouts + workout_templates
-- OLD: workout_library → NEW: workout_templates + workout_exercises
-- OLD: wod_squad_assignments → NEW: scheduled_workout_squads
-- ================================================

-- ================================================
-- STEP 1: DROP DEPRECATED TABLES
-- ================================================

-- Drop old WOD Squad Assignments junction table
-- This was replaced by scheduled_workout_squads
DROP TABLE IF EXISTS wod_squad_assignments CASCADE;

-- Drop old WODs table
-- This was replaced by scheduled_workouts
DROP TABLE IF EXISTS wods CASCADE;

-- Drop old Workout Library table
-- This was replaced by workout_templates + workout_exercises
DROP TABLE IF EXISTS workout_library CASCADE;

-- ================================================
-- STEP 2: VERIFY NEW TABLES EXIST
-- ================================================
-- Run this query to confirm new tables are in place:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'workout_templates',
    'workout_exercises', 
    'scheduled_workouts',
    'scheduled_workout_squads'
)
ORDER BY table_name;

-- Expected output: Should show all 4 new tables
-- If any are missing, DO NOT proceed with cleanup

-- ================================================
-- STEP 3: VERIFY DATA IN NEW SYSTEM
-- ================================================

-- Check workout templates count
SELECT COUNT(*) as template_count FROM workout_templates;

-- Check exercises count
SELECT COUNT(*) as exercise_count FROM workout_exercises;

-- Check scheduled workouts count
SELECT COUNT(*) as scheduled_count FROM scheduled_workouts;

-- Check squad assignments count
SELECT COUNT(*) as assignment_count FROM scheduled_workout_squads;

-- ================================================
-- OPTIONAL: MIGRATION SCRIPT (If you need old data)
-- ================================================
-- If you want to preserve old WOD data before cleanup,
-- run this BEFORE dropping tables:

/*
-- Create backup tables
CREATE TABLE wods_backup AS SELECT * FROM wods;
CREATE TABLE workout_library_backup AS SELECT * FROM workout_library;
CREATE TABLE wod_squad_assignments_backup AS SELECT * FROM wod_squad_assignments;

-- Verify backups
SELECT COUNT(*) FROM wods_backup;
SELECT COUNT(*) FROM workout_library_backup;
SELECT COUNT(*) FROM wod_squad_assignments_backup;
*/

-- ================================================
-- CLEANUP SUMMARY
-- ================================================
-- After running this script:
-- ✅ Old tables removed (wods, workout_library, wod_squad_assignments)
-- ✅ New system tables active (workout_templates, workout_exercises, etc.)
-- ✅ Admin uses: WOD Library → Calendar assignment
-- ✅ Participants see: Detailed exercises in WOD page
-- ================================================

-- ================================================
-- ROLLBACK (Emergency Only)
-- ================================================
-- If you backed up data and need to restore:
/*
CREATE TABLE wods AS SELECT * FROM wods_backup;
CREATE TABLE workout_library AS SELECT * FROM workout_library_backup;
CREATE TABLE wod_squad_assignments AS SELECT * FROM wod_squad_assignments_backup;
*/
-- ================================================
