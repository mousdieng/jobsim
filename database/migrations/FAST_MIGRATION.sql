-- ============================================
-- FAST DIRECT MIGRATION
-- Description: Migrates existing schema to new enhanced task system
-- WARNING: This will DROP existing tables after backup
-- Run this in a SINGLE transaction for safety
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: BACKUP EXISTING DATA
-- ============================================

-- Create temporary backup tables
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS enterprises_backup AS SELECT * FROM enterprises;

-- Verify backup
DO $$
DECLARE
  backup_user_count INTEGER;
  backup_enterprise_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_user_count FROM users_backup;
  SELECT COUNT(*) INTO backup_enterprise_count FROM enterprises_backup;

  RAISE NOTICE '✓ Backed up % users', backup_user_count;
  RAISE NOTICE '✓ Backed up % enterprises', backup_enterprise_count;
END $$;

-- ============================================
-- STEP 2: DROP OLD TABLES
-- ============================================

DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles_metadata CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS recruiter_views CASCADE;
DROP TABLE IF EXISTS user_task_progress CASCADE;
DROP TABLE IF EXISTS enterprise_tasks CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS task_submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS simulations CASCADE;
DROP TABLE IF EXISTS enterprises CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✓ Dropped old tables';
END $$;

-- ============================================
-- STEP 3: CREATE NEW SCHEMA
-- ============================================

-- Run migration 001: Create Tables
-- (I'll inline the essential parts here for a single-script execution)

-- PROFILES (base user table)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'enterprise_rep', 'admin', 'platform_support')),
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CANDIDATE PROFILES
CREATE TABLE public.candidate_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_xp INTEGER DEFAULT 0 CHECK (overall_xp >= 0),
  overall_level INTEGER DEFAULT 1 CHECK (overall_level BETWEEN 1 AND 7),
  category_xp JSONB DEFAULT '{}'::jsonb,
  category_levels JSONB DEFAULT '{}'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  tasks_completed INTEGER DEFAULT 0,
  tasks_attempted INTEGER DEFAULT 0,
  approval_rate DECIMAL(5,2) DEFAULT 0,
  current_task_id UUID,
  bio TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  location TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  is_open_to_opportunities BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENTERPRISE REP PROFILES
CREATE TABLE public.enterprise_rep_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  job_title TEXT,
  department TEXT,
  bio TEXT,
  can_review BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  reviews_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  category TEXT NOT NULL,
  job_role TEXT NOT NULL,
  skill_tags JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  base_xp INTEGER NOT NULL,
  difficulty_multiplier DECIMAL(3,2) DEFAULT 1.0,
  estimated_time_minutes INTEGER,
  submission_config JSONB NOT NULL,
  evaluation_criteria JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBMISSIONS
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending_validation' CHECK (status IN ('pending_validation', 'validation_failed', 'awaiting_review', 'under_review', 'review_complete', 'rejected')),
  submitted_files JSONB DEFAULT '[]'::jsonb,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  xp_earned INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_attempt_number INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, task_id, attempt_number)
);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.enterprise_rep_profiles(id),
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject')),
  feedback TEXT NOT NULL CHECK (LENGTH(feedback) >= 50),
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, reviewer_id)
);

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT NOT NULL CHECK (category IN ('skill', 'consistency', 'progression')),
  criteria_description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHORTLISTS
CREATE TABLE public.shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_rep_id UUID NOT NULL REFERENCES public.enterprise_rep_profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'contacted', 'interviewing', 'offered', 'hired', 'passed')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enterprise_rep_id, candidate_id)
);

-- INTERACTIONS
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'interview_request', 'offer')),
  subject TEXT,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_candidate_profiles_current_task ON public.candidate_profiles(current_task_id);
CREATE INDEX idx_candidate_profiles_overall_xp ON public.candidate_profiles(overall_xp DESC);
CREATE INDEX idx_tasks_category ON public.tasks(category);
CREATE INDEX idx_tasks_difficulty ON public.tasks(difficulty);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_submissions_candidate ON public.submissions(candidate_id);
CREATE INDEX idx_submissions_task ON public.submissions(task_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_reviews_submission ON public.reviews(submission_id);
CREATE INDEX idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX idx_shortlists_enterprise_rep ON public.shortlists(enterprise_rep_id);
CREATE INDEX idx_shortlists_candidate ON public.shortlists(candidate_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

DO $$
BEGIN
  RAISE NOTICE '✓ Created new table structure';
END $$;

-- ============================================
-- STEP 4: CREATE FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION calculate_submission_xp(p_submission_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_base_xp INTEGER;
  v_difficulty_mult DECIMAL;
  v_attempt_number INTEGER;
  v_attempt_mult DECIMAL;
  v_total_xp INTEGER;
BEGIN
  SELECT t.base_xp, t.difficulty_multiplier, s.attempt_number
  INTO v_base_xp, v_difficulty_mult, v_attempt_number
  FROM public.submissions s
  JOIN public.tasks t ON s.task_id = t.id
  WHERE s.id = p_submission_id;

  v_attempt_mult := CASE
    WHEN v_attempt_number = 1 THEN 2.0
    WHEN v_attempt_number = 2 THEN 1.5
    WHEN v_attempt_number = 3 THEN 1.25
    WHEN v_attempt_number = 4 THEN 1.0
    ELSE 0.75
  END;

  v_total_xp := ROUND(v_base_xp * v_difficulty_mult * v_attempt_mult);
  RETURN v_total_xp;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_review_completion(p_submission_id UUID)
RETURNS VOID AS $$
DECLARE
  v_review_count INTEGER;
  v_approve_count INTEGER;
  v_is_approved BOOLEAN;
  v_xp_earned INTEGER;
  v_candidate_id UUID;
  v_task_id UUID;
  v_category TEXT;
BEGIN
  SELECT COUNT(*), SUM(CASE WHEN decision = 'approve' THEN 1 ELSE 0 END)
  INTO v_review_count, v_approve_count
  FROM public.reviews
  WHERE submission_id = p_submission_id;

  IF v_review_count = 3 THEN
    v_is_approved := (v_approve_count >= 2);

    IF v_is_approved THEN
      v_xp_earned := calculate_submission_xp(p_submission_id);
    ELSE
      v_xp_earned := 0;
    END IF;

    UPDATE public.submissions
    SET status = 'review_complete',
        is_approved = v_is_approved,
        xp_earned = v_xp_earned,
        reviewed_at = NOW()
    WHERE id = p_submission_id
    RETURNING candidate_id, task_id INTO v_candidate_id, v_task_id;

    IF v_is_approved THEN
      SELECT category INTO v_category FROM public.tasks WHERE id = v_task_id;

      UPDATE public.candidate_profiles
      SET overall_xp = overall_xp + v_xp_earned,
          category_xp = jsonb_set(
            category_xp,
            ARRAY[v_category],
            to_jsonb(COALESCE((category_xp->>v_category)::INTEGER, 0) + v_xp_earned)
          ),
          tasks_completed = tasks_completed + 1
      WHERE id = v_candidate_id;

      PERFORM update_candidate_levels(v_candidate_id);
      PERFORM check_achievements(v_candidate_id);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_candidate_levels(p_candidate_id UUID)
RETURNS VOID AS $$
DECLARE
  v_overall_xp INTEGER;
  v_overall_level INTEGER;
  v_category RECORD;
  v_category_levels JSONB := '{}'::jsonb;
BEGIN
  SELECT overall_xp INTO v_overall_xp FROM public.candidate_profiles WHERE id = p_candidate_id;

  v_overall_level := CASE
    WHEN v_overall_xp >= 10000 THEN 7
    WHEN v_overall_xp >= 7500 THEN 6
    WHEN v_overall_xp >= 5000 THEN 5
    WHEN v_overall_xp >= 3000 THEN 4
    WHEN v_overall_xp >= 1500 THEN 3
    WHEN v_overall_xp >= 500 THEN 2
    ELSE 1
  END;

  FOR v_category IN
    SELECT key AS category, value::INTEGER AS xp
    FROM jsonb_each_text((SELECT category_xp FROM public.candidate_profiles WHERE id = p_candidate_id))
  LOOP
    v_category_levels := jsonb_set(
      v_category_levels,
      ARRAY[v_category.category],
      to_jsonb(CASE
        WHEN v_category.xp >= 5000 THEN 5
        WHEN v_category.xp >= 3000 THEN 4
        WHEN v_category.xp >= 1500 THEN 3
        WHEN v_category.xp >= 500 THEN 2
        ELSE 1
      END)
    );
  END LOOP;

  UPDATE public.candidate_profiles
  SET overall_level = v_overall_level,
      category_levels = v_category_levels
  WHERE id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_achievements(p_candidate_id UUID)
RETURNS VOID AS $$
DECLARE
  v_achievements JSONB;
  v_tasks_completed INTEGER;
  v_approval_rate DECIMAL;
BEGIN
  SELECT achievements, tasks_completed, approval_rate
  INTO v_achievements, v_tasks_completed, v_approval_rate
  FROM public.candidate_profiles
  WHERE id = p_candidate_id;

  IF NOT v_achievements ? 'first_perfect' THEN
    IF EXISTS (
      SELECT 1 FROM public.submissions
      WHERE candidate_id = p_candidate_id
      AND is_approved = TRUE
      AND attempt_number = 1
    ) THEN
      v_achievements := v_achievements || '["first_perfect"]'::jsonb;
    END IF;
  END IF;

  IF NOT v_achievements ? 'sharpshooter' THEN
    IF v_tasks_completed >= 10 AND v_approval_rate >= 90 THEN
      v_achievements := v_achievements || '["sharpshooter"]'::jsonb;
    END IF;
  END IF;

  UPDATE public.candidate_profiles
  SET achievements = v_achievements
  WHERE id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✓ Created database functions';
END $$;

-- ============================================
-- STEP 5: CREATE TRIGGERS
-- ============================================

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_candidate_profiles_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_enterprise_rep_profiles_updated_at
  BEFORE UPDATE ON public.enterprise_rep_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_shortlists_updated_at
  BEFORE UPDATE ON public.shortlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION trigger_review_completion()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM process_review_completion(NEW.submission_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_review_completion();

DO $$
BEGIN
  RAISE NOTICE '✓ Created triggers';
END $$;

-- ============================================
-- STEP 6: MIGRATE DATA
-- ============================================

-- Migrate users to new structure
INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
SELECT
  id,
  email,
  name,  -- Changed from full_name to name
  CASE
    WHEN user_type IN ('student', 'candidate') THEN 'candidate'
    WHEN user_type = 'enterprise' THEN 'enterprise_rep'
    WHEN user_type IN ('admin', 'super_admin') THEN 'admin'
    WHEN user_type IN ('mentor', 'support', 'platform_support') THEN 'platform_support'
    ELSE 'candidate'
  END,
  TRUE,
  created_at,
  updated_at
FROM users_backup;

-- Migrate candidates
INSERT INTO public.candidate_profiles (
  id, overall_xp, overall_level, tasks_completed, created_at, updated_at
)
SELECT
  id,
  COALESCE(score_total, 0),
  CASE
    WHEN COALESCE(score_total, 0) >= 10000 THEN 7
    WHEN COALESCE(score_total, 0) >= 7500 THEN 6
    WHEN COALESCE(score_total, 0) >= 5000 THEN 5
    WHEN COALESCE(score_total, 0) >= 3000 THEN 4
    WHEN COALESCE(score_total, 0) >= 1500 THEN 3
    WHEN COALESCE(score_total, 0) >= 500 THEN 2
    ELSE 1
  END,
  COALESCE(completed_count, 0),
  created_at,
  updated_at
FROM users_backup
WHERE user_type IN ('student', 'candidate');

-- Migrate companies
INSERT INTO public.companies (id, name, industry, size, description, website_url, is_active, created_at, updated_at)
SELECT
  id,
  name,
  sector,  -- Map sector to industry
  CASE
    WHEN LOWER(size) IN ('startup', 'small', 'medium', 'large', 'enterprise') THEN LOWER(size)
    ELSE 'medium'  -- Default fallback
  END,
  description,
  website,
  CASE WHEN status = 'active' THEN TRUE ELSE FALSE END,  -- Map status to is_active
  created_at,
  updated_at
FROM enterprises_backup;

-- Migrate enterprise reps
INSERT INTO public.enterprise_rep_profiles (id, company_id, job_title, created_at, updated_at)
SELECT
  u.id,
  e.id,
  'Representative',
  u.created_at,
  u.updated_at
FROM users_backup u
JOIN enterprises_backup e ON e.admin_user_id = u.id
WHERE u.user_type = 'enterprise';

DO $$
BEGIN
  RAISE NOTICE '✓ Migrated user data';
END $$;

-- ============================================
-- STEP 7: SEED ACHIEVEMENTS
-- ============================================

INSERT INTO public.achievements (id, name, description, icon, category, criteria_description) VALUES
  ('first_perfect', 'First Perfect', 'Pass a task on your first attempt', '🏆', 'skill', 'Complete and get approved on first submission'),
  ('speed_demon', 'Speed Demon', 'Complete 5 tasks under estimated time', '⚡', 'consistency', 'Complete 5 tasks faster than the estimated time'),
  ('sharpshooter', 'Sharpshooter', 'Maintain 90%+ approval rate with 10+ tasks', '🎯', 'skill', 'Have at least 10 tasks with 90% or higher approval rate'),
  ('consistent', 'Consistent', 'Get 10 tasks approved in a row', '🌟', 'consistency', 'Achieve 10 consecutive task approvals without rejection'),
  ('specialist', 'Specialist', 'Reach Level 5 in any category', '🎓', 'progression', 'Reach Level 5 or higher in any single task category'),
  ('renaissance', 'Renaissance', 'Reach Level 3+ in 3+ categories', '🌈', 'progression', 'Reach Level 3 or higher in three different categories'),
  ('elite', 'Elite', 'Reach the maximum overall Level 7', '👑', 'progression', 'Reach Level 7 overall - the highest level possible');

DO $$
BEGIN
  RAISE NOTICE '✓ Seeded achievements';
END $$;

-- ============================================
-- STEP 8: ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_rep_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- CANDIDATE PROFILES POLICIES
CREATE POLICY "Candidates can read own profile"
  ON public.candidate_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Candidates can update own profile"
  ON public.candidate_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enterprise reps can read candidate profiles"
  ON public.candidate_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('enterprise_rep', 'admin', 'platform_support')
    )
  );

-- COMPANIES POLICIES
CREATE POLICY "Anyone can read active companies"
  ON public.companies FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ENTERPRISE REP PROFILES POLICIES
CREATE POLICY "Reps can read own profile"
  ON public.enterprise_rep_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Reps can update own profile"
  ON public.enterprise_rep_profiles FOR UPDATE
  USING (auth.uid() = id);

-- TASKS POLICIES
CREATE POLICY "Anyone can read active tasks"
  ON public.tasks FOR SELECT
  USING (status = 'active' OR auth.uid() = created_by);

CREATE POLICY "Admins can manage tasks"
  ON public.tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- SUBMISSIONS POLICIES
CREATE POLICY "Candidates can read own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can create own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update own draft submissions"
  ON public.submissions FOR UPDATE
  USING (
    auth.uid() = candidate_id
    AND status = 'pending_validation'
  );

CREATE POLICY "Admins can read all submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'platform_support')
    )
  );

-- REVIEWS POLICIES
CREATE POLICY "Reviewers can read own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND
    EXISTS (
      SELECT 1 FROM public.enterprise_rep_profiles
      WHERE id = auth.uid()
      AND is_active = TRUE
    )
  );

-- ACHIEVEMENTS POLICIES
CREATE POLICY "Anyone can read achievements"
  ON public.achievements FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- SHORTLISTS POLICIES
CREATE POLICY "Reps can manage own shortlist"
  ON public.shortlists FOR ALL
  USING (auth.uid() = enterprise_rep_id)
  WITH CHECK (auth.uid() = enterprise_rep_id);

-- INTERACTIONS POLICIES
CREATE POLICY "Users can read own interactions"
  ON public.interactions FOR SELECT
  USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can create interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

-- ACTIVITY LOGS POLICIES
CREATE POLICY "Admins can read activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "System can create activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (TRUE);

DO $$
BEGIN
  RAISE NOTICE '✓ Enabled RLS and created policies';
END $$;

-- ============================================
-- STEP 9: VERIFICATION
-- ============================================

DO $$
DECLARE
  v_profiles_count INTEGER;
  v_candidates_count INTEGER;
  v_reps_count INTEGER;
  v_companies_count INTEGER;
  v_achievements_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO v_candidates_count FROM public.candidate_profiles;
  SELECT COUNT(*) INTO v_reps_count FROM public.enterprise_rep_profiles;
  SELECT COUNT(*) INTO v_companies_count FROM public.companies;
  SELECT COUNT(*) INTO v_achievements_count FROM public.achievements;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migrated Data:';
  RAISE NOTICE '  - % profiles', v_profiles_count;
  RAISE NOTICE '  - % candidate profiles', v_candidates_count;
  RAISE NOTICE '  - % enterprise rep profiles', v_reps_count;
  RAISE NOTICE '  - % companies', v_companies_count;
  RAISE NOTICE '  - % achievements', v_achievements_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Backup tables preserved:';
  RAISE NOTICE '  - users_backup';
  RAISE NOTICE '  - enterprises_backup';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create storage buckets in Supabase UI';
  RAISE NOTICE '  2. Run storage policies migration';
  RAISE NOTICE '  3. Test authentication';
  RAISE NOTICE '  4. Create sample tasks';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
