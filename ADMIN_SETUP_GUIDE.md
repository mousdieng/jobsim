# Admin System Setup Guide
**JobSim Senegal Platform**

## Overview

A complete admin system has been integrated into your JobSim platform with:
- Database migrations for admin roles and audit logging
- Role-based access control (RBAC)
- Admin dashboard with analytics
- User management interface
- Enterprise approval workflow
- Comprehensive audit trail

---

## Files Created/Modified

### Database Migrations
- `database/migrations/005_add_admin_system.sql` - Complete database schema for admin system

### Models
- `src/app/models/platform.model.ts` - Extended with admin types and interfaces

### Services
- `src/app/services/admin.service.ts` - Complete admin service with Supabase integration

### Guards
- `src/app/guards/auth.guard.ts` - Updated with adminGuard and superAdminGuard

### Components
- `src/app/pages/admin/admin-dashboard/` - Admin dashboard with stats
- `src/app/pages/admin/users-management/` - User management interface
- `src/app/pages/admin/enterprises-management/` - Enterprise approval interface

### Routes
- `src/app/app.routes.ts` - Added `/admin/*` routes with guard protection

---

## Setup Instructions

### Step 1: Run Database Migration

```bash
# Connect to your Supabase project
# Go to SQL Editor in Supabase Dashboard
# Copy and paste the content of: database/migrations/005_add_admin_system_v2.sql
# Run the migration
```

**Important:** Use `005_add_admin_system_v2.sql` (not v1) - it's compatible with your existing schema.

For quick admin operations after migration, see: `database/admin_quick_commands.sql`

This migration creates:
- Extended `user_type` enum with `enterprise` and `super_admin`
- Admin-specific fields in `users` table
- `admin_audit_logs` table for tracking all admin actions
- `enterprises` table for company accounts
- Admin fields in `tasks` and `submissions` tables
- Row-level security policies
- Helper functions for admin checks

### Step 2: Create Your First Super Admin

After running the migration, create a super admin account:

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → Create new user
3. Set email: `admin@jobsim-senegal.com` (or your preferred email)
4. Set a strong password
5. After creation, go to SQL Editor and run:

```sql
UPDATE users
SET user_type = 'super_admin',
    status = 'active',
    two_factor_enabled = true
WHERE email = 'admin@jobsim-senegal.com';
```

#### Option B: Via SQL

```sql
-- This creates a user in auth.users table
-- Then updates the users table
-- Replace with your email and user ID

UPDATE users
SET user_type = 'super_admin',
    status = 'active',
    name = 'Super Admin',
    two_factor_enabled = true
WHERE id = 'YOUR_USER_ID_HERE';
```

### Step 3: Build and Deploy

```bash
# Build the application
npm run build

# The build should complete successfully with admin components included
# Deploy to your hosting (Vercel, etc.)
```

### Step 4: Access Admin Panel

1. Log in with your super admin account
2. Navigate to: `https://yourdomain.com/admin/dashboard`
3. You should see the admin dashboard with platform statistics

---

## Admin System Features

### 1. Admin Dashboard (`/admin/dashboard`)
- Platform-wide statistics
- Pending actions (enterprise approvals, flagged content)
- Recent admin activity
- Quick links to management interfaces

### 2. User Management (`/admin/users`)
- View all users with filters (status, role, search)
- Suspend/unsuspend user accounts
- Ban users permanently
- View user statistics and activity
- All actions logged to audit trail

### 3. Enterprise Management (`/admin/enterprises`)
- Approve/reject enterprise registrations
- Suspend/unsuspend enterprise accounts
- View enterprise details and verification status
- Manage enterprise-posted tasks

### 4. Audit Logs (`/admin/audit-logs`)
- Complete history of all admin actions
- Filter by admin, action type, target
- 90-day reversibility window for certain actions
- Immutable audit trail

---

## User Roles

### Hierarchy
```
Super Admin (highest authority)
    ↓
Admin (platform moderator)
    ↓
Enterprise (company/recruiter)
    ↓
Mentor (instructor)
    ↓
Student (learner)
```

### Role Permissions

| Feature | Student | Mentor | Enterprise | Admin | Super Admin |
|---------|---------|--------|------------|-------|-------------|
| Submit tasks | ✅ | ✅ | ❌ | ✅ | ✅ |
| Create tasks | ❌ | ❌ | ✅ | ✅ | ✅ |
| View all users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Suspend users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Approve enterprises | ❌ | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create admins | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Security Features

### 1. Row-Level Security (RLS)
All tables have RLS policies that restrict access based on user role:
- Regular users can only see their own data
- Admins can see all data
- Audit logs are read-only for admins

### 2. Audit Trail
Every admin action is logged with:
- Admin user ID and email
- Action type and target
- Reason (required for destructive actions)
- IP address and session info
- Timestamp
- Before/after state (for reversibility)

### 3. Reversibility
Certain actions can be reversed within 90 days:
- User suspensions
- Enterprise suspensions
- Task/submission flags

### 4. Protected Actions
Critical actions require:
- Detailed reason (min 20 characters for score overrides)
- Confirmation modal
- Immediate audit log entry

---

## API Service Methods

The `AdminService` provides these methods:

### Analytics
- `getAdminStats()` - Platform-wide statistics

### User Management
- `getAllUsers(filters)` - Get all users with optional filters
- `suspendUser(userId, reason)` - Suspend a user account
- `unsuspendUser(userId)` - Reactivate suspended user
- `banUser(userId, reason)` - Permanently ban user

### Enterprise Management
- `getAllEnterprises(status)` - Get enterprises by status
- `approveEnterprise(enterpriseId)` - Approve pending enterprise
- `rejectEnterprise(enterpriseId, reason)` - Reject enterprise
- `suspendEnterprise(enterpriseId, reason)` - Suspend enterprise
- `unsuspendEnterprise(enterpriseId)` - Reactivate enterprise

### Task Management
- `getAllTasks(filters)` - Get all tasks with filters
- `approveTask(taskId)` - Approve flagged task
- `flagTask(taskId, reason)` - Flag task for review
- `featureTask(taskId, featured)` - Feature/unfeature task

### Submission Management
- `getAllSubmissions(filters)` - Get submissions with filters
- `overrideSubmissionScore(submissionId, newScore, reason)` - Override score
- `flagSubmission(submissionId, reason)` - Flag submission

### Audit Logs
- `getAuditLogs(filters)` - Get admin action history

---

## Adding New Admin Features

### 1. Add New Action to AdminService

```typescript
// In src/app/services/admin.service.ts
myNewAction(param: string): Observable<void> {
  return from(this.performMyNewAction(param));
}

private async performMyNewAction(param: string): Promise<void> {
  // Perform action in Supabase
  const { error } = await this.supabase
    .from('table_name')
    .update({ field: 'value' })
    .eq('id', param);

  if (error) throw error;

  // Log the action
  await this.logAction('my_new_action', 'target_type', param, 'Action reason');
}
```

### 2. Add Action Type to Model

```typescript
// In src/app/models/platform.model.ts
export type AdminActionType =
  | 'approve_enterprise'
  | 'my_new_action'  // Add here
  | ...;
```

### 3. Use in Component

```typescript
// In your component
this.adminService.myNewAction(id).subscribe({
  next: () => {
    console.log('Action completed');
    this.refresh();
  },
  error: (err) => console.error(err)
});
```

---

## Navigation Integration

To add admin link to main navigation, update `main-layout.component.html`:

```html
<!-- Add this link in the navigation section -->
<a
  *ngIf="isAdmin()"
  routerLink="/admin/dashboard"
  routerLinkActive="bg-white/20 text-white"
  class="text-indigo-100 hover:bg-white/10 hover:text-white inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group"
>
  <svg class="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
  Admin
</a>
```

And add method to component:

```typescript
// In main-layout.component.ts
isAdmin(): boolean {
  return this.user?.user_type === 'admin' || this.user?.user_type === 'super_admin';
}
```

---

## Testing

### Test Admin Access

1. Log in as super admin
2. Navigate to `/admin/dashboard`
3. Verify you can see:
   - Platform statistics
   - Pending actions
   - Recent admin activity

### Test User Management

1. Go to `/admin/users`
2. Try filtering by status/role
3. Try suspending a test user
4. Verify action appears in audit logs

### Test Enterprise Management

1. Create a test enterprise account
2. Go to `/admin/enterprises?status=pending`
3. Approve or reject the enterprise
4. Verify email notifications (if implemented)

### Test Authorization

1. Log in as regular user
2. Try accessing `/admin/dashboard`
3. Should be redirected to `/unauthorized`

---

## Monitoring & Maintenance

### Regular Tasks

1. **Weekly**: Review pending enterprise approvals
2. **Weekly**: Check flagged tasks and submissions
3. **Monthly**: Review admin audit logs
4. **Monthly**: Check for suspended accounts that can be unsuspended
5. **Quarterly**: Review admin access and permissions

### Audit Log Retention

- Default: 7 years (as per compliance standards)
- Configure in database migration if different retention needed
- Set up automated archival for old logs

### Performance

The admin system includes database indexes on:
- `admin_audit_logs`: admin_id, target (type + id), created_at, action_type
- `enterprises`: status, is_verified, admin_user_id
- `tasks`: enterprise_id, is_approved, flagged
- `submissions`: flagged, score_overridden

---

## Troubleshooting

### Can't access admin panel

**Problem**: Redirected to unauthorized page

**Solution**:
```sql
-- Check user role
SELECT id, email, user_type, status FROM users WHERE email = 'your@email.com';

-- Update if needed
UPDATE users SET user_type = 'admin' WHERE email = 'your@email.com';
```

### Admin actions not being logged

**Problem**: Audit logs table empty

**Solution**:
- Check RLS policies on `admin_audit_logs`
- Ensure `logAction()` method is being called
- Check browser console for errors

### Build errors

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
rm -rf .angular
npm run build
```

---

## Next Steps

### Recommended Enhancements

1. **Email Notifications**
   - Send email when user is suspended
   - Notify enterprises of approval/rejection
   - Send weekly admin summary

2. **Task Management Interface**
   - Create dedicated task approval page
   - Bulk actions for tasks
   - Task quality scoring

3. **Submission Review**
   - Interface for reviewing flagged submissions
   - Dispute resolution workflow
   - Score override history view

4. **Advanced Analytics**
   - User growth charts
   - Task completion trends
   - Enterprise engagement metrics

5. **Two-Factor Authentication**
   - Enforce 2FA for all admins
   - Integrate with authenticator app

---

## Support

For issues or questions:
- Check Supabase logs for database errors
- Review browser console for frontend errors
- Check admin audit logs for action history
- Review RLS policies if access issues

---

## Security Reminders

1. ✅ Never share admin credentials
2. ✅ Enable 2FA for all admin accounts
3. ✅ Regularly review audit logs
4. ✅ Use strong, unique passwords
5. ✅ Limit super admin access to 1-2 trusted people
6. ✅ Always provide detailed reasons for actions
7. ✅ Keep Supabase and dependencies updated
8. ✅ Monitor for suspicious activity

---

**Setup completed successfully!** 🎉

Your admin system is now ready to use. Access it at `/admin/dashboard` after logging in as an admin.
