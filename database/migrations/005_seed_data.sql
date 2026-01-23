-- ============================================
-- Migration 005: Seed Initial Data
-- Description: Inserts initial achievements and sample data
-- Run after 004_create_policies.sql
-- ============================================

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================

INSERT INTO public.achievements (id, name, description, icon, category, criteria_description) VALUES
  ('first_perfect', 'First Perfect', 'Pass a task on your first attempt', '🏆', 'skill', 'Complete and get approved on first submission'),
  ('speed_demon', 'Speed Demon', 'Complete 5 tasks under estimated time', '⚡', 'consistency', 'Complete 5 tasks faster than the estimated time'),
  ('sharpshooter', 'Sharpshooter', 'Maintain 90%+ approval rate with 10+ tasks', '🎯', 'skill', 'Have at least 10 tasks with 90% or higher approval rate'),
  ('consistent', 'Consistent', 'Get 10 tasks approved in a row', '🌟', 'consistency', 'Achieve 10 consecutive task approvals without rejection'),
  ('specialist', 'Specialist', 'Reach Level 5 in any category', '🎓', 'progression', 'Reach Level 5 or higher in any single task category'),
  ('renaissance', 'Renaissance', 'Reach Level 3+ in 3+ categories', '🌈', 'progression', 'Reach Level 3 or higher in three different categories'),
  ('elite', 'Elite', 'Reach the maximum overall Level 7', '👑', 'progression', 'Reach Level 7 overall - the highest level possible')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREATE SAMPLE ADMIN USER (for testing)
-- ============================================

-- Note: You'll need to manually create this user via Supabase Auth UI
-- Then update their profile:

-- UNCOMMENT AND RUN THIS AFTER CREATING AN ADMIN USER IN SUPABASE AUTH:
/*
UPDATE public.profiles
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'admin@example.com';
*/

-- ============================================
-- SAMPLE COMPANY (for testing)
-- ============================================

INSERT INTO public.companies (id, name, industry, size, description, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'TechCorp Solutions',
    'Technology',
    'medium',
    'A leading technology solutions provider specializing in enterprise software.',
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'InnovateCo',
    'Marketing',
    'small',
    'An innovative marketing agency helping brands grow digitally.',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE TASK (for testing)
-- ============================================

INSERT INTO public.tasks (
  id,
  title,
  description,
  instructions,
  category,
  job_role,
  skill_tags,
  difficulty,
  base_xp,
  difficulty_multiplier,
  estimated_time_minutes,
  submission_config,
  evaluation_criteria,
  status
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Social Media Campaign Strategy',
    'Create a comprehensive social media marketing strategy for a new product launch.',
    E'# Social Media Campaign Strategy\n\n## Objective\nDevelop a 30-day social media campaign strategy for launching a new eco-friendly water bottle.\n\n## Requirements\n1. Target audience analysis\n2. Platform selection (choose 3 platforms)\n3. Content calendar for 30 days\n4. KPIs and success metrics\n5. Budget allocation recommendations\n\n## Deliverables\n- Strategy document (PDF)\n- Sample social media posts (images)\n- Analytics plan (spreadsheet)\n\n## Tips\n- Be creative but realistic\n- Show understanding of current trends\n- Justify your recommendations with data',
    'marketing',
    'Marketing Manager',
    '["social_media", "strategy", "content_marketing", "analytics"]'::jsonb,
    'intermediate',
    250,
    2.0,
    180,
    '{
      "required_files": [
        {
          "label": "Strategy Document",
          "type": "document",
          "allowed_formats": ["pdf", "docx"],
          "max_size_mb": 10,
          "description": "Your complete social media strategy document"
        },
        {
          "label": "Sample Posts",
          "type": "images",
          "allowed_formats": ["png", "jpg", "pdf"],
          "max_size_mb": 5,
          "max_files": 5,
          "description": "Sample social media post designs (at least 3)"
        }
      ],
      "optional_files": [
        {
          "label": "Analytics Plan",
          "type": "spreadsheet",
          "allowed_formats": ["xlsx", "csv"],
          "max_size_mb": 5,
          "description": "Optional analytics tracking plan"
        }
      ]
    }'::jsonb,
    '[
      "Clear target audience definition",
      "Realistic 30-day content calendar",
      "Measurable KPIs defined",
      "Creative and engaging sample posts",
      "Budget considerations included"
    ]'::jsonb,
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Landing Page Wireframe Design',
    'Design a wireframe for a product landing page with clear conversion goals.',
    E'# Landing Page Wireframe\n\n## Objective\nCreate a wireframe design for a SaaS product landing page aimed at small businesses.\n\n## Requirements\n1. Hero section with value proposition\n2. Features section (minimum 3 features)\n3. Pricing section\n4. Testimonials section\n5. Call-to-action (CTA) buttons\n6. Mobile responsive layout\n\n## Deliverables\n- Wireframe design (PDF, Figma, or image)\n- Brief explanation document\n\n## Tools\nYou can use any tool: Figma, Sketch, Adobe XD, or even hand-drawn (scanned)\n\n## Evaluation Criteria\n- Clear user flow\n- Effective visual hierarchy\n- Conversion optimization\n- Mobile responsiveness consideration',
    'design',
    'UX Designer',
    '["ux_design", "wireframing", "landing_page", "conversion"]'::jsonb,
    'beginner',
    100,
    1.0,
    120,
    '{
      "required_files": [
        {
          "label": "Wireframe Design",
          "type": "design",
          "allowed_formats": ["pdf", "png", "jpg", "fig"],
          "max_size_mb": 20,
          "description": "Your landing page wireframe design"
        }
      ],
      "optional_files": [
        {
          "label": "Design Explanation",
          "type": "document",
          "allowed_formats": ["pdf", "docx"],
          "max_size_mb": 5,
          "description": "Brief explanation of your design decisions"
        }
      ]
    }'::jsonb,
    '[
      "Clear visual hierarchy",
      "Effective value proposition in hero section",
      "Logical user flow",
      "Mobile responsiveness considered",
      "Strong call-to-action placement"
    ]'::jsonb,
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  achievement_count INTEGER;
  company_count INTEGER;
  task_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO achievement_count FROM public.achievements;
  SELECT COUNT(*) INTO company_count FROM public.companies;
  SELECT COUNT(*) INTO task_count FROM public.tasks;

  RAISE NOTICE 'Seeded % achievements', achievement_count;
  RAISE NOTICE 'Seeded % companies', company_count;
  RAISE NOTICE 'Seeded % sample tasks', task_count;
  RAISE NOTICE 'Database seeding complete!';
END $$;
