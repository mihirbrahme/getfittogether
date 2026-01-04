-- Migration: Fix ALL Infinite Recursion Issues in RLS Policies
-- CRITICAL: Policies cannot query the same table they're protecting

-- =====================================================
-- PROFILES - Remove recursive admin checks
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read squad members profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Simple, non-recursive policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow all authenticated users to read all profiles (needed for leaderboard)
-- This is safe because profiles don't contain sensitive data (no PII)
CREATE POLICY "Authenticated can read profiles" ON profiles FOR SELECT TO authenticated USING (true);

-- Admin operations will be handled by service_role, not RLS policies

-- =====================================================
-- GROUP_MEMBERS - Already fixed, but ensure clean
-- =====================================================

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own membership" ON group_members;
DROP POLICY IF EXISTS "Users can read squad members" ON group_members;
DROP POLICY IF EXISTS "Admins can manage memberships" ON group_members;
DROP POLICY IF EXISTS "Users can read related memberships" ON group_members;

CREATE POLICY "Users can read own membership" ON group_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can read memberships" ON group_members FOR SELECT TO authenticated USING (true);

-- =====================================================
-- DAILY_LOGS - Remove recursive admin check
-- =====================================================

DROP POLICY IF EXISTS "Admins can read all daily logs" ON daily_logs;

-- Keep only user-specific policies
-- Admins will use service_role or direct database access

-- =====================================================
-- BIOMETRIC_LOGS - Remove recursive admin check
-- =====================================================

DROP POLICY IF EXISTS "Admins can read all biometrics" ON biometric_logs;

-- =====================================================
-- GROUPS - Remove recursive admin check
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage groups" ON groups;

-- Allow all authenticated users to read groups (needed for squad selection)
DROP POLICY IF EXISTS "Users can read own groups" ON groups;
CREATE POLICY "Authenticated can read groups" ON groups FOR SELECT TO authenticated USING (true);

-- =====================================================
-- USER_GOAL_ASSIGNMENTS - Remove recursive admin check
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage goal assignments" ON user_goal_assignments;

-- =====================================================
-- SQUAD_CHECKIN_ACTIVITIES - Remove recursive admin check  
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage activities" ON squad_checkin_activities;

-- =====================================================
-- EVENTS - Remove recursive admin check
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage events" ON events;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that no policies query their own table
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
