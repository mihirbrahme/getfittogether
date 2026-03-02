-- =====================================================
-- MIGRATION: 005_squad_programs
-- Description: Assigns active programs per squad instead of globally
-- =====================================================

BEGIN;

-- 1. Add active_program_id to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS active_program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- 2. Update get_active_program() to be squad-aware
CREATE OR REPLACE FUNCTION get_active_program()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_prog_id UUID;
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Try to find program via squad membership
    SELECT g.active_program_id INTO v_prog_id
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = auth.uid() AND gm.status = 'approved'
    LIMIT 1;

    -- 2. If no squad program found, check if they are admin
    IF v_prog_id IS NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        ) INTO v_is_admin;
        
        IF v_is_admin THEN
            SELECT id INTO v_prog_id FROM programs WHERE status = 'active' ORDER BY created_at DESC LIMIT 1;
        END IF;
    END IF;

    RETURN v_prog_id;
END;
$$;

-- 3. New RPC to activate a program for specific squads
CREATE OR REPLACE FUNCTION activate_program_for_squads(p_program_id UUID, p_squad_ids UUID[], p_reset_points BOOLEAN DEFAULT true)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if program exists
    IF NOT EXISTS (SELECT 1 FROM programs WHERE id = p_program_id) THEN
        RAISE EXCEPTION 'Program not found';
    END IF;

    -- Ensure program is marked as active
    UPDATE programs SET status = 'active' WHERE id = p_program_id;

    -- Assign program to the selected squads
    UPDATE groups SET active_program_id = p_program_id WHERE id = ANY(p_squad_ids);

    -- Reset all users' points conditionally for users in these squads
    IF p_reset_points THEN
        UPDATE profiles p SET
            total_points = 0,
            streak_bonus_points = 0,
            current_checkin_streak = 0,
            current_workout_streak = 0,
            current_clean_streak = 0,
            longest_checkin_streak = 0,
            longest_workout_streak = 0,
            longest_clean_streak = 0,
            last_streak_calculation = NULL
        FROM group_members gm
        WHERE gm.user_id = p.id AND gm.group_id = ANY(p_squad_ids) AND gm.status = 'approved';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'program_id', p_program_id,
        'squads_updated', array_length(p_squad_ids, 1)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION activate_program_for_squads(UUID, UUID[], BOOLEAN) TO authenticated;

COMMIT;
