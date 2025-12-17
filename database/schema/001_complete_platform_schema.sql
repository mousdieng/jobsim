-- ============================================
-- JOBSIM SENEGAL - COMPLETE PLATFORM SCHEMA
-- Enterprise Work Simulation Platform
-- ============================================

-- ============================================
-- SECTION 1: CUSTOM TYPES (ENUMS)
-- ============================================

-- Job field categories
DO $$ BEGIN
  CREATE TYPE job_field AS ENUM (
    'software_engineering',
    'accounting',
    'marketing',
    'sales',
    'human_resources',
    'project_management',
    'data_science',
    'graphic_design',
    'customer_service',
    'finance',
    'legal',
    'healthcare',
    'education',
    'operations',
    'consulting',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Experience levels
DO $$ BEGIN
  CREATE TYPE experience_level AS ENUM (
    'junior',
    'mid',
    'senior'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Task difficulty levels
-- Drop and recreate to ensure correct values
DO $$ BEGIN
  -- First check if any tables use this type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE udt_name = 'difficulty_level'
  ) THEN
    DROP TYPE IF EXISTS difficulty_level;
    CREATE TYPE difficulty_level AS ENUM (
      'beginner',
      'intermediate',
      'advanced',
      'expert'
    );
  ELSE
    -- Type exists and is in use, try to add missing values
    BEGIN
      ALTER TYPE difficulty_level ADD VALUE IF NOT EXISTS 'beginner';
    EXCEPTION WHEN others THEN null;
    END;
    BEGIN
      ALTER TYPE difficulty_level ADD VALUE IF NOT EXISTS 'intermediate';
    EXCEPTION WHEN others THEN null;
    END;
    BEGIN
      ALTER TYPE difficulty_level ADD VALUE IF NOT EXISTS 'advanced';
    EXCEPTION WHEN others THEN null;
    END;
    BEGIN
      ALTER TYPE difficulty_level ADD VALUE IF NOT EXISTS 'expert';
    EXCEPTION WHEN others THEN null;
    END;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Task creator type
DO $$ BEGIN
  CREATE TYPE creator_type AS ENUM (
    'ai',
    'enterprise',
    'platform'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Submission status
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'reviewed',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- SECTION 2: CORE TABLES
-- ============================================

-- 1. USERS TABLE (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  job_field job_field DEFAULT 'other',
  experience_level experience_level DEFAULT 'junior',
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  completed_tasks_count INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  is_available_for_hire BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ENTERPRISES TABLE (Companies that create real tasks)
CREATE TABLE IF NOT EXISTS enterprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  location TEXT,
  size TEXT, -- '1-10', '11-50', '51-200', '201-500', '500+'
  is_verified BOOLEAN DEFAULT false,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TASKS TABLE (AI-generated or Enterprise-created tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  job_field job_field NOT NULL,
  difficulty_level difficulty_level NOT NULL DEFAULT 'intermediate',
  estimated_duration TEXT, -- e.g., '2-3 hours'
  deadline TIMESTAMPTZ,
  skills_required JSONB DEFAULT '[]'::jsonb,
  deliverables JSONB DEFAULT '[]'::jsonb, -- What user must submit
  resources JSONB DEFAULT '[]'::jsonb, -- Supporting materials
  created_by creator_type NOT NULL DEFAULT 'ai',
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
  max_submissions INTEGER DEFAULT NULL, -- NULL = unlimited
  current_submissions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TASK_SUBMISSIONS TABLE (User work submissions)
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content JSONB NOT NULL, -- Flexible structure for different submission types
  attachments JSONB DEFAULT '[]'::jsonb, -- File URLs
  notes TEXT,
  time_spent_minutes INTEGER,
  status submission_status NOT NULL DEFAULT 'draft',
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user can only submit once per task (unless rejected)
  UNIQUE(task_id, user_id)
);

-- 5. MEETINGS TABLE (AI-simulated meetings)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meeting_title TEXT NOT NULL,
  meeting_type TEXT DEFAULT 'general', -- 'kickoff', 'standup', 'review', 'client_call'
  participants JSONB DEFAULT '[]'::jsonb, -- AI-generated participant profiles
  agenda JSONB DEFAULT '[]'::jsonb,
  transcript TEXT,
  summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  duration_minutes INTEGER DEFAULT 30,
  scheduled_for TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT false,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ENTERPRISE_TASKS TABLE (Link enterprises to their tasks)
CREATE TABLE IF NOT EXISTS enterprise_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  budget_range TEXT,
  hiring_intent BOOLEAN DEFAULT false, -- True if task is for hiring
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each task can only be linked to one enterprise
  UNIQUE(task_id)
);

-- ============================================
-- SECTION 3: ADDITIONAL UTILITY TABLES
-- ============================================

-- User task progress tracking
CREATE TABLE IF NOT EXISTS user_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0,
  notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, task_id)
);

-- Recruiter views (track when recruiters view user profiles)
CREATE TABLE IF NOT EXISTS recruiter_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES task_submissions(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SECTION 4: INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_job_field ON users(job_field);
CREATE INDEX IF NOT EXISTS idx_users_experience ON users(experience_level);
CREATE INDEX IF NOT EXISTS idx_users_available ON users(is_available_for_hire);
CREATE INDEX IF NOT EXISTS idx_users_score ON users(average_score DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_job_field ON tasks(job_field);
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_featured ON tasks(is_featured);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_enterprise ON tasks(enterprise_id);

-- Task submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user ON task_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON task_submissions(score DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted ON task_submissions(submitted_at);

-- Meetings indexes
CREATE INDEX IF NOT EXISTS idx_meetings_user ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_task ON meetings(task_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings(scheduled_for);

-- Enterprises indexes
CREATE INDEX IF NOT EXISTS idx_enterprises_sector ON enterprises(sector);
CREATE INDEX IF NOT EXISTS idx_enterprises_verified ON enterprises(is_verified);

-- ============================================
-- SECTION 5: TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprises_timestamp
  BEFORE UPDATE ON enterprises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_timestamp
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_timestamp
  BEFORE UPDATE ON task_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_timestamp
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_timestamp
  BEFORE UPDATE ON user_task_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for auto user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update user stats when submission is scored
CREATE OR REPLACE FUNCTION update_user_stats_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if score is set and status is 'reviewed' or 'approved'
  IF NEW.score IS NOT NULL AND NEW.status IN ('reviewed', 'approved') THEN
    -- Update user statistics
    UPDATE users
    SET
      completed_tasks_count = (
        SELECT COUNT(DISTINCT task_id)
        FROM task_submissions
        WHERE user_id = NEW.user_id
        AND status IN ('reviewed', 'approved')
      ),
      total_score = (
        SELECT COALESCE(SUM(score), 0)
        FROM task_submissions
        WHERE user_id = NEW.user_id
        AND score IS NOT NULL
      ),
      average_score = (
        SELECT COALESCE(AVG(score), 0)
        FROM task_submissions
        WHERE user_id = NEW.user_id
        AND score IS NOT NULL
      ),
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT OR UPDATE ON task_submissions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_submission();

-- Update task submission count
CREATE OR REPLACE FUNCTION update_task_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks
    SET current_submissions = current_submissions + 1
    WHERE id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tasks
    SET current_submissions = current_submissions - 1
    WHERE id = OLD.task_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_count_trigger
  AFTER INSERT OR DELETE ON task_submissions
  FOR EACH ROW EXECUTE FUNCTION update_task_submission_count();

-- ============================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can view public user profiles (for recruiters)
DROP POLICY IF EXISTS "Public can view user profiles" ON users;
CREATE POLICY "Public can view user profiles"
  ON users FOR SELECT
  TO authenticated
  USING (is_available_for_hire = true);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- ENTERPRISES POLICIES
-- ============================================

-- Anyone can view enterprises
DROP POLICY IF EXISTS "Anyone can view enterprises" ON enterprises;
CREATE POLICY "Anyone can view enterprises"
  ON enterprises FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can update their enterprise
DROP POLICY IF EXISTS "Admin can update own enterprise" ON enterprises;
CREATE POLICY "Admin can update own enterprise"
  ON enterprises FOR UPDATE
  USING (auth.uid() = admin_user_id);

-- Authenticated users can create enterprises
DROP POLICY IF EXISTS "Authenticated can create enterprise" ON enterprises;
CREATE POLICY "Authenticated can create enterprise"
  ON enterprises FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_user_id);

-- Only admin can delete their enterprise
DROP POLICY IF EXISTS "Admin can delete own enterprise" ON enterprises;
CREATE POLICY "Admin can delete own enterprise"
  ON enterprises FOR DELETE
  USING (auth.uid() = admin_user_id);

-- ============================================
-- TASKS POLICIES
-- ============================================

-- Anyone can view active tasks
DROP POLICY IF EXISTS "Anyone can view active tasks" ON tasks;
CREATE POLICY "Anyone can view active tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Enterprise admins can create tasks
DROP POLICY IF EXISTS "Enterprise admin can create tasks" ON tasks;
CREATE POLICY "Enterprise admin can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = 'ai' OR
    created_by = 'platform' OR
    (created_by = 'enterprise' AND enterprise_id IN (
      SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
    ))
  );

-- Enterprise admins can update their tasks
DROP POLICY IF EXISTS "Enterprise admin can update own tasks" ON tasks;
CREATE POLICY "Enterprise admin can update own tasks"
  ON tasks FOR UPDATE
  USING (
    enterprise_id IN (
      SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
    )
  );

-- Enterprise admins can delete their tasks
DROP POLICY IF EXISTS "Enterprise admin can delete own tasks" ON tasks;
CREATE POLICY "Enterprise admin can delete own tasks"
  ON tasks FOR DELETE
  USING (
    enterprise_id IN (
      SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
    )
  );

-- ============================================
-- TASK SUBMISSIONS POLICIES
-- ============================================

-- Users can view their own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON task_submissions;
CREATE POLICY "Users can view own submissions"
  ON task_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Enterprise admins can view submissions for their tasks
DROP POLICY IF EXISTS "Enterprise can view task submissions" ON task_submissions;
CREATE POLICY "Enterprise can view task submissions"
  ON task_submissions FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN enterprises e ON t.enterprise_id = e.id
      WHERE e.admin_user_id = auth.uid()
    )
  );

-- Users can create submissions
DROP POLICY IF EXISTS "Users can create submissions" ON task_submissions;
CREATE POLICY "Users can create submissions"
  ON task_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft submissions
DROP POLICY IF EXISTS "Users can update own draft submissions" ON task_submissions;
CREATE POLICY "Users can update own draft submissions"
  ON task_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

-- Enterprise admins can review submissions
DROP POLICY IF EXISTS "Enterprise can review submissions" ON task_submissions;
CREATE POLICY "Enterprise can review submissions"
  ON task_submissions FOR UPDATE
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN enterprises e ON t.enterprise_id = e.id
      WHERE e.admin_user_id = auth.uid()
    )
  );

-- Users can delete their draft submissions
DROP POLICY IF EXISTS "Users can delete draft submissions" ON task_submissions;
CREATE POLICY "Users can delete draft submissions"
  ON task_submissions FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

-- ============================================
-- MEETINGS POLICIES
-- ============================================

-- Users can view their own meetings
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;
CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = user_id);

-- System can create meetings (AI)
DROP POLICY IF EXISTS "System can create meetings" ON meetings;
CREATE POLICY "System can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own meetings
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- ENTERPRISE TASKS POLICIES
-- ============================================

-- Anyone can view enterprise task links
DROP POLICY IF EXISTS "Anyone can view enterprise tasks" ON enterprise_tasks;
CREATE POLICY "Anyone can view enterprise tasks"
  ON enterprise_tasks FOR SELECT
  TO authenticated
  USING (true);

-- Enterprise admins can manage their task links
DROP POLICY IF EXISTS "Enterprise admin can manage task links" ON enterprise_tasks;
CREATE POLICY "Enterprise admin can manage task links"
  ON enterprise_tasks FOR ALL
  USING (
    enterprise_id IN (
      SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
    )
  );

-- ============================================
-- USER TASK PROGRESS POLICIES
-- ============================================

-- Users can view their own progress
DROP POLICY IF EXISTS "Users can view own progress" ON user_task_progress;
CREATE POLICY "Users can view own progress"
  ON user_task_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own progress
DROP POLICY IF EXISTS "Users can manage own progress" ON user_task_progress;
CREATE POLICY "Users can manage own progress"
  ON user_task_progress FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- RECRUITER VIEWS POLICIES
-- ============================================

-- Enterprise admins can view their view history
DROP POLICY IF EXISTS "Enterprise can view own views" ON recruiter_views;
CREATE POLICY "Enterprise can view own views"
  ON recruiter_views FOR SELECT
  USING (
    enterprise_id IN (
      SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
    )
  );

-- Enterprise admins can record views
DROP POLICY IF EXISTS "Enterprise can record views" ON recruiter_views;
CREATE POLICY "Enterprise can record views"
  ON recruiter_views FOR INSERT
  TO authenticated
  WITH CHECK (
    enterprise_id IN (
      SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
    )
  );

-- Users can see who viewed them
DROP POLICY IF EXISTS "Users can see who viewed them" ON recruiter_views;
CREATE POLICY "Users can see who viewed them"
  ON recruiter_views FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- SECTION 7: SAMPLE DATA (Optional)
-- ============================================

-- You can uncomment and run this to seed sample data

/*
-- Sample AI-generated tasks
INSERT INTO tasks (title, description, job_field, difficulty_level, created_by, estimated_duration, skills_required, deliverables)
VALUES
  (
    'Build REST API for E-commerce Platform',
    'Design and implement a RESTful API for an e-commerce platform that handles product listings, user authentication, shopping cart, and order processing.',
    'software_engineering',
    'intermediate',
    'ai',
    '4-6 hours',
    '["Node.js", "Express", "REST API", "JWT", "Database Design"]'::jsonb,
    '["API documentation", "Source code", "Database schema", "Postman collection"]'::jsonb
  ),
  (
    'Financial Report Analysis',
    'Analyze quarterly financial reports for a tech startup and provide insights on cash flow, burn rate, and runway recommendations.',
    'accounting',
    'advanced',
    'ai',
    '3-4 hours',
    '["Financial Analysis", "Excel", "Cash Flow Management", "Financial Modeling"]'::jsonb,
    '["Analysis report (PDF)", "Excel spreadsheet", "Executive summary"]'::jsonb
  ),
  (
    'Social Media Marketing Campaign',
    'Create a comprehensive 30-day social media marketing campaign for a new fitness app launch targeting millennials.',
    'marketing',
    'intermediate',
    'ai',
    '5-7 hours',
    '["Social Media Strategy", "Content Creation", "Analytics", "Campaign Planning"]'::jsonb,
    '["Campaign calendar", "Content templates", "KPI targets", "Budget breakdown"]'::jsonb
  );
*/

-- ============================================
-- SECTION 8: DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'Extended user profiles linked to Supabase Auth';
COMMENT ON TABLE enterprises IS 'Companies that create real-world tasks for hiring';
COMMENT ON TABLE tasks IS 'Work simulation tasks (AI or Enterprise created)';
COMMENT ON TABLE task_submissions IS 'User submissions proving their skills';
COMMENT ON TABLE meetings IS 'AI-simulated meetings for practice';
COMMENT ON TABLE enterprise_tasks IS 'Links enterprises to their specific tasks';
COMMENT ON TABLE user_task_progress IS 'Tracks user progress on tasks';
COMMENT ON TABLE recruiter_views IS 'Tracks when recruiters view user profiles';

COMMENT ON COLUMN users.skills IS 'JSON array of user skills';
COMMENT ON COLUMN tasks.deliverables IS 'JSON array of expected deliverables';
COMMENT ON COLUMN tasks.resources IS 'JSON array of supporting materials';
COMMENT ON COLUMN task_submissions.content IS 'Flexible JSON structure for submission data';
COMMENT ON COLUMN meetings.participants IS 'JSON array of AI-generated meeting participants';
COMMENT ON COLUMN meetings.action_items IS 'JSON array of action items from meeting';

-- Success message
SELECT 'Platform schema created successfully!' AS status;
