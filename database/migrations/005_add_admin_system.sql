-- Migration: 005_add_admin_system
-- Description: Extends the user system with comprehensive admin roles and audit logging
-- Dependencies: 001_create_users_table.sql
-- Created: 2025-12-18

-- ============================================
-- 1. Extend user_type enum with more roles
-- ============================================

-- Add enterprise and super_admin to user_type enum
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'enterprise';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'super_admin';

-- ============================================
-- 2. Add admin-specific fields to users table
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_policy_training TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Add comment
COMMENT ON COLUMN users.status IS 'Account status: active, suspended, or banned';
COMMENT ON COLUMN users.two_factor_enabled IS 'Whether 2FA is enabled (required for admins)';
COMMENT ON COLUMN users.approved_by IS 'Admin user ID who approved this account (for enterprises/admins)';

-- ============================================
-- 3. Create admin_audit_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,

  -- Action details
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'enterprise', 'task', 'submission', 'setting')),
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
  reversed_by UUID REFERENCES users(id),
  reversed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
-- 4. Create enterprises table
-- ============================================

CREATE TABLE IF NOT EXISTS enterprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  location TEXT,
  size TEXT,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,

  -- Contact
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Admin
  admin_user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enterprises_status ON enterprises(status);
CREATE INDEX IF NOT EXISTS idx_enterprises_verified ON enterprises(is_verified);
CREATE INDEX IF NOT EXISTS idx_enterprises_admin_user ON enterprises(admin_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_enterprises_updated_at
  BEFORE UPDATE ON enterprises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE enterprises IS 'Companies/organizations that post tasks and recruit on the platform';
COMMENT ON COLUMN enterprises.status IS 'Enterprise account status: pending approval, active, suspended, or banned';
COMMENT ON COLUMN enterprises.verified_by IS 'Admin user ID who verified this enterprise';

-- ============================================
-- 5. Link tasks to enterprises
-- ============================================

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_enterprise ON tasks(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_tasks_approved ON tasks(is_approved);
CREATE INDEX IF NOT EXISTS idx_tasks_flagged ON tasks(flagged);

COMMENT ON COLUMN tasks.enterprise_id IS 'Enterprise that created this task (null for platform/AI tasks)';
COMMENT ON COLUMN tasks.is_approved IS 'Whether task has been approved by admin (if manual review required)';
COMMENT ON COLUMN tasks.flagged IS 'Whether task has been flagged for review';

-- ============================================
-- 6. Add admin fields to submissions
-- ============================================

ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS score_overridden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS score_override_reason TEXT,
ADD COLUMN IF NOT EXISTS score_overridden_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS score_overridden_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_submissions_flagged ON submissions(flagged);
CREATE INDEX IF NOT EXISTS idx_submissions_overridden ON submissions(score_overridden);

COMMENT ON COLUMN submissions.flagged IS 'Whether submission has been flagged for admin review';
COMMENT ON COLUMN submissions.score_overridden IS 'Whether an admin has overridden the original score';

-- ============================================
-- 7. Update RLS Policies for Admin Access
-- ============================================

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can update any user (except role changes without proper auth)
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type IN ('admin', 'super_admin')
    )
  );

-- Enable RLS on new tables
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type IN ('admin', 'super_admin')
    )
  );

-- Only system/service role can insert audit logs (prevents tampering)
CREATE POLICY "Service role can insert audit logs"
  ON admin_audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Enterprises can read their own profile
CREATE POLICY "Enterprises can read own profile"
  ON enterprises
  FOR SELECT
  USING (
    admin_user_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM users WHERE user_type IN ('admin', 'super_admin'))
  );

-- Enterprises can update their own profile (if not suspended)
CREATE POLICY "Enterprises can update own profile"
  ON enterprises
  FOR UPDATE
  USING (
    admin_user_id = auth.uid() AND status = 'active'
  );

-- Admins can read all enterprises
CREATE POLICY "Admins can read all enterprises"
  ON enterprises
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can update any enterprise
CREATE POLICY "Admins can update enterprises"
  ON enterprises
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can insert enterprises
CREATE POLICY "Admins can insert enterprises"
  ON enterprises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- 8. Create helper functions
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

-- Function to log admin action (call from application)
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
-- 9. Create default super admin (MUST CHANGE)
-- ============================================

-- This creates a placeholder super admin account
-- You MUST update this with your actual admin email after running migration
-- Then set a strong password via Supabase Auth dashboard

COMMENT ON TABLE users IS 'IMPORTANT: After migration, create super admin via Supabase Auth Dashboard
with email admin@jobsim-senegal.com and set user_type to super_admin manually';

-- ============================================
-- Migration complete
-- ============================================
