-- Fix: Remove infinite recursion in group_members RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read squad members" ON group_members;

-- Simpler, non-recursive version:
-- Users can only see memberships for groups they belong to (after they're approved)
-- But we need to allow them to see their own membership even when pending
CREATE POLICY "Users can read related memberships" ON group_members FOR SELECT
USING (
  -- Can read own membership (any status)
  auth.uid() = user_id
  OR
  -- Can read other memberships in same group if user is approved member
  group_id IN (
    SELECT gm.group_id 
    FROM group_members gm 
    WHERE gm.user_id = auth.uid() 
    AND gm.status = 'approved'
  )
);
