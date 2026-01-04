-- Migration: Add Admin Policies Without Recursion
-- Creates a helper function to check admin role without causing infinite recursion

-- =====================================================
-- STEP 1: Create helper function to check admin role
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- =====================================================
-- STEP 2: Add admin policies using the helper function
-- =====================================================

-- GROUPS
DROP POLICY IF EXISTS "Admins can insert groups" ON groups;
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;

CREATE POLICY "Admins can insert groups" ON groups FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update groups" ON groups FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete groups" ON groups FOR DELETE USING (is_admin());

-- GROUP_MEMBERS
DROP POLICY IF EXISTS "Admins can insert memberships" ON group_members;
DROP POLICY IF EXISTS "Admins can update memberships" ON group_members;
DROP POLICY IF EXISTS "Admins can delete memberships" ON group_members;

CREATE POLICY "Admins can insert memberships" ON group_members FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update memberships" ON group_members FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete memberships" ON group_members FOR DELETE USING (is_admin());

-- DAILY_LOGS (read-only for admins)
DROP POLICY IF EXISTS "Admins can read all daily logs" ON daily_logs;
CREATE POLICY "Admins can read all daily logs" ON daily_logs FOR SELECT USING (is_admin());

-- BIOMETRIC_LOGS (read-only for admins)
DROP POLICY IF EXISTS "Admins can read all biometrics" ON biometric_logs;
CREATE POLICY "Admins can read all biometrics" ON biometric_logs FOR SELECT USING (is_admin());

-- USER_GOAL_ASSIGNMENTS
DROP POLICY IF EXISTS "Admins can manage goal assignments" ON user_goal_assignments;
CREATE POLICY "Admins can manage goal assignments" ON user_goal_assignments FOR ALL USING (is_admin());

-- SQUAD_CHECKIN_ACTIVITIES
DROP POLICY IF EXISTS "Admins can manage activities" ON squad_checkin_activities;
CREATE POLICY "Admins can manage activities" ON squad_checkin_activities FOR ALL USING (is_admin());

-- EVENTS
DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (is_admin());

-- PROFILES (update only - reads already allowed)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (is_admin());

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test admin check function
-- SELECT is_admin();

-- List all policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
