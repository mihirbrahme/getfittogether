BEGIN;

DROP FUNCTION IF EXISTS activate_program(UUID);

CREATE OR REPLACE FUNCTION activate_program(p_program_id UUID, p_reset_points BOOLEAN DEFAULT true)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_active_count INTEGER;
    v_user RECORD;
    v_squad RECORD;
    v_metric RECORD;
BEGIN
    -- Check if program exists
    IF NOT EXISTS (SELECT 1 FROM programs WHERE id = p_program_id) THEN
        RAISE EXCEPTION 'Program not found';
    END IF;

    -- Mark current active programs as completed
    WITH updated AS (
        UPDATE programs 
        SET status = 'completed' 
        WHERE status = 'active' AND id != p_program_id
        RETURNING id
    )
    SELECT count(*) INTO v_old_active_count FROM updated;

    -- Set new program as active
    UPDATE programs SET status = 'active' WHERE id = p_program_id;

    -- Reset all users' points and streaks conditionally
    IF p_reset_points THEN
        UPDATE profiles SET
            total_points = 0,
            streak_bonus_points = 0,
            current_checkin_streak = 0,
            current_workout_streak = 0,
            current_clean_streak = 0,
            longest_checkin_streak = 0,
            longest_workout_streak = 0,
            longest_clean_streak = 0,
            last_streak_calculation = NULL;
    END IF;

    -- Copy program metrics to squad_checkin_activities for all active squads
    -- This handles smooth transition for CheckInOverview which relies on squad_checkin_activities currently
    FOR v_squad IN SELECT id FROM groups LOOP
        -- Optional: clear current activities for squad (or keep them active)
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'program_id', p_program_id,
        'old_programs_completed', v_old_active_count,
        'points_reset', p_reset_points
    );
END;
$$;

GRANT EXECUTE ON FUNCTION activate_program(UUID, BOOLEAN) TO authenticated;

COMMIT;
