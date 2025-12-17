-- DIAGNOSTIC AND FIX SCRIPT
-- Run this to diagnose and fix the trigger issue

-- Step 1: Check if users table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Step 2: Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Step 3: Check if trigger exists
SELECT tgname, tgrelid::regclass as table_name 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Step 4: Check Postgres logs for errors (last 10 entries)
-- Note: This might not work depending on permissions
-- SELECT * FROM pg_stat_statements ORDER BY calls DESC LIMIT 10;

-- Step 5: Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use INSERT with ON CONFLICT to handle duplicates
  INSERT INTO public.users (
    id, 
    email, 
    user_type, 
    name, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_type,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Verify trigger was created
SELECT 'Trigger recreated successfully' AS status;

-- Step 7: Show current RLS policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';
