-- ============================================
-- DIAGNOSTIC SCRIPT FOR ZERO DATA ISSUE
-- Run this to find out why the admin dashboard shows zeros
-- ============================================

-- 1. Check if you're authenticated
SELECT
  'Current Auth User' as check_type,
  auth.uid() as user_id,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED'
    ELSE '✅ Authenticated'
  END as status;

-- 2. Check your user record and role
SELECT
  'Your User Profile' as check_type,
  id,
  email,
  name,
  user_type,
  status,
  CASE
    WHEN user_type = 'admin' THEN '✅ You are admin'
    ELSE '❌ NOT ADMIN - Your role is: ' || COALESCE(user_type, 'NULL')
  END as admin_status
FROM users
WHERE id = auth.uid();

-- 3. Check if is_admin() function exists and works
SELECT
  'is_admin() Function Test' as check_type,
  is_admin(auth.uid()) as result,
  CASE
    WHEN is_admin(auth.uid()) = true THEN '✅ Function works, you are admin'
    WHEN is_admin(auth.uid()) = false THEN '❌ Function works, but says you are NOT admin'
    ELSE '❌ Function returned NULL or errored'
  END as status;

-- 4. Check actual data counts (bypassing RLS)
SELECT
  'Actual Data Counts (No RLS)' as check_type,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM enterprises) as total_enterprises,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM task_submissions) as total_submissions;

-- 5. Check what YOU can see with RLS
SELECT
  'What YOU Can See (With RLS)' as check_type,
  (SELECT COUNT(*) FROM users WHERE true) as users_you_can_see,
  (SELECT COUNT(*) FROM enterprises WHERE true) as enterprises_you_can_see,
  (SELECT COUNT(*) FROM tasks WHERE true) as tasks_you_can_see,
  (SELECT COUNT(*) FROM task_submissions WHERE true) as submissions_you_can_see;

-- 6. Check RLS policies on users table
SELECT
  'Users Table RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 7. Check if required columns exist
SELECT
  'Required Audit Columns Check' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'created_by_admin_id'
    ) THEN '✅ created_by_admin_id exists'
    ELSE '❌ created_by_admin_id MISSING'
  END as users_audit_columns,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'admin_audit_logs'
      AND column_name = 'actor_id'
    ) THEN '✅ actor_id exists'
    ELSE '❌ actor_id MISSING - Need migration 012'
  END as audit_log_columns;

-- 8. Try to manually query users (to see the error)
DO $$
DECLARE
  user_count INTEGER;
  error_msg TEXT;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE '✅ Can query users table. Count: %', user_count;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
    RAISE NOTICE '❌ Error querying users: %', error_msg;
  END;
END $$;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
/*
If you see:
1. "NOT AUTHENTICATED" → Clear browser storage, sign in again
2. "NOT ADMIN" → Run: UPDATE users SET user_type = 'admin' WHERE email = 'your@email.com';
3. "Function returned NULL" → The is_admin() function doesn't exist. Need to create it.
4. Actual counts > 0 but "you can see" = 0 → RLS policies are blocking you
5. "actor_id MISSING" → You need to apply migration 012
6. Any SQL errors → Check the error message for details

MOST COMMON FIX:
If migration 012 hasn't been applied, the RLS policies reference columns that don't exist yet,
causing all queries to fail silently and return 0 results.

SOLUTION:
Apply database/012_fix_audit_logs_and_strict_roles.sql via Supabase Dashboard SQL Editor
*/
