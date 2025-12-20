-- Migration: 007_implement_four_role_model
-- Description: Implement clean 4-role model (Admin, Platform Support, Enterprise Recruiter, Candidate)
-- Created: 2025-12-18

-- ============================================
-- ROLE MODEL:
-- 1. Admin (super_admin) - Platform governance
-- 2. Platform Support (admin) - Platform operations
-- 3. Enterprise Recruiter (enterprise) - Hiring-focused
-- 4. Candidate (student) - Task solving
-- ============================================

-- ============================================
-- STEP 1: Map existing roles to new model
-- ============================================

-- Current enum values: student, mentor, admin, super_admin, enterprise
-- New mapping:
-- - super_admin → Admin (highest authority)
-- - admin → Platform Support (operations)
-- - enterprise → Enterprise Recruiter (hiring)
-- - student → Candidate (task solver)
-- - mentor → DEPRECATED (migrate to Platform Support)

-- Migrate mentors to Platform Support
UPDATE users
SET user_type = 'admin'  -- Platform Support
WHERE user_type = 'mentor';

-- Add comments to document the role mapping
COMMENT ON COLUMN users.user_type IS 'User role:
- super_admin = Admin (platform governance)
- admin = Platform Support (operations)
- enterprise = Enterprise Recruiter (hiring)
- student = Candidate (task solver)';

-- ============================================
-- STEP 2: Add role metadata table
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_display_name TEXT NOT NULL,
  role_description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  scope TEXT CHECK (scope IN ('platform', 'enterprise', 'global')),
  enterprise_id UUID REFERENCES enterprises(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_role_metadata_user ON user_roles_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_role_metadata_enterprise ON user_roles_metadata(enterprise_id);

COMMENT ON TABLE user_roles_metadata IS 'Extended role information and permissions';

-- ============================================
-- STEP 3: Create role permissions table
-- ============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type TEXT NOT NULL CHECK (role_type IN ('super_admin', 'admin', 'enterprise', 'student')),
  permission_key TEXT NOT NULL,
  permission_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_type, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_type ON role_permissions(role_type);

COMMENT ON TABLE role_permissions IS 'Defines what each role can do';

-- ============================================
-- STEP 4: Insert role permissions
-- ============================================

-- Admin (super_admin) permissions
INSERT INTO role_permissions (role_type, permission_key, permission_name, description) VALUES
('super_admin', 'platform.govern', 'Platform Governance', 'Full platform authority'),
('super_admin', 'enterprises.create', 'Create Enterprises', 'Create and verify enterprises'),
('super_admin', 'enterprises.verify', 'Verify Enterprises', 'Approve enterprise registrations'),
('super_admin', 'enterprises.manage', 'Manage Enterprises', 'Suspend, ban, modify enterprises'),
('super_admin', 'users.manage', 'Manage Users', 'Suspend, ban, modify any user'),
('super_admin', 'tasks.create', 'Create Tasks', 'Create platform tasks'),
('super_admin', 'tasks.validate', 'Validate Tasks', 'Approve/reject tasks'),
('super_admin', 'tasks.manage', 'Manage Tasks', 'Flag, feature, modify tasks'),
('super_admin', 'submissions.review', 'Review Submissions', 'Review and score submissions'),
('super_admin', 'submissions.override', 'Override Scores', 'Override submission scores'),
('super_admin', 'audit.view', 'View Audit Logs', 'Access full audit trail'),
('super_admin', 'roles.assign', 'Assign Roles', 'Promote users to other roles')
ON CONFLICT (role_type, permission_key) DO NOTHING;

-- Platform Support (admin) permissions
INSERT INTO role_permissions (role_type, permission_key, permission_name, description) VALUES
('admin', 'platform.support', 'Platform Support', 'Operational support role'),
('admin', 'tasks.create', 'Create Tasks', 'Create platform tasks'),
('admin', 'tasks.validate', 'Validate Tasks', 'Flag tasks for review (not final approval)'),
('admin', 'tasks.moderate', 'Moderate Tasks', 'Flag inappropriate tasks'),
('admin', 'submissions.review', 'Review Submissions', 'Review and score submissions'),
('admin', 'users.support', 'User Support', 'Assist users with issues'),
('admin', 'disputes.mediate', 'Mediate Disputes', 'Handle user disputes'),
('admin', 'audit.view', 'View Audit Logs', 'Access audit trail')
ON CONFLICT (role_type, permission_key) DO NOTHING;

-- Enterprise Recruiter (enterprise) permissions
INSERT INTO role_permissions (role_type, permission_key, permission_name, description) VALUES
('enterprise', 'tasks.create', 'Create Tasks', 'Create hiring tasks'),
('enterprise', 'tasks.manage_own', 'Manage Own Tasks', 'Manage enterprise tasks'),
('enterprise', 'submissions.review_own', 'Review Own Submissions', 'Review submissions to own tasks'),
('enterprise', 'candidates.view', 'View Candidates', 'View candidate profiles and submissions'),
('enterprise', 'candidates.rate', 'Rate Candidates', 'Score and provide feedback'),
('enterprise', 'analytics.view_own', 'View Analytics', 'View enterprise task analytics')
ON CONFLICT (role_type, permission_key) DO NOTHING;

-- Candidate (student) permissions
INSERT INTO role_permissions (role_type, permission_key, permission_name, description) VALUES
('student', 'tasks.browse', 'Browse Tasks', 'View available tasks'),
('student', 'tasks.submit', 'Submit Solutions', 'Submit task solutions'),
('student', 'submissions.view_own', 'View Own Submissions', 'View own submission history'),
('student', 'profile.manage', 'Manage Profile', 'Update own profile'),
('student', 'progress.track', 'Track Progress', 'View own progress and scores')
ON CONFLICT (role_type, permission_key) DO NOTHING;

-- ============================================
-- STEP 5: Create task validation workflow
-- ============================================

-- Add task lifecycle status
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'draft'
  CHECK (lifecycle_status IN ('draft', 'validation_pending', 'active', 'archived'));

CREATE INDEX IF NOT EXISTS idx_tasks_lifecycle ON tasks(lifecycle_status);

-- Add validation metadata
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validation_notes TEXT;

COMMENT ON COLUMN tasks.lifecycle_status IS 'Task lifecycle: draft → validation_pending → active → archived';
COMMENT ON COLUMN tasks.validated_by IS 'Admin who validated the task (not creator)';

-- ============================================
-- STEP 6: Add creator restrictions
-- ============================================

-- Prevent task creators from validating their own tasks
CREATE OR REPLACE FUNCTION prevent_self_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- If validation is being set
  IF NEW.validated_by IS NOT NULL AND NEW.approved_by IS NOT NULL THEN
    -- Check if validator is the creator
    IF EXISTS (
      SELECT 1 FROM tasks
      WHERE id = NEW.id
      AND created_by = 'enterprise'
      AND enterprise_id IN (
        SELECT id FROM enterprises WHERE admin_user_id = NEW.validated_by
      )
    ) THEN
      RAISE EXCEPTION 'Task creator cannot validate their own task';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_task_self_validation ON tasks;
CREATE TRIGGER check_task_self_validation
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_validation();

-- ============================================
-- STEP 7: Update RLS policies for new model
-- ============================================

-- Candidates can browse active tasks
DROP POLICY IF EXISTS "candidates_browse_tasks" ON tasks;
CREATE POLICY "candidates_browse_tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    lifecycle_status = 'active'
    AND is_active = true
  );

-- Enterprise recruiters can manage own tasks
DROP POLICY IF EXISTS "recruiters_manage_own_tasks" ON tasks;
CREATE POLICY "recruiters_manage_own_tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    enterprise_id IN (
      SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
    )
  );

-- Platform Support and Admin can see all tasks
DROP POLICY IF EXISTS "platform_staff_see_all_tasks" ON tasks;
CREATE POLICY "platform_staff_see_all_tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
  );

-- ============================================
-- STEP 8: Create role helper functions
-- ============================================

-- Check if user is Admin (super_admin)
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND user_type = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is Platform Support (admin)
CREATE OR REPLACE FUNCTION is_platform_support(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is Enterprise Recruiter
CREATE OR REPLACE FUNCTION is_enterprise_recruiter(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enterprises
    WHERE admin_user_id = user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can create tasks
CREATE OR REPLACE FUNCTION can_create_tasks(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    is_platform_admin(user_id)
    OR is_platform_support(user_id)
    OR is_enterprise_recruiter(user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║   FOUR-ROLE MODEL IMPLEMENTED! ✓      ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Role Mapping:';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'super_admin → Admin (platform governance)';
  RAISE NOTICE 'admin       → Platform Support (operations)';
  RAISE NOTICE 'enterprise  → Enterprise Recruiter (hiring)';
  RAISE NOTICE 'student     → Candidate (task solving)';
  RAISE NOTICE '';
  RAISE NOTICE 'New Features:';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✓ Role permissions table';
  RAISE NOTICE '✓ Task lifecycle workflow';
  RAISE NOTICE '✓ Self-validation prevention';
  RAISE NOTICE '✓ Role helper functions';
  RAISE NOTICE '✓ Updated RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Task Lifecycle:';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'DRAFT → VALIDATION_PENDING → ACTIVE → ARCHIVED';
  RAISE NOTICE '';
END $$;

-- Show role permissions
SELECT
  role_type,
  CASE role_type
    WHEN 'super_admin' THEN 'Admin'
    WHEN 'admin' THEN 'Platform Support'
    WHEN 'enterprise' THEN 'Enterprise Recruiter'
    WHEN 'student' THEN 'Candidate'
  END as display_name,
  COUNT(*) as permission_count
FROM role_permissions
GROUP BY role_type
ORDER BY
  CASE role_type
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'enterprise' THEN 3
    WHEN 'student' THEN 4
  END;
