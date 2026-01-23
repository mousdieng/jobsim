# Database Migration Plan: Existing → Enhanced Task System

**CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE EXECUTING ANY MIGRATION**

---

## Overview

This migration transforms your existing job simulation platform database to the new enhanced XP-based task system.

### What Changes
- **User system**: Single `users` table → Role-based `profiles` + `candidate_profiles` + `enterprise_rep_profiles`
- **Task system**: Current `tasks` + `task_submissions` → Enhanced `tasks` + `submissions` + `reviews`
- **New features**: XP system, achievements, review workflow, shortlists, interactions

### What Stays
- All your existing user data (transformed)
- All your existing task data (transformed)
- All your existing submission data (transformed)
- Enterprise data
- Audit logs

---

## Migration Strategy

### Phase 1: Backup (CRITICAL - Don't Skip!)
- Export all existing tables
- Create restore point
- Verify backups

### Phase 2: Schema Transformation
- Rename existing tables (add `_old` suffix)
- Create new table structure
- Keep old tables until migration verified

### Phase 3: Data Migration
- Transform and copy user data
- Transform and copy task data
- Transform and copy submission data
- Migrate enterprise data
- Create default values for new fields

### Phase 4: Verification
- Count records (old vs new)
- Spot-check sample data
- Test application functionality
- Verify RLS policies work

### Phase 5: Cleanup (Only After Full Verification)
- Drop old tables (after 30 days backup period)

---

## Data Mapping

### Users Transformation

```
EXISTING users table:
- user_type: 'student' | 'mentor' | 'admin' | 'enterprise' | 'super_admin' | 'support'
- completed_count, score_total, badge_level
- job_field, experience_level

NEW structure:
profiles (base)
├─ candidate_profiles (if user_type = 'student')
│  ├─ overall_xp = score_total (migrated)
│  ├─ tasks_completed = completed_count
│  └─ overall_level = calculated from XP
├─ enterprise_rep_profiles (if user_type = 'enterprise')
│  └─ company_id = looked up from enterprises.admin_user_id
└─ role = mapped from user_type
```

**User Type Mapping:**
- `student` → candidate_profiles + role='candidate'
- `enterprise` → enterprise_rep_profiles + role='enterprise_rep'
- `admin` → role='admin'
- `super_admin` → role='admin'
- `support` → role='platform_support'
- `mentor` → role='platform_support' (deprecated role)

### Tasks Transformation

```
EXISTING tasks:
- job_field, difficulty_level
- deliverables (jsonb)
- resources (jsonb)
- created_by: 'ai' | 'enterprise' | 'platform'

NEW tasks:
- category = job_field (mapped)
- difficulty = difficulty_level
- submission_config = built from deliverables
- attachments = built from resources
- base_xp = calculated from difficulty
- difficulty_multiplier = 1.0 (default, can adjust)
```

### Submissions Transformation

```
EXISTING task_submissions:
- status: 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'approved' | 'rejected'
- score (0-100)
- content (jsonb)
- attachments (jsonb)

NEW submissions:
- status = mapped from old status
- submitted_files = built from attachments
- xp_earned = calculated from score
- is_approved = (status = 'approved')
- approved_attempt_number = calculated
```

---

## Risk Assessment

### Low Risk
- Adding new tables (achievements, reviews, shortlists, interactions)
- Migrating enterprise data (similar structure)
- Copying audit logs

### Medium Risk
- Transforming user data (complex mapping)
- Migrating task data (structure change)

### High Risk
- Transforming submissions (major structure change)
- Calculating XP from old scores
- Breaking existing application if not done carefully

---

## Rollback Plan

If migration fails or issues arise:

1. **Immediate Rollback** (within migration script):
   ```sql
   -- Restore original table names
   DROP TABLE IF EXISTS new_table;
   ALTER TABLE old_table_backup RENAME TO old_table;
   ```

2. **Post-Migration Rollback** (if issues found later):
   ```sql
   -- We keep _old tables for 30 days
   -- Can restore from these
   ```

3. **Worst Case** (corruption):
   - Restore from Supabase automatic backups
   - Or use our manual backup files

---

## Execution Timeline

### Recommended Approach: STAGED MIGRATION

**Stage 1: Non-Destructive Setup (30 min)**
- Create new tables with `new_` prefix
- Don't touch existing tables
- Test migration scripts

**Stage 2: Data Migration (1-2 hours)**
- Copy data from old → new tables
- Verify counts match
- Spot-check data quality

**Stage 3: Application Update (2-4 hours)**
- Update Angular services to use new tables
- Test all functionality
- Fix any issues

**Stage 4: Cutover (Scheduled Downtime)**
- Rename old tables (_old suffix)
- Rename new tables (remove new_ prefix)
- Update RLS policies
- Deploy application

**Stage 5: Monitoring (1 week)**
- Watch for errors
- Keep old tables as backup
- User acceptance testing

**Stage 6: Cleanup (After 30 days)**
- Drop old tables if everything stable

---

## Pre-Migration Checklist

Before starting:
- [ ] Read this entire document
- [ ] Have Supabase project backup enabled
- [ ] Export all current data manually
- [ ] Schedule maintenance window (if needed)
- [ ] Inform users of potential downtime
- [ ] Have rollback plan ready
- [ ] Test migration on a copy first (if possible)

---

## Migration Scripts Ready

I've prepared these scripts:
1. `migration/001_backup_existing.sql` - Backup existing data
2. `migration/002_create_new_schema.sql` - Create new tables
3. `migration/003_migrate_users.sql` - Transform user data
4. `migration/004_migrate_enterprises.sql` - Migrate companies
5. `migration/005_migrate_tasks.sql` - Transform tasks
6. `migration/006_migrate_submissions.sql` - Transform submissions
7. `migration/007_verify_migration.sql` - Verification queries
8. `migration/008_cutover.sql` - Final cutover (rename tables)
9. `migration/009_rollback.sql` - Emergency rollback

---

## Decision Point

**You have 2 options:**

### Option A: SAFE - Staged Migration (Recommended)
- New tables run alongside old tables
- Gradually test and migrate
- Zero downtime
- Can roll back anytime
- Takes longer (1-2 weeks total)

### Option B: FAST - Direct Migration
- Backup → Transform → Cutover in one session
- Requires downtime (2-4 hours)
- Riskier but faster
- Good for development environments

---

## Which option do you prefer?

**Type 'A' for Safe Staged Migration** (recommended for production)
**Type 'B' for Fast Direct Migration** (ok for development)

I'll create the appropriate migration scripts based on your choice.
