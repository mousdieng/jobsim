-- ============================================
-- ADMIN RLS POLICIES
-- Grant full access to users with user_type = 'admin'
-- ============================================

-- Drop existing admin policies if they exist
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

-- ============================================
-- USERS TABLE - Admin Policies
-- ============================================

CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

-- ============================================
-- ENTERPRISES TABLE - Admin Policies
-- ============================================

CREATE POLICY "Admins can view all enterprises"
  ON enterprises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all enterprises"
  ON enterprises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete enterprises"
  ON enterprises
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

-- ============================================
-- TASKS TABLE - Admin Policies
-- ============================================

CREATE POLICY "Admins can view all tasks"
  ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all tasks"
  ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete tasks"
  ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

-- ============================================
-- TASK_SUBMISSIONS TABLE - Admin Policies
-- ============================================

CREATE POLICY "Admins can view all submissions"
  ON task_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all submissions"
  ON task_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete submissions"
  ON task_submissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

-- ============================================
-- ADMIN_AUDIT_LOGS TABLE - Admin Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_audit_logs;

CREATE POLICY "Admins can view audit logs"
  ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
      AND admin_user.user_type = 'admin'
    )
  );
