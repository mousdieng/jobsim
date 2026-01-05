-- ============================================
-- STRICT ROLE-BASED SYSTEM IMPLEMENTATION
-- Implements the architecture defined in docs/ROLE_BASED_ARCHITECTURE.md
-- ============================================

-- ============================================
-- SECTION 1: USERS TABLE - ADD AUDIT COLUMNS
-- ============================================

-- Add columns to track who created users and when roles were assigned
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS role_assigned_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS role_assigned_by UUID REFERENCES users(id);

-- Update existing admin users to have proper metadata
UPDATE users
SET role_assigned_at = created_at,
    role_assigned_by = id
WHERE user_type = 'admin' AND role_assigned_at IS NULL;

-- ============================================
-- SECTION 2: ENTERPRISES TABLE - TASK CREATION CONTROL
-- ============================================

-- Add columns to control whether enterprises can create tasks
ALTER TABLE enterprises
ADD COLUMN IF NOT EXISTS can_create_tasks BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_creation_enabled_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS task_creation_enabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS task_creation_disabled_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enterprises_task_creation
ON enterprises(can_create_tasks)
WHERE can_create_tasks = true;

-- ============================================
-- SECTION 3: TASKS TABLE - CREATOR TRACKING
-- ============================================

-- Add columns to track who created tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS created_by_role TEXT CHECK (created_by_role IN ('admin', 'enterprise', 'platform')),
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id);

-- Update existing tasks
UPDATE tasks
SET created_by_role = 'platform',
    created_by_user_id = NULL
WHERE created_by_role IS NULL;

-- ============================================
-- SECTION 4: AUDIT LOGGING TABLE
-- ============================================

-- Create audit logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('admin', 'support', 'enterprise', 'student')),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'task', 'enterprise', 'submission', 'system')),
  target_id UUID,
  before_state JSONB,
  after_state JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON admin_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action_type, created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 5: STRICT USER CREATION POLICIES
-- ============================================

-- Drop existing user creation policies
DROP POLICY IF EXISTS "only_admins_create_users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Policy: Only admins can create Support/Enterprise/Admin users
-- Students can self-register
CREATE POLICY "strict_user_creation"
  ON users
  FOR INSERT
  WITH CHECK (
    -- Self-registration for students only
    (NEW.user_type = 'student' AND NEW.id = auth.uid())
    OR
    -- Admin creating any role (including other admins)
    (NEW.user_type IN ('admin', 'support', 'enterprise')
     AND is_admin(auth.uid()))
  );

-- ============================================
-- SECTION 6: STRICT TASK CREATION POLICIES
-- ============================================

-- Drop existing task creation policies
DROP POLICY IF EXISTS "task_creation_control" ON tasks;
DROP POLICY IF EXISTS "platform_staff_create_tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;

-- Policy: Only admins or enabled enterprises can create tasks
CREATE POLICY "strict_task_creation"
  ON tasks
  FOR INSERT
  WITH CHECK (
    -- Admin can always create tasks
    is_admin(auth.uid())
    OR
    -- Enterprise can create if explicitly enabled
    (
      NEW.created_by_role = 'enterprise'
      AND EXISTS (
        SELECT 1 FROM enterprises e
        INNER JOIN users u ON u.id = auth.uid()
        WHERE e.id = NEW.enterprise_id
        AND e.admin_user_id = u.id
        AND e.can_create_tasks = true
      )
    )
  );

-- ============================================
-- SECTION 7: ROLE ASSIGNMENT RESTRICTIONS
-- ============================================

-- Drop existing update policies that might allow role changes
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Policy: Users can update own profile but NOT role
CREATE POLICY "users_update_own_profile"
  ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      -- Students cannot change their role
      (OLD.user_type = 'student' AND NEW.user_type = 'student')
      OR
      -- Enterprises cannot change their role
      (OLD.user_type = 'enterprise' AND NEW.user_type = 'enterprise')
      OR
      -- Support cannot change their role
      (OLD.user_type = 'support' AND NEW.user_type = 'support')
    )
  );

-- Policy: Only admins can change user roles
CREATE POLICY "admins_can_change_roles"
  ON users
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- SECTION 8: ENTERPRISE PERMISSION CONTROL
-- ============================================

-- Drop existing enterprise policies
DROP POLICY IF EXISTS "Enterprises can view their own data" ON enterprises;
DROP POLICY IF EXISTS "Enterprises can update their own profile" ON enterprises;

-- Policy: Admins can manage all enterprises
CREATE POLICY "admins_manage_enterprises"
  ON enterprises
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy: Enterprises can view own data
CREATE POLICY "enterprises_view_own"
  ON enterprises
  FOR SELECT
  USING (
    admin_user_id = auth.uid()
    OR is_admin(auth.uid())
  );

-- Policy: Enterprises can update own profile (but not permissions)
CREATE POLICY "enterprises_update_own"
  ON enterprises
  FOR UPDATE
  USING (admin_user_id = auth.uid())
  WITH CHECK (
    admin_user_id = auth.uid()
    AND OLD.can_create_tasks = NEW.can_create_tasks  -- Cannot change own permissions
    AND OLD.task_creation_enabled_by = NEW.task_creation_enabled_by
    AND OLD.task_creation_enabled_at = NEW.task_creation_enabled_at
  );

-- ============================================
-- SECTION 9: SUPPORT ROLE RESTRICTIONS
-- ============================================

-- Support users have NO creation powers
-- They can only read data within their scope

-- Policy: Support can view users (for assistance)
DROP POLICY IF EXISTS "support_view_users" ON users;
CREATE POLICY "support_view_users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type = 'support'
    )
  );

-- Policy: Support can view tasks (for flagging/review)
DROP POLICY IF EXISTS "support_view_tasks" ON tasks;
CREATE POLICY "support_view_tasks"
  ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type = 'support'
    )
  );

-- Support CANNOT create, update, or delete anything
-- No additional policies needed - default deny

-- ============================================
-- SECTION 10: AUDIT LOG POLICIES
-- ============================================

-- Policy: Admins can view all audit logs
CREATE POLICY "admins_view_audit_logs"
  ON admin_audit_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Policy: Support can view their own actions
CREATE POLICY "support_view_own_audit_logs"
  ON admin_audit_logs
  FOR SELECT
  USING (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type = 'support'
    )
  );

-- Policy: All authenticated users can insert audit logs
-- (for automatic logging via triggers)
CREATE POLICY "authenticated_insert_audit_logs"
  ON admin_audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- SECTION 11: HELPER FUNCTIONS FOR AUDIT LOGGING
-- ============================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get actor role
  SELECT user_type INTO v_actor_role
  FROM users
  WHERE id = auth.uid();

  -- Insert audit log
  INSERT INTO admin_audit_logs (
    actor_id,
    actor_role,
    action_type,
    target_type,
    target_id,
    before_state,
    after_state,
    reason
  )
  VALUES (
    auth.uid(),
    v_actor_role,
    p_action_type,
    p_target_type,
    p_target_id,
    p_before_state,
    p_after_state,
    p_reason
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================
-- SECTION 12: TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- ============================================

-- Trigger function to log user changes
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Log user creation
    PERFORM log_admin_action(
      'user_created',
      'user',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      'User created'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log user updates (especially role changes)
    IF OLD.user_type != NEW.user_type THEN
      PERFORM log_admin_action(
        'user_role_changed',
        'user',
        NEW.id,
        jsonb_build_object('role', OLD.user_type),
        jsonb_build_object('role', NEW.user_type),
        'User role changed from ' || OLD.user_type || ' to ' || NEW.user_type
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Log user deletion
    PERFORM log_admin_action(
      'user_deleted',
      'user',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      'User deleted'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for user audit logging
DROP TRIGGER IF EXISTS audit_user_changes_trigger ON users;
CREATE TRIGGER audit_user_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_changes();

-- Trigger function to log enterprise permission changes
CREATE OR REPLACE FUNCTION audit_enterprise_permission_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log task creation permission changes
    IF OLD.can_create_tasks != NEW.can_create_tasks THEN
      PERFORM log_admin_action(
        'enterprise_permission_changed',
        'enterprise',
        NEW.id,
        jsonb_build_object('can_create_tasks', OLD.can_create_tasks),
        jsonb_build_object('can_create_tasks', NEW.can_create_tasks),
        CASE
          WHEN NEW.can_create_tasks THEN 'Task creation enabled'
          ELSE 'Task creation disabled'
        END
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for enterprise permission audit logging
DROP TRIGGER IF EXISTS audit_enterprise_permission_changes_trigger ON enterprises;
CREATE TRIGGER audit_enterprise_permission_changes_trigger
  AFTER UPDATE ON enterprises
  FOR EACH ROW
  EXECUTE FUNCTION audit_enterprise_permission_changes();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify admin users
SELECT
  id,
  email,
  user_type,
  created_at,
  role_assigned_at,
  created_by_admin_id
FROM users
WHERE user_type = 'admin';

-- Verify table structures
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('created_by_admin_id', 'role_assigned_at', 'role_assigned_by')
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'enterprises'
AND column_name IN ('can_create_tasks', 'task_creation_enabled_by', 'task_creation_enabled_at')
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'enterprises', 'tasks', 'admin_audit_logs')
ORDER BY tablename, policyname;

-- ============================================
-- NOTES
-- ============================================
-- This migration implements:
-- 1. Audit columns on users, enterprises, and tasks
-- 2. Strict RLS policies preventing privilege escalation
-- 3. Admin-only user creation for non-student roles
-- 4. Admin-controlled enterprise task creation capability
-- 5. Comprehensive audit logging system
-- 6. Automatic triggers for logging critical changes
--
-- Security Principles Enforced:
-- - Principle of Least Privilege
-- - No Privilege Escalation
-- - Explicit Deny (default)
-- - Audit Everything
-- - Database-level enforcement (not just UI)
