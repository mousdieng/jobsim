# Phase 1: Foundation Setup Guide

This guide will walk you through setting up the foundation for the Job Simulation Platform.

**Duration:** 1-2 weeks
**Status:** 🚀 In Progress

---

## ✅ Checklist

### Database Setup
- [ ] Create Supabase project
- [ ] Run database schema SQL
- [ ] Verify tables created
- [ ] Test database functions
- [ ] Set up RLS policies
- [ ] Seed initial data

### Storage Setup
- [ ] Create storage buckets
- [ ] Configure bucket policies
- [ ] Test file upload/download

### Authentication
- [ ] Configure Supabase Auth
- [ ] Set up email templates
- [ ] Configure auth providers
- [ ] Test authentication flow

### Angular Core
- [ ] Install dependencies
- [ ] Set up environment variables
- [ ] Create core module structure
- [ ] Implement SupabaseService
- [ ] Implement AuthService
- [ ] Implement ApiService
- [ ] Implement StorageService

### Routing & Guards
- [ ] Set up route structure
- [ ] Create AuthGuard
- [ ] Create RoleGuard
- [ ] Implement route resolvers

### Basic UI
- [ ] Create login component
- [ ] Create signup component
- [ ] Create dashboard layouts
- [ ] Test role-based routing

---

## Step 1: Create Supabase Project

### 1.1 Sign up for Supabase
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"

### 1.2 Project Settings
```
Organization: [Your Organization]
Project Name: jobsim-platform
Database Password: [Generate Strong Password - SAVE THIS!]
Region: [Choose closest to your users]
Pricing Plan: Free (to start)
```

### 1.3 Save Project Details
Create a `.env` file (DON'T COMMIT THIS):
```env
# Supabase Configuration
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Don't share the service role key publicly!
```

**Where to find these:**
- Project Settings > API > Project URL
- Project Settings > API > API Keys

---

## Step 2: Run Database Schema

### 2.1 Open SQL Editor
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**

### 2.2 Execute Schema Files

I've created organized SQL files in `database/migrations/`. Run them in order:

**Run these in Supabase SQL Editor:**
1. `001_create_tables.sql` - Create all tables
2. `002_create_functions.sql` - Create database functions
3. `003_create_triggers.sql` - Create triggers
4. `004_create_policies.sql` - Set up Row Level Security
5. `005_seed_data.sql` - Seed initial data

### 2.3 Verify Installation
```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return: achievements, activity_logs, candidate_profiles,
-- companies, enterprise_rep_profiles, interactions, notifications,
-- profiles, reviews, shortlists, submissions, tasks

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- Should return: calculate_submission_xp, check_achievements,
-- process_review_completion, update_best_score, update_candidate_levels
```

---

## Step 3: Configure Storage

### 3.1 Create Buckets
1. In Supabase Dashboard, go to **Storage**
2. Create these buckets:

| Bucket Name | Public | Description |
|-------------|--------|-------------|
| `task-attachments` | ✅ Yes | Admin task files |
| `submission-files` | ❌ No | Candidate submissions |
| `avatars` | ✅ Yes | Profile pictures |
| `company-logos` | ✅ Yes | Company branding |

### 3.2 Configure Bucket Policies
Run the SQL from `database/migrations/006_storage_policies.sql`

### 3.3 Test Upload (Optional)
```typescript
// Test in browser console after setting up Angular
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('test.png', file);
console.log('Upload test:', data, error);
```

---

## Step 4: Set Up Angular Project

### 4.1 Install Dependencies
```bash
# Install Supabase client
npm install @supabase/supabase-js

# Install TailwindCSS (if not already)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# Install useful libraries
npm install rxjs
npm install date-fns
npm install dompurify
npm install @types/dompurify --save-dev
```

### 4.2 Environment Configuration
Create environment files:

**src/environments/environment.ts** (development):
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://[your-project-ref].supabase.co',
  supabaseAnonKey: '[your-anon-key]'
};
```

**src/environments/environment.prod.ts** (production):
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://[your-project-ref].supabase.co',
  supabaseAnonKey: '[your-anon-key]'
};
```

### 4.3 Update .gitignore
```
# Environment files (IMPORTANT!)
.env
.env.local
src/environments/environment.ts
src/environments/environment.prod.ts

# Keep templates
!src/environments/environment.example.ts
```

---

## Step 5: Implement Core Services

I'll create the core service files for you. These will be in:
- `src/app/core/services/`

The core services include:
- **SupabaseService** - Supabase client wrapper
- **AuthService** - Authentication logic
- **ApiService** - HTTP client wrapper
- **StorageService** - File upload/download

---

## Step 6: Create Authentication Components

Components to create:
- Login page
- Signup page (with role selection)
- Profile completion flow

---

## Step 7: Set Up Routing

Create route structure:
```
/login
/signup
/candidate/* (protected)
/enterprise/* (protected)
/admin/* (protected)
```

---

## Success Criteria

By the end of Phase 1, you should have:

✅ **Database**
- All tables created
- Functions working
- Policies enabled
- Sample data loaded

✅ **Authentication**
- Users can sign up
- Users can log in
- Role-based access working
- Sessions persisted

✅ **Core Services**
- Supabase client initialized
- Auth state managed
- API calls working
- File uploads working

✅ **Basic UI**
- Login page functional
- Signup page functional
- Dashboard skeleton
- Role-based routing

---

## Next Steps

After Phase 1 is complete, you'll move to:
- **Phase 2:** Task System (Admin task builder, candidate discovery)
- **Phase 3:** Submission System
- **Phase 4:** Review System

---

## Troubleshooting

### Common Issues

**Issue:** "Cannot connect to Supabase"
- **Fix:** Check your Supabase URL and anon key in environment.ts

**Issue:** "RLS policy prevents access"
- **Fix:** Make sure policies are created (run 004_create_policies.sql)

**Issue:** "Function not found"
- **Fix:** Run 002_create_functions.sql in SQL Editor

**Issue:** "CORS error"
- **Fix:** Supabase handles CORS automatically. Check your URL is correct.

---

Let's start! I'll now create the database migration files and core Angular services.

**Ready?** Type "continue" and I'll generate the files!
