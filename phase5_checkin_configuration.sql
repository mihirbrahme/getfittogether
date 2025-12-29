-- ================================================
-- Phase 5: Check-In Configuration System
-- ================================================
-- Admin control over check-in activities and personal goals
-- Squad-level customization with global defaults
-- ================================================

-- ================================================
-- 1. SQUAD CHECK-IN ACTIVITIES
-- ================================================
-- Configurable activities per squad (with global defaults)
CREATE TABLE IF NOT EXISTS squad_checkin_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    squad_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    activity_type TEXT CHECK (activity_type IN ('wod', 'core_habit', 'custom')),
    activity_key TEXT NOT NULL, -- 'wod', 'steps', 'diet', etc. for tracking
    points INT NOT NULL DEFAULT 10,
    enabled BOOLEAN DEFAULT true,
    display_order INT NOT NULL,
    icon TEXT DEFAULT 'CheckCircle', -- lucide icon name
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one activity_key per squad
CREATE UNIQUE INDEX idx_squad_activity_key ON squad_checkin_activities(squad_id, activity_key);

-- Index for ordering
CREATE INDEX idx_squad_activities_order ON squad_checkin_activities(squad_id, display_order);

-- ================================================
-- 2. GLOBAL DEFAULT ACTIVITIES (Template)
-- ================================================
-- Store default activity configuration (squad_id = NULL)
-- Used when creating new squads
INSERT INTO squad_checkin_activities (squad_id, activity_name, activity_type, activity_key, points, display_order, icon, description)
VALUES
    (NULL, 'WOD Completion', 'wod', 'wod', 20, 1, 'Dumbbell', 'Complete today''s workout'),
    (NULL, 'Steps Target', 'core_habit', 'steps', 10, 2, 'Footprints', 'Hit your daily step goal'),
    (NULL, 'Diet Compliance', 'core_habit', 'diet', 10, 3, 'Apple', 'Follow your meal plan'),
    (NULL, 'Sleep Quality', 'core_habit', 'sleep', 10, 4, 'Moon', 'Get 7+ hours of quality sleep'),
    (NULL, 'Hydration', 'core_habit', 'hydration', 10, 5, 'Droplet', 'Meet daily water intake goal')
ON CONFLICT DO NOTHING;

-- ================================================
-- 3. PERSONAL GOAL TEMPLATES
-- ================================================
-- Admin-created goal templates available for assignment
CREATE TABLE IF NOT EXISTS goal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('fitness', 'nutrition', 'wellness', 'lifestyle', 'custom')),
    points INT DEFAULT 5,
    is_global BOOLEAN DEFAULT true, -- true = available to all squads
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default goal templates
INSERT INTO goal_templates (name, description, category, points, is_global)
VALUES
    ('Read 30 mins daily', 'Read for at least 30 minutes each day', 'wellness', 5, true),
    ('Yoga/Stretching', 'Complete a yoga or stretching session', 'fitness', 5, true),
    ('No alcohol', 'Avoid alcoholic beverages', 'lifestyle', 5, true),
    ('Cold shower', 'Take a cold shower', 'wellness', 5, true),
    ('Journaling', 'Write in your journal', 'wellness', 5, true),
    ('Meal prep', 'Prepare healthy meals in advance', 'nutrition', 5, true),
    ('Meditation', 'Practice 10+ minutes of meditation', 'wellness', 5, true),
    ('No sugar', 'Avoid added sugars', 'nutrition', 5, true),
    ('Mobility work', 'Complete mobility exercises', 'fitness', 5, true),
    ('Gratitude practice', 'List 3 things you''re grateful for', 'wellness', 5, true)
ON CONFLICT DO NOTHING;

-- ================================================
-- 4. USER GOAL ASSIGNMENTS
-- ================================================
-- Admin assigns exactly 2 goals to each member
CREATE TABLE IF NOT EXISTS user_goal_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    goal_template_id UUID REFERENCES goal_templates(id) ON DELETE CASCADE,
    slot INT CHECK (slot IN (1, 2)), -- Goal slot 1 or 2
    assigned_by UUID REFERENCES profiles(id), -- Admin who assigned it
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slot) -- Each user has exactly one goal per slot
);

-- Index for quick user goal lookups
CREATE INDEX idx_user_goals ON user_goal_assignments(user_id);

-- ================================================
-- 5. HELPER FUNCTION: Copy Global Defaults to New Squad
-- ================================================
-- This function copies global default activities when a new squad is created
CREATE OR REPLACE FUNCTION create_squad_default_activities(new_squad_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO squad_checkin_activities (
        squad_id, activity_name, activity_type, activity_key, 
        points, enabled, display_order, icon, description
    )
    SELECT 
        new_squad_id, activity_name, activity_type, activity_key,
        points, enabled, display_order, icon, description
    FROM squad_checkin_activities
    WHERE squad_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 6. TRIGGER: Auto-create activities for new squads
-- ================================================
CREATE OR REPLACE FUNCTION auto_create_squad_activities()
RETURNS TRIGGER AS $$
BEGIN
    -- Copy global defaults to new squad
    PERFORM create_squad_default_activities(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_squad_activities
    AFTER INSERT ON groups
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_squad_activities();

-- ================================================
-- 7. SEED EXISTING SQUADS WITH DEFAULTS
-- ================================================
-- For existing squads without activities, copy defaults
DO $$
DECLARE
    squad_record RECORD;
BEGIN
    FOR squad_record IN SELECT id FROM groups
    LOOP
        -- Check if squad already has activities
        IF NOT EXISTS (
            SELECT 1 FROM squad_checkin_activities 
            WHERE squad_id = squad_record.id
        ) THEN
            PERFORM create_squad_default_activities(squad_record.id);
        END IF;
    END LOOP;
END $$;

-- ================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Squad Check-In Activities
ALTER TABLE squad_checkin_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage squad activities"
    ON squad_checkin_activities
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Members can view their squad activities"
    ON squad_checkin_activities
    FOR SELECT
    TO authenticated
    USING (
        squad_id IS NULL OR -- Global defaults
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = squad_checkin_activities.squad_id
            AND group_members.user_id = auth.uid()
            AND group_members.status = 'approved'
        )
    );

-- Goal Templates
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage goal templates"
    ON goal_templates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Everyone can view global goal templates"
    ON goal_templates
    FOR SELECT
    TO authenticated
    USING (is_global = true);

-- User Goal Assignments
ALTER TABLE user_goal_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user goal assignments"
    ON user_goal_assignments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own goal assignments"
    ON user_goal_assignments
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ================================================
-- 9. UPDATED AT TRIGGERS
-- ================================================
CREATE TRIGGER update_squad_activities_updated_at
    BEFORE UPDATE ON squad_checkin_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_templates_updated_at
    BEFORE UPDATE ON goal_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 10. VERIFICATION QUERIES
-- ================================================
-- Check global default activities
SELECT * FROM squad_checkin_activities WHERE squad_id IS NULL ORDER BY display_order;

-- Check goal templates
SELECT * FROM goal_templates WHERE is_global = true ORDER BY category, name;

-- Check squad-specific activities (after creation)
SELECT g.name as squad_name, sca.activity_name, sca.points, sca.enabled
FROM squad_checkin_activities sca
JOIN groups g ON g.id = sca.squad_id
ORDER BY g.name, sca.display_order;

-- ================================================
-- NOTES:
-- ================================================
-- 1. Global defaults (squad_id = NULL) serve as template
-- 2. New squads automatically get copy of global defaults
-- 3. Admins can customize per squad after creation
-- 4. Admin assigns exactly 2 goals per member (slot 1 and 2)
-- 5. Daily check-ins fetch activities from squad_checkin_activities
-- ================================================
