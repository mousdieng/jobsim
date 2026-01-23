# Database Migration Complete ✓

**Migration Date:** January 14, 2026
**Migration Type:** Fast Direct Migration
**Status:** SUCCESS

---

## Migration Summary

Successfully migrated from old schema to new enhanced XP-based task system.

### Data Migrated

| Table | Count | Status |
|-------|-------|--------|
| **Profiles** | 4 | ✓ Migrated |
| **Candidate Profiles** | 1 | ✓ Migrated |
| **Enterprise Rep Profiles** | 1 | ✓ Migrated |
| **Companies** | 1 | ✓ Migrated |
| **Achievements** | 7 | ✓ Seeded |
| **Tasks** | 0 | - Empty (ready for new tasks) |
| **Submissions** | 0 | - Empty (ready for new submissions) |

### User Accounts Migrated

1. **moizadieng@gmail.com** (Moussa Dieng)
   - Role: Candidate
   - Overall XP: 0
   - Overall Level: 1
   - Tasks Completed: 0

2. **mogesselyon@gmail.com** (Moussa Dieng)
   - Role: Admin
   - Full platform access

3. **m1@gmail.com** (Orange LTS)
   - Role: Enterprise Rep
   - Status: No company profile yet (pending setup)

4. **m2@gmail.com** (Moise)
   - Role: Enterprise Rep
   - Company: Orange LTS (Technology, Medium size)
   - Status: Fully linked

### Company Migrated

- **Orange LTS**
  - Industry: Technology
  - Size: Medium
  - Status: Active
  - Admin: m2@gmail.com (Moise)

---

## What Changed

### Old Schema → New Schema

**Users Table:**
```
users (user_type, score_total, completed_count)
  ↓
profiles (role-based) + candidate_profiles (XP system)
```

**Role Mapping:**
- `student` → `candidate` + candidate_profiles entry
- `enterprise` → `enterprise_rep` + enterprise_rep_profiles entry (if linked to company)
- `admin` → `admin`
- `super_admin` → `admin`
- `mentor` / `support` → `platform_support`

**Enterprise System:**
```
enterprises (company_size, sector, admin_user_id)
  ↓
companies (size, industry) + enterprise_rep_profiles (company_id link)
```

---

## New Features Available

### 1. XP System
- Base XP per task (100-1000)
- Difficulty multipliers (1.0x - 3.0x)
- Attempt multipliers (2.0x first attempt → 0.75x fifth attempt)
- Automatic level progression (Level 1-7)

### 2. Category Tracking
- Overall XP and Level
- Per-category XP and Levels (marketing, sales, design, etc.)
- Category specialization tracking

### 3. Achievement System
7 achievements ready:
- 🏆 First Perfect - Pass on first attempt
- ⚡ Speed Demon - Complete 5 tasks under estimated time
- 🎯 Sharpshooter - Maintain 90%+ approval rate (10+ tasks)
- 🌟 Consistent - 10 tasks approved in a row
- 🎓 Specialist - Reach Level 5 in any category
- 🌈 Renaissance - Reach Level 3+ in 3+ categories
- 👑 Elite - Reach maximum Level 7

### 4. Review System
- 3 reviewers per submission
- 2/3 majority approval required
- Automatic XP calculation and awarding
- Achievement unlocking triggers

### 5. Flexible Task System
- Dynamic submission requirements (JSONB)
- Multiple file types supported
- Category-based organization
- Difficulty-based XP scaling

---

## Backup Tables Preserved

The following backup tables are still in your database:
- `users_backup` (4 rows)
- `enterprises_backup` (1 row)

**IMPORTANT:** Keep these tables for at least 30 days in case you need to rollback or reference old data.

### To Drop Backups (After 30 Days):
```sql
DROP TABLE IF EXISTS users_backup;
DROP TABLE IF EXISTS enterprises_backup;
```

---

## Next Steps

### 1. Create Storage Buckets (Required)
In Supabase Dashboard → Storage, create:

1. **task-attachments** (PUBLIC)
   - For task instructions, resources, sample files
   - Admins can upload

2. **submission-files** (PRIVATE)
   - For candidate submissions
   - Secured with RLS policies

3. **avatars** (PUBLIC)
   - User profile pictures
   - Users manage their own

4. **company-logos** (PUBLIC)
   - Enterprise company branding
   - Enterprise reps manage their own

Then run:
```bash
database/migrations/006_storage_policies.sql
```

### 2. Create Sample Tasks
Use the admin account to create tasks with the new flexible system:
```sql
-- Example task structure
{
  "title": "Social Media Campaign",
  "category": "marketing",
  "difficulty": "intermediate",
  "base_xp": 250,
  "submission_config": {
    "required_files": [
      {
        "label": "Strategy Document",
        "type": "document",
        "allowed_formats": ["pdf", "docx"],
        "max_size_mb": 10
      }
    ]
  }
}
```

### 3. Update Angular Services
Update your Angular services to use the new schema:
- `auth.service.ts` - Use `profiles` table
- `task.service.ts` - Use new `tasks` structure
- `submission.service.ts` - Use new `submissions` + `reviews` system
- Create new `xp.service.ts` for XP/level display

### 4. Test Authentication
1. Log in as each user type
2. Verify role-based routing works
3. Test RLS policies are enforcing correctly

### 5. Build Admin Task Creator
Create an admin UI for the flexible task builder that allows:
- Dynamic submission requirements
- File type/size configuration
- Evaluation criteria definition

---

## Database Functions Created

### XP Calculation
- `calculate_submission_xp(submission_id)` - Calculates XP based on difficulty and attempt
- `update_candidate_levels(candidate_id)` - Recalculates levels from XP

### Review Processing
- `process_review_completion(submission_id)` - Auto-processes when 3 reviews complete
- `trigger_review_completion()` - Trigger function that calls processor

### Achievement System
- `check_achievements(candidate_id)` - Checks and unlocks achievements

### Automatic Timestamps
- `update_updated_at()` - Updates `updated_at` on row changes

---

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Profiles**: Users can read/update own profile
- **Candidate Profiles**: Candidates manage own, enterprise reps can read all
- **Companies**: Anyone can read active companies, admins manage
- **Tasks**: Anyone can read active tasks, admins create/manage
- **Submissions**: Candidates manage own, reviewers see assigned, admins see all
- **Reviews**: Reviewers create and read own, candidates see completed reviews
- **Achievements**: Everyone can read, admins manage
- **Shortlists**: Enterprise reps manage their own lists
- **Interactions**: Users see messages to/from them
- **Notifications**: Users see only their own

---

## Rollback Plan (If Needed)

If you need to rollback within 30 days:

```sql
BEGIN;

-- Drop new tables
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS shortlists CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS enterprise_rep_profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS candidate_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Restore from backup
ALTER TABLE users_backup RENAME TO users;
ALTER TABLE enterprises_backup RENAME TO enterprises;

-- Recreate old tables (tasks, submissions, etc.) from your git history

COMMIT;
```

---

## Verification Queries

Check data integrity:

```sql
-- View all users with roles
SELECT p.email, p.full_name, p.role,
       cp.overall_level, cp.overall_xp,
       erp.company_id
FROM profiles p
LEFT JOIN candidate_profiles cp ON p.id = cp.id
LEFT JOIN enterprise_rep_profiles erp ON p.id = erp.id;

-- Check company linkages
SELECT c.name, p.email as rep_email
FROM companies c
JOIN enterprise_rep_profiles erp ON c.id = erp.company_id
JOIN profiles p ON erp.id = p.id;

-- List all achievements
SELECT * FROM achievements ORDER BY category, name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Support

If you encounter any issues:

1. Check backup tables are intact: `SELECT COUNT(*) FROM users_backup;`
2. Review migration logs in Supabase Dashboard → Database → Query History
3. Test RLS policies in Supabase Dashboard → Authentication → Policies
4. Contact Claude for assistance with rollback or fixes

---

**Migration completed successfully! Your database is now ready for the enhanced XP-based task system.** 🎉

Next: Create storage buckets and run `006_storage_policies.sql`
