-- Migration: Fix Admin RLS Policy for Goal Assignments
-- FIXES: Admin cannot save personal goals of new participants
-- REASON: The "FOR ALL USING" policy doesn't work for INSERT operations
--         INSERT requires WITH CHECK clause, not USING

-- =====================================================
-- STEP 1: Ensure is_admin() function exists
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
-- STEP 2: Fix user_goal_assignments admin policies
-- =====================================================

-- Drop existing combined policy that doesn't work for INSERT
DROP POLICY IF EXISTS "Admins can manage goal assignments" ON user_goal_assignments;

-- Also drop any individual policies if they exist
DROP POLICY IF EXISTS "Admins can select goal assignments" ON user_goal_assignments;
DROP POLICY IF EXISTS "Admins can insert goal assignments" ON user_goal_assignments;
DROP POLICY IF EXISTS "Admins can update goal assignments" ON user_goal_assignments;
DROP POLICY IF EXISTS "Admins can delete goal assignments" ON user_goal_assignments;

-- Create separate policies for each operation type
-- SELECT uses USING clause
CREATE POLICY "Admins can select goal assignments" ON user_goal_assignments 
    FOR SELECT 
    USING (is_admin());

-- INSERT uses WITH CHECK clause (critical fix!)
CREATE POLICY "Admins can insert goal assignments" ON user_goal_assignments 
    FOR INSERT 
    WITH CHECK (is_admin());

-- UPDATE uses both USING (for which rows to update) and WITH CHECK (for new values)
CREATE POLICY "Admins can update goal assignments" ON user_goal_assignments 
    FOR UPDATE 
    USING (is_admin()) 
    WITH CHECK (is_admin());

-- DELETE uses USING clause
CREATE POLICY "Admins can delete goal assignments" ON user_goal_assignments 
    FOR DELETE 
    USING (is_admin());

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all policies on user_goal_assignments
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_goal_assignments' 
AND schemaname = 'public';
