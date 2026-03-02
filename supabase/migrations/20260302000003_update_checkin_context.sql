BEGIN;

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
        'negative_points', dl.negative_points,
        'note_to_admin', dl.note_to_admin
      )
      FROM daily_logs dl 
      WHERE dl.user_id = auth.uid() AND dl.date = p_date
    ),
    'activities', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pm.id,
          'activity_name', pm.metric_name,
          'activity_type', pm.metric_type,
          'points', pm.points,
          'icon', pm.icon,
          'display_order', pm.display_order
        ) ORDER BY pm.display_order
      )
      FROM program_metrics pm
      JOIN programs p ON p.id = pm.program_id
      WHERE p.status = 'active' AND pm.enabled = true
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

GRANT EXECUTE ON FUNCTION get_checkin_context(DATE) TO authenticated;

COMMIT;
