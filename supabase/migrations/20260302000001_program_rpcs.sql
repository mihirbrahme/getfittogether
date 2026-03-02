-- =====================================================
-- MIGRATION: 002_program_rpcs
-- Description: RPCs for program management and scoping streaks
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Helper: Get Active Program
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_program()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM programs WHERE status = 'active' LIMIT 1;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_active_program() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_program() TO anon;

-- =====================================================
-- 2. Activate Program (Transition)
-- =====================================================
CREATE OR REPLACE FUNCTION activate_program(p_program_id UUID)
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

    -- Reset all users' points and streaks
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

    -- We do NOT delete old daily_logs, admin_weekly_points, or streak_bonus_log
    -- They are inherently tied to their respective program_id if set, 
    -- or they represent legacy data before this system.

    -- Copy program metrics to squad_checkin_activities for all active squads
    -- This handles smooth transition for CheckInOverview which relies on squad_checkin_activities currently
    FOR v_squad IN SELECT id FROM groups LOOP
        -- Optional: clear current activities for squad (or keep them active)
        -- We'll keep them as is and let the app just read from program_metrics
        -- For full backwards compat, we could insert them, but moving to program_metrics is better.
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'program_id', p_program_id,
        'old_programs_completed', v_old_active_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION activate_program(UUID) TO authenticated;

-- =====================================================
-- 3. Calculate Streaks V2 (Program Scoped)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_user_streaks_v2(p_user_id UUID, p_program_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_checkin_streak INTEGER := 0;
    v_workout_streak INTEGER := 0;
    v_clean_streak INTEGER := 0;
    v_prev_date DATE;
    v_current_date DATE;
    v_log RECORD;
    v_bonus_total INTEGER := 0;
    v_milestone RECORD;
BEGIN
    v_current_date := CURRENT_DATE;
    v_prev_date := v_current_date;
    
    -- Iterate through daily logs SCOPED to this program
    FOR v_log IN 
        SELECT 
            date, 
            daily_points, 
            negative_points,
            -- If metric schema changed, we look at custom_logs for ANY workout-type metric completion
            EXISTS(
                SELECT 1 FROM jsonb_each_text(custom_logs) 
                WHERE key LIKE 'activity_%' OR key LIKE 'metric_%workout%'
                AND value = 'true'
            ) as wod_done
        FROM daily_logs 
        WHERE user_id = p_user_id 
        AND (program_id = p_program_id OR program_id IS NULL) -- Fallback for logs created right before switch
        AND date >= (SELECT start_date FROM programs WHERE id = p_program_id)
        ORDER BY date DESC
    LOOP
        -- Check if consecutive
        IF v_log.date = v_prev_date OR v_log.date = v_prev_date - 1 THEN
            v_checkin_streak := v_checkin_streak + 1;
            
            IF v_log.wod_done THEN
                v_workout_streak := v_workout_streak + 1;
            ELSE
                v_workout_streak := 0; 
            END IF;
            
            IF COALESCE(v_log.negative_points, 0) = 0 THEN
                v_clean_streak := v_clean_streak + 1;
            ELSE
                v_clean_streak := 0; 
            END IF;
            
            v_prev_date := v_log.date;
        ELSE
            EXIT; -- Gap
        END IF;
    END LOOP;
    
    -- Update profiles
    UPDATE profiles SET 
        current_checkin_streak = v_checkin_streak,
        current_workout_streak = v_workout_streak,
        current_clean_streak = v_clean_streak,
        longest_checkin_streak = GREATEST(longest_checkin_streak, v_checkin_streak),
        longest_workout_streak = GREATEST(longest_workout_streak, v_workout_streak),
        longest_clean_streak = GREATEST(longest_clean_streak, v_clean_streak),
        last_streak_calculation = NOW()
    WHERE id = p_user_id;
    
    -- Award milestone bonuses
    -- Look for program-specific config first, then fall back to defaults
    FOR v_milestone IN 
        WITH default_milestones AS (
            SELECT * FROM streak_milestones
        ),
        program_milestones AS (
            SELECT * FROM program_streak_config WHERE program_id = p_program_id
        )
        SELECT 
            COALESCE(pm.id, dm.id) as id,
            COALESCE(pm.streak_type, dm.streak_type) as streak_type,
            COALESCE(pm.days_required, dm.days_required) as days_required,
            COALESCE(pm.bonus_points, dm.bonus_points) as bonus_points,
            (pm.id IS NOT NULL) as is_program_specific
        FROM default_milestones dm
        FULL OUTER JOIN program_milestones pm ON dm.streak_type = pm.streak_type AND dm.days_required = pm.days_required
    LOOP
        -- Only award if not already awarded FOR THIS PROGRAM
        IF NOT EXISTS (
            SELECT 1 FROM streak_bonus_log sbl 
            WHERE sbl.user_id = p_user_id 
            AND sbl.milestone_id = v_milestone.id
            AND (sbl.program_id = p_program_id OR sbl.program_id IS NULL)
        )
        AND (
            (v_milestone.streak_type = 'checkin' AND v_milestone.days_required <= v_checkin_streak)
            OR (v_milestone.streak_type = 'workout' AND v_milestone.days_required <= v_workout_streak)
            OR (v_milestone.streak_type = 'clean_eating' AND v_milestone.days_required <= v_clean_streak)
        )
        THEN
            INSERT INTO streak_bonus_log (user_id, milestone_id, streak_type, days_achieved, bonus_points, program_id)
            VALUES (p_user_id, v_milestone.id, v_milestone.streak_type, v_milestone.days_required, v_milestone.bonus_points, p_program_id);
            
            v_bonus_total := v_bonus_total + v_milestone.bonus_points;
        END IF;
    END LOOP;
    
    -- Update total points if bonuses were awarded
    IF v_bonus_total > 0 THEN
        UPDATE profiles SET 
            streak_bonus_points = streak_bonus_points + v_bonus_total,
            total_points = total_points + v_bonus_total
        WHERE id = p_user_id;
    END IF;
    
    RETURN jsonb_build_object(
        'checkin_streak', v_checkin_streak,
        'workout_streak', v_workout_streak,
        'clean_streak', v_clean_streak,
        'bonus_awarded', v_bonus_total
    );
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_user_streaks_v2(UUID, UUID) TO authenticated;

-- =====================================================
-- 4. Calculate All User Streaks V2
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_all_user_streaks_v2(p_program_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
    v_user RECORD;
BEGIN
    FOR v_user IN 
        SELECT DISTINCT p.id 
        FROM profiles p
        JOIN group_members gm ON gm.user_id = p.id
        WHERE gm.status = 'approved'
        AND (p.last_streak_calculation IS NULL 
             OR p.last_streak_calculation < CURRENT_DATE)
    LOOP
        PERFORM calculate_user_streaks_v2(v_user.id, p_program_id);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_all_user_streaks_v2(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_all_user_streaks_v2(UUID) TO authenticated; -- Let admin execute it

COMMIT;
