-- =====================================================
-- MIGRATION: 001_add_programs
-- Description: Adds programs, program-scoped metrics, and streaks
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Create programmes table
-- =====================================================
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    max_daily_points INTEGER DEFAULT 70,
    CONSTRAINT valid_program_dates CHECK (end_date > start_date),
    CONSTRAINT valid_program_status CHECK (status IN ('draft', 'active', 'completed'))
);

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active programs" ON programs FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can do everything on programs" ON programs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- 2. Add program_id to existing log tables
-- =====================================================
-- Find the active program ID in subsequent migrations or leave NULL for legacy data
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE CASCADE;
ALTER TABLE admin_weekly_points ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE CASCADE;
ALTER TABLE streak_bonus_log ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE CASCADE;

-- Default index for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_program_id ON daily_logs(program_id);
CREATE INDEX IF NOT EXISTS idx_admin_points_program_id ON admin_weekly_points(program_id);
CREATE INDEX IF NOT EXISTS idx_streak_bonus_program_id ON streak_bonus_log(program_id);

-- =====================================================
-- 3. Create program_squad_dates (overrides)
-- =====================================================
CREATE TABLE IF NOT EXISTS program_squad_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    squad_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    UNIQUE(program_id, squad_id)
);

ALTER TABLE program_squad_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read squad dates" ON program_squad_dates FOR SELECT USING (true);
CREATE POLICY "Admins can manage squad dates" ON program_squad_dates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- 4. Create program_metrics (replaces legacy goals)
-- =====================================================
CREATE TABLE IF NOT EXISTS program_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    metric_name TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    metric_type TEXT NOT NULL,         -- 'core_habit', 'nutrition', 'personal_goal', 'negative'
    points INTEGER NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'CheckCircle',
    display_order INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    UNIQUE(program_id, metric_key)
);

ALTER TABLE program_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read metrics" ON program_metrics FOR SELECT USING (true);
CREATE POLICY "Admins can manage metrics" ON program_metrics FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- 5. Create program_streak_config (overrides default milestones)
-- =====================================================
CREATE TABLE IF NOT EXISTS program_streak_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    streak_type TEXT NOT NULL,         -- 'checkin', 'workout', 'clean_eating'
    days_required INTEGER NOT NULL,
    bonus_points INTEGER NOT NULL,
    UNIQUE(program_id, streak_type, days_required)
);

ALTER TABLE program_streak_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read streak config" ON program_streak_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage streak config" ON program_streak_config FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

COMMIT;
