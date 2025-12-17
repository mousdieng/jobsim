-- ============================================
-- FIX USER SIGNUP TRIGGER
-- This updates the trigger to properly handle user metadata
-- Run this in your Supabase SQL editor
-- ============================================

-- First, make full_name nullable to prevent errors
ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;

-- Update the trigger function to properly extract ALL metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    job_field,
    experience_level,
    skills,
    completed_tasks_count,
    total_score,
    average_score,
    is_available_for_hire,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'User'
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'job_field')::job_field,
      'other'::job_field
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'experience_level')::experience_level,
      'junior'::experience_level
    ),
    '[]'::jsonb,
    0,
    0,
    0.00,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    job_field = COALESCE(EXCLUDED.job_field, users.job_field),
    experience_level = COALESCE(EXCLUDED.experience_level, users.experience_level),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Success message
SELECT 'User signup trigger fixed successfully!' AS status;
