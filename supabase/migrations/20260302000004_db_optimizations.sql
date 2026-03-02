-- =====================================================
-- MIGRATION: 004_db_optimizations
-- Description: Optimizes the is_admin function and adds missing indexes
-- =====================================================

BEGIN;

-- 1. Optimize is_admin() bottleneck
-- Rewrite from VOLATILE plpgsql to STABLE sql to allow PostgreSQL to cache the result per query
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Add missing indexes for ON DELETE CASCADE foreign keys
-- Prevents full table scans when parent rows are deleted
CREATE INDEX IF NOT EXISTS idx_program_squad_dates_squad_id ON program_squad_dates(squad_id);
CREATE INDEX IF NOT EXISTS idx_user_goal_assignments_template_id ON user_goal_assignments(goal_template_id);

-- 3. Add index for frequent RLS lookup
-- Speeds up queries where admins view their owned groups
CREATE INDEX IF NOT EXISTS idx_groups_admin_id ON groups(admin_id);

COMMIT;
