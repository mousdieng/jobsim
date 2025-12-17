-- Fix RLS Policies for User Registration
-- Run this in Supabase SQL Editor if you're having issues with sign up

-- Drop the existing INSERT policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Create a new, simplified INSERT policy that works with both anon and authenticated
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';
