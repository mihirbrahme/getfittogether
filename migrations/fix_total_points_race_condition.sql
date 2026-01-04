-- Migration: Fix Total Points Race Condition with Atomic Database Trigger
-- Replaces application-level recalculation with database-level automation

-- =====================================================
-- DROP OLD MANUAL CALCULATION (if exists)
-- =====================================================

-- This will be replaced by automatic triggers

-- =====================================================
-- CREATE FUNCTION TO CALCULATE TOTAL POINTS
-- ====================================================

CREATE OR REPLACE FUNCTION calculate_total_points(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    -- Daily points from all check-ins
    COALESCE((
      SELECT SUM(daily_points)
      FROM daily_logs
      WHERE user_id = p_user_id
    ), 0) +
    -- Streak bonus points
    COALESCE((
      SELECT streak_bonus_points
      FROM profiles
      WHERE id = p_user_id
    ), 0) +
    -- Admin weekly points
    COALESCE((
      SELECT SUM(consistency_points + effort_points + community_points)
      FROM admin_weekly_points
      WHERE user_id = p_user_id
    ), 0)
$$;

-- =====================================================
-- TRIGGER: Auto-update total_points on daily_logs change
-- =====================================================

CREATE OR REPLACE FUNCTION update_total_points_from_daily_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recalculate and update total_points atomically
  UPDATE profiles
  SET total_points = calculate_total_points(COALESCE(NEW.user_id, OLD.user_id))
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_update_total_points_daily_log ON daily_logs;

-- Create trigger
CREATE TRIGGER trg_update_total_points_daily_log
AFTER INSERT OR UPDATE OR DELETE ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION update_total_points_from_daily_log();

-- =====================================================
-- NOTE: admin_weekly_points already has trigger from add_admin_weekly_points.sql
-- =====================================================

-- =====================================================
-- TRIGGER: Auto-update total_points when streak bonus changes
-- =====================================================

CREATE OR REPLACE FUNCTION update_total_points_from_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only recalculate if streak_bonus_points actually changed
  IF OLD.streak_bonus_points IS DISTINCT FROM NEW.streak_bonus_points THEN
    NEW.total_points := calculate_total_points(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_update_total_points_streak ON profiles;

-- Create trigger
CREATE TRIGGER trg_update_total_points_streak
BEFORE UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.streak_bonus_points IS DISTINCT FROM NEW.streak_bonus_points)
EXECUTE FUNCTION update_total_points_from_streak();

-- =====================================================
-- INITIAL CALCULATION: Update all existing users
-- =====================================================

-- Recalculate total_points for all users to fix any discrepancies
UPDATE profiles
SET total_points = calculate_total_points(id)
WHERE id IS NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check a specific user's calculation:
-- SELECT 
--   p.id,
--   p.total_points as current_total,
--   calculate_total_points(p.id) as calculated_total,
--   p.total_points - calculate_total_points(p.id) as discrepancy
-- FROM profiles p
-- WHERE p.id = 'user-uuid-here';

-- Find all users with discrepancies:
-- SELECT 
--   p.id,
--   p.full_name,
--   p.total_points as current,
--   calculate_total_points(p.id) as should_be,
--   p.total_points - calculate_total_points(p.id) as diff
-- FROM profiles p
-- WHERE p.total_points != calculate_total_points(p.id);
