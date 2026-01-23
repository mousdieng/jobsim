-- ============================================
-- Storage Bucket Setup
-- Description: Creates storage buckets for JobSim Senegal
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE BUCKETS
-- ============================================

-- Create submission-files bucket (PRIVATE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-files',
  'submission-files',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- Create task-attachments bucket (PUBLIC)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Create avatars bucket (PUBLIC)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152;

-- Create company-logos bucket (PUBLIC)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152, -- 2MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id IN ('submission-files', 'task-attachments', 'avatars', 'company-logos');

  RAISE NOTICE '';
  RAISE NOTICE '✅ Storage Setup Complete!';
  RAISE NOTICE '==========================';
  RAISE NOTICE 'Created/Updated % buckets:', bucket_count;
  RAISE NOTICE '';
  RAISE NOTICE '📦 Buckets:';
  RAISE NOTICE '  1. submission-files (PRIVATE, 50MB, 13 mime types)';
  RAISE NOTICE '  2. task-attachments (PUBLIC, 10MB, 7 mime types)';
  RAISE NOTICE '  3. avatars (PUBLIC, 2MB, 4 mime types)';
  RAISE NOTICE '  4. company-logos (PUBLIC, 2MB, 5 mime types)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ NEXT STEP: Run 006_storage_policies.sql to set up access policies';
END $$;

-- List all buckets for verification
SELECT
  id,
  name,
  public,
  file_size_limit / 1048576 as size_limit_mb,
  array_length(allowed_mime_types, 1) as mime_types_count,
  created_at
FROM storage.buckets
WHERE id IN ('submission-files', 'task-attachments', 'avatars', 'company-logos')
ORDER BY id;
