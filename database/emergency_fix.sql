-- EMERGENCY FIX - Disable Trigger, Use Service Role Instead
-- This bypasses the trigger issue completely

-- Step 1: Remove the broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Remove all RLS policies temporarily
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON users;

-- Step 3: Disable RLS temporarily for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled, trigger removed. Try signup now.' AS status;
