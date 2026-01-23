-- ============================================
-- Migration 006: Storage Bucket Policies
-- Description: Configures Supabase Storage access policies
-- Run after creating storage buckets in Supabase UI
-- ============================================

-- NOTE: You must create these buckets first in Supabase Dashboard > Storage:
-- 1. task-attachments (PUBLIC)
-- 2. submission-files (PRIVATE)
-- 3. avatars (PUBLIC)
-- 4. company-logos (PUBLIC)

-- ============================================
-- SUBMISSION FILES (Private)
-- ============================================

-- Candidates can upload to their own submission folders
CREATE POLICY "Candidates can upload own submission files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submission-files'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Candidates can read their own submission files
CREATE POLICY "Candidates can read own submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files'
    AND (storage.foldername(name))[1] = 'submissions'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Enterprise reps can read submission files they're reviewing
CREATE POLICY "Reviewers can read assigned submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.reviews r
      JOIN public.submissions s ON r.submission_id = s.id
      WHERE r.reviewer_id = auth.uid()
      AND (storage.foldername(name))[3] = s.id::text
    )
  );

-- Enterprise reps can read approved submission files
CREATE POLICY "Enterprise reps can read approved submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.is_approved = TRUE
      AND (storage.foldername(name))[3] = s.id::text
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'enterprise_rep'
    )
  );

-- Admins can read all submission files
CREATE POLICY "Admins can read all submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'platform_support')
    )
  );

-- ============================================
-- TASK ATTACHMENTS (Public)
-- ============================================

-- Authenticated users can read task attachments
CREATE POLICY "Authenticated users can read task attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND auth.role() = 'authenticated'
  );

-- Only admins can upload task attachments
CREATE POLICY "Admins can upload task attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete task attachments
CREATE POLICY "Admins can delete task attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- AVATARS (Public)
-- ============================================

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read avatars
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ============================================
-- COMPANY LOGOS (Public)
-- ============================================

-- Enterprise reps can upload their company logo
CREATE POLICY "Enterprise reps can upload company logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM public.enterprise_rep_profiles erp
      WHERE erp.id = auth.uid()
      AND (storage.foldername(name))[1] = erp.company_id::text
    )
  );

-- Enterprise reps can update their company logo
CREATE POLICY "Enterprise reps can update company logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM public.enterprise_rep_profiles erp
      WHERE erp.id = auth.uid()
      AND (storage.foldername(name))[1] = erp.company_id::text
    )
  );

-- Anyone can read company logos
CREATE POLICY "Anyone can read company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- Admins can manage all company logos
CREATE POLICY "Admins can manage all company logos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects';

  RAISE NOTICE 'Created % storage policies successfully', policy_count;
  RAISE NOTICE 'Storage security is now configured!';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Make sure you have created these buckets:';
  RAISE NOTICE '  1. task-attachments (PUBLIC)';
  RAISE NOTICE '  2. submission-files (PRIVATE)';
  RAISE NOTICE '  3. avatars (PUBLIC)';
  RAISE NOTICE '  4. company-logos (PUBLIC)';
END $$;
