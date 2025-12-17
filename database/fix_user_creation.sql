-- SOLUTION: Automatically create user profile when auth user is created
-- This uses a database trigger to bypass RLS issues

-- Step 1: Drop existing RLS policies that are causing issues
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON users;

-- Step 2: Create function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, user_type, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Recreate RLS policies (simpler this time)
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to read all profiles
CREATE POLICY "Authenticated users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: We don't need INSERT policy anymore because trigger handles it!

-- Step 5: Verify everything is set up
SELECT 'Trigger created successfully' AS status;
SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE tablename = 'users';
