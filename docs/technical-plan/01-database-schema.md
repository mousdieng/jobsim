# Database Schema

Complete PostgreSQL database schema for the Job Simulation Platform using Supabase.

---

## Overview

This schema supports:
- 4-role system (Admin, Platform Support, Enterprise Rep, Candidate)
- Flexible task creation with dynamic submission requirements
- XP-based gamification system
- Review workflow with 3 reviewers
- Enterprise talent discovery and recruitment
- Messaging and notifications

---

## Core Tables

### Users & Authentication

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Base users table (Supabase Auth handles this)
-- Extended with profiles

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
```

---

### Candidate Profiles

```sql
-- ============================================
-- CANDIDATE-SPECIFIC DATA
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
  skills JSONB DEFAULT '[]'::jsonb, -- Array of skill tags

  -- XP & Progression
  overall_xp INTEGER DEFAULT 0,
  overall_level INTEGER DEFAULT 1,
  category_xp JSONB DEFAULT '{}'::jsonb, -- {marketing: 6200, sales: 3100}
  category_levels JSONB DEFAULT '{}'::jsonb, -- {marketing: 4, sales: 3}

  -- Stats
  tasks_completed INTEGER DEFAULT 0,
  tasks_approved INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,

  -- Achievements
  achievements JSONB DEFAULT '[]'::jsonb, -- Array of achievement IDs

  -- Privacy Settings
  contact_email TEXT,
  contact_phone TEXT,
  linkedin_url TEXT,
  allow_direct_contact BOOLEAN DEFAULT FALSE,

  -- Current State
  current_task_id UUID REFERENCES public.tasks(id),
  current_task_enrolled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidate_profiles_overall_xp ON public.candidate_profiles(overall_xp DESC);
CREATE INDEX idx_candidate_profiles_overall_level ON public.candidate_profiles(overall_level DESC);
CREATE INDEX idx_candidate_profiles_location ON public.candidate_profiles(location);
CREATE INDEX idx_candidate_profiles_availability ON public.candidate_profiles(availability_status);
```

---

### Enterprise Data

```sql
-- ============================================
-- ENTERPRISE DATA
-- ============================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  website TEXT,
  logo_url TEXT,
  description TEXT,

  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_active ON public.companies(is_active) WHERE is_active = TRUE;

CREATE TABLE public.enterprise_rep_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  job_title TEXT,
  department TEXT,

  -- Reviewer Stats
  total_reviews INTEGER DEFAULT 0,
  avg_review_time_hours DECIMAL(10,2),
  reviewer_rating DECIMAL(3,2) DEFAULT 5.0, -- Based on candidate feedback
  helpful_review_count INTEGER DEFAULT 0,

  -- Preferences
  focus_categories JSONB DEFAULT '[]'::jsonb, -- [marketing, sales]
  notification_preferences JSONB DEFAULT '{}'::jsonb,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enterprise_rep_profiles_company ON public.enterprise_rep_profiles(company_id);
CREATE INDEX idx_enterprise_rep_profiles_active ON public.enterprise_rep_profiles(is_active) WHERE is_active = TRUE;
```

---

### Tasks

```sql
-- ============================================
-- TASKS
-- ============================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL, -- Rich text/markdown

  -- Categorization
  category TEXT NOT NULL, -- marketing, sales, design, etc.
  job_role TEXT, -- Marketing Manager, Sales Lead, etc.
  skill_tags JSONB DEFAULT '[]'::jsonb, -- [strategy, analytics, b2b]

  -- Difficulty & Scoring
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  base_xp INTEGER NOT NULL, -- 100, 250, 500, 1000
  difficulty_multiplier DECIMAL(3,2) DEFAULT 1.0, -- 1.0 to 3.0
  estimated_time_minutes INTEGER, -- For display purposes

  -- Submission Requirements (Dynamic)
  submission_config JSONB NOT NULL,
  /* Example:
  {
    "required_files": [
      {
        "label": "Strategy Document",
        "type": "document",
        "allowed_formats": ["pdf", "docx"],
        "max_size_mb": 10,
        "description": "Your marketing strategy document"
      },
      {
        "label": "Creative Mockups",
        "type": "images",
        "allowed_formats": ["png", "jpg", "pdf"],
        "max_size_mb": 5,
        "max_files": 5
      }
    ],
    "optional_files": [...]
  }
  */

  -- Evaluation Criteria
  evaluation_criteria JSONB DEFAULT '[]'::jsonb,
  /* Example:
  [
    "Clear target audience definition",
    "Realistic budget & timeline",
    "Measurable KPIs defined"
  ]
  */

  -- Attachments (provided to candidates)
  attachments JSONB DEFAULT '[]'::jsonb,
  /* Example:
  [
    {"name": "brand_guidelines.pdf", "url": "...", "size": 1024000},
    {"name": "dataset.csv", "url": "...", "size": 2048000}
  ]
  */

  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),

  -- Stats
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
```

---

### Submissions

```sql
-- ============================================
-- SUBMISSIONS
-- ============================================

CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,

  -- Attempt Tracking
  is_approved BOOLEAN, -- NULL = pending, TRUE = approved, FALSE = rejected
  approved_attempt_number INTEGER, -- Only set if approved (1-5)
  total_submission_number INTEGER NOT NULL, -- Includes rejections

  -- Files
  submitted_files JSONB NOT NULL,
  /* Example:
  [
    {
      "field": "strategy_document",
      "filename": "my_strategy.pdf",
      "storage_path": "submissions/uuid/strategy_document.pdf",
      "size": 1024000,
      "mime_type": "application/pdf"
    }
  ]
  */

  -- Candidate Notes (optional)
  candidate_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending_validation'
    CHECK (status IN (
      'pending_validation',
      'validation_failed',
      'under_review',
      'review_complete',
      'flagged'
    )),

  -- Validation
  validation_errors JSONB, -- If validation failed
  validation_passed_at TIMESTAMPTZ,

  -- XP (calculated after review)
  xp_earned INTEGER DEFAULT 0,
  xp_calculation JSONB, -- Store breakdown for transparency
  /* Example:
  {
    "base_xp": 250,
    "difficulty_multiplier": 2.0,
    "attempt_multiplier": 1.5,
    "bonuses": [{"type": "first_try_perfect", "multiplier": 1.25}],
    "total": 750
  }
  */

  is_best_score BOOLEAN DEFAULT FALSE, -- Only one per task per candidate

  -- Review Tracking
  required_reviews INTEGER DEFAULT 3,
  reviews_completed INTEGER DEFAULT 0,
  reviews_approved INTEGER DEFAULT 0,
  reviews_rejected INTEGER DEFAULT 0,
  review_closed_at TIMESTAMPTZ,

  -- Timestamps
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

-- Constraint: Only one "in progress" submission per candidate
CREATE UNIQUE INDEX idx_one_active_submission_per_candidate
  ON public.submissions(candidate_id)
  WHERE status IN ('pending_validation', 'under_review');
```

---

### Reviews

```sql
-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.enterprise_rep_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),

  -- Review Decision
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject')),

  -- Feedback (required)
  feedback TEXT NOT NULL,
  feedback_word_count INTEGER,

  -- Interest Level
  interest_level TEXT DEFAULT 'pass'
    CHECK (interest_level IN ('shortlist', 'exceptional', 'contact_request', 'pass')),

  -- Quality Metrics
  was_helpful_vote BOOLEAN, -- Candidate can vote if feedback was helpful
  review_time_minutes INTEGER, -- Time spent reviewing

  -- Timestamps
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_submission ON public.reviews(submission_id);
CREATE INDEX idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_company ON public.reviews(company_id);
CREATE INDEX idx_reviews_reviewed_at ON public.reviews(reviewed_at DESC);

-- Constraint: One review per reviewer per submission
CREATE UNIQUE INDEX idx_one_review_per_reviewer_per_submission
  ON public.reviews(submission_id, reviewer_id);
```

---

### Shortlists

```sql
-- ============================================
-- SHORTLISTS
-- ============================================

CREATE TABLE public.shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  enterprise_rep_id UUID NOT NULL REFERENCES public.enterprise_rep_profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,

  -- Organization
  tags JSONB DEFAULT '[]'::jsonb, -- [top_choice, interview_scheduled]
  notes TEXT,

  -- Status
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'interviewed', 'hired', 'passed', 'removed')),

  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shortlists_rep ON public.shortlists(enterprise_rep_id);
CREATE INDEX idx_shortlists_candidate ON public.shortlists(candidate_id);
CREATE INDEX idx_shortlists_status ON public.shortlists(status);

-- Constraint: One entry per rep per candidate
CREATE UNIQUE INDEX idx_one_shortlist_per_rep_per_candidate
  ON public.shortlists(enterprise_rep_id, candidate_id);
```

---

### Interactions

```sql
-- ============================================
-- INTERACTIONS (Messages, Requests)
-- ============================================

CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  type TEXT NOT NULL CHECK (type IN (
    'message',
    'interview_request',
    'contact_request'
  )),

  from_user_id UUID NOT NULL REFERENCES public.profiles(id),
  to_user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- Content
  subject TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  /* Example for interview_request:
  {
    "position": "Marketing Manager",
    "interview_type": "video_call",
    "proposed_times": [...]
  }
  */

  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

  -- Thread (for message replies)
  thread_id UUID REFERENCES public.interactions(id),

  -- Read Status
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
```

---

### Achievements

```sql
-- ============================================
-- ACHIEVEMENTS
-- ============================================

CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY, -- e.g., 'first_perfect', 'speed_demon'

  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- Emoji or icon identifier
  category TEXT, -- progression, skill, consistency

  -- Unlock Criteria (for display)
  criteria_description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed achievements
INSERT INTO public.achievements (id, name, description, icon, category, criteria_description) VALUES
  ('first_perfect', 'First Perfect', 'Pass a task on your first attempt', '🏆', 'skill', 'Complete a task with approval on first submission'),
  ('speed_demon', 'Speed Demon', 'Complete 5 tasks under estimated time', '⚡', 'consistency', 'Complete 5 tasks faster than estimated time'),
  ('sharpshooter', 'Sharpshooter', '90%+ approval rate (min 10 tasks)', '🎯', 'skill', 'Maintain 90% or higher approval rate with at least 10 tasks'),
  ('consistent', 'Consistent', '10 tasks in a row approved', '🌟', 'consistency', 'Get 10 consecutive task approvals'),
  ('specialist', 'Specialist', 'Reach Level 5 in one category', '🎓', 'progression', 'Reach Level 5 or higher in any task category'),
  ('renaissance', 'Renaissance', 'Level 3+ in 3+ categories', '🌈', 'progression', 'Reach Level 3 or higher in three different categories'),
  ('elite', 'Elite', 'Reach Level 7 overall', '👑', 'progression', 'Reach the maximum overall level of 7');
```

---

### Notifications

```sql
-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  type TEXT NOT NULL, -- submission_reviewed, review_assigned, message_received, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Link/Action
  action_url TEXT,
  action_label TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Status
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
```

---

### Activity Logs

```sql
-- ============================================
-- ANALYTICS / AUDIT LOGS
-- ============================================

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT, -- task, submission, review, etc.
  resource_id UUID,

  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_resource ON public.activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
```

---

## Database Functions

### XP Calculation

```sql
-- ============================================
-- SUBMISSION & XP CALCULATION
-- ============================================

-- Calculate XP for approved submission
CREATE OR REPLACE FUNCTION calculate_submission_xp(
  p_submission_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_base_xp INTEGER;
  v_difficulty_mult DECIMAL;
  v_attempt_number INTEGER;
  v_attempt_mult DECIMAL;
  v_total_xp INTEGER;
BEGIN
  -- Get task XP and attempt number
  SELECT
    t.base_xp,
    t.difficulty_multiplier,
    s.approved_attempt_number
  INTO v_base_xp, v_difficulty_mult, v_attempt_number
  FROM submissions s
  JOIN tasks t ON s.task_id = t.id
  WHERE s.id = p_submission_id;

  -- Calculate attempt multiplier
  v_attempt_mult := CASE
    WHEN v_attempt_number = 1 THEN 2.0
    WHEN v_attempt_number = 2 THEN 1.5
    WHEN v_attempt_number = 3 THEN 1.25
    WHEN v_attempt_number = 4 THEN 1.0
    ELSE 0.75
  END;

  -- Calculate total
  v_total_xp := ROUND(v_base_xp * v_difficulty_mult * v_attempt_mult);

  -- Update submission
  UPDATE submissions
  SET xp_earned = v_total_xp,
      xp_calculation = jsonb_build_object(
        'base_xp', v_base_xp,
        'difficulty_multiplier', v_difficulty_mult,
        'attempt_multiplier', v_attempt_mult,
        'total', v_total_xp
      )
  WHERE id = p_submission_id;

  RETURN v_total_xp;
END;
$$ LANGUAGE plpgsql;
```

### Review Completion

```sql
-- ============================================
-- REVIEW COMPLETION & APPROVAL
-- ============================================

-- Called after each review is submitted
CREATE OR REPLACE FUNCTION process_review_completion(
  p_submission_id UUID
) RETURNS VOID AS $$
DECLARE
  v_reviews_completed INTEGER;
  v_reviews_approved INTEGER;
  v_is_approved BOOLEAN;
  v_candidate_id UUID;
  v_task_id UUID;
  v_task_category TEXT;
  v_xp_earned INTEGER;
  v_current_attempt INTEGER;
BEGIN
  -- Count reviews
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE decision = 'approve')
  INTO v_reviews_completed, v_reviews_approved
  FROM reviews
  WHERE submission_id = p_submission_id;

  -- If we have 3 reviews, close the review period
  IF v_reviews_completed >= 3 THEN
    v_is_approved := (v_reviews_approved >= 2); -- 2/3 majority

    -- Get submission details
    SELECT candidate_id, task_id INTO v_candidate_id, v_task_id
    FROM submissions WHERE id = p_submission_id;

    IF v_is_approved THEN
      -- Count approved attempts for this task
      SELECT COUNT(*) + 1 INTO v_current_attempt
      FROM submissions
      WHERE candidate_id = v_candidate_id
        AND task_id = v_task_id
        AND is_approved = TRUE;

      -- Update submission as approved
      UPDATE submissions
      SET
        status = 'review_complete',
        is_approved = TRUE,
        approved_attempt_number = v_current_attempt,
        reviews_completed = v_reviews_completed,
        reviews_approved = v_reviews_approved,
        review_closed_at = NOW()
      WHERE id = p_submission_id;

      -- Calculate XP
      v_xp_earned := calculate_submission_xp(p_submission_id);

      -- Update candidate XP
      SELECT category INTO v_task_category FROM tasks WHERE id = v_task_id;

      UPDATE candidate_profiles
      SET
        overall_xp = overall_xp + v_xp_earned,
        category_xp = jsonb_set(
          COALESCE(category_xp, '{}'::jsonb),
          ARRAY[v_task_category],
          to_jsonb(COALESCE((category_xp->>v_task_category)::INTEGER, 0) + v_xp_earned)
        ),
        tasks_approved = tasks_approved + 1
      WHERE id = v_candidate_id;

      -- Check if this is the best score
      PERFORM update_best_score(p_submission_id);

      -- Update levels
      PERFORM update_candidate_levels(v_candidate_id);

      -- Check achievements
      PERFORM check_achievements(v_candidate_id);

      -- Unlock candidate from task
      UPDATE candidate_profiles
      SET current_task_id = NULL, current_task_enrolled_at = NULL
      WHERE id = v_candidate_id;

    ELSE
      -- Rejected - no XP, no attempt count
      UPDATE submissions
      SET
        status = 'review_complete',
        is_approved = FALSE,
        reviews_completed = v_reviews_completed,
        reviews_rejected = 3 - v_reviews_approved,
        review_closed_at = NOW()
      WHERE id = p_submission_id;

      -- Unlock candidate so they can resubmit
      UPDATE candidate_profiles
      SET current_task_id = NULL, current_task_enrolled_at = NULL
      WHERE id = v_candidate_id;
    END IF;

    -- Send notification to candidate
    INSERT INTO notifications (user_id, type, title, message, action_url)
    VALUES (
      v_candidate_id,
      'submission_reviewed',
      CASE WHEN v_is_approved THEN 'Submission Approved!' ELSE 'Submission Needs Work' END,
      CASE
        WHEN v_is_approved THEN 'Congratulations! You earned ' || v_xp_earned || ' XP.'
        ELSE 'Your submission was not approved. Review feedback and try again!'
      END,
      '/submissions/' || p_submission_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Level Calculation

```sql
-- ============================================
-- LEVEL CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION update_candidate_levels(
  p_candidate_id UUID
) RETURNS VOID AS $$
DECLARE
  v_overall_xp INTEGER;
  v_new_level INTEGER;
  v_category RECORD;
BEGIN
  -- Get overall XP
  SELECT overall_xp INTO v_overall_xp FROM candidate_profiles WHERE id = p_candidate_id;

  -- Calculate overall level (thresholds: 500, 2000, 5000, 10000, 17500, 27500)
  v_new_level := CASE
    WHEN v_overall_xp >= 27500 THEN 7
    WHEN v_overall_xp >= 17500 THEN 6
    WHEN v_overall_xp >= 10000 THEN 5
    WHEN v_overall_xp >= 5000 THEN 4
    WHEN v_overall_xp >= 2000 THEN 3
    WHEN v_overall_xp >= 500 THEN 2
    ELSE 1
  END;

  UPDATE candidate_profiles SET overall_level = v_new_level WHERE id = p_candidate_id;

  -- Calculate category levels
  FOR v_category IN
    SELECT key AS category, value::INTEGER AS xp
    FROM candidate_profiles, jsonb_each_text(category_xp)
    WHERE id = p_candidate_id
  LOOP
    v_new_level := CASE
      WHEN v_category.xp >= 27500 THEN 7
      WHEN v_category.xp >= 17500 THEN 6
      WHEN v_category.xp >= 10000 THEN 5
      WHEN v_category.xp >= 5000 THEN 4
      WHEN v_category.xp >= 2000 THEN 3
      WHEN v_category.xp >= 500 THEN 2
      ELSE 1
    END;

    UPDATE candidate_profiles
    SET category_levels = jsonb_set(
      COALESCE(category_levels, '{}'::jsonb),
      ARRAY[v_category.category],
      to_jsonb(v_new_level)
    )
    WHERE id = p_candidate_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Best Score Update

```sql
-- ============================================
-- UPDATE BEST SCORE
-- ============================================

CREATE OR REPLACE FUNCTION update_best_score(
  p_submission_id UUID
) RETURNS VOID AS $$
DECLARE
  v_candidate_id UUID;
  v_task_id UUID;
  v_new_xp INTEGER;
  v_current_best_xp INTEGER;
BEGIN
  -- Get submission details
  SELECT candidate_id, task_id, xp_earned
  INTO v_candidate_id, v_task_id, v_new_xp
  FROM submissions
  WHERE id = p_submission_id;

  -- Get current best XP for this task
  SELECT COALESCE(MAX(xp_earned), 0)
  INTO v_current_best_xp
  FROM submissions
  WHERE candidate_id = v_candidate_id
    AND task_id = v_task_id
    AND is_approved = TRUE
    AND id != p_submission_id;

  -- If new submission is better, update flags
  IF v_new_xp > v_current_best_xp THEN
    -- Remove best_score flag from previous best
    UPDATE submissions
    SET is_best_score = FALSE
    WHERE candidate_id = v_candidate_id
      AND task_id = v_task_id
      AND is_best_score = TRUE;

    -- Set new best
    UPDATE submissions
    SET is_best_score = TRUE
    WHERE id = p_submission_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Achievement Checker

```sql
-- ============================================
-- CHECK ACHIEVEMENTS
-- ============================================

CREATE OR REPLACE FUNCTION check_achievements(
  p_candidate_id UUID
) RETURNS VOID AS $$
DECLARE
  v_profile RECORD;
  v_new_achievements TEXT[] := ARRAY[]::TEXT[];
  v_current_achievements JSONB;
BEGIN
  -- Get candidate profile
  SELECT * INTO v_profile FROM candidate_profiles WHERE id = p_candidate_id;
  v_current_achievements := v_profile.achievements;

  -- First Perfect: Pass a task on first attempt
  IF NOT v_current_achievements ? 'first_perfect' THEN
    IF EXISTS (
      SELECT 1 FROM submissions
      WHERE candidate_id = p_candidate_id
        AND is_approved = TRUE
        AND approved_attempt_number = 1
    ) THEN
      v_new_achievements := array_append(v_new_achievements, 'first_perfect');
    END IF;
  END IF;

  -- Consistent: 10 tasks in a row approved
  IF NOT v_current_achievements ? 'consistent' THEN
    IF v_profile.current_streak >= 10 THEN
      v_new_achievements := array_append(v_new_achievements, 'consistent');
    END IF;
  END IF;

  -- Sharpshooter: 90%+ approval rate (min 10 tasks)
  IF NOT v_current_achievements ? 'sharpshooter' THEN
    IF v_profile.tasks_completed >= 10 THEN
      IF v_profile.tasks_approved::DECIMAL / v_profile.tasks_completed >= 0.9 THEN
        v_new_achievements := array_append(v_new_achievements, 'sharpshooter');
      END IF;
    END IF;
  END IF;

  -- Specialist: Reach Level 5 in one category
  IF NOT v_current_achievements ? 'specialist' THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_each_text(v_profile.category_levels)
      WHERE value::INTEGER >= 5
    ) THEN
      v_new_achievements := array_append(v_new_achievements, 'specialist');
    END IF;
  END IF;

  -- Renaissance: Level 3+ in 3+ categories
  IF NOT v_current_achievements ? 'renaissance' THEN
    IF (
      SELECT COUNT(*)
      FROM jsonb_each_text(v_profile.category_levels)
      WHERE value::INTEGER >= 3
    ) >= 3 THEN
      v_new_achievements := array_append(v_new_achievements, 'renaissance');
    END IF;
  END IF;

  -- Elite: Reach Level 7 overall
  IF NOT v_current_achievements ? 'elite' THEN
    IF v_profile.overall_level >= 7 THEN
      v_new_achievements := array_append(v_new_achievements, 'elite');
    END IF;
  END IF;

  -- Update achievements if any new ones
  IF array_length(v_new_achievements, 1) > 0 THEN
    UPDATE candidate_profiles
    SET achievements = achievements || to_jsonb(v_new_achievements)
    WHERE id = p_candidate_id;

    -- Create notifications for new achievements
    FOR i IN 1..array_length(v_new_achievements, 1) LOOP
      INSERT INTO notifications (user_id, type, title, message, action_url)
      SELECT
        p_candidate_id,
        'achievement_unlocked',
        'Achievement Unlocked: ' || a.name,
        a.description || ' ' || a.icon,
        '/achievements'
      FROM achievements a
      WHERE a.id = v_new_achievements[i];
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

```sql
-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_rep_profiles_updated_at BEFORE UPDATE ON public.enterprise_rep_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shortlists_updated_at BEFORE UPDATE ON public.shortlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger review completion processing after review insert
CREATE OR REPLACE FUNCTION trigger_review_completion()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM process_review_completion(NEW.submission_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_review_completion();
```

---

## Next Steps

1. Run this schema in your Supabase SQL editor
2. Verify all tables, indexes, and functions are created
3. Set up Row Level Security policies (see `05-security-validation.md`)
4. Test database functions with sample data
5. Proceed to API implementation

---

**Note:** This schema is designed for PostgreSQL 14+ and Supabase. All JSONB fields support flexible data structures while maintaining strong typing for core fields.
