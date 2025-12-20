# Admin System Migration Steps

## ⚠️ Important: Run in Order

The admin system requires **3 migrations** to be run **in sequence**.

---

## Step 1: Add Enum Values

**File:** `database/migrations/005a_add_admin_enum_values.sql`

**What it does:** Adds `enterprise` and `super_admin` to the user_type enum

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy **entire contents** of `005a_add_admin_enum_values.sql`
3. Paste and click **"Run"**
4. Should complete in < 1 second

**Expected output:**
```
admin
enterprise
mentor
student
super_admin
```

---

## Step 2: Add Admin System Tables

**File:** `database/migrations/005b_add_admin_system.sql`

**What it does:** Creates admin_audit_logs table and adds admin columns to existing tables

**How to run:**
1. Still in SQL Editor
2. Copy **entire contents** of `005b_add_admin_system.sql`
3. Paste and click **"Run"**
4. Should complete in 2-5 seconds

**Expected output:**
```
NOTICE: Admin system successfully installed!
NOTICE: Next step: Create super admin with:
NOTICE: UPDATE users SET user_type = 'super_admin'...
```

---

## Step 3: Verify & Create Super Admin

**File:** `database/migrations/006_verify_and_create_admin.sql`

**What it does:** Verifies installation and helps you create your first super admin

**How to run:**
1. Still in SQL Editor
2. Copy **entire contents** of `006_verify_and_create_admin.sql`
3. Paste and click **"Run"** (first time - just to verify)
4. You'll see a list of existing users
5. **Edit the file:** Uncomment ONE of the UPDATE statements and add your email
6. Run again to create super admin

**Expected output (first run):**
```
✓ Enum value "enterprise" exists
✓ Enum value "super_admin" exists
✓ Table "admin_audit_logs" exists
✓ Column "users.status" exists
All checks passed! ✓
```

Then you'll see your list of users.

**Example modification:**
```sql
-- Find this section in the file:
/*
UPDATE users
SET user_type = 'super_admin',
    status = 'active',
    two_factor_enabled = false
WHERE email = 'your-email@example.com';
*/

-- Change to (remove /* */ and update email):
UPDATE users
SET user_type = 'super_admin',
    status = 'active',
    two_factor_enabled = false
WHERE email = 'moussa@example.com';  -- Your actual email
```

---

## Quick Summary

```bash
# In Supabase SQL Editor:

1. Run: 005a_add_admin_enum_values.sql
   ↓ Wait for completion

2. Run: 005b_add_admin_system.sql
   ↓ Wait for completion

3. Run: 006_verify_and_create_admin.sql
   ↓ See your users list
   ↓ Edit file to uncomment UPDATE statement
   ↓ Add your email
   ↓ Run again

4. Done! Access /admin/dashboard
```

---

## Verify It Worked

After all migrations, run this quick check:

```sql
-- Should return 1 row with your admin account
SELECT id, email, user_type, status
FROM users
WHERE user_type = 'super_admin';
```

---

## Files Explained

| File | Purpose | Run All at Once? |
|------|---------|------------------|
| `005a_add_admin_enum_values.sql` | Adds enum values | ✅ YES |
| `005b_add_admin_system.sql` | Creates admin system | ✅ YES |
| `006_verify_and_create_admin.sql` | Creates super admin | ⚠️ EDIT FIRST |
| `admin_quick_commands.sql` | Reference guide only | ❌ NO - Copy individual commands |

---

## Common Errors

### Error: "unsafe use of new value"
**Cause:** Tried to run 005b before 005a
**Fix:** Run 005a first, wait for it to complete, then run 005b

### Error: "invalid input syntax for type uuid"
**Cause:** Tried to run `admin_quick_commands.sql` all at once
**Fix:** That file is a reference guide. Use individual commands and replace placeholder UUIDs

### Error: "column status does not exist"
**Cause:** Migration 005b didn't complete
**Fix:** Re-run 005b (it's safe to run multiple times)

---

## After Setup

1. **Build your app:** `npm run build`
2. **Log in** with your super admin email
3. **Navigate to:** `/admin/dashboard`
4. **Reference:** Use `admin_quick_commands.sql` for day-to-day operations

---

## Need Help?

If you see any errors:
1. Note which file you were running (005a, 005b, or 006)
2. Copy the exact error message
3. Let me know and I'll help fix it immediately
