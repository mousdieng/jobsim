-- Fix RLS Policies for Tasks Table to Allow AI Engine to Insert Tasks
-- Run this in your Supabase SQL Editor

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Enable insert for service role and users" ON tasks;

-- Create a new INSERT policy for service role (AI Engine uses this)
-- This allows the AI Engine to insert tasks using the service_role key
CREATE POLICY "Allow service role to insert tasks"
ON tasks
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create INSERT policy for regular authenticated users
CREATE POLICY "Allow users to insert their own tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON tasks;

-- Allow all authenticated users to read all tasks
CREATE POLICY "Allow authenticated users to read tasks"
ON tasks
FOR SELECT
TO authenticated
USING (true);

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "Enable update for task creators" ON tasks;

-- Allow users to update their own tasks
CREATE POLICY "Allow users to update own tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Drop existing DELETE policies
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;
DROP POLICY IF EXISTS "Enable delete for task creators and admins" ON tasks;

-- Allow users to delete their own tasks, or admins to delete any
CREATE POLICY "Allow users to delete own tasks"
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

-- Ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT
  policyname,
  cmd as operation,
  roles,
  qual::text as using_expression,
  with_check::text as check_expression
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY cmd, policyname;
