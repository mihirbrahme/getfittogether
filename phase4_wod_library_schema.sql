-- ================================================
-- Phase 4: Enhanced WOD Library System
-- ================================================
-- This migration creates a comprehensive workout library
-- with detailed exercises to replace the basic WOD system
-- ================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. WORKOUT TEMPLATES TABLE
-- ================================================
-- Stores reusable workout templates with metadata
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('weekday', 'weekend', 'event')),
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for searching by tags
CREATE INDEX idx_workout_templates_tags ON workout_templates USING GIN(tags);
CREATE INDEX idx_workout_templates_type ON workout_templates(type);
CREATE INDEX idx_workout_templates_created_at ON workout_templates(created_at DESC);

-- ================================================
-- 2. WORKOUT EXERCISES TABLE
-- ================================================
-- Stores individual exercises for each workout template
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    exercise_name TEXT NOT NULL,
    sets INT, -- Can represent sets or cycles
    reps INT NULL, -- For rep-based exercises
    duration_seconds INT NULL, -- For time-based exercises
    rest_seconds INT DEFAULT 60,
    equipment TEXT,
    video_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_reps_or_duration CHECK (
        (reps IS NOT NULL AND duration_seconds IS NULL) OR
        (reps IS NULL AND duration_seconds IS NOT NULL) OR
        (reps IS NULL AND duration_seconds IS NULL)
    )
);

-- Index for ordering exercises within a workout
CREATE INDEX idx_workout_exercises_template ON workout_exercises(template_id, order_index);

-- ================================================
-- 3. SCHEDULED WORKOUTS TABLE
-- ================================================
-- Represents workout instances assigned to specific dates
-- Replaces the old 'wods' table functionality
CREATE TABLE IF NOT EXISTS scheduled_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    customized BOOLEAN DEFAULT FALSE,
    custom_exercises JSONB, -- Stores modified exercises if customized
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for date-based queries
CREATE INDEX idx_scheduled_workouts_date ON scheduled_workouts(date);
CREATE INDEX idx_scheduled_workouts_template ON scheduled_workouts(template_id);

-- ================================================
-- 4. SCHEDULED WORKOUT SQUADS TABLE
-- ================================================
-- Junction table for many-to-many relationship
-- Links scheduled workouts to squads
CREATE TABLE IF NOT EXISTS scheduled_workout_squads (
    workout_id UUID REFERENCES scheduled_workouts(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (workout_id, group_id)
);

-- Indexes for squad assignment queries
CREATE INDEX idx_scheduled_workout_squads_workout ON scheduled_workout_squads(workout_id);
CREATE INDEX idx_scheduled_workout_squads_group ON scheduled_workout_squads(group_id);

-- ================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_workout_squads ENABLE ROW LEVEL SECURITY;

-- Workout Templates Policies
CREATE POLICY "Admins can do everything with workout templates"
    ON workout_templates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Participants can view workout templates"
    ON workout_templates
    FOR SELECT
    TO authenticated
    USING (true);

-- Workout Exercises Policies
CREATE POLICY "Admins can do everything with exercises"
    ON workout_exercises
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Participants can view exercises"
    ON workout_exercises
    FOR SELECT
    TO authenticated
    USING (true);

-- Scheduled Workouts Policies
CREATE POLICY "Admins can do everything with scheduled workouts"
    ON scheduled_workouts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Participants can view their assigned workouts"
    ON scheduled_workouts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM scheduled_workout_squads sws
            JOIN group_members gm ON gm.group_id = sws.group_id
            WHERE sws.workout_id = scheduled_workouts.id
            AND gm.user_id = auth.uid()
            AND gm.status = 'approved'
        )
    );

-- Scheduled Workout Squads Policies
CREATE POLICY "Admins can do everything with workout squad assignments"
    ON scheduled_workout_squads
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Participants can view their squad assignments"
    ON scheduled_workout_squads
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = scheduled_workout_squads.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.status = 'approved'
        )
    );

-- ================================================
-- 6. HELPER FUNCTIONS
-- ================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_workout_templates_updated_at
    BEFORE UPDATE ON workout_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_workouts_updated_at
    BEFORE UPDATE ON scheduled_workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ================================================

-- Sample workout template
INSERT INTO workout_templates (name, description, type, tags)
VALUES (
    'Day 1: Full Body Blast',
    'A comprehensive full-body workout targeting all major muscle groups',
    'weekday',
    ARRAY['beginner', 'full-body', 'strength']
);

-- Get the ID of the template we just created
DO $$
DECLARE
    template_uuid UUID;
BEGIN
    SELECT id INTO template_uuid FROM workout_templates WHERE name = 'Day 1: Full Body Blast' LIMIT 1;
    
    -- Sample exercises for the template
    INSERT INTO workout_exercises (template_id, order_index, exercise_name, sets, reps, rest_seconds, equipment, video_url, notes)
    VALUES
        (template_uuid, 1, 'Push-ups', 3, 15, 45, 'None', 'https://youtube.com/watch?v=example1', 'Keep core tight'),
        (template_uuid, 2, 'Bodyweight Squats', 3, 20, 60, 'None', 'https://youtube.com/watch?v=example2', 'Knees track over toes'),
        (template_uuid, 3, 'Plank Hold', 3, NULL, 60, 'None', 'https://youtube.com/watch?v=example3', 'Maintain straight line from head to heels');
END $$;

-- ================================================
-- NOTES:
-- ================================================
-- 1. Old tables (wods, workout_library, wod_squad_assignments) are kept but unused
-- 2. Custom exercises stored as JSONB for flexibility
-- 3. Tags array allows multiple categorizations
-- 4. RLS ensures admins control templates, participants see assigned workouts
-- 5. ON DELETE CASCADE ensures cleanup when templates deleted
-- ================================================
