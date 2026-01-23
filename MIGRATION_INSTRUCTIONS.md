# How to Apply the Candidate Tasks Migration

## The Error You're Seeing

```
GET https://rnqwajmjfqlsrvhupram.supabase.co/rest/v1/candidate_tasks 404 (Not Found)
Could not find the table 'public.candidate_tasks' in the schema cache
```

This means the `candidate_tasks` table doesn't exist in your database yet. You need to run the migration.

---

## Quick Fix - Apply Migration in 5 Minutes

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project (the one with URL: `rnqwajmjfqlsrvhupram.supabase.co`)
3. Click on **"SQL Editor"** in the left sidebar

### Step 2: Open the Migration File

1. On your computer, open this file:
   ```
   C:\Users\Moussa Dieng\Desktop\Dev\jobsim\database\APPLY_MIGRATION_007.sql
   ```

2. **Select ALL the contents** of the file (Ctrl + A)

3. **Copy** it (Ctrl + C)

### Step 3: Run the Migration

1. In Supabase SQL Editor, click **"New query"**

2. **Paste** the entire migration SQL (Ctrl + V)

3. Click **"Run"** button (or press Ctrl + Enter)

4. You should see: ✅ **"Success. No rows returned"**

### Step 4: Verify Tables Were Created

Run this query to verify:

```sql
SELECT
  'candidate_tasks' as table_name,
  COUNT(*) as row_count
FROM public.candidate_tasks
UNION ALL
SELECT
  'ai_meetings' as table_name,
  COUNT(*) as row_count
FROM public.ai_meetings;
```

**Expected result:**
```
table_name       | row_count
-----------------|-----------
candidate_tasks  | 0
ai_meetings      | 0
```

### Step 5: Refresh Your Application

1. Go back to your browser with the app: `localhost:4200`
2. **Hard refresh** the page (Ctrl + Shift + R or Cmd + Shift + R on Mac)
3. The error should be gone!

---

## What This Migration Does

### Creates 2 New Tables:

**1. `candidate_tasks`**
- Tracks when candidates start tasks
- Records deadlines, completion times, scores
- Links candidates to tasks they're working on

**2. `ai_meetings`**
- Stores AI-generated meeting simulations
- Automatically created when task is started
- Includes kickoff, checkpoint, and review meetings

### Sets Up Security:

- **Row Level Security (RLS)** policies
- Candidates can only see their own tasks
- Admins can view all tasks
- Secure by default

### Creates Automation:

- **Trigger function** that automatically generates a kickoff meeting when a candidate starts a task
- Meeting scheduled 5 minutes after task start
- Includes agenda with key topics

---

## Troubleshooting

### Issue: "permission denied for schema public"

**Fix:** You need to be logged in as the database owner or postgres user.

1. In Supabase dashboard, check you're using the correct project
2. The SQL Editor should automatically use the right permissions

### Issue: "relation already exists"

**Fix:** Tables already exist. This is fine! The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.

### Issue: "foreign key constraint fails"

**Fix:** Make sure your `candidate_profiles` and `tasks` tables exist first.

Check with:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('candidate_profiles', 'tasks');
```

### Issue: Migration runs but error persists

**Fix:**

1. **Clear browser cache:**
   - Press Ctrl + Shift + Delete
   - Clear "Cached images and files"
   - Restart browser

2. **Verify tables in Supabase:**
   - Go to Table Editor in Supabase
   - Look for `candidate_tasks` and `ai_meetings` tables
   - They should appear in the list

3. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename IN ('candidate_tasks', 'ai_meetings');
   ```
   Should return 8 policies

---

## After Migration is Applied

### Test the Flow:

1. **Login** as a candidate
2. **Navigate** to a task detail page
3. **Click** "Démarrer la Tâche" button
4. You should see:
   - ✅ Success banner with deadline
   - ✅ "Soumettre le Travail" button enabled
   - ✅ AI Meetings section with kickoff meeting

### Verify in Database:

Check a record was created:
```sql
SELECT * FROM candidate_tasks
ORDER BY created_at DESC
LIMIT 5;
```

Check kickoff meeting was generated:
```sql
SELECT * FROM ai_meetings
WHERE meeting_type = 'kickoff'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Need Help?

If you encounter any issues:

1. **Check the Browser Console:**
   - Press F12
   - Look at Console tab for errors
   - Look at Network tab for failed requests

2. **Check Supabase Logs:**
   - In Supabase dashboard
   - Go to "Logs" section
   - Filter by "Database"

3. **Verify User Role:**
   ```sql
   SELECT id, email, role
   FROM profiles
   WHERE id = auth.uid();
   ```
   Make sure you're logged in as a 'candidate'

---

## Summary

**What to do:**
1. ✅ Open Supabase SQL Editor
2. ✅ Copy entire `APPLY_MIGRATION_007.sql` file
3. ✅ Paste and run in SQL Editor
4. ✅ Verify tables created
5. ✅ Refresh your app
6. ✅ Test starting a task

**Time required:** ~5 minutes

**Risk level:** Low (uses IF NOT EXISTS, safe to run multiple times)

**Rollback:** If needed, you can drop tables:
```sql
DROP TABLE IF EXISTS ai_meetings CASCADE;
DROP TABLE IF EXISTS candidate_tasks CASCADE;
```
(⚠️ Warning: This deletes all data!)

---

## Next Steps After Migration

Once migration is applied and working:

1. **Test thoroughly:**
   - Start a task
   - Submit work
   - Check deadline is correct
   - Verify meeting was created

2. **Consider adding:**
   - More meeting types (checkpoint, review)
   - Email notifications before deadline
   - XP rewards on completion
   - Progress percentage tracking

3. **Monitor:**
   - Check Supabase usage
   - Monitor RLS policy performance
   - Review trigger execution logs

Good luck! 🚀
