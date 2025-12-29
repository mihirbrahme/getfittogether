-- ================================================
-- Events Enhancement - Schema Updates
-- ================================================
-- Add status and squad assignment to events
-- ================================================

-- 1. Add status column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled'));

-- 2. Create event squad assignments table (many-to-many)
CREATE TABLE IF NOT EXISTS event_squad_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, group_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_squad_assignments_event ON event_squad_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_squad_assignments_group ON event_squad_assignments(group_id);

-- 3. RLS Policies for event squad assignments
ALTER TABLE event_squad_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event squad assignments"
    ON event_squad_assignments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Members can view their squad event assignments"
    ON event_squad_assignments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = event_squad_assignments.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.status = 'approved'
        )
    );

-- 4. Add updated_at trigger
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Verification
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

SELECT * FROM event_squad_assignments LIMIT 1;

-- ================================================
-- NOTES:
-- ================================================
-- 1. Events now have status: upcoming, completed, cancelled
-- 2. Events can be assigned to multiple squads
-- 3. Only assigned squads see events in participant view
-- 4. Admins have full control over assignments
-- ================================================
