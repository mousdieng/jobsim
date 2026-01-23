-- ============================================
-- Migration 007: Candidate Tasks Junction Table
-- Description: Creates table to track candidates' task progress
-- Dependencies: 001_create_tables.sql (tasks, candidate_profiles)
-- ============================================

-- ============================================
-- CANDIDATE TASKS (Junction Table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.candidate_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Timeline
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'enrolled'
    CHECK (status IN ('enrolled', 'in_progress', 'completed', 'abandoned', 'expired')),

  -- Progress Tracking
  submission_count INTEGER DEFAULT 0,
  last_submission_at TIMESTAMPTZ,

  -- Results
  final_score INTEGER,
  final_feedback TEXT,
  xp_earned INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(candidate_id, task_id)
);

-- Indexes for performance
CREATE INDEX idx_candidate_tasks_candidate ON public.candidate_tasks(candidate_id);
CREATE INDEX idx_candidate_tasks_task ON public.candidate_tasks(task_id);
CREATE INDEX idx_candidate_tasks_status ON public.candidate_tasks(status);
CREATE INDEX idx_candidate_tasks_deadline ON public.candidate_tasks(deadline) WHERE status = 'in_progress';
CREATE INDEX idx_candidate_tasks_started_at ON public.candidate_tasks(started_at DESC);

-- ============================================
-- AI MEETINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  candidate_task_id UUID NOT NULL REFERENCES public.candidate_tasks(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Meeting Details
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('kickoff', 'checkpoint', 'review', 'debrief')),
  meeting_title TEXT NOT NULL,
  meeting_description TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed')),

  -- Meeting Content (AI Generated)
  meeting_agenda JSONB,
  meeting_participants JSONB,
  meeting_notes TEXT,

  -- Completion
  completed_at TIMESTAMPTZ,
  candidate_feedback TEXT,
  ai_feedback TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for AI meetings
CREATE INDEX idx_ai_meetings_candidate_task ON public.ai_meetings(candidate_task_id);
CREATE INDEX idx_ai_meetings_candidate ON public.ai_meetings(candidate_id);
CREATE INDEX idx_ai_meetings_task ON public.ai_meetings(task_id);
CREATE INDEX idx_ai_meetings_scheduled_for ON public.ai_meetings(scheduled_for);
CREATE INDEX idx_ai_meetings_status ON public.ai_meetings(status);

-- ============================================
-- UPDATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidate_tasks_updated_at
  BEFORE UPDATE ON public.candidate_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_meetings_updated_at
  BEFORE UPDATE ON public.ai_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.candidate_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_meetings ENABLE ROW LEVEL SECURITY;

-- Candidate Tasks Policies
-- Candidates can view their own task progress
CREATE POLICY "Candidates can view own tasks"
  ON public.candidate_tasks
  FOR SELECT
  TO authenticated
  USING (
    candidate_id = auth.uid()
  );

-- Candidates can insert their own task enrollments
CREATE POLICY "Candidates can enroll in tasks"
  ON public.candidate_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_id = auth.uid()
  );

-- Candidates can update their own task progress
CREATE POLICY "Candidates can update own task progress"
  ON public.candidate_tasks
  FOR UPDATE
  TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

-- Admins can view all candidate tasks
CREATE POLICY "Admins can view all candidate tasks"
  ON public.candidate_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'platform_support')
    )
  );

-- Enterprise reps can view tasks for their company's tasks
CREATE POLICY "Enterprise reps can view tasks for their tasks"
  ON public.candidate_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = candidate_tasks.task_id
      AND t.created_by = p.id
      AND p.role = 'enterprise_rep'
    )
  );

-- AI Meetings Policies
-- Candidates can view their own meetings
CREATE POLICY "Candidates can view own meetings"
  ON public.ai_meetings
  FOR SELECT
  TO authenticated
  USING (
    candidate_id = auth.uid()
  );

-- Candidates can update their own meetings (feedback, completion)
CREATE POLICY "Candidates can update own meetings"
  ON public.ai_meetings
  FOR UPDATE
  TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

-- Admins can view all AI meetings
CREATE POLICY "Admins can view all AI meetings"
  ON public.ai_meetings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'platform_support')
    )
  );

-- System can insert AI meetings (for AI generation)
CREATE POLICY "System can insert AI meetings"
  ON public.ai_meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate deadline based on estimated time
CREATE OR REPLACE FUNCTION calculate_task_deadline(
  task_id_param UUID,
  start_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  estimated_minutes INTEGER;
  deadline TIMESTAMPTZ;
BEGIN
  -- Get estimated time from task
  SELECT estimated_time_minutes INTO estimated_minutes
  FROM public.tasks
  WHERE id = task_id_param;

  -- Default to 7 days if no estimate
  IF estimated_minutes IS NULL THEN
    deadline := start_time + INTERVAL '7 days';
  ELSE
    -- Add estimated time as deadline
    deadline := start_time + (estimated_minutes || ' minutes')::INTERVAL;
  END IF;

  RETURN deadline;
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI kickoff meeting when task is started
CREATE OR REPLACE FUNCTION generate_kickoff_meeting()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if task is being started (status changed to in_progress and started_at is set)
  IF NEW.status = 'in_progress' AND NEW.started_at IS NOT NULL AND OLD.started_at IS NULL THEN
    INSERT INTO public.ai_meetings (
      candidate_task_id,
      candidate_id,
      task_id,
      meeting_type,
      meeting_title,
      meeting_description,
      scheduled_for,
      duration_minutes,
      meeting_agenda
    ) VALUES (
      NEW.id,
      NEW.candidate_id,
      NEW.task_id,
      'kickoff',
      'Project Kickoff Meeting',
      'Welcome to your task! This AI-simulated meeting will help you understand the requirements and expectations.',
      NEW.started_at + INTERVAL '5 minutes',
      30,
      jsonb_build_object(
        'topics', jsonb_build_array(
          'Task overview and objectives',
          'Key deliverables and requirements',
          'Timeline and milestones',
          'Questions and clarifications'
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_kickoff_meeting
  AFTER INSERT OR UPDATE ON public.candidate_tasks
  FOR EACH ROW
  EXECUTE FUNCTION generate_kickoff_meeting();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.candidate_tasks IS 'Tracks candidates progress on tasks they enroll in and start';
COMMENT ON COLUMN public.candidate_tasks.status IS 'enrolled: just enrolled, in_progress: started working, completed: finished, abandoned: gave up, expired: deadline passed';
COMMENT ON TABLE public.ai_meetings IS 'AI-generated meeting simulations for candidates working on tasks';
COMMENT ON FUNCTION calculate_task_deadline IS 'Calculates the deadline for a task based on estimated time';
COMMENT ON FUNCTION generate_kickoff_meeting IS 'Automatically generates a kickoff meeting when a candidate starts a task';
