-- Migration: 003_create_jobs_table
-- Description: Creates the jobs table for storing real job opportunities
-- Dependencies: 002_create_simulations_table.sql
-- Created: 2025-11-15

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  related_simulations JSONB DEFAULT '[]'::jsonb,
  link TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Create GIN index for related_simulations JSONB column
CREATE INDEX IF NOT EXISTS idx_jobs_related_simulations ON jobs USING GIN (related_simulations);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow everyone to read jobs
CREATE POLICY "Anyone can read jobs"
  ON jobs
  FOR SELECT
  USING (true);

-- Allow authenticated users to create jobs
CREATE POLICY "Authenticated users can create jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow mentors and admins to update jobs
CREATE POLICY "Mentors and admins can update jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('mentor', 'admin')
    )
  );

-- Allow admins to delete jobs
CREATE POLICY "Admins can delete jobs"
  ON jobs
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
COMMENT ON TABLE jobs IS 'Stores real job opportunities for students';
COMMENT ON COLUMN jobs.related_simulations IS 'JSON array of simulation IDs that relate to this job';
COMMENT ON COLUMN jobs.link IS 'External application link for the job';
COMMENT ON COLUMN jobs.contact IS 'Contact information for job applications';
