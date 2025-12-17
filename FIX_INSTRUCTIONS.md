# FINAL FIX - User Profile Creation Issue

## The Problem

- ✅ Supabase Auth is working (users appear in Authentication)
- ❌ User profiles not being created in `users` table
- ❌ RLS policy violation error

## The Solution

Use a **database trigger** that automatically creates the user profile whenever a new auth user is created. This bypasses RLS issues completely!

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Sign in and open your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run This SQL Code

Copy and paste the ENTIRE code below into the SQL Editor and click **Run**:

```sql
-- SOLUTION: Automatically create user profile when auth user is created

-- Step 1: Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON users;

-- Step 2: Create function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, user_type, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Recreate RLS policies (simpler - no INSERT needed!)
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Verify setup
SELECT 'Setup completed successfully!' AS status;
```

### Step 3: Verify the Trigger

After running the SQL, you should see "Setup completed successfully!"

### Step 4: Test Sign Up

1. Start your dev server (if not running):
   ```bash
   npm start
   ```

2. Open browser to: `http://localhost:4200/register`

3. Fill out the form:
   - Full Name: Test User
   - Email: test123@example.com
   - User Type: Student  
   - Password: Test123!
   - Confirm Password: Test123!

4. Click **Create Account**

5. Check for success!

### Step 5: Verify in Database

1. Go to Supabase → **Table Editor** → **users**
2. You should NOW see your user record!
3. The user_type and name fields should be populated correctly

## What Changed?

### Before (Not Working):
- Frontend tried to manually insert into users table
- RLS policy blocked the insert
- Error: "row violates row-level security policy"

### After (Working):
- Supabase Auth creates user in auth.users table
- **Database trigger automatically creates user profile**
- No RLS violation because trigger runs with elevated permissions
- Frontend just waits and loads the profile

## How It Works

```
1. User submits registration form
2. Frontend calls Supabase Auth signup
3. Supabase creates user in auth.users table
4. ⚡ TRIGGER FIRES AUTOMATICALLY ⚡
5. Trigger creates matching record in users table
6. Frontend loads the newly created profile
7. User is redirected to dashboard
```

## Testing Checklist

After running the SQL fix:

- [ ] Trigger exists (check in Supabase → Database → Triggers)
- [ ] Navigate to /register 
- [ ] Fill out form and submit
- [ ] No console errors
- [ ] Success message appears
- [ ] Redirect to dashboard works
- [ ] User appears in Authentication tab
- [ ] **User appears in users table** ✅
- [ ] user_type and name are correctly saved

## Troubleshooting

### "Trigger already exists"
**Solution**: That's fine! The trigger is already created. Just continue with testing.

### "Function does not exist"
**Solution**: Make sure you ran the ENTIRE SQL block, not just parts of it.

### Still getting RLS error
**Solution**: 
1. Make sure the trigger was created successfully
2. Delete any existing test users from Authentication
3. Try signing up with a completely new email

### User still not appearing in users table
**Solution**:
1. Check Supabase logs: Database → Logs → Postgres Logs
2. Look for trigger errors
3. Verify the trigger is on the auth.users table (not public.users)

## Verify Trigger Installation

Run this query in SQL Editor to verify:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

You should see one row with:
- trigger_name: on_auth_user_created
- event_object_table: users
- event_manipulation: INSERT

## Clean Up Old Test Data (Optional)

If you have test users in Authentication but not in users table:

```sql
-- This will create profiles for existing auth users
INSERT INTO public.users (id, email, user_type, name, created_at, updated_at)
SELECT 
  id,
  email,
  'student',
  COALESCE(raw_user_meta_data->>'name', ''),
  created_at,
  created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);
```

## Next Steps

Once sign up is working:

1. ✅ Test sign in with your new account
2. ✅ Verify user data persists
3. ✅ Run remaining database migrations (simulations, jobs, submissions)
4. ✅ Customize the app for your needs

---

**This should completely fix the user profile creation issue!**

The trigger approach is actually better than the original implementation because:
- More reliable (no RLS conflicts)
- Automatically consistent (can't forget to create profile)
- Follows Supabase best practices
- Works for all authentication methods (including social login in the future)
