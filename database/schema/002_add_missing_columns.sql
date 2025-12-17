-- ============================================
-- JOBSIM SENEGAL - ADD MISSING COLUMNS
-- Run this AFTER dropping old enums and running main migration
-- ============================================

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
  -- Add job_field column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'job_field') THEN
    ALTER TABLE users ADD COLUMN job_field job_field DEFAULT 'other';
  END IF;

  -- Add experience_level column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'experience_level') THEN
    ALTER TABLE users ADD COLUMN experience_level experience_level DEFAULT 'junior';
  END IF;

  -- Add bio column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
  END IF;

  -- Add avatar_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add location column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'location') THEN
    ALTER TABLE users ADD COLUMN location TEXT;
  END IF;

  -- Add linkedin_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'linkedin_url') THEN
    ALTER TABLE users ADD COLUMN linkedin_url TEXT;
  END IF;

  -- Add github_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'github_url') THEN
    ALTER TABLE users ADD COLUMN github_url TEXT;
  END IF;

  -- Add portfolio_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'portfolio_url') THEN
    ALTER TABLE users ADD COLUMN portfolio_url TEXT;
  END IF;

  -- Add skills column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'skills') THEN
    ALTER TABLE users ADD COLUMN skills JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add completed_tasks_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'completed_tasks_count') THEN
    ALTER TABLE users ADD COLUMN completed_tasks_count INTEGER DEFAULT 0;
  END IF;

  -- Add total_score column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_score') THEN
    ALTER TABLE users ADD COLUMN total_score INTEGER DEFAULT 0;
  END IF;

  -- Add average_score column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'average_score') THEN
    ALTER TABLE users ADD COLUMN average_score DECIMAL(5,2) DEFAULT 0.00;
  END IF;

  -- Add is_available_for_hire column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_available_for_hire') THEN
    ALTER TABLE users ADD COLUMN is_available_for_hire BOOLEAN DEFAULT true;
  END IF;
END $$;
