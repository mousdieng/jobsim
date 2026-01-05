# Database Migration Guide

## Current Status

The Supabase MCP plugin is experiencing timeout issues. You'll need to apply the migrations manually through the Supabase Dashboard.

## How to Apply Migration 012 (UPDATED)

**Use migration 012 instead of 011** - it fixes compatibility with the existing audit logs table.

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your "JobSim" project
   - Navigate to "SQL Editor" in the left sidebar

2. **Apply the Migration**
   - Open the file `database/012_fix_audit_logs_and_strict_roles.sql`
   - Copy sections 1-12 one at a time into the SQL Editor
   - Run each section separately to avoid timeouts

3. **Recommended Order**
   ```
   Section 1: Users table audit columns
   Section 2: Enterprises table task creation control
   Section 3: Tasks table creator tracking
   Section 4: Audit logging table
   Section 5: Strict user creation policies
   Section 6: Strict task creation policies
   Section 7: Role assignment restrictions
   Section 8: Enterprise permission control
   Section 9: Support role restrictions
   Section 10: Audit log policies
   Section 11: Helper functions for audit logging
   Section 12: Triggers for automatic audit logging
   ```

4. **Verify Success**
   - Run the verification queries at the end of the migration file
   - Check that all columns were added
   - Verify RLS policies are in place

## What This Migration Does

### Schema Changes
- Adds `created_by_admin_id`, `role_assigned_at`, `role_assigned_by` to `users` table
- Adds `can_create_tasks`, `task_creation_enabled_by`, `task_creation_enabled_at` to `enterprises` table
- Adds `created_by_role`, `created_by_user_id` to `tasks` table
- Creates `admin_audit_logs` table for comprehensive audit trail

### Security Policies
- **Strict User Creation**: Only admins can create Support/Enterprise/Admin users
- **Strict Task Creation**: Only admins or enabled enterprises can create tasks
- **Role Protection**: Users cannot change their own roles
- **Enterprise Permissions**: Only admins can enable/disable task creation for enterprises
- **Support Restrictions**: Support role can view but cannot create/modify data

### Audit Logging
- Automatic logging of user creation/deletion/role changes
- Automatic logging of enterprise permission changes
- Helper function `log_admin_action()` for manual logging
- Triggers on `users` and `enterprises` tables

## After Migration

Once the migration is applied:
1. The Admin UI will be able to create users with proper role assignments
2. Enterprise task creation can be controlled via the Admin panel
3. All administrative actions will be logged to `admin_audit_logs`
4. RLS policies will enforce strict role boundaries at the database level

## Troubleshooting

### If you see "infinite recursion" errors:
- Make sure the `is_admin()` function exists and is marked `SECURITY DEFINER`
- Verify it's using `SECURITY DEFINER SET search_path = public`

### If policies fail to create:
- Drop the old policy first: `DROP POLICY IF EXISTS "policy_name" ON table_name;`
- Then create the new policy

### If columns already exist:
- The migration uses `IF NOT EXISTS` clauses, so it's safe to re-run
- Existing data won't be affected
