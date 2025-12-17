-- Migration: 001_create_users_table
-- Description: Creates the users table for storing user profiles
-- Dependencies: Requires Supabase Auth to be enabled
-- Created: 2025-11-15

-- Create user_type enum
CREATE TYPE user_type AS ENUM ('student', 'mentor', 'admin');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  user_type user_type NOT NULL DEFAULT 'student',
  name TEXT,
  role TEXT,
  completed_count INTEGER DEFAULT 0,
  score_total INTEGER DEFAULT 0,
  badge_level TEXT,
  linked_profile TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on user_type for filtering
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies

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

-- Allow authenticated users to read all users (for mentors/admins to view students)
CREATE POLICY "Authenticated users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile during registration
-- This works for both anon and authenticated roles
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user profile information linked to Supabase Auth';
COMMENT ON COLUMN users.id IS 'References auth.users(id) - Supabase Auth user ID';
COMMENT ON COLUMN users.user_type IS 'Type of user: student, mentor, or admin';
COMMENT ON COLUMN users.completed_count IS 'Number of simulations/tasks completed';
COMMENT ON COLUMN users.score_total IS 'Total score accumulated across all submissions';
COMMENT ON COLUMN users.badge_level IS 'Achievement badge level (bronze, silver, gold, etc.)';
