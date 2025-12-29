-- Phase 3 Sprint 1 Task 2.1: Squad-Specific WOD Assignment
-- Create many-to-many relationship between WODs and Squads

-- Create the junction table for WOD-Squad assignments
CREATE TABLE IF NOT EXISTS wod_squad_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wod_id UUID REFERENCES wods(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wod_id, group_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wod_squad_wod_id ON wod_squad_assignments(wod_id);
CREATE INDEX IF NOT EXISTS idx_wod_squad_group_id ON wod_squad_assignments(group_id);

-- Migrate existing data from wods.group_id to junction table
-- Only migrate where group_id is not null
INSERT INTO wod_squad_assignments (wod_id, group_id)
SELECT id, group_id 
FROM wods 
WHERE group_id IS NOT NULL
ON CONFLICT (wod_id, group_id) DO NOTHING;

-- Optional: Keep group_id column for backward compatibility
-- Or drop it if you want to enforce the new structure
-- ALTER TABLE wods DROP COLUMN group_id;

-- Add RLS policies for the new table
ALTER TABLE wod_squad_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can view assignments
CREATE POLICY "Everyone can view WOD assignments" ON wod_squad_assignments 
    FOR SELECT TO authenticated USING (TRUE);

-- Admins can manage assignments
CREATE POLICY "Admins can manage WOD assignments" ON wod_squad_assignments 
    FOR ALL USING (is_admin());

-- Add comment for documentation
COMMENT ON TABLE wod_squad_assignments IS 'Many-to-many relationship between WODs and Squads/Groups';
