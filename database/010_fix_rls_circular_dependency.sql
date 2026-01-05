-- ============================================
-- FIX RLS CIRCULAR DEPENDENCY
-- The problem: RLS policies check users table, but users table has RLS!
-- Solution: Use a function with SECURITY DEFINER to bypass RLS
-- ============================================

-- Create a helper function that bypasses RLS to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND user_type = 'admin'
  );
END;
$$;

-- Drop all existing admin policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can view all enterprises" ON enterprises;
DROP POLICY IF EXISTS "Admins can update all enterprises" ON enterprises;
DROP POLICY IF EXISTS "Admins can delete enterprises" ON enterprises;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can update all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all submissions" ON task_submissions;
DROP POLICY IF EXISTS "Admins can update all submissions" ON task_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON task_submissions;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_audit_logs;

-- ============================================
-- USERS TABLE - Fixed Admin Policies
-- ============================================

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (is_admin());

-- ============================================
-- ENTERPRISES TABLE - Fixed Admin Policies
-- ============================================

CREATE POLICY "Admins can view all enterprises"
  ON enterprises FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all enterprises"
  ON enterprises FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete enterprises"
  ON enterprises FOR DELETE
  USING (is_admin());

-- ============================================
-- TASKS TABLE - Fixed Admin Policies
-- ============================================

CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all tasks"
  ON tasks FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  USING (is_admin());

-- ============================================
-- TASK_SUBMISSIONS TABLE - Fixed Admin Policies
-- ============================================

CREATE POLICY "Admins can view all submissions"
  ON task_submissions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all submissions"
  ON task_submissions FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete submissions"
  ON task_submissions FOR DELETE
  USING (is_admin());

-- ============================================
-- ADMIN_AUDIT_LOGS TABLE - Fixed Admin Policies
-- ============================================

CREATE POLICY "Admins can view audit logs"
  ON admin_audit_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (is_admin());

-- ============================================
-- TEST THE FIX
-- ============================================

-- This should now return true if you're an admin
SELECT is_admin() as am_i_admin_now;

-- This should show the count of users
SELECT COUNT(*) as user_count FROM users;
