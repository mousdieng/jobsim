-- ============================================
-- FIX CURRENT ADMIN USER
-- This will update your logged-in user to be an admin
-- ============================================

-- First, let's see what users exist
SELECT
  id,
  email,
  name,
  user_type,
  status
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Update the user with your email to be an admin
-- REPLACE 'mogesselvon@gmail.com' with your actual email
UPDATE users
SET
  user_type = 'admin',
  status = 'active',
  updated_at = NOW()
WHERE email = 'mogesselvon@gmail.com';

-- Verify the update
SELECT
  id,
  email,
  name,
  user_type,
  status
FROM users
WHERE user_type = 'admin';

-- ============================================
-- FIX THE TRIGGER FOR FUTURE USERS
-- ============================================

-- Update the trigger to properly set user_type based on email or metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_type text;
BEGIN
  -- Determine user type from metadata or email
  new_user_type := COALESCE(
    NEW.raw_user_meta_data->>'user_type',
    CASE
      WHEN NEW.email = 'mogesselvon@gmail.com' THEN 'admin'
      ELSE 'student'
    END
  );

  INSERT INTO public.users (
    id,
    email,
    name,
    full_name,
    user_type,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    new_user_type,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
