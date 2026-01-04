-- Migration: Add Streak Tracking System
-- Adds streak columns and milestone definitions

-- =====================================================
-- STEP 1: ADD STREAK COLUMNS TO PROFILES
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_checkin_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_workout_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_clean_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_checkin_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_workout_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_clean_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_bonus_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_streak_calculation TIMESTAMPTZ;

-- =====================================================
-- STEP 2: CREATE STREAK MILESTONES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS streak_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    streak_type TEXT NOT NULL, -- 'checkin', 'workout', 'clean_eating'
    days_required INTEGER NOT NULL,
    bonus_points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(streak_type, days_required)
);

-- Enable RLS
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Authenticated users can read milestones" 
ON streak_milestones FOR SELECT 
TO authenticated 
USING (true);

-- =====================================================
-- STEP 3: INSERT MILESTONE DATA FROM OVERVIEW
-- =====================================================

INSERT INTO streak_milestones (streak_type, days_required, bonus_points) VALUES
    -- Check-in streaks
    ('checkin', 3, 5),
    ('checkin', 7, 10),
    ('checkin', 14, 15),
    ('checkin', 21, 20),
    ('checkin', 28, 25),
    -- Workout streaks
    ('workout', 5, 10),
    ('workout', 10, 20),
    ('workout', 20, 30),
    -- Clean eating streaks (no negative points)
    ('clean_eating', 3, 5),
    ('clean_eating', 7, 10),
    ('clean_eating', 14, 15)
ON CONFLICT (streak_type, days_required) DO NOTHING;

-- =====================================================
-- STEP 4: CREATE STREAK BONUS LOG TABLE
-- =====================================================
-- Tracks which bonuses have been awarded to prevent duplicates

CREATE TABLE IF NOT EXISTS streak_bonus_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    milestone_id UUID REFERENCES streak_milestones(id) NOT NULL,
    streak_type TEXT NOT NULL,
    days_achieved INTEGER NOT NULL,
    bonus_points INTEGER NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, milestone_id)
);

-- Enable RLS
ALTER TABLE streak_bonus_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own bonuses
CREATE POLICY "Users can read own streak bonuses" 
ON streak_bonus_log FOR SELECT 
USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: CREATE STREAK CALCULATION FUNCTION
-- =====================================================
-- This function calculates streaks and awards bonuses
-- Called by a scheduled job at end of day

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
BEGIN
    -- Get current date
    v_current_date := CURRENT_DATE;
    v_prev_date := v_current_date;
    
    -- Calculate check-in streak (consecutive days with any log entry)
    FOR v_log IN 
        SELECT date, daily_points, negative_points,
               EXISTS(SELECT 1 FROM daily_logs d2 
                      WHERE d2.user_id = p_user_id 
                      AND d2.date = daily_logs.date 
                      AND d2.custom_logs ? 'activity_wod' 
                      AND (d2.custom_logs->>'activity_wod')::boolean = true) as wod_done
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
            
            -- Count clean eating streak (no negative points)
            IF COALESCE(v_log.negative_points, 0) >= 0 THEN
                v_clean_streak := v_clean_streak + 1;
            ELSE
                v_clean_streak := 0; -- Reset if had slip-ups
            END IF;
            
            v_prev_date := v_log.date;
        ELSE
            EXIT; -- Gap in dates, streak broken
        END IF;
    END LOOP;
    
    -- Update profiles with current streaks
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
        -- Insert bonus log
        INSERT INTO streak_bonus_log (user_id, milestone_id, streak_type, days_achieved, bonus_points)
        VALUES (p_user_id, v_milestone.id, v_milestone.streak_type, v_milestone.days_required, v_milestone.bonus_points);
        
        -- Add to bonus total
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_user_streaks(UUID) TO authenticated;

-- =====================================================
-- STEP 6: CREATE BATCH STREAK CALCULATION FUNCTION
-- =====================================================
-- This function processes all active users
-- Should be called by a scheduled job (e.g., pg_cron)

CREATE OR REPLACE FUNCTION calculate_all_user_streaks()
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
        PERFORM calculate_user_streaks(v_user.id);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$;

-- Grant execute to service role only (for cron jobs)
GRANT EXECUTE ON FUNCTION calculate_all_user_streaks() TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Test streak calculation for a specific user:
-- SELECT calculate_user_streaks('user-uuid-here');

-- Check milestones:
-- SELECT * FROM streak_milestones ORDER BY streak_type, days_required;
