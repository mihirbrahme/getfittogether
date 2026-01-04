-- Migration: Add Admin Weekly Points System
-- Allows admin to award 0-30 weekly points per participant

-- =====================================================
-- STEP 1: CREATE ADMIN WEEKLY POINTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_weekly_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    consistency_points INTEGER DEFAULT 0 CHECK (consistency_points >= 0 AND consistency_points <= 10),
    effort_points INTEGER DEFAULT 0 CHECK (effort_points >= 0 AND effort_points <= 10),
    community_points INTEGER DEFAULT 0 CHECK (community_points >= 0 AND community_points <= 10),
    notes TEXT,
    awarded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE admin_weekly_points ENABLE ROW LEVEL SECURITY;

-- Admins can read/write all
CREATE POLICY "Admins can manage weekly points" 
ON admin_weekly_points FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Users can read their own points
CREATE POLICY "Users can read own weekly points" 
ON admin_weekly_points FOR SELECT 
USING (auth.uid() = user_id);

-- =====================================================
-- STEP 2: CREATE TRIGGER TO UPDATE TOTAL POINTS
-- =====================================================

CREATE OR REPLACE FUNCTION update_total_points_on_admin_award()
RETURNS TRIGGER AS $$
DECLARE
    v_daily_total INTEGER;
    v_admin_total INTEGER;
    v_streak_bonus INTEGER;
BEGIN
    -- Get sum of daily points
    SELECT COALESCE(SUM(daily_points), 0) INTO v_daily_total
    FROM daily_logs WHERE user_id = NEW.user_id;
    
    -- Get sum of admin weekly points
    SELECT COALESCE(SUM(consistency_points + effort_points + community_points), 0) INTO v_admin_total
    FROM admin_weekly_points WHERE user_id = NEW.user_id;
    
    -- Get streak bonus
    SELECT COALESCE(streak_bonus_points, 0) INTO v_streak_bonus
    FROM profiles WHERE id = NEW.user_id;
    
    -- Update total
    UPDATE profiles 
    SET total_points = v_daily_total + v_admin_total + v_streak_bonus
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_update_total_on_admin_award ON admin_weekly_points;

-- Create trigger
CREATE TRIGGER trg_update_total_on_admin_award
AFTER INSERT OR UPDATE ON admin_weekly_points
FOR EACH ROW
EXECUTE FUNCTION update_total_points_on_admin_award();

-- =====================================================
-- STEP 3: HELPER FUNCTION TO GET WEEK START
-- =====================================================

CREATE OR REPLACE FUNCTION get_week_start(p_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
    -- Returns Monday of the week containing p_date
    RETURN p_date - EXTRACT(DOW FROM p_date)::INTEGER + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- STEP 4: RPC TO GET PARTICIPANTS FOR ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION get_squad_members_for_admin(p_week_start DATE)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'user_id', p.id,
            'full_name', p.full_name,
            'display_name', p.display_name,
            'total_points', p.total_points,
            'weekly_points', (
                SELECT jsonb_build_object(
                    'consistency_points', awp.consistency_points,
                    'effort_points', awp.effort_points,
                    'community_points', awp.community_points,
                    'notes', awp.notes
                )
                FROM admin_weekly_points awp
                WHERE awp.user_id = p.id AND awp.week_start = p_week_start
            )
        ) ORDER BY p.full_name
    ), '[]'::jsonb)
    FROM profiles p
    JOIN group_members gm ON gm.user_id = p.id
    WHERE gm.status = 'approved'
    AND p.role != 'admin';
$$;

GRANT EXECUTE ON FUNCTION get_squad_members_for_admin(DATE) TO authenticated;
