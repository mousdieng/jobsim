# Migration 012 - Fixed Audit Logs & Strict Role System

## What Was Fixed

The error you encountered was caused by the existing `admin_audit_logs` table having different column names than the new migration expected.

**Error**: `column "actor_id" does not exist`

**Cause**: The table was created earlier with columns `admin_id` and `admin_email`, but the new strict role system needs `actor_id` and `actor_role` to support all user roles (not just admin).

## Solution

Created **migration 012** (`database/012_fix_audit_logs_and_strict_roles.sql`) which:

✅ **Adds new columns** to existing table instead of creating it
✅ **Migrates data** from old columns to new columns
✅ **Preserves existing audit logs** - no data loss
✅ **Maintains backward compatibility** - both old and new columns work
✅ **Adds error handling** to triggers - won't break main operations

## How to Apply

### Option 1: Apply Full Migration (Recommended)

Copy and run the entire file `database/012_fix_audit_logs_and_strict_roles.sql` in Supabase SQL Editor.

### Option 2: Apply Section by Section

If timeouts occur, apply these sections one at a time:

```sql
-- Section 1: Users table audit columns
-- Section 2: Enterprises table task creation control
-- Section 3: Tasks table creator tracking
-- Section 4: Update audit logs table (CRITICAL - fixes the error)
-- Section 5: Strict user creation policies
-- Section 6: Strict task creation policies
-- Section 7: Role assignment restrictions
-- Section 8: Enterprise permission control
-- Section 9: Support role restrictions
-- Section 10: Audit log policies
-- Section 11: Helper function for audit logging
-- Section 12: Triggers for automatic logging
```

**Most Important**: Section 4 fixes the column issue.

## What Changed in the Code

### Admin Service (`src/app/services/admin.service.ts`)

Updated the `logAction()` method to use new column names:

```typescript
// OLD (before)
{
  admin_id: user.id,
  admin_email: user.email,
  ...
}

// NEW (after)
{
  actor_id: user.id,
  actor_role: profile?.user_type || 'admin',
  // Keep old columns for backward compatibility
  admin_id: user.id,
  admin_email: user.email,
  ...
}
```

The service now:
- Fetches the user's role from the `users` table
- Logs with `actor_id` and `actor_role` (new system)
- Also includes `admin_id` and `admin_email` (backward compatibility)

## Migration 012 vs Migration 011

**Use Migration 012** - it's the corrected version.

| Feature | Migration 011 | Migration 012 |
|---------|---------------|---------------|
| Creates new table | ❌ Conflicts with existing | ✅ Updates existing table |
| Preserves data | ❌ Would lose audit logs | ✅ Migrates existing data |
| Backward compatible | ❌ No | ✅ Yes |
| Error handling | ❌ Basic | ✅ Enhanced with exceptions |

## After Migration

Once applied, you'll be able to:

✅ Create Admin/Support/Enterprise users (not students)
✅ Change user roles with audit trails
✅ Enable/disable enterprise task creation
✅ Track who created users and when roles were assigned
✅ View comprehensive audit logs with actor role information

## Verify Migration Success

Run these queries after applying the migration:

```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_audit_logs'
AND column_name IN ('actor_id', 'actor_role', 'before_state', 'after_state');

-- Check data was migrated
SELECT actor_id, actor_role, action_type, created_at
FROM admin_audit_logs
ORDER BY created_at DESC
LIMIT 5;

-- Verify RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'admin_audit_logs';
```

## Troubleshooting

### If you still see column errors:

1. **Check which section failed**: The error message will indicate the line number
2. **Apply Section 4 first**: This adds the missing columns
3. **Then apply other sections**: Once columns exist, other sections should work

### If migration succeeds but UI shows errors:

1. **Clear browser cache**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear auth storage**: Open `clear-auth.html` in browser
3. **Rebuild the app**: `npm run build`

## Next Steps

After successful migration:

1. ✅ Test user creation from Admin UI
2. ✅ Test role changes with audit logging
3. ✅ Verify RLS policies block unauthorized access
4. ✅ Check audit logs viewer shows entries

## Files Changed

- `database/012_fix_audit_logs_and_strict_roles.sql` - NEW migration (use this)
- `src/app/services/admin.service.ts` - Updated logAction method
- `DATABASE_MIGRATION_GUIDE.md` - Updated to reference migration 012

## Support

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Verify your admin user exists: `SELECT * FROM users WHERE user_type = 'admin'`
3. Check if the `is_admin()` function exists: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'is_admin'`
