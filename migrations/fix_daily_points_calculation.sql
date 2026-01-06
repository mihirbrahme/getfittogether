-- =====================================================
-- MIGRATION: Fix Daily Points Calculation
-- =====================================================
-- This migration fixes the critical bug where a legacy trigger
-- overwrites correctly calculated points (60 becomes 40).
--
-- Run this in Supabase SQL Editor
-- Created: 2026-01-06
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: DROP THE ROGUE TRIGGER ON DAILY_LOGS
-- =====================================================
-- A BEFORE trigger with calculate_daily_points() is overwriting
-- the points calculated by the application with stale logic.

-- Drop any BEFORE triggers that might exist (unknown name)
DO $$
DECLARE
    trg_name TEXT;
    trg_count INTEGER := 0;
BEGIN
    FOR trg_name IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'daily_logs' 
        AND action_timing = 'BEFORE' 
        AND (event_manipulation = 'INSERT' OR event_manipulation = 'UPDATE')
    LOOP
        RAISE NOTICE 'Dropping BEFORE trigger: %', trg_name;
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trg_name) || ' ON daily_logs;';
        trg_count := trg_count + 1;
    END LOOP;
    
    IF trg_count = 0 THEN
        RAISE NOTICE 'No BEFORE triggers found on daily_logs (may have been dropped already)';
    ELSE
        RAISE NOTICE 'Dropped % BEFORE trigger(s) on daily_logs', trg_count;
    END IF;
END $$;

-- =====================================================
-- STEP 2: DROP THE OBSOLETE FUNCTION
-- =====================================================
-- The calculate_daily_points() function uses hardcoded point values
-- and ignores the actual configured points in squad_checkin_activities.

DROP FUNCTION IF EXISTS calculate_daily_points() CASCADE;

-- =====================================================
-- STEP 3: FIX WORKOUT STREAK CALCULATION
-- =====================================================
-- The current function looks for 'activity_wod' key but the app
-- uses 'activity_{uuid}' format. This fixes the lookup.

CREATE OR REPLACE FUNCTION calculate_user_streaks(p_user_id UUID)
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
    v_wod_activity_id UUID;
BEGIN
    v_current_date := CURRENT_DATE;
    v_prev_date := v_current_date;
    
    -- Find the WOD activity ID for the user's squad
    SELECT sca.id INTO v_wod_activity_id
    FROM squad_checkin_activities sca
    JOIN group_members gm ON gm.group_id = sca.squad_id
    WHERE gm.user_id = p_user_id 
    AND gm.status = 'approved'
    AND sca.activity_type = 'wod'
    AND sca.enabled = true
    LIMIT 1;
    
    -- Calculate streaks by iterating through daily logs
    FOR v_log IN 
        SELECT 
            date, 
            daily_points, 
            negative_points,
            CASE 
                WHEN v_wod_activity_id IS NOT NULL 
                THEN COALESCE((custom_logs->('activity_' || v_wod_activity_id::text))::boolean, false)
                ELSE false
            END as wod_done
        FROM daily_logs 
        WHERE user_id = p_user_id 
        ORDER BY date DESC
    LOOP
        -- Check if this date is consecutive
        IF v_log.date = v_prev_date OR v_log.date = v_prev_date - 1 THEN
            v_checkin_streak := v_checkin_streak + 1;
            
            -- Count workout streak
            IF v_log.wod_done THEN
                v_workout_streak := v_workout_streak + 1;
            ELSE
                v_workout_streak := 0; -- Reset if missed
            END IF;
            
            -- Count clean eating streak (no negative points = no slip-ups)
            IF COALESCE(v_log.negative_points, 0) = 0 THEN
                v_clean_streak := v_clean_streak + 1;
            ELSE
                v_clean_streak := 0; -- Reset if had slip-ups
            END IF;
            
            v_prev_date := v_log.date;
        ELSE
            EXIT; -- Gap in dates, streak broken
        END IF;
    END LOOP;
    
    -- Update profiles with current streak values
    UPDATE profiles SET 
        current_checkin_streak = v_checkin_streak,
        current_workout_streak = v_workout_streak,
        current_clean_streak = v_clean_streak,
        longest_checkin_streak = GREATEST(longest_checkin_streak, v_checkin_streak),
        longest_workout_streak = GREATEST(longest_workout_streak, v_workout_streak),
        longest_clean_streak = GREATEST(longest_clean_streak, v_clean_streak),
        last_streak_calculation = NOW()
    WHERE id = p_user_id;
    
    -- Award milestone bonuses if not already awarded
    FOR v_milestone IN 
        SELECT sm.* FROM streak_milestones sm
        WHERE NOT EXISTS (
            SELECT 1 FROM streak_bonus_log sbl 
            WHERE sbl.user_id = p_user_id AND sbl.milestone_id = sm.id
        )
        AND (
            (sm.streak_type = 'checkin' AND sm.days_required <= v_checkin_streak)
            OR (sm.streak_type = 'workout' AND sm.days_required <= v_workout_streak)
            OR (sm.streak_type = 'clean_eating' AND sm.days_required <= v_clean_streak)
        )
    LOOP
        INSERT INTO streak_bonus_log (user_id, milestone_id, streak_type, days_achieved, bonus_points)
        VALUES (p_user_id, v_milestone.id, v_milestone.streak_type, v_milestone.days_required, v_milestone.bonus_points);
        
        v_bonus_total := v_bonus_total + v_milestone.bonus_points;
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

-- =====================================================
-- STEP 4: RECALCULATE DAILY POINTS FOR EXISTING LOGS
-- =====================================================
-- Since the old trigger may have set incorrect points, we need to
-- recalculate points for all existing daily_logs entries.

DO $$
DECLARE
    v_log RECORD;
    v_new_points INTEGER;
    v_activity RECORD;
    v_goal RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    FOR v_log IN 
        SELECT dl.id, dl.user_id, dl.date, dl.custom_logs, dl.daily_points,
               dl.junk_food, dl.processed_sugar, dl.alcohol_excess,
               gm.group_id as squad_id
        FROM daily_logs dl
        LEFT JOIN group_members gm ON gm.user_id = dl.user_id AND gm.status = 'approved'
    LOOP
        v_new_points := 0;
        
        -- Sum points from activities in custom_logs
        IF v_log.custom_logs IS NOT NULL AND v_log.squad_id IS NOT NULL THEN
            FOR v_activity IN 
                SELECT id, points 
                FROM squad_checkin_activities 
                WHERE squad_id = v_log.squad_id AND enabled = true
            LOOP
                IF (v_log.custom_logs->('activity_' || v_activity.id::text))::boolean = true THEN
                    v_new_points := v_new_points + COALESCE(v_activity.points, 0);
                END IF;
            END LOOP;
        END IF;
        
        -- Sum points from goals in custom_logs
        IF v_log.custom_logs IS NOT NULL THEN
            FOR v_goal IN 
                SELECT uga.slot, gt.points
                FROM user_goal_assignments uga
                JOIN goal_templates gt ON gt.id = uga.goal_template_id
                WHERE uga.user_id = v_log.user_id
            LOOP
                IF (v_log.custom_logs->('goal_' || v_goal.slot::text))::boolean = true THEN
                    v_new_points := v_new_points + COALESCE(v_goal.points, 0);
                END IF;
            END LOOP;
        END IF;
        
        -- Subtract negative points for slip-ups
        IF v_log.junk_food THEN v_new_points := v_new_points - 5; END IF;
        IF v_log.processed_sugar THEN v_new_points := v_new_points - 5; END IF;
        IF v_log.alcohol_excess THEN v_new_points := v_new_points - 5; END IF;
        
        -- Update if different
        IF v_new_points != COALESCE(v_log.daily_points, 0) THEN
            UPDATE daily_logs 
            SET daily_points = v_new_points 
            WHERE id = v_log.id;
            v_updated_count := v_updated_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Recalculated points for % daily_logs entries', v_updated_count;
END $$;

-- =====================================================
-- STEP 5: RECALCULATE TOTAL POINTS FOR ALL USERS
-- =====================================================
-- Update profiles.total_points based on corrected daily_logs

UPDATE profiles p
SET total_points = (
    SELECT COALESCE(SUM(dl.daily_points), 0)
    FROM daily_logs dl
    WHERE dl.user_id = p.id
) + COALESCE(p.streak_bonus_points, 0) + (
    SELECT COALESCE(SUM(awp.consistency_points + awp.effort_points + awp.community_points), 0)
    FROM admin_weekly_points awp
    WHERE awp.user_id = p.id
);

-- =====================================================
-- STEP 6: DROP LEGACY COLUMNS (OPTIONAL)
-- =====================================================
-- These columns are no longer used by the application.
-- Uncomment if you want to clean up the schema.

-- ALTER TABLE daily_logs DROP COLUMN IF EXISTS wod_done;
-- ALTER TABLE daily_logs DROP COLUMN IF EXISTS steps_done;
-- ALTER TABLE daily_logs DROP COLUMN IF EXISTS water_done;
-- ALTER TABLE daily_logs DROP COLUMN IF EXISTS sleep_done;
-- ALTER TABLE daily_logs DROP COLUMN IF EXISTS clean_eating_done;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify success:

-- 1. Check no BEFORE triggers remain on daily_logs:
-- SELECT trigger_name, action_timing, event_manipulation 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'daily_logs';

-- 2. Check calculate_daily_points function is gone:
-- SELECT proname FROM pg_proc WHERE proname = 'calculate_daily_points';

-- 3. Verify a user's points:
-- SELECT user_id, date, daily_points, custom_logs 
-- FROM daily_logs 
-- WHERE date = CURRENT_DATE;

COMMIT;

-- =====================================================
-- POST-MIGRATION: Test the fix
-- =====================================================
-- 1. Go to Check-in page
-- 2. Click "Update Check-in"
-- 3. The warning popup should NOT appear
-- 4. Dashboard should show correct points (60)
