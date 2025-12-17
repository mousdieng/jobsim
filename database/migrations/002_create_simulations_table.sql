-- Migration: 002_create_simulations_table
-- Description: Creates the simulations table for storing job simulations
-- Dependencies: 001_create_users_table.sql (for mentor foreign key)
-- Created: 2025-11-15

-- Create difficulty enum
CREATE TYPE difficulty_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');

-- Create progress status enum
CREATE TYPE progress_status AS ENUM ('Completed', 'Awaiting Review', 'Incomplete');

-- Create urgency level enum
CREATE TYPE urgency_level AS ENUM ('High', 'Medium', 'Low');

-- Create asset type enum
CREATE TYPE asset_type AS ENUM ('pdf', 'excel', 'github');

-- Create simulations table
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_description TEXT NOT NULL,
  work_environment TEXT NOT NULL,
  applicants_count INTEGER DEFAULT 0,
  difficulty difficulty_level NOT NULL DEFAULT 'Beginner',
  progress progress_status DEFAULT 'Incomplete',
  time_estimate TEXT NOT NULL,
  date_posted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT NOT NULL,
  mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  mentor_name TEXT, -- Denormalized for quick display
  urgency urgency_level DEFAULT 'Medium',
  brief TEXT NOT NULL,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  support_assets JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_simulations_category ON simulations(category);
CREATE INDEX IF NOT EXISTS idx_simulations_difficulty ON simulations(difficulty);
CREATE INDEX IF NOT EXISTS idx_simulations_progress ON simulations(progress);
CREATE INDEX IF NOT EXISTS idx_simulations_mentor_id ON simulations(mentor_id);
CREATE INDEX IF NOT EXISTS idx_simulations_date_posted ON simulations(date_posted DESC);
CREATE INDEX IF NOT EXISTS idx_simulations_urgency ON simulations(urgency);

-- Create GIN index for JSONB columns for faster searches
CREATE INDEX IF NOT EXISTS idx_simulations_deliverables ON simulations USING GIN (deliverables);
CREATE INDEX IF NOT EXISTS idx_simulations_support_assets ON simulations USING GIN (support_assets);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_simulations_updated_at
  BEFORE UPDATE ON simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow everyone to read simulations
CREATE POLICY "Anyone can read simulations"
  ON simulations
  FOR SELECT
  USING (true);

-- Allow authenticated users to create simulations
CREATE POLICY "Authenticated users can create simulations"
  ON simulations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow mentors and admins to update simulations
CREATE POLICY "Mentors and admins can update simulations"
  ON simulations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('mentor', 'admin')
    )
  );

-- Allow admins to delete simulations
CREATE POLICY "Admins can delete simulations"
  ON simulations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE simulations IS 'Stores job simulation exercises for students';
COMMENT ON COLUMN simulations.company_name IS 'Name of the company for the simulation';
COMMENT ON COLUMN simulations.work_environment IS 'Description of the work environment';
COMMENT ON COLUMN simulations.applicants_count IS 'Number of students who applied to this simulation';
COMMENT ON COLUMN simulations.time_estimate IS 'Estimated time to complete (e.g., "2-3 hours")';
COMMENT ON COLUMN simulations.deliverables IS 'JSON array of deliverable items expected from students';
COMMENT ON COLUMN simulations.support_assets IS 'JSON array of supporting materials (PDFs, Excel files, GitHub repos)';
