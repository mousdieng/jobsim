-- Migration: 005a_add_admin_enum_values
-- Description: Add new enum values for admin system (PART 1 of 2)
-- This must be run FIRST and SEPARATELY
-- Created: 2025-12-18

-- ============================================
-- Add enum values for user_type
-- IMPORTANT: This must be run in a separate transaction
-- ============================================

-- Add 'enterprise' to user_type enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'enterprise'
        AND enumtypid = 'user_type'::regtype
    ) THEN
        ALTER TYPE user_type ADD VALUE 'enterprise';
    END IF;
END $$;

-- Add 'super_admin' to user_type enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'super_admin'
        AND enumtypid = 'user_type'::regtype
    ) THEN
        ALTER TYPE user_type ADD VALUE 'super_admin';
    END IF;
END $$;

-- Verify enum values were added
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'user_type'::regtype
ORDER BY enumlabel;

-- ============================================
-- IMPORTANT: After running this migration,
-- proceed to run 005b_add_admin_system.sql
-- ============================================
