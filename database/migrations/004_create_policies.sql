-- ============================================
-- Migration 004: Row Level Security Policies
-- Description: Enables RLS and creates security policies
-- Run after 003_create_triggers.sql
-- ============================================

-- ============================================
-- PROFILES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- CANDIDATE PROFILES
-- ============================================

ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

-- Candidates can read/update their own profile
CREATE POLICY "Candidates can read own profile"
  ON public.candidate_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Candidates can update own profile"
  ON public.candidate_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Enterprise reps and admins can read candidate profiles
CREATE POLICY "Enterprise reps can read candidate profiles"
  ON public.candidate_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('enterprise_rep', 'admin', 'platform_support')
    )
  );

-- ============================================
-- COMPANIES
-- ============================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Everyone can read active companies
CREATE POLICY "Anyone can read active companies"
  ON public.companies FOR SELECT
  USING (is_active = TRUE);

-- Only admins can manage companies
CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- ENTERPRISE REP PROFILES
-- ============================================

ALTER TABLE public.enterprise_rep_profiles ENABLE ROW LEVEL SECURITY;

-- Reps can read/update their own profile
CREATE POLICY "Reps can read own profile"
  ON public.enterprise_rep_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Reps can update own profile"
  ON public.enterprise_rep_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Candidates and admins can read rep profiles
CREATE POLICY "Others can read rep profiles"
  ON public.enterprise_rep_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('candidate', 'admin', 'platform_support')
    )
  );

-- ============================================
-- TASKS
-- ============================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Everyone can read active tasks
CREATE POLICY "Anyone can read active tasks"
  ON public.tasks FOR SELECT
  USING (status = 'active' OR auth.uid() = created_by);

-- Only admins can create/update/delete tasks
CREATE POLICY "Admins can manage tasks"
  ON public.tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- SUBMISSIONS
-- ============================================

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Candidates can read their own submissions
CREATE POLICY "Candidates can read own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = candidate_id);

-- Candidates can create submissions (for themselves only)
CREATE POLICY "Candidates can create own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

-- Candidates can update their own submissions (only drafts)
CREATE POLICY "Candidates can update own draft submissions"
  ON public.submissions FOR UPDATE
  USING (
    auth.uid() = candidate_id
    AND status = 'pending_validation'
  );

-- Enterprise reps can read submissions they're reviewing
CREATE POLICY "Reviewers can read assigned submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE submission_id = submissions.id
      AND reviewer_id = auth.uid()
    )
    OR
    -- OR if submission is approved (public portfolio)
    (submissions.is_approved = TRUE)
  );

-- Admins and platform support can read all submissions
CREATE POLICY "Admins can read all submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'platform_support')
    )
  );

-- ============================================
-- REVIEWS
-- ============================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviewers can read their own reviews
CREATE POLICY "Reviewers can read own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = reviewer_id);

-- Reviewers can create reviews (for assigned submissions)
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

-- Candidates can read reviews for their completed submissions
CREATE POLICY "Candidates can read reviews for their submissions"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE id = reviews.submission_id
      AND candidate_id = auth.uid()
      AND status = 'review_complete'
    )
  );

-- Enterprise reps can read reviews for submissions they're viewing
CREATE POLICY "Enterprise reps can read submission reviews"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE id = reviews.submission_id
      AND is_approved = TRUE
    )
    AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('enterprise_rep', 'admin')
    )
  );

-- ============================================
-- SHORTLISTS
-- ============================================

ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

-- Enterprise reps can manage their own shortlist
CREATE POLICY "Reps can manage own shortlist"
  ON public.shortlists FOR ALL
  USING (auth.uid() = enterprise_rep_id)
  WITH CHECK (auth.uid() = enterprise_rep_id);

-- ============================================
-- INTERACTIONS
-- ============================================

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Users can read messages sent to them or from them
CREATE POLICY "Users can read own interactions"
  ON public.interactions FOR SELECT
  USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
  );

-- Users can create interactions (from themselves)
CREATE POLICY "Users can create interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Users can update interactions sent to them (mark as read, respond)
CREATE POLICY "Users can update received interactions"
  ON public.interactions FOR UPDATE
  USING (auth.uid() = to_user_id);

-- ============================================
-- ACHIEVEMENTS
-- ============================================

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can read achievements
CREATE POLICY "Anyone can read achievements"
  ON public.achievements FOR SELECT
  USING (TRUE);

-- Only admins can manage achievements
CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- NOTIFICATIONS
-- ============================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can create notifications (via service role)
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- ACTIVITY LOGS
-- ============================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read activity logs
CREATE POLICY "Admins can read activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- System can create activity logs (via service role)
CREATE POLICY "System can create activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE 'Created % RLS policies successfully', policy_count;
  RAISE NOTICE 'Row Level Security is now ENABLED on all tables';
END $$;
