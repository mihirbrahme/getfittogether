-- Migration: Allow Public Read Access to Groups Table
-- FIXES: New participants cannot see squads during registration
-- REASON: RLS policy only allowed authenticated users to read groups,
--         but registration page fetches groups BEFORE user authenticates

-- =====================================================
-- GROUPS - Add Public Read Policy
-- =====================================================

-- Drop existing authenticated-only policy
DROP POLICY IF EXISTS "Authenticated can read groups" ON groups;
DROP POLICY IF EXISTS "Users can read own groups" ON groups;
DROP POLICY IF EXISTS "Public can read groups" ON groups;

-- Allow ALL users (including unauthenticated/anonymous) to read groups
-- This is safe because groups table only contains:
-- - id, name, code, start_date, end_date, created_at
-- No sensitive data is exposed
CREATE POLICY "Public can read groups" ON groups 
    FOR SELECT 
    USING (true);

-- Admin write operations handled by service_role
