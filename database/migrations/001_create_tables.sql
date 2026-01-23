-- ============================================
-- Migration 001: Create Core Tables
-- Description: Creates all base tables for the platform
-- Run this first!
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES & USER DATA
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'platform_support', 'enterprise_rep', 'candidate')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================
-- CANDIDATE PROFILES
-- ============================================

CREATE TABLE public.candidate_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Location & Availability
  location TEXT,
  remote_ok BOOLEAN DEFAULT FALSE,
  availability_status TEXT DEFAULT 'actively_looking'
    CHECK (availability_status IN ('actively_looking', 'open', 'not_looking')),

  -- Experience
  years_of_experience INTEGER,
  bio TEXT,
  skills JSONB DEFAULT '[]'::jsonb,

  -- XP & Progression
  overall_xp INTEGER DEFAULT 0,
  overall_level INTEGER DEFAULT 1,
  category_xp JSONB DEFAULT '{}'::jsonb,
  category_levels JSONB DEFAULT '{}'::jsonb,

  -- Stats
  tasks_completed INTEGER DEFAULT 0,
  tasks_approved INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,

  -- Achievements
  achievements JSONB DEFAULT '[]'::jsonb,

  -- Privacy Settings
  contact_email TEXT,
  contact_phone TEXT,
  linkedin_url TEXT,
  allow_direct_contact BOOLEAN DEFAULT FALSE,

  -- Current State
  current_task_id UUID,
  current_task_enrolled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidate_profiles_overall_xp ON public.candidate_profiles(overall_xp DESC);
CREATE INDEX idx_candidate_profiles_overall_level ON public.candidate_profiles(overall_level DESC);
CREATE INDEX idx_candidate_profiles_location ON public.candidate_profiles(location);
CREATE INDEX idx_candidate_profiles_availability ON public.candidate_profiles(availability_status);

-- ============================================
-- COMPANIES
-- ============================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  website TEXT,
  logo_url TEXT,
  description TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_active ON public.companies(is_active) WHERE is_active = TRUE;

-- ============================================
-- ENTERPRISE REP PROFILES
-- ============================================

CREATE TABLE public.enterprise_rep_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  job_title TEXT,
  department TEXT,

  -- Reviewer Stats
  total_reviews INTEGER DEFAULT 0,
  avg_review_time_hours DECIMAL(10,2),
  reviewer_rating DECIMAL(3,2) DEFAULT 5.0,
  helpful_review_count INTEGER DEFAULT 0,

  -- Preferences
  focus_categories JSONB DEFAULT '[]'::jsonb,
  notification_preferences JSONB DEFAULT '{}'::jsonb,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enterprise_rep_profiles_company ON public.enterprise_rep_profiles(company_id);
CREATE INDEX idx_enterprise_rep_profiles_active ON public.enterprise_rep_profiles(is_active)
  WHERE is_active = TRUE;

-- ============================================
-- TASKS
-- ============================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,

  category TEXT NOT NULL,
  job_role TEXT,
  skill_tags JSONB DEFAULT '[]'::jsonb,

  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  base_xp INTEGER NOT NULL,
  difficulty_multiplier DECIMAL(3,2) DEFAULT 1.0,
  estimated_time_minutes INTEGER,

  submission_config JSONB NOT NULL,
  evaluation_criteria JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,

  created_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),

  total_attempts INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  avg_completion_time_minutes INTEGER,
  avg_xp_earned INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_category ON public.tasks(category) WHERE status = 'active';
CREATE INDEX idx_tasks_difficulty ON public.tasks(difficulty) WHERE status = 'active';
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);

-- Add foreign key after tasks table is created
ALTER TABLE public.candidate_profiles
  ADD CONSTRAINT fk_candidate_current_task
  FOREIGN KEY (current_task_id) REFERENCES public.tasks(id);

-- ============================================
-- SUBMISSIONS
-- ============================================

CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,

  is_approved BOOLEAN,
  approved_attempt_number INTEGER,
  total_submission_number INTEGER NOT NULL,

  submitted_files JSONB NOT NULL,
  candidate_notes TEXT,

  status TEXT NOT NULL DEFAULT 'pending_validation'
    CHECK (status IN ('pending_validation', 'validation_failed', 'under_review', 'review_complete', 'flagged')),

  validation_errors JSONB,
  validation_passed_at TIMESTAMPTZ,

  xp_earned INTEGER DEFAULT 0,
  xp_calculation JSONB,
  is_best_score BOOLEAN DEFAULT FALSE,

  required_reviews INTEGER DEFAULT 3,
  reviews_completed INTEGER DEFAULT 0,
  reviews_approved INTEGER DEFAULT 0,
  reviews_rejected INTEGER DEFAULT 0,
  review_closed_at TIMESTAMPTZ,

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_candidate ON public.submissions(candidate_id);
CREATE INDEX idx_submissions_task ON public.submissions(task_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_under_review ON public.submissions(status)
  WHERE status = 'under_review';
CREATE INDEX idx_submissions_candidate_task ON public.submissions(candidate_id, task_id);

CREATE UNIQUE INDEX idx_one_active_submission_per_candidate
  ON public.submissions(candidate_id)
  WHERE status IN ('pending_validation', 'under_review');

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.enterprise_rep_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),

  decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject')),
  feedback TEXT NOT NULL,
  feedback_word_count INTEGER,

  interest_level TEXT DEFAULT 'pass'
    CHECK (interest_level IN ('shortlist', 'exceptional', 'contact_request', 'pass')),

  was_helpful_vote BOOLEAN,
  review_time_minutes INTEGER,

  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_submission ON public.reviews(submission_id);
CREATE INDEX idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_company ON public.reviews(company_id);
CREATE INDEX idx_reviews_reviewed_at ON public.reviews(reviewed_at DESC);

CREATE UNIQUE INDEX idx_one_review_per_reviewer_per_submission
  ON public.reviews(submission_id, reviewer_id);

-- ============================================
-- SHORTLISTS
-- ============================================

CREATE TABLE public.shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  enterprise_rep_id UUID NOT NULL REFERENCES public.enterprise_rep_profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,

  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,

  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'interviewed', 'hired', 'passed', 'removed')),

  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shortlists_rep ON public.shortlists(enterprise_rep_id);
CREATE INDEX idx_shortlists_candidate ON public.shortlists(candidate_id);
CREATE INDEX idx_shortlists_status ON public.shortlists(status);

CREATE UNIQUE INDEX idx_one_shortlist_per_rep_per_candidate
  ON public.shortlists(enterprise_rep_id, candidate_id);

-- ============================================
-- INTERACTIONS
-- ============================================

CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  type TEXT NOT NULL CHECK (type IN ('message', 'interview_request', 'contact_request')),

  from_user_id UUID NOT NULL REFERENCES public.profiles(id),
  to_user_id UUID NOT NULL REFERENCES public.profiles(id),

  subject TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

  thread_id UUID REFERENCES public.interactions(id),
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_from ON public.interactions(from_user_id);
CREATE INDEX idx_interactions_to ON public.interactions(to_user_id);
CREATE INDEX idx_interactions_thread ON public.interactions(thread_id);
CREATE INDEX idx_interactions_unread ON public.interactions(to_user_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_interactions_type ON public.interactions(type);

-- ============================================
-- ACHIEVEMENTS
-- ============================================

CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  criteria_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================
-- ACTIVITY LOGS
-- ============================================

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,

  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_resource ON public.activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

  RAISE NOTICE 'Created % tables successfully', table_count;
END $$;
