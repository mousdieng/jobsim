-- Migration: 006_verify_and_create_admin
-- Description: Verify admin system installation and create first super admin
-- Prerequisites: 005a and 005b must be completed
-- Created: 2025-12-18

-- ============================================
-- STEP 1: VERIFY INSTALLATION
-- ============================================

-- Check if enum values exist
DO $$
DECLARE
  v_has_enterprise BOOLEAN;
  v_has_super_admin BOOLEAN;
  v_has_audit_table BOOLEAN;
  v_has_status_column BOOLEAN;
BEGIN
  -- Check for 'enterprise' enum value
  SELECT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'enterprise' AND enumtypid = 'user_type'::regtype
  ) INTO v_has_enterprise;

  -- Check for 'super_admin' enum value
  SELECT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_admin' AND enumtypid = 'user_type'::regtype
  ) INTO v_has_super_admin;

  -- Check for admin_audit_logs table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'admin_audit_logs'
  ) INTO v_has_audit_table;

  -- Check for status column in users table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'status'
  ) INTO v_has_status_column;

  -- Report results
  IF v_has_enterprise THEN
    RAISE NOTICE '✓ Enum value "enterprise" exists';
  ELSE
    RAISE EXCEPTION '✗ Enum value "enterprise" NOT FOUND - Run migration 005a first!';
  END IF;

  IF v_has_super_admin THEN
    RAISE NOTICE '✓ Enum value "super_admin" exists';
  ELSE
    RAISE EXCEPTION '✗ Enum value "super_admin" NOT FOUND - Run migration 005a first!';
  END IF;

  IF v_has_audit_table THEN
    RAISE NOTICE '✓ Table "admin_audit_logs" exists';
  ELSE
    RAISE EXCEPTION '✗ Table "admin_audit_logs" NOT FOUND - Run migration 005b first!';
  END IF;

  IF v_has_status_column THEN
    RAISE NOTICE '✓ Column "users.status" exists';
  ELSE
    RAISE EXCEPTION '✗ Column "users.status" NOT FOUND - Run migration 005b first!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All checks passed! ✓';
  RAISE NOTICE 'Admin system is properly installed.';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================
-- STEP 2: SHOW EXISTING USERS
-- ============================================

-- Display all users to help you choose which one to promote
DO $$
DECLARE
  v_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM users;

  RAISE NOTICE 'Current users in the system (%)', v_user_count;
  RAISE NOTICE '----------------------------------------';
END $$;

-- Show users table
SELECT
  id,
  email,
  name,
  user_type,
  COALESCE(status, 'active') as status,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 3: CREATE/PROMOTE SUPER ADMIN
-- ============================================

-- INSTRUCTIONS:
-- Uncomment ONE of the options below and modify the email address

-- OPTION A: Promote existing user to super admin
-- Replace 'your-email@example.com' with the actual email

/*
UPDATE users
SET user_type = 'super_admin',
    status = 'active',
    two_factor_enabled = false  -- Set to true when you enable 2FA
WHERE email = 'your-email@example.com';
*/

-- OPTION B: Find user by ID and promote
-- First, get the user ID from the list above, then:

/*
UPDATE users
SET user_type = 'super_admin',
    status = 'active',
    two_factor_enabled = false
WHERE id = 'paste-user-uuid-here';
*/

-- ============================================
-- STEP 4: VERIFY SUPER ADMIN WAS CREATED
-- ============================================

-- This will show your super admin(s) after you uncomment and run one of the UPDATE statements above
SELECT
  id,
  email,
  name,
  user_type,
  status,
  two_factor_enabled,
  created_at
FROM users
WHERE user_type IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- ============================================
-- STEP 5: VIEW ADMIN STATISTICS
-- ============================================

-- Platform overview
SELECT
  'Total Users' as metric,
  COUNT(*)::text as value
FROM users
UNION ALL
SELECT
  'Active Users',
  COUNT(*)::text
FROM users
WHERE COALESCE(status, 'active') = 'active'
UNION ALL
SELECT
  'Total Enterprises',
  COUNT(*)::text
FROM enterprises
UNION ALL
SELECT
  'Pending Enterprises',
  COUNT(*)::text
FROM enterprises
WHERE COALESCE(status, 'pending') = 'pending'
UNION ALL
SELECT
  'Total Tasks',
  COUNT(*)::text
FROM tasks
UNION ALL
SELECT
  'Total Submissions',
  COUNT(*)::text
FROM task_submissions;

-- ============================================
-- DONE!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Installation verification complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Uncomment ONE of the UPDATE statements above';
  RAISE NOTICE '2. Replace the email/ID with your actual value';
  RAISE NOTICE '3. Run this file again to create your super admin';
  RAISE NOTICE '4. Access admin panel at: /admin/dashboard';
  RAISE NOTICE '';
END $$;
