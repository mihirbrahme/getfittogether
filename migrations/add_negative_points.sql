-- Migration: Add Negative Points System
-- Adds tracking for junk food, processed sugar, and alcohol excess

-- =====================================================
-- STEP 1: ADD COLUMNS TO DAILY_LOGS
-- =====================================================

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS junk_food BOOLEAN DEFAULT false;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS processed_sugar BOOLEAN DEFAULT false;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS alcohol_excess BOOLEAN DEFAULT false;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS negative_points INTEGER DEFAULT 0;

-- =====================================================
-- STEP 2: ADD INDEX FOR ANALYTICS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_daily_logs_negative 
ON daily_logs(user_id, date) 
WHERE negative_points < 0;

-- =====================================================
-- STEP 3: UPDATE RPC FUNCTION TO INCLUDE NEGATIVE DATA
-- =====================================================

CREATE OR REPLACE FUNCTION get_checkin_context(p_date DATE)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'squad_id', gm.group_id,
    'already_submitted', EXISTS(
      SELECT 1 FROM daily_logs dl 
      WHERE dl.user_id = auth.uid() AND dl.date = p_date
    ),
    'existing_log', (
      SELECT jsonb_build_object(
        'custom_logs', dl.custom_logs,
        'junk_food', dl.junk_food,
        'processed_sugar', dl.processed_sugar,
        'alcohol_excess', dl.alcohol_excess,
        'negative_points', dl.negative_points
      )
      FROM daily_logs dl 
      WHERE dl.user_id = auth.uid() AND dl.date = p_date
    ),
    'activities', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', sca.id,
          'activity_name', sca.activity_name,
          'activity_type', sca.activity_type,
          'points', sca.points,
          'icon', sca.icon,
          'display_order', sca.display_order
        ) ORDER BY sca.display_order
      )
      FROM squad_checkin_activities sca 
      WHERE sca.squad_id = gm.group_id AND sca.enabled = true
    ), '[]'::jsonb),
    'goals', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'slot', uga.slot,
          'goal_templates', jsonb_build_object(
            'id', gt.id,
            'name', gt.name,
            'description', gt.description,
            'points', gt.points
          )
        ) ORDER BY uga.slot
      )
      FROM user_goal_assignments uga
      JOIN goal_templates gt ON gt.id = uga.goal_template_id
      WHERE uga.user_id = auth.uid()
    ), '[]'::jsonb)
  )
  FROM group_members gm 
  WHERE gm.user_id = auth.uid() AND gm.status = 'approved'
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_checkin_context(DATE) TO authenticated;
