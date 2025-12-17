# FINAL FIX - Complete Solution

## What's Happening Now

The error you're seeing means:
- ✅ Supabase Auth user is created successfully
- ⏳ The database trigger hasn't created the user profile YET
- ❌ Frontend tried to load profile too quickly

## The Solution

I've updated the code to **retry loading the profile** up to 5 times with delays, giving the trigger time to complete.

## What You Need to Do

### Step 1: Verify the Trigger is Installed

Run this in Supabase SQL Editor:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**If you see 0 rows** → The trigger is NOT installed. Go to Step 2.

**If you see 1 row** → Trigger is installed. Go to Step 3.

### Step 2: Install the Trigger (If Not Already Installed)

Copy and run this ENTIRE SQL in Supabase SQL Editor:

```sql
-- Create function to auto-create user profile
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

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix RLS policies (drop old ones)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Create simple RLS policies (no INSERT needed - trigger handles it)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON users;
CREATE POLICY "Authenticated users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

SELECT 'Trigger installed successfully!' AS status;
```

### Step 3: Rebuild and Restart Your App

```bash
# Stop the dev server (Ctrl+C if running)

# Rebuild the app
npm run build

# Start the dev server
npm start
```

### Step 4: Test Sign Up Again

1. Open browser to: `http://localhost:4200/register`

2. Use a **NEW email** (not one you've tried before):
   - Full Name: Test User
   - Email: `newtest@example.com` (use a new email!)
   - User Type: Student
   - Password: Test123!
   - Confirm Password: Test123!

3. Click **Create Account**

4. Watch the browser console - you should see:
   ```
   Waiting for user profile... (attempt 1/5)
   Waiting for user profile... (attempt 2/5)
   ```
   
5. After 1-2 seconds, it should succeed and redirect!

### Step 5: Verify Success

1. Go to Supabase → **Authentication** → **Users**
   - Your user should be there ✅

2. Go to Supabase → **Table Editor** → **users**
   - Your user profile should be there ✅
   - `user_type` should be "student" ✅
   - `name` should be "Test User" ✅

## What Changed in the Code

### Before:
```typescript
// Tried to load profile immediately
await this.loadUserProfile(authData.user.id);
```

### After:
```typescript
// Retries up to 5 times with 500ms delays
const maxRetries = 5;
while (retries < maxRetries && !currentUser) {
  await new Promise(resolve => setTimeout(resolve, 500));
  try {
    await this.loadUserProfile(authData.user.id);
    currentUser = this.currentUserSubject.value;
  } catch (error) {
    console.log(`Waiting for user profile... (attempt ${retries + 1}/${maxRetries})`);
  }
  retries++;
}
```

## Troubleshooting

### Still getting "Cannot coerce to single JSON object"

**Solution**: The trigger isn't installed or isn't firing.

1. Delete test users from Authentication:
   - Go to Authentication → Users
   - Delete all test users

2. Verify trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

3. Manually test the trigger:
   ```sql
   -- This should create a user in both tables
   -- Replace with your own test email
   SELECT auth.signup(
     'trigger-test@example.com',
     'Test123!',
     '{"name": "Trigger Test", "user_type": "student"}'::jsonb
   );
   
   -- Then check if it worked
   SELECT * FROM public.users WHERE email = 'trigger-test@example.com';
   ```

### Error: "User profile creation is taking longer than expected"

This means the trigger didn't create the profile after 5 retries (2.5 seconds).

**Solution**:
1. Check Supabase logs: Database → Logs → Postgres Logs
2. Look for trigger errors
3. Make sure the function has correct permissions

### Users appearing in auth but not in users table

**Solution**: Trigger is not working. Check:

```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Both should return 1 row. If not, run the installation SQL again.

## Success Indicators

You'll know it's working when:

1. ✅ Console shows "Waiting for user profile..." messages
2. ✅ After 1-2 seconds, success message appears
3. ✅ Redirect to dashboard works
4. ✅ User appears in Authentication tab
5. ✅ **User appears in users table with correct data**

## Next Steps

Once sign up is working:

1. Test sign in with the account you just created
2. Run remaining database migrations (simulations, jobs, submissions)
3. Customize the app for your needs

---

**The retry logic should now handle the timing issue!**

Just make sure the trigger is installed and try again with a new email.
