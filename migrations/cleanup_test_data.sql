-- Migration: Clean Test Data
-- Removes all test users and their data, keeps admin, workouts, and squads

-- IMPORTANT: Review this carefully before running!
-- This will DELETE data permanently.

-- =====================================================
-- DELETE TEST USER DATA
-- =====================================================

-- 1. Delete daily logs for non-admin users
DELETE FROM daily_logs
WHERE user_id IN (
    SELECT id FROM profiles WHERE role != 'admin'
);

-- 2. Delete biometric logs for non-admin users
DELETE FROM biometric_logs
WHERE user_id IN (
    SELECT id FROM profiles WHERE role != 'admin'
);

-- 3. Delete admin weekly points for non-admin users
DELETE FROM admin_weekly_points
WHERE user_id IN (
    SELECT id FROM profiles WHERE role != 'admin'
);

-- 4. Delete streak bonus logs for non-admin users
DELETE FROM streak_bonus_log
WHERE user_id IN (
    SELECT id FROM profiles WHERE role != 'admin'
);

-- 5. Delete user goal assignments for non-admin users
DELETE FROM user_goal_assignments
WHERE user_id IN (
    SELECT id FROM profiles WHERE role != 'admin'
);

-- 6. Delete group memberships for non-admin users
DELETE FROM group_members
WHERE user_id IN (
    SELECT id FROM profiles WHERE role != 'admin'
);

-- 7. Delete events (optional - uncomment if you want to delete test events)
-- DELETE FROM events;

-- 8. Reset streak data for admin (if admin participated in testing)
UPDATE profiles
SET 
    current_checkin_streak = 0,
    current_workout_streak = 0,
    current_clean_streak = 0,
    longest_checkin_streak = 0,
    longest_workout_streak = 0,
    longest_clean_streak = 0,
    streak_bonus_points = 0,
    total_points = 0,
    last_streak_calculation = NULL
WHERE role = 'admin';

-- 9. Finally, delete non-admin user profiles
-- This will CASCADE delete any remaining references due to ON DELETE CASCADE
DELETE FROM profiles
WHERE role != 'admin';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check remaining users (should only show admin)
SELECT id, full_name, role, total_points FROM profiles;

-- Check groups are intact
SELECT id, name, created_at FROM groups;

-- Verify all test data is gone
SELECT 
    (SELECT COUNT(*) FROM daily_logs) as daily_logs_count,
    (SELECT COUNT(*) FROM biometric_logs) as biometric_logs_count,
    (SELECT COUNT(*) FROM admin_weekly_points) as admin_points_count,
    (SELECT COUNT(*) FROM streak_bonus_log) as streak_bonus_count,
    (SELECT COUNT(*) FROM user_goal_assignments) as goal_assignments_count,
    (SELECT COUNT(*) FROM group_members) as group_members_count;
-- All should be 0 if only admin exists and admin hasn't done activities

