-- Fix RLS Policies for Tasks Table to Allow AI Engine to Insert Tasks
-- Run this in your Supabase SQL Editor

-- First, let's see what policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Drop existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;

-- Create a new INSERT policy that allows:
-- 1. Service role (AI Engine) to insert tasks
-- 2. Authenticated users to insert their own tasks
CREATE POLICY "Enable insert for service role and users"
ON tasks
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  -- Service role can insert anything (AI Engine)
  auth.role() = 'service_role'
  OR
  -- Regular users can only insert tasks they created
  (auth.uid() = created_by AND creator_type = 'user')
);

-- Also ensure SELECT policy allows reading all tasks
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;

CREATE POLICY "Enable read access for all authenticated users"
ON tasks
FOR SELECT
TO authenticated
USING (true);  -- All authenticated users can read all tasks

-- Ensure UPDATE policy exists for task owners
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;

CREATE POLICY "Enable update for task creators"
ON tasks
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Ensure DELETE policy exists for task owners and admins
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

CREATE POLICY "Enable delete for task creators and admins"
ON tasks
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.user_type = 'admin'
  )
);

-- Verify RLS is enabled on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Show all policies for verification
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY policyname;
