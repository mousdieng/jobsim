# Database Migrations

This folder contains SQL migration files for the JobSim Senegal database.

## Overview

The database uses PostgreSQL (via Supabase) with Row Level Security (RLS) enabled for secure access control.

## Migration Files

Migrations should be run in order:

1. **001_create_users_table.sql** - User profiles and authentication
2. **002_create_simulations_table.sql** - Job simulation exercises
3. **003_create_jobs_table.sql** - Real job opportunities
4. **004_create_submissions_table.sql** - Student submissions and grading

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of each migration file (in order)
5. Click **Run** to execute
6. Repeat for all migration files

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Manual SQL Execution

Connect to your PostgreSQL database and execute each migration file:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f database/migrations/001_create_users_table.sql
```

## Database Schema

### Users Table
- Stores user profile information
- Linked to Supabase Auth (`auth.users`)
- User types: `student`, `mentor`, `admin`
- Tracks completion count and total score

### Simulations Table
- Job simulation exercises for students
- Difficulty levels: Beginner, Intermediate, Advanced
- Progress tracking: Completed, Awaiting Review, Incomplete
- Supports deliverables and support assets (PDFs, Excel, GitHub)

### Jobs Table
- Real job opportunities
- Links to related simulations
- External application links and contact info

### Submissions Table
- Student submissions for simulations
- Score tracking (0-100)
- Mentor/admin feedback
- Auto-updates user stats on grading

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Users
- Users can read/update their own profile
- Users can insert their own profile during registration
- All authenticated users can read other profiles
- Service role can insert new users

### Simulations
- Anyone can read simulations
- Authenticated users can create simulations
- Mentors/admins can update simulations
- Admins can delete simulations

### Jobs
- Anyone can read jobs
- Authenticated users can create jobs
- Mentors/admins can update jobs
- Admins can delete jobs

### Submissions
- Students can read/create/update their own submissions
- Mentors/admins can read/update all submissions
- Admins can delete submissions

## Triggers and Functions

### Auto-update Timestamps
All tables have an `updated_at` trigger that automatically updates the timestamp on record modification.

### User Stats Auto-update
When a submission is graded (score assigned), the user's `completed_count` and `score_total` are automatically updated.

## Indexes

Optimized indexes are created for:
- Common query patterns (category, difficulty, date filters)
- Foreign key relationships
- JSONB columns (using GIN indexes)
- Composite queries (student + simulation lookups)

## Data Types

### Custom ENUMs
- `user_type`: student, mentor, admin
- `difficulty_level`: Beginner, Intermediate, Advanced
- `progress_status`: Completed, Awaiting Review, Incomplete
- `urgency_level`: High, Medium, Low
- `asset_type`: pdf, excel, github

### JSONB Columns
- `deliverables`: Array of deliverable items
- `support_assets`: Array of support materials
- `related_simulations`: Array of simulation IDs
- `submission_files`: Array of uploaded files

## Rollback Migrations

If you need to rollback migrations, run these in reverse order:

```sql
-- Rollback 004
DROP TABLE IF EXISTS submissions CASCADE;
DROP FUNCTION IF EXISTS update_user_stats_on_submission() CASCADE;

-- Rollback 003
DROP TABLE IF EXISTS jobs CASCADE;

-- Rollback 002
DROP TABLE IF EXISTS simulations CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS progress_status CASCADE;
DROP TYPE IF EXISTS urgency_level CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;

-- Rollback 001
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_type CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Environment Setup

Make sure your Supabase credentials are configured in:
- `/src/environments/environment.ts`
- `/src/environments/environment.development.ts`

```typescript
export const environment = {
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

## Testing

After running migrations, verify:

1. Tables exist: Check Supabase Dashboard → Table Editor
2. RLS policies work: Test CRUD operations with different user roles
3. Triggers fire: Update a record and check `updated_at`
4. Indexes exist: Check with `\di` in psql or Supabase Database settings

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review PostgreSQL docs: https://www.postgresql.org/docs/
