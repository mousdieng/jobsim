-- Migration: 005b_add_admin_system
-- Description: Add admin system tables and fields (PART 2 of 2)
-- Prerequisites: 005a_add_admin_enum_values.sql must be run FIRST
-- Created: 2025-12-18

-- ============================================
-- 1. Add admin-specific fields to users table
-- ============================================

-- Add status column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraint after column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_status_check'
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'banned'));
    END IF;
END $$;

-- Add other admin columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_policy_training TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add foreign key constraint for approved_by
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_approved_by_fkey'
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES users(id);
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN users.status IS 'Account status: active, suspended, or banned';
COMMENT ON COLUMN users.two_factor_enabled IS 'Whether 2FA is enabled (required for admins)';
COMMENT ON COLUMN users.approved_by IS 'Admin user ID who approved this account (for enterprises/admins)';

-- ============================================
-- 2. Create admin_audit_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,

  -- Action details
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,

  -- Context
  reason TEXT,
  before_state JSONB,
  after_state JSONB,

  -- Session info
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  session_id TEXT,

  -- Reversibility
  reversible BOOLEAN DEFAULT FALSE,
  reversible_until TIMESTAMPTZ,
  reversed BOOLEAN DEFAULT FALSE,
  reversed_by UUID,
  reversed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for reversed_by
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'admin_audit_logs_reversed_by_fkey'
        AND conrelid = 'admin_audit_logs'::regclass
    ) THEN
        ALTER TABLE admin_audit_logs
        ADD CONSTRAINT admin_audit_logs_reversed_by_fkey
        FOREIGN KEY (reversed_by) REFERENCES users(id);
    END IF;
END $$;

-- Add constraint for target_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'admin_audit_logs_target_type_check'
        AND conrelid = 'admin_audit_logs'::regclass
    ) THEN
        ALTER TABLE admin_audit_logs
        ADD CONSTRAINT admin_audit_logs_target_type_check
        CHECK (target_type IN ('user', 'enterprise', 'task', 'submission', 'setting'));
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_reversible ON admin_audit_logs(reversible, reversible_until)
  WHERE reversible = TRUE AND reversed = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action_type);

-- Comments
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all administrative actions on the platform';
COMMENT ON COLUMN admin_audit_logs.reversible IS 'Whether this action can be reversed (soft deletes, suspensions)';
COMMENT ON COLUMN admin_audit_logs.reversible_until IS 'Date until which this action can be reversed (typically 90 days)';

-- ============================================
-- 3. Extend enterprises table
-- ============================================

-- Add verification fields
ALTER TABLE enterprises
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID;

-- Add foreign key for verified_by
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'enterprises_verified_by_fkey'
        AND conrelid = 'enterprises'::regclass
    ) THEN
        ALTER TABLE enterprises
        ADD CONSTRAINT enterprises_verified_by_fkey
        FOREIGN KEY (verified_by) REFERENCES users(id);
    END IF;
END $$;

-- Add status field
ALTER TABLE enterprises
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add constraint after column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'enterprises_status_check'
        AND conrelid = 'enterprises'::regclass
    ) THEN
        ALTER TABLE enterprises
        ADD CONSTRAINT enterprises_status_check
        CHECK (status IN ('pending', 'active', 'suspended', 'banned'));
    END IF;
END $$;

-- Add suspension fields
ALTER TABLE enterprises
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enterprises_status ON enterprises(status);
CREATE INDEX IF NOT EXISTS idx_enterprises_verified ON enterprises(is_verified);
CREATE INDEX IF NOT EXISTS idx_enterprises_admin_user ON enterprises(admin_user_id);

-- Comments
COMMENT ON COLUMN enterprises.status IS 'Enterprise account status: pending approval, active, suspended, or banned';
COMMENT ON COLUMN enterprises.verified_by IS 'Admin user ID who verified this enterprise';

-- ============================================
-- 4. Add admin fields to tasks table
-- ============================================

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Add foreign key for approved_by
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tasks_approved_by_fkey'
        AND conrelid = 'tasks'::regclass
    ) THEN
        ALTER TABLE tasks
        ADD CONSTRAINT tasks_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_approved ON tasks(is_approved);
CREATE INDEX IF NOT EXISTS idx_tasks_flagged ON tasks(flagged);

COMMENT ON COLUMN tasks.is_approved IS 'Whether task has been approved by admin (if manual review required)';
COMMENT ON COLUMN tasks.flagged IS 'Whether task has been flagged for review';

-- ============================================
-- 5. Add admin fields to task_submissions
-- ============================================

ALTER TABLE task_submissions
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS score_overridden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS score_override_reason TEXT,
ADD COLUMN IF NOT EXISTS score_overridden_by UUID,
ADD COLUMN IF NOT EXISTS score_overridden_at TIMESTAMPTZ;

-- Add foreign key for score_overridden_by
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'task_submissions_score_overridden_by_fkey'
        AND conrelid = 'task_submissions'::regclass
    ) THEN
        ALTER TABLE task_submissions
        ADD CONSTRAINT task_submissions_score_overridden_by_fkey
        FOREIGN KEY (score_overridden_by) REFERENCES users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_task_submissions_flagged ON task_submissions(flagged);
CREATE INDEX IF NOT EXISTS idx_task_submissions_overridden ON task_submissions(score_overridden);

COMMENT ON COLUMN task_submissions.flagged IS 'Whether submission has been flagged for admin review';
COMMENT ON COLUMN task_submissions.score_overridden IS 'Whether an admin has overridden the original score';

-- ============================================
-- 6. Update RLS Policies for Admin Access
-- ============================================

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type IN ('admin', 'super_admin')
    )
    OR auth.uid() = id
  );

-- Admins can update any user
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type IN ('admin', 'super_admin')
    )
    OR auth.uid() = id
  );

-- Enable RLS on admin_audit_logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON admin_audit_logs;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type IN ('admin', 'super_admin')
    )
  );

-- Authenticated admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type IN ('admin', 'super_admin')
    )
  );

-- Update enterprises RLS policies
DROP POLICY IF EXISTS "Enterprises can read own profile" ON enterprises;
DROP POLICY IF EXISTS "Enterprises can update own profile" ON enterprises;
DROP POLICY IF EXISTS "Admins can read all enterprises" ON enterprises;
DROP POLICY IF EXISTS "Admins can update enterprises" ON enterprises;
DROP POLICY IF EXISTS "Admins can insert enterprises" ON enterprises;

-- Enterprises and admins can read
CREATE POLICY "Enterprises can read own profile"
  ON enterprises
  FOR SELECT
  TO authenticated
  USING (
    admin_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type IN ('admin', 'super_admin')
    )
  );

-- Enterprises can update own profile (if not suspended)
CREATE POLICY "Enterprises can update own profile"
  ON enterprises
  FOR UPDATE
  TO authenticated
  USING (
    admin_user_id = auth.uid() AND (status IS NULL OR status = 'active')
  );

-- Admins can update any enterprise
CREATE POLICY "Admins can update enterprises"
  ON enterprises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can insert enterprises
CREATE POLICY "Admins can insert enterprises"
  ON enterprises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- 7. Create helper functions
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND user_type IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND user_type = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_reason TEXT,
  p_before_state JSONB,
  p_after_state JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_reversible BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_email TEXT;
  v_reversible_until TIMESTAMPTZ;
BEGIN
  -- Get admin email
  SELECT email INTO v_admin_email FROM users WHERE id = p_admin_id;

  -- Calculate reversible_until (90 days from now if reversible)
  IF p_reversible THEN
    v_reversible_until := NOW() + INTERVAL '90 days';
  END IF;

  -- Insert log
  INSERT INTO admin_audit_logs (
    admin_id,
    admin_email,
    action_type,
    target_type,
    target_id,
    reason,
    before_state,
    after_state,
    ip_address,
    user_agent,
    session_id,
    reversible,
    reversible_until
  ) VALUES (
    p_admin_id,
    v_admin_email,
    p_action_type,
    p_target_type,
    p_target_id,
    p_reason,
    p_before_state,
    p_after_state,
    p_ip_address,
    p_user_agent,
    p_session_id,
    p_reversible,
    v_reversible_until
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Grant permissions
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE ON admin_audit_logs TO authenticated;
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, UPDATE, INSERT ON enterprises TO authenticated;
GRANT SELECT, UPDATE ON tasks TO authenticated;
GRANT SELECT, UPDATE ON task_submissions TO authenticated;

-- ============================================
-- Migration complete
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Admin system successfully installed!';
  RAISE NOTICE 'Next step: Create super admin with:';
  RAISE NOTICE 'UPDATE users SET user_type = ''super_admin'', status = ''active'' WHERE email = ''your-admin@email.com'';';
END $$;
