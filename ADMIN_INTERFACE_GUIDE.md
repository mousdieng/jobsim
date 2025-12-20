# Admin Interface Guide - JobSim

## Overview

This guide describes the interfaces and permissions for users with the **admin** role (top-level administrators).

## Role Hierarchy

```
┌─────────────────────────────────────────────┐
│ admin (Platform Governance)                 │ ← Full authority
├─────────────────────────────────────────────┤
│ support (Platform Operations)               │ ← Operational support
├─────────────────────────────────────────────┤
│ enterprise (Enterprise Recruiters)          │ ← Task creation & hiring
├─────────────────────────────────────────────┤
│ student (Candidates)                        │ ← Task solving
└─────────────────────────────────────────────┘
```

## Admin Role Permissions (12 Total)

### 🔒 **Platform Governance**
- **platform.govern** - Full platform authority
  - Highest level of control
  - Can override any decision
  - Access to all system features

### 🏢 **Enterprise Management**
- **enterprises.create** - Create new enterprises
- **enterprises.verify** - Approve enterprise registrations
- **enterprises.manage** - Suspend, ban, or modify enterprises

### 👥 **User Management**
- **users.manage** - Suspend, ban, or modify any user
- **roles.assign** - Promote users to different roles

### 📋 **Task Management**
- **tasks.create** - Create platform tasks
- **tasks.validate** - Approve/reject task validations
- **tasks.manage** - Flag, feature, or modify tasks

### 📝 **Submission Management**
- **submissions.review** - Review and score submissions
- **submissions.override** - Override submission scores (requires 20+ char reason)

### 📊 **Audit & Monitoring**
- **audit.view** - Access full audit trail

## Admin Dashboard Features

### 1. **Statistics Overview**
```typescript
{
  total_users: number;
  total_enterprises: number;
  total_tasks: number;
  total_submissions: number;
  pending_enterprises: number;
  pending_task_approvals: number;
  flagged_tasks: number;
  suspended_users: number;
  recent_actions: AdminAuditLog[];
}
```

### 2. **User Management** (`/admin/users`)
Available Operations:
- ✅ View all users with filters (status, role, search)
- ✅ Suspend user (with reason)
- ✅ Unsuspend user
- ✅ Ban user (with reason)
- ✅ View user details
- ✅ Change user roles

### 3. **Enterprise Management** (`/admin/enterprises`)
Available Operations:
- ✅ View all enterprises (filter by status)
- ✅ Approve enterprise registration
- ✅ Reject enterprise (with reason)
- ✅ Suspend enterprise (with reason)
- ✅ Unsuspend enterprise
- ✅ Verify enterprise status

### 4. **Task Lifecycle Management** (`/admin/tasks`)
Task Workflow:
```
draft → validation_pending → active → archived
```

Available Operations:
- ✅ View tasks by lifecycle status
- ✅ Submit task for validation
- ✅ Validate task (activate)
- ✅ Reject task validation (send back to draft)
- ✅ Archive task
- ✅ Flag task for review
- ✅ Feature/unfeature task

**Important:** Admins CANNOT validate tasks they created (prevented by database trigger)

### 5. **Submission Management**
Available Operations:
- ✅ View all submissions
- ✅ Filter flagged submissions
- ✅ Override submission scores
  - Requires detailed reason (min 20 characters)
  - Creates audit log entry
- ✅ Flag submission for review

### 6. **Audit Logs** (`/admin/audit-logs`)
Available Operations:
- ✅ View all admin actions
- ✅ Filter by:
  - Admin ID
  - Action type
  - Target type (user/enterprise/task/submission)
- ✅ View reversible actions
- ✅ Track reversed actions

## Support Role Permissions (8 Total)

The **support** role has operational permissions but lacks governance authority:

### ✅ Support Can Do:
- **platform.support** - Operational support role
- **tasks.create** - Create platform tasks
- **tasks.validate** - Flag tasks for review (not final approval)
- **tasks.moderate** - Flag inappropriate tasks
- **submissions.review** - Review and score submissions
- **users.support** - Assist users with issues
- **disputes.mediate** - Handle user disputes
- **audit.view** - Access audit trail

### ❌ Support Cannot Do:
- Change user roles
- Approve/reject enterprises
- Override submission scores
- Manage platform-wide settings

## Routes & Guards

### Admin Routes
All admin routes require both `authGuard` and `adminGuard`:

```typescript
/admin
  ├── /dashboard       → Admin overview
  ├── /users          → User management
  ├── /enterprises    → Enterprise management
  ├── /tasks          → Task management
  └── /audit-logs     → Audit trail
```

### Route Protection
```typescript
adminGuard: ['admin', 'support']  // Both can access admin panel
superAdminGuard: ['admin']        // Only top admin
supportGuard: ['support']         // Only support staff
```

## Admin Service API

### User Management
```typescript
getAllUsers(filters?: { status, user_type, search }): Observable<UserProfile[]>
suspendUser(userId: string, reason: string): Observable<void>
unsuspendUser(userId: string): Observable<void>
banUser(userId: string, reason: string): Observable<void>
```

### Enterprise Management
```typescript
getAllEnterprises(status?: string): Observable<Enterprise[]>
approveEnterprise(enterpriseId: string): Observable<void>
rejectEnterprise(enterpriseId: string, reason: string): Observable<void>
suspendEnterprise(enterpriseId: string, reason: string): Observable<void>
unsuspendEnterprise(enterpriseId: string): Observable<void>
```

### Task Lifecycle
```typescript
submitTaskForValidation(taskId: string): Observable<void>
validateTask(taskId: string, notes?: string): Observable<void>
rejectTaskValidation(taskId: string, reason: string): Observable<void>
archiveTask(taskId: string, reason?: string): Observable<void>
getTasksByLifecycleStatus(status: 'draft' | 'validation_pending' | 'active' | 'archived'): Observable<Task[]>
```

### Submission Management
```typescript
getAllSubmissions(filters?: { flagged }): Observable<TaskSubmission[]>
overrideSubmissionScore(submissionId: string, newScore: number, reason: string): Observable<void>
flagSubmission(submissionId: string, reason: string): Observable<void>
```

### Audit Logs
```typescript
getAuditLogs(filters?: {
  admin_id?: string;
  action_type?: string;
  target_type?: string;
  limit?: number;
}): Observable<AdminAuditLog[]>
```

## Security Features

### 1. **Audit Trail**
Every admin action is logged:
```typescript
{
  admin_id: string;
  admin_email: string;
  action_type: AdminActionType;
  target_type: 'user' | 'enterprise' | 'task' | 'submission' | 'setting';
  target_id: string;
  reason?: string;
  before_state?: any;
  after_state?: any;
  ip_address: string;
  reversible: boolean;
  reversible_until?: timestamp;
  reversed: boolean;
  created_at: timestamp;
}
```

### 2. **Reversible Actions**
Actions that can be reversed (90-day window):
- Suspend user
- Suspend enterprise
- Flag task
- Flag submission

### 3. **Self-Validation Prevention**
Database trigger prevents:
- Task creators from validating their own tasks
- Conflict of interest scenarios

### 4. **Required Reasons**
Certain actions require detailed justification:
- Score overrides (min 20 characters)
- User bans
- Enterprise rejections
- Suspensions

## Best Practices for Admins

### 1. **Always Provide Context**
When taking actions, provide clear reasons that:
- Explain why the action was taken
- Reference relevant policies or guidelines
- Help future admins understand the decision

### 2. **Use Task Lifecycle Properly**
- Tasks should flow: draft → validation_pending → active
- Never activate tasks without validation
- Archive tasks when they're no longer relevant

### 3. **Review Audit Logs Regularly**
- Monitor for unusual patterns
- Check reversed actions
- Verify compliance with policies

### 4. **Score Overrides**
Use sparingly and only when:
- Original score is clearly incorrect
- Evidence supports the override
- Detailed reason is provided (20+ chars)

### 5. **User Management**
- Suspend first, ban only for serious violations
- Document suspension reasons clearly
- Review suspended users periodically

## Database Tables

### Admin-Specific Tables

#### `admin_audit_logs`
Tracks all administrative actions

#### `role_permissions`
Defines what each role can do:
```sql
SELECT * FROM role_permissions WHERE role_type = 'admin';
-- Returns 12 permissions
```

#### `user_roles_metadata`
Extended role information per user

## Permission Checking

### Frontend
```typescript
// Using PermissionService
canManageUsers(userRole: UserRole): boolean
canManageEnterprises(userRole: UserRole): boolean
canOverrideScores(userRole: UserRole): boolean
hasPlatformGovernance(userRole: UserRole): boolean

// Using role utils
isAdmin(userRole: UserRole): boolean
isSuperAdmin(userRole: UserRole): boolean
```

### Backend (RLS Policies)
```sql
-- Admins can see all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()) OR auth.uid() = id);

-- Admins can see all tasks
CREATE POLICY "platform_staff_see_all_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));
```

## UI Components

### Badge Colors
```typescript
getUserRoleBadge(role: string): string {
  switch (role) {
    case 'admin':       return 'bg-purple-100 text-purple-800';
    case 'support':     return 'bg-indigo-100 text-indigo-800';
    case 'enterprise':  return 'bg-blue-100 text-blue-800';
    default:            return 'bg-gray-100 text-gray-800';
  }
}
```

### Role Display Names
```typescript
const ROLE_DISPLAY_NAMES = {
  admin: 'Admin',
  support: 'Platform Support',
  enterprise: 'Enterprise Recruiter',
  student: 'Candidate'
};
```

## Migration Notes

### Old → New Role Mapping
- `super_admin` → `admin` (governance)
- `admin` → `support` (operations)
- `mentor` → `support` (legacy compatibility)

All existing users with `super_admin` have been migrated to `admin`.
All existing users with `admin` have been migrated to `support`.

---

**Last Updated:** 2025-12-19
**Database:** PostgreSQL 17.6.1
**Framework:** Angular + Supabase
