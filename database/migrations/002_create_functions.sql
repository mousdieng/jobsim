-- ============================================
-- Migration 002: Create Database Functions
-- Description: Creates all stored procedures and functions
-- Run after 001_create_tables.sql
-- ============================================

-- ============================================
-- XP CALCULATION FUNCTION
-- ============================================

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

  -- Calculate total XP
  v_total_xp := ROUND(v_base_xp * v_difficulty_mult * v_attempt_mult);

  -- Update submission with XP details
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

-- ============================================
-- BEST SCORE UPDATE FUNCTION
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

-- ============================================
-- LEVEL CALCULATION FUNCTION
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
  SELECT overall_xp INTO v_overall_xp
  FROM candidate_profiles
  WHERE id = p_candidate_id;

  -- Calculate overall level
  v_new_level := CASE
    WHEN v_overall_xp >= 27500 THEN 7
    WHEN v_overall_xp >= 17500 THEN 6
    WHEN v_overall_xp >= 10000 THEN 5
    WHEN v_overall_xp >= 5000 THEN 4
    WHEN v_overall_xp >= 2000 THEN 3
    WHEN v_overall_xp >= 500 THEN 2
    ELSE 1
  END;

  UPDATE candidate_profiles
  SET overall_level = v_new_level
  WHERE id = p_candidate_id;

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

-- ============================================
-- ACHIEVEMENT CHECK FUNCTION
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
  SELECT * INTO v_profile
  FROM candidate_profiles
  WHERE id = p_candidate_id;

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

-- ============================================
-- REVIEW COMPLETION PROCESSOR
-- ============================================

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

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';

  RAISE NOTICE 'Created % functions successfully', function_count;
END $$;
