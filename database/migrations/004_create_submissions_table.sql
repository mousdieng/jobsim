-- Migration: 004_create_submissions_table
-- Description: Creates the submissions table for storing student simulation submissions
-- Dependencies: 001_create_users_table.sql, 002_create_simulations_table.sql
-- Created: 2025-11-15

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  submission_url TEXT,
  submission_files JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_simulation_id ON submissions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON submissions(score);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON submissions(reviewed_by);

-- Create composite index for student's submissions
CREATE INDEX IF NOT EXISTS idx_submissions_student_simulation ON submissions(student_id, simulation_id);

-- Create GIN index for submission_files JSONB column
CREATE INDEX IF NOT EXISTS idx_submissions_files ON submissions USING GIN (submission_files);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow students to read their own submissions
CREATE POLICY "Students can read own submissions"
  ON submissions
  FOR SELECT
  USING (auth.uid() = student_id);

-- Allow mentors and admins to read all submissions
CREATE POLICY "Mentors and admins can read all submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('mentor', 'admin')
    )
  );

-- Allow students to create their own submissions
CREATE POLICY "Students can create own submissions"
  ON submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Allow students to update their own unreviewed submissions
CREATE POLICY "Students can update own unreviewed submissions"
  ON submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id AND reviewed_at IS NULL);

-- Allow mentors and admins to update any submission (for grading)
CREATE POLICY "Mentors and admins can update all submissions"
  ON submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('mentor', 'admin')
    )
  );

-- Allow admins to delete submissions
CREATE POLICY "Admins can delete submissions"
  ON submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Create function to update user's completed_count and score_total when submission is graded
CREATE OR REPLACE FUNCTION update_user_stats_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if score was just added or changed and reviewed_at is set
  IF NEW.score IS NOT NULL AND NEW.reviewed_at IS NOT NULL AND
     (OLD.score IS NULL OR OLD.score != NEW.score OR OLD.reviewed_at IS NULL) THEN

    -- Update user's score_total
    UPDATE users
    SET
      score_total = COALESCE(score_total, 0) + NEW.score - COALESCE(OLD.score, 0),
      completed_count = (
        SELECT COUNT(DISTINCT simulation_id)
        FROM submissions
        WHERE student_id = NEW.student_id
        AND reviewed_at IS NOT NULL
      )
    WHERE id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update user stats when submission is graded
CREATE TRIGGER update_user_stats_on_submission_grade
  AFTER UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_submission();

-- Comments for documentation
COMMENT ON TABLE submissions IS 'Stores student submissions for simulations';
COMMENT ON COLUMN submissions.student_id IS 'References the student who made the submission';
COMMENT ON COLUMN submissions.simulation_id IS 'References the simulation being submitted for';
COMMENT ON COLUMN submissions.score IS 'Score out of 100, assigned by mentor/admin';
COMMENT ON COLUMN submissions.feedback IS 'Written feedback from reviewer';
COMMENT ON COLUMN submissions.submission_url IS 'URL to submission (e.g., GitHub repo, Google Drive)';
COMMENT ON COLUMN submissions.submission_files IS 'JSON array of uploaded file references';
COMMENT ON COLUMN submissions.reviewed_by IS 'User ID of mentor/admin who reviewed the submission';
