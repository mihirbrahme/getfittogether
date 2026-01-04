-- Migration: Enable Row Level Security on All Core Tables (IDEMPOTENT VERSION)
-- CRITICAL SECURITY FIX: Prevents users from accessing other users' data
-- This version can be run multiple times safely

-- =====================================================
-- DAILY LOGS
-- =====================================================

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own daily logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own daily logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own daily logs" ON daily_logs;
DROP POLICY IF EXISTS "Admins can read all daily logs" ON daily_logs;

CREATE POLICY "Users can read own daily logs" ON daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily logs" ON daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily logs" ON daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all daily logs" ON daily_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- =====================================================
-- PROFILES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read squad members profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can read squad members profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM group_members gm1 JOIN group_members gm2 ON gm1.group_id = gm2.group_id WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id AND gm1.status = 'approved' AND gm2.status = 'approved'));
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Trigger to prevent users from changing their own role
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN NEW;
  END IF;
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON profiles;
CREATE TRIGGER trg_prevent_role_change BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- =====================================================
-- BIOMETRIC LOGS
-- =====================================================

ALTER TABLE biometric_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own biometrics" ON biometric_logs;
DROP POLICY IF EXISTS "Users can insert own biometrics" ON biometric_logs;
DROP POLICY IF EXISTS "Users can update own biometrics" ON biometric_logs;
DROP POLICY IF EXISTS "Admins can read all biometrics" ON biometric_logs;

CREATE POLICY "Users can read own biometrics" ON biometric_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own biometrics" ON biometric_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own biometrics" ON biometric_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all biometrics" ON biometric_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- =====================================================
-- GROUP MEMBERS
-- =====================================================

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own membership" ON group_members;
DROP POLICY IF EXISTS "Users can read squad members" ON group_members;
DROP POLICY IF EXISTS "Admins can manage memberships" ON group_members;

CREATE POLICY "Users can read own membership" ON group_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read squad members" ON group_members FOR SELECT USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.user_id = auth.uid() AND gm.group_id = group_members.group_id AND gm.status = 'approved'));
CREATE POLICY "Admins can manage memberships" ON group_members FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- =====================================================
-- GROUPS
-- =====================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own groups" ON groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON groups;

CREATE POLICY "Users can read own groups" ON groups FOR SELECT USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()));
CREATE POLICY "Admins can manage groups" ON groups FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- =====================================================
-- USER GOAL ASSIGNMENTS
-- =====================================================

ALTER TABLE user_goal_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own goals" ON user_goal_assignments;
DROP POLICY IF EXISTS "Users can insert own goals" ON user_goal_assignments;
DROP POLICY IF EXISTS "Users can update own goals" ON user_goal_assignments;
DROP POLICY IF EXISTS "Admins can manage goal assignments" ON user_goal_assignments;

CREATE POLICY "Users can read own goals" ON user_goal_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON user_goal_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON user_goal_assignments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage goal assignments" ON user_goal_assignments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- =====================================================
-- SQUAD CHECKIN ACTIVITIES
-- =====================================================

ALTER TABLE squad_checkin_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read activities" ON squad_checkin_activities;
DROP POLICY IF EXISTS "Admins can manage activities" ON squad_checkin_activities;

CREATE POLICY "Authenticated can read activities" ON squad_checkin_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage activities" ON squad_checkin_activities FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- =====================================================
-- EVENTS
-- =====================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read events" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;

CREATE POLICY "Authenticated can read events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify all tables have RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
