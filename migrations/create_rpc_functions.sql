-- Migration: Create RPC functions for optimized data fetching
-- These replace multiple sequential queries with single RPC calls

-- =====================================================
-- CHECK-IN CONTEXT RPC
-- =====================================================
-- Returns all data needed to render the check-in page in 1 call
-- Replaces 5 separate queries

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_checkin_context(DATE) TO authenticated;

-- =====================================================
-- WOD TODAY RPC
-- =====================================================
-- Returns today's workout with all exercises in 1 call
-- Replaces 4 separate queries

CREATE OR REPLACE FUNCTION get_wod_today()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'found', true,
    'date', sw.date,
    'workout', jsonb_build_object(
      'id', sw.id,
      'template_id', wt.id,
      'name', wt.name,
      'description', wt.description,
      'type', wt.type
    ),
    'exercises', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', we.id,
          'order_index', we.order_index,
          'exercise_name', we.exercise_name,
          'sets', we.sets,
          'reps', we.reps,
          'duration_seconds', we.duration_seconds,
          'rest_seconds', we.rest_seconds,
          'equipment', we.equipment,
          'video_url', we.video_url,
          'notes', we.notes
        ) ORDER BY we.order_index
      )
      FROM workout_exercises we
      WHERE we.template_id = wt.id
    ), '[]'::jsonb)
  )
  FROM scheduled_workout_squads sws
  JOIN scheduled_workouts sw ON sw.id = sws.workout_id
  JOIN workout_templates wt ON wt.id = sw.template_id
  JOIN group_members gm ON gm.group_id = sws.group_id
  WHERE gm.user_id = auth.uid()
    AND gm.status = 'approved'
    AND sw.date = CURRENT_DATE
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_wod_today() TO authenticated;

-- =====================================================
-- RATE LIMITING FOR AUDIT LOGS
-- =====================================================
-- Prevents log flooding attacks

-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

-- Create rate-limited insert policy
CREATE POLICY "Authenticated users can insert audit logs with rate limit"
ON audit_logs FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    SELECT COUNT(*) FROM audit_logs 
    WHERE user_id = auth.uid() 
    AND created_at > NOW() - INTERVAL '1 minute'
  ) < 60
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Test the RPC functions after creation

-- Test check-in context (run as authenticated user)
-- SELECT get_checkin_context(CURRENT_DATE);

-- Test WOD today (run as authenticated user)
-- SELECT get_wod_today();
