# Quick Fix Guide - Zero Data & LockManager Error

## Issues Fixed

### ✅ Issue 1: LockManager Error (FIXED in code)
**Error**: `NavigatorLockAcquireTimeoutError: Acquiring an exclusive Navigator LockManager lock`

**Root Cause**: AdminService was creating its own Supabase client without the custom lock bypass.

**Fix Applied**:
- Modified `src/app/services/admin.service.ts` to use the shared `SupabaseService` client
- This ensures the custom lock bypass is applied everywhere

**You Need To**:
```bash
# Rebuild the app to apply the fix
npm run build
# Or if running dev server, it should auto-reload
```

### ⚠️ Issue 2: Zero Data on Dashboard (NEEDS ACTION)

**Problem**: All counts show 0 (users, enterprises, tasks, submissions)

**Most Likely Cause**: Migration 012 has NOT been applied yet

The RLS policies expect columns that don't exist yet, causing all queries to fail silently.

## Step-by-Step Fix for Zero Data

### Step 1: Run Diagnostic

1. Open Supabase Dashboard → SQL Editor
2. Copy and run the entire file: `database/DIAGNOSE_ZERO_DATA.sql`
3. Read the results - they'll tell you exactly what's wrong

### Step 2: Apply Migration 012

**If diagnostic shows "actor_id MISSING":**

1. Open `database/012_fix_audit_logs_and_strict_roles.sql`
2. Copy the ENTIRE file
3. Paste into Supabase SQL Editor
4. Click "Run"

**If you get timeouts, apply sections individually:**
- Section 1: Users table audit columns
- Section 2: Enterprises table task creation control
- Section 3: Tasks table creator tracking
- **Section 4: Update audit logs table** ← Most critical
- Sections 5-12: Policies and triggers

### Step 3: Verify Your Admin Status

Run this in Supabase SQL Editor:

```sql
-- Check if you're admin
SELECT
  id,
  email,
  user_type,
  is_admin(id) as is_admin_function_result
FROM users
WHERE email = 'mogesselvon@gmail.com';
```

**Expected Result:**
- `user_type` should be `'admin'`
- `is_admin_function_result` should be `true`

**If NOT admin, run:**
```sql
UPDATE users
SET user_type = 'admin',
    role_assigned_at = NOW(),
    role_assigned_by = id
WHERE email = 'mogesselvon@gmail.com';
```

### Step 4: Clear Browser & Restart

After migration is applied:

1. **Clear all browser data**:
   - Open `clear-auth.html` in your browser
   - Wait for confirmation message
   - Close ALL browser tabs

2. **Restart the dev server**:
```bash
# Stop the current server (Ctrl+C)
# Restart
npm start
```

3. **Sign in again** using your admin credentials

### Step 5: Check Console Output

After restart, open browser console (F12) and look for:

**GOOD** ✅:
```
🔍 Admin Stats Debug: {
  users: { count: 1, error: null, hasError: false },
  enterprises: { count: 0, error: null, hasError: false },
  ...
}
```

**BAD** ❌:
```
🔍 Admin Stats Debug: {
  users: { count: null, error: "...", hasError: true },
  ...
}
❌ All queries failed. Possible causes:
1. Not authenticated as admin
2. RLS policies blocking access
3. Migration 012 not applied
4. is_admin() function missing
```

If you see the BAD output, the console will tell you which specific issue to fix.

## Common Problems & Solutions

### Problem: "is_admin() function does not exist"

**Solution**: Create the function:
```sql
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = COALESCE(user_id, auth.uid())
    AND user_type = 'admin'
  );
END;
$$;
```

### Problem: "Permission denied for table users"

**Solution**: RLS is blocking you. Run this to check:
```sql
-- Disable RLS temporarily to test
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Try query again
SELECT COUNT(*) FROM users;
-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

If it works with RLS disabled, the issue is with the RLS policies. Apply migration 012.

### Problem: Still getting LockManager errors

**Solution**:
1. Make sure you rebuilt the app after the code fix
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Check that `supabase.service.ts` has the custom lock bypass:
```typescript
lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn(); // Execute without acquiring lock
}
```

### Problem: Data shows in Supabase Dashboard but not in app

**Solution**: Authentication issue. Check:
```sql
-- See who is currently authenticated
SELECT auth.uid() as current_user_id;

-- See if that user is admin
SELECT * FROM users WHERE id = auth.uid();
```

If `auth.uid()` is NULL, you're not authenticated properly.

## Quick Test Checklist

After applying all fixes:

- [ ] No LockManager errors in console
- [ ] Dashboard shows actual counts (not all zeros)
- [ ] Can click "User Management" and see users
- [ ] Console shows `🔍 Admin Stats Debug` with no errors
- [ ] Your email shows in bottom-left sidebar
- [ ] "All Systems Operational" shows in top-right

## Still Stuck?

Run the diagnostic and share the output:
```bash
# In Supabase SQL Editor, run:
database/DIAGNOSE_ZERO_DATA.sql

# Share all the results
```

The diagnostic will tell you EXACTLY which fix to apply.
