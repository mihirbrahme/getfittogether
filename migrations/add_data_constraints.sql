-- Migration: Add Database Constraints for Data Integrity
-- Prevents invalid data from being inserted

-- =====================================================
-- PROFILES CONSTRAINTS
-- =====================================================

-- Drop existing constraints if they exist
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS positive_total_points;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS positive_streaks;

-- Ensure total_points is never negative
ALTER TABLE profiles 
ADD CONSTRAINT positive_total_points CHECK (total_points >= 0);

-- Ensure streak values are non-negative
ALTER TABLE profiles 
ADD CONSTRAINT positive_streaks CHECK (
  current_checkin_streak >= 0 AND
  current_workout_streak >= 0 AND
  current_clean_streak >= 0 AND
  longest_checkin_streak >= 0 AND
  longest_workout_streak >= 0 AND
  longest_clean_streak >= 0 AND
  streak_bonus_points >= 0
);

-- =====================================================
-- ADMIN WEEKLY POINTS CONSTRAINTS
-- =====================================================

ALTER TABLE admin_weekly_points DROP CONSTRAINT IF EXISTS valid_admin_points;

-- Limit admin points to 0-10 per category
ALTER TABLE admin_weekly_points
ADD CONSTRAINT valid_admin_points CHECK (
  consistency_points BETWEEN 0 AND 10 AND
  effort_points BETWEEN 0 AND 10 AND
  community_points BETWEEN 0 AND 10
);

-- =====================================================
-- DAILY LOGS CONSTRAINTS
-- =====================================================

ALTER TABLE daily_logs DROP CONSTRAINT IF EXISTS negative_points_check;
ALTER TABLE daily_logs DROP CONSTRAINT IF EXISTS reasonable_daily_points;

-- Ensure negative_points is never positive (it's for deductions)
ALTER TABLE daily_logs
ADD CONSTRAINT negative_points_check CHECK (
  negative_points IS NULL OR negative_points <= 0
);

-- Ensure daily_points is reasonable (max 100 to catch errors)
ALTER TABLE daily_logs
ADD CONSTRAINT reasonable_daily_points CHECK (
  daily_points BETWEEN -50 AND 100
);

-- =====================================================
-- STREAK MILESTONES CONSTRAINTS
-- =====================================================

ALTER TABLE streak_milestones DROP CONSTRAINT IF EXISTS positive_milestone_values;

-- Ensure milestone values are positive
ALTER TABLE streak_milestones
ADD CONSTRAINT positive_milestone_values CHECK (
  days_required > 0 AND
  bonus_points > 0
);

-- =====================================================
-- SQUAD CHECKIN ACTIVITIES CONSTRAINTS
-- =====================================================

ALTER TABLE squad_checkin_activities DROP CONSTRAINT IF EXISTS reasonable_activity_points;

-- Ensure points are reasonable
ALTER TABLE squad_checkin_activities
ADD CONSTRAINT reasonable_activity_points CHECK (
  points BETWEEN 0 AND 50
);

-- =====================================================
-- EVENTS CONSTRAINTS
-- =====================================================

ALTER TABLE events DROP CONSTRAINT IF EXISTS positive_bonus_points;

-- Ensure bonus points are non-negative
ALTER TABLE events
ADD CONSTRAINT positive_bonus_points CHECK (
  bonus_points >= 0
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Speed up daily logs queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date 
ON daily_logs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_logs_date 
ON daily_logs(date DESC);

-- Speed up admin weekly points queries
CREATE INDEX IF NOT EXISTS idx_admin_weekly_user_week 
ON admin_weekly_points(user_id, week_start);

-- Speed up group members queries
CREATE INDEX IF NOT EXISTS idx_group_members_user 
ON group_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_group_members_group 
ON group_members(group_id, status);

-- Speed up streak bonus log queries
CREATE INDEX IF NOT EXISTS idx_streak_bonus_user 
ON streak_bonus_log(user_id, awarded_at DESC);

-- Speed up biometric logs queries
CREATE INDEX IF NOT EXISTS idx_biometric_logs_user 
ON biometric_logs(user_id, created_at DESC);

