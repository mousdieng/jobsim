-- ============================================
-- QUICK MIGRATION: Candidate Tasks & AI Meetings
-- Copy this entire file and paste into Supabase SQL Editor
-- Then click "Run"
-- ============================================

-- Step 1: Create candidate_tasks table
CREATE TABLE IF NOT EXISTS public.candidate_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'abandoned', 'expired')),
  submission_count INTEGER DEFAULT 0,
  last_submission_at TIMESTAMPTZ,
  final_score INTEGER,
  final_feedback TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, task_id)
);

-- Step 2: Create indexes for candidate_tasks
CREATE INDEX IF NOT EXISTS idx_candidate_tasks_candidate ON public.candidate_tasks(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_tasks_task ON public.candidate_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_candidate_tasks_status ON public.candidate_tasks(status);

-- Step 3: Create ai_meetings table
CREATE TABLE IF NOT EXISTS public.ai_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_task_id UUID NOT NULL REFERENCES public.candidate_tasks(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('kickoff', 'checkpoint', 'review', 'debrief')),
  meeting_title TEXT NOT NULL,
  meeting_description TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed')),
  meeting_agenda JSONB,
  meeting_participants JSONB,
  meeting_notes TEXT,
  completed_at TIMESTAMPTZ,
  candidate_feedback TEXT,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for ai_meetings
CREATE INDEX IF NOT EXISTS idx_ai_meetings_candidate_task ON public.ai_meetings(candidate_task_id);
CREATE INDEX IF NOT EXISTS idx_ai_meetings_candidate ON public.ai_meetings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_meetings_task ON public.ai_meetings(task_id);

-- Step 5: Enable RLS
ALTER TABLE public.candidate_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_meetings ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies (if any)
DROP POLICY IF EXISTS "Candidates can view own tasks" ON public.candidate_tasks;
DROP POLICY IF EXISTS "Candidates can enroll in tasks" ON public.candidate_tasks;
DROP POLICY IF EXISTS "Candidates can update own task progress" ON public.candidate_tasks;
DROP POLICY IF EXISTS "Admins can view all candidate tasks" ON public.candidate_tasks;
DROP POLICY IF EXISTS "Candidates can view own meetings" ON public.ai_meetings;
DROP POLICY IF EXISTS "Candidates can update own meetings" ON public.ai_meetings;
DROP POLICY IF EXISTS "Admins can view all AI meetings" ON public.ai_meetings;
DROP POLICY IF EXISTS "System can insert AI meetings" ON public.ai_meetings;

-- Step 7: Create RLS policies for candidate_tasks
CREATE POLICY "Candidates can view own tasks"
  ON public.candidate_tasks FOR SELECT TO authenticated
  USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can enroll in tasks"
  ON public.candidate_tasks FOR INSERT TO authenticated
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Candidates can update own task progress"
  ON public.candidate_tasks FOR UPDATE TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Admins can view all candidate tasks"
  ON public.candidate_tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'platform_support')
    )
  );

-- Step 8: Create RLS policies for ai_meetings
CREATE POLICY "Candidates can view own meetings"
  ON public.ai_meetings FOR SELECT TO authenticated
  USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can update own meetings"
  ON public.ai_meetings FOR UPDATE TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Admins can view all AI meetings"
  ON public.ai_meetings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'platform_support')
    )
  );

CREATE POLICY "System can insert AI meetings"
  ON public.ai_meetings FOR INSERT TO authenticated
  WITH CHECK (true);

-- Step 9: Create trigger function for kickoff meeting
CREATE OR REPLACE FUNCTION generate_kickoff_meeting()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND NEW.started_at IS NOT NULL AND (OLD IS NULL OR OLD.started_at IS NULL) THEN
    INSERT INTO public.ai_meetings (
      candidate_task_id, candidate_id, task_id,
      meeting_type, meeting_title, meeting_description,
      scheduled_for, duration_minutes, meeting_agenda
    ) VALUES (
      NEW.id, NEW.candidate_id, NEW.task_id,
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

-- Step 10: Create trigger
DROP TRIGGER IF EXISTS trigger_generate_kickoff_meeting ON public.candidate_tasks;
CREATE TRIGGER trigger_generate_kickoff_meeting
  AFTER INSERT OR UPDATE ON public.candidate_tasks
  FOR EACH ROW
  EXECUTE FUNCTION generate_kickoff_meeting();

-- ============================================
-- VERIFICATION QUERIES (Run these after to verify)
-- ============================================

-- Verify tables exist
SELECT 'candidate_tasks' as table_name, COUNT(*) as row_count FROM public.candidate_tasks
UNION ALL
SELECT 'ai_meetings' as table_name, COUNT(*) as row_count FROM public.ai_meetings;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('candidate_tasks', 'ai_meetings');

-- List all policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('candidate_tasks', 'ai_meetings');
