# Role-Based Architecture Specification

## Overview
This document defines the strict role-based access control system for the JobSim platform with four isolated roles and separate interfaces.

## Role Hierarchy (Strict - No Upward Escalation)

```
┌─────────────────────────────────────┐
│ ADMIN (Super Admin)                 │ ← Absolute Authority
│ - Full platform control             │
│ - User creation (all roles)         │
│ - Task creation (all types)         │
│ - Enterprise management             │
└─────────────────────────────────────┘
              ⬇
┌─────────────────────────────────────┐
│ SUPPORT (Operational)               │ ← Restricted Operations
│ - No user/task creation             │
│ - Ticket handling                   │
│ - Issue escalation                  │
│ - Limited moderation                │
└─────────────────────────────────────┘
              ⬇
┌─────────────────────────────────────┐
│ ENTERPRISE (Partner Company)        │ ← Conditional Permissions
│ - View assigned candidates          │
│ - Create tasks (if enabled)         │
│ - Cannot create users               │
│ - Own data only                     │
└─────────────────────────────────────┘
              ⬇
┌─────────────────────────────────────┐
│ STUDENT (Candidate)                 │ ← Strictly Limited
│ - Self-registration only            │
│ - Domain-based task access          │
│ - Cannot see enterprises            │
│ - Own submissions only              │
└─────────────────────────────────────┘
```

## 1. Admin Role - Absolute Authority

### 1.1 User Management Powers

**Admin Can:**
- ✅ Create users with roles: Admin, Support, Enterprise
- ✅ Assign or change any user role
- ✅ Disable, suspend, or delete any user
- ✅ Reset credentials and enforce security actions
- ✅ View full activity history of all users

**Admin Cannot Be:**
- ❌ Created by anyone except another Admin
- ❌ Downgraded by Support or Enterprise

### 1.2 Task Creation Authority

**Admin Task Powers:**
- ✅ Create tasks directly for any domain
- ✅ Create platform-owned tasks (generic simulations)
- ✅ Create enterprise-linked tasks (on behalf of partner)
- ✅ Edit, delete, archive, or reassign ANY task
- ✅ Override task evaluations
- ✅ Set task difficulty and evaluation rules

**Enterprise Task Creation:**
- ⚠️ Optional and Admin-controlled
- ⚠️ Only allowed if Admin enables it per enterprise
- ⚠️ Admin can revoke this capability at any time

### 1.3 Enterprise Control

**Admin Enterprise Powers:**
- ✅ Create enterprise accounts
- ✅ Define enterprise permissions (including task creation toggle)
- ✅ Monitor enterprise-created tasks
- ✅ Suspend or terminate enterprise access
- ✅ View all enterprise data and activities

### 1.4 Admin Interface Requirements

**Required Admin UI Sections:**

```
/admin
├── /dashboard              → System overview
├── /users
│   ├── /create            → Create Support/Enterprise/Admin
│   ├── /manage            → View, edit, suspend users
│   └── /roles             → Role assignment
├── /tasks
│   ├── /create            → Manual task creation
│   ├── /manage            → Edit/delete any task
│   ├── /assign            → Assign tasks to domains/enterprises
│   └── /evaluate          → Override evaluations
├── /enterprises
│   ├── /create            → Create enterprise accounts
│   ├── /manage            → Manage permissions
│   ├── /permissions       → Enable/disable task creation
│   └── /monitor           → View enterprise activities
├── /support
│   └── /tickets           → View all support tickets
└── /audit
    └── /logs              → Full audit trail
```

## 2. Support Role - Restricted Operations

### 2.1 Support Limitations (Hard Restrictions)

**Support CANNOT:**
- ❌ Create users
- ❌ Assign roles
- ❌ Create tasks
- ❌ Modify enterprise permissions
- ❌ Access Admin functions
- ❌ Delete or permanently modify data

### 2.2 Support Capabilities

**Support CAN:**
- ✅ Handle support tickets
- ✅ Assist users with navigation/issues
- ✅ Flag tasks for Admin review
- ✅ Temporarily hide tasks (pending Admin approval)
- ✅ Escalate issues to Admin
- ✅ View user activity (limited scope)

**All Support actions are:**
- 📝 Logged in audit trail
- 👁️ Reviewable by Admin
- ⏱️ Time-stamped with reason

### 2.3 Support Interface Requirements

```
/support
├── /dashboard              → Support ticket overview
├── /tickets
│   ├── /inbox             → New tickets
│   ├── /assigned          → My assigned tickets
│   └── /escalated         → Escalated to Admin
├── /tasks
│   └── /flagged           → Flag tasks for review (read-only)
├── /users
│   └── /assist            → User assistance (read-only)
└── /knowledge-base        → Help articles
```

## 3. Enterprise Role - Conditional Permissions

### 3.1 Enterprise Base Permissions

**All Enterprises Can:**
- ✅ View candidates who completed their tasks
- ✅ Review submissions to their tasks
- ✅ Rate and provide feedback on submissions
- ✅ View analytics for their tasks

**All Enterprises Cannot:**
- ❌ See students outside their task scope
- ❌ Create users
- ❌ Modify other enterprises' data
- ❌ Access platform-wide data

### 3.2 Conditional Task Creation

**If Admin Enables Task Creation:**
- ✅ Enterprise can create tasks in their domain
- ✅ Tasks must follow platform guidelines
- ✅ Admin can review and reject tasks
- ✅ Admin can disable this capability anytime

**Task Creation Toggle:**
```typescript
interface Enterprise {
  id: string;
  name: string;
  can_create_tasks: boolean; // Admin-controlled
  task_creation_enabled_by: string; // Admin user ID
  task_creation_enabled_at: timestamp;
}
```

### 3.3 Enterprise Interface Requirements

```
/enterprise
├── /dashboard              → Enterprise overview
├── /tasks
│   ├── /browse            → View own tasks
│   ├── /create            → Create tasks (if enabled)
│   └── /analytics         → Task performance
├── /candidates
│   └── /submissions       → View/rate submissions
└── /profile               → Enterprise profile
```

## 4. Student Role - Strictly Limited

### 4.1 Student Registration

**Student Creation:**
- ✅ Self-registration only
- ✅ Admin defines registration rules
- ✅ Assigned to domain(s) upon signup
- ❌ Cannot be created by other users

### 4.2 Student Permissions

**Students Can:**
- ✅ See tasks related to their domain(s)
- ✅ Submit solutions to tasks
- ✅ View own submissions and scores
- ✅ Update own profile

**Students Cannot:**
- ❌ See enterprise data outside assigned tasks
- ❌ View other students' submissions
- ❌ Create or modify tasks
- ❌ Access platform administration

### 4.3 Student Interface Requirements

```
/app
├── /dashboard              → Student dashboard
├── /tasks
│   ├── /browse            → Domain-filtered tasks
│   └── /detail/:id        → Task details
├── /submissions
│   └── /my-submissions    → Own submissions only
└── /profile               → Student profile
```

## 5. Interface Separation (Mandatory)

### 5.1 Separate Layouts

Each role has a **completely isolated layout**:

```typescript
// Admin Layout
AdminLayoutComponent
├── Admin Navigation
├── Admin Sidebar
└── Admin Content Area

// Support Layout
SupportLayoutComponent
├── Support Navigation
├── Support Sidebar
└── Support Content Area

// Enterprise Layout
EnterpriseLayoutComponent
├── Enterprise Navigation
├── Enterprise Sidebar
└── Enterprise Content Area

// Student Layout (Main Layout)
MainLayoutComponent
├── Student Navigation
├── Student Sidebar
└── Student Content Area
```

### 5.2 Separate Routes

**No route overlap or shared dashboards:**

```typescript
// Admin routes - /admin/*
/admin/dashboard
/admin/users/create
/admin/tasks/create
/admin/enterprises/manage

// Support routes - /support/*
/support/dashboard
/support/tickets
/support/tasks/flagged

// Enterprise routes - /enterprise/*
/enterprise/dashboard
/enterprise/tasks
/enterprise/candidates

// Student routes - /app/*
/app/dashboard
/app/tasks
/app/submissions
```

### 5.3 Permission Guards

**Each route is protected:**

```typescript
// Admin routes
{
  path: 'admin',
  canActivate: [authGuard, adminGuard],
  loadComponent: () => AdminLayoutComponent
}

// Support routes
{
  path: 'support',
  canActivate: [authGuard, supportGuard],
  loadComponent: () => SupportLayoutComponent
}

// Enterprise routes
{
  path: 'enterprise',
  canActivate: [authGuard, enterpriseGuard],
  loadComponent: () => EnterpriseLayoutComponent
}

// Student routes
{
  path: 'app',
  canActivate: [authGuard, studentGuard],
  loadComponent: () => MainLayoutComponent
}
```

## 6. Permission Matrix

| Action | Admin | Support | Enterprise | Student |
|--------|-------|---------|------------|---------|
| **User Management** |
| Create Support | ✅ | ❌ | ❌ | ❌ |
| Create Enterprise | ✅ | ❌ | ❌ | ❌ |
| Create Admin | ✅ | ❌ | ❌ | ❌ |
| Assign roles | ✅ | ❌ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ | ❌ |
| **Task Management** |
| Create tasks | ✅ | ❌ | ⚠️ Conditional | ❌ |
| Edit any task | ✅ | ❌ | Own only | ❌ |
| Delete tasks | ✅ | ❌ | Own only | ❌ |
| Moderate tasks | ✅ | Flag only | Own only | ❌ |
| Override evaluations | ✅ | ❌ | ❌ | ❌ |
| **Enterprise Management** |
| Create enterprise | ✅ | ❌ | ❌ | ❌ |
| Enable task creation | ✅ | ❌ | ❌ | ❌ |
| Suspend enterprise | ✅ | ❌ | ❌ | ❌ |
| **Data Access** |
| View all users | ✅ | Partial | Own scope | Own only |
| View all tasks | ✅ | Partial | Own only | Domain only |
| View all submissions | ✅ | ❌ | Own tasks | Own only |
| View audit logs | ✅ | Own actions | ❌ | ❌ |
| **System Configuration** |
| Configure platform | ✅ | ❌ | ❌ | ❌ |
| Manage domains | ✅ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ |

## 7. Database Schema Updates

### 7.1 Users Table

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS role_assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS role_assigned_by UUID REFERENCES users(id);

-- Enforce: Only admins can create Support/Enterprise/Admin users
CREATE POLICY "only_admins_create_users"
  ON users FOR INSERT
  WITH CHECK (
    -- Self-registration for students
    (NEW.user_type = 'student')
    OR
    -- Admin creating other roles
    (NEW.user_type IN ('admin', 'support', 'enterprise')
     AND is_admin(auth.uid()))
  );
```

### 7.2 Enterprises Table

```sql
ALTER TABLE enterprises
ADD COLUMN IF NOT EXISTS can_create_tasks BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS task_creation_enabled_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS task_creation_enabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS task_creation_disabled_at TIMESTAMPTZ;
```

### 7.3 Tasks Table

```sql
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS created_by_role TEXT CHECK (created_by_role IN ('admin', 'enterprise', 'platform')),
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id);

-- Enforce: Only admins or enabled enterprises can create tasks
CREATE POLICY "task_creation_control"
  ON tasks FOR INSERT
  WITH CHECK (
    -- Admin can always create
    is_admin(auth.uid())
    OR
    -- Enterprise if enabled
    (created_by_role = 'enterprise'
     AND enterprise_id IN (
       SELECT id FROM enterprises
       WHERE admin_user_id = auth.uid()
       AND can_create_tasks = true
     ))
  );
```

## 8. Audit Logging Strategy

### 8.1 Logged Actions

**All Admin actions logged:**
- User creation/deletion/role changes
- Task creation/modification/deletion
- Enterprise permission changes
- System configuration changes

**All Support actions logged:**
- Ticket handling
- Task flagging
- User assistance
- Escalations

**Audit Log Schema:**
```typescript
interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: 'admin' | 'support' | 'enterprise' | 'student';
  action_type: string;
  target_type: 'user' | 'task' | 'enterprise' | 'submission';
  target_id: string;
  before_state: any;
  after_state: any;
  reason?: string;
  ip_address: string;
  created_at: timestamp;
}
```

## 9. Implementation Checklist

- [ ] Database schema updates
- [ ] RLS policies for strict permissions
- [ ] Admin UI components
- [ ] Support UI components
- [ ] Enterprise UI components
- [ ] Student UI updates
- [ ] Separate layouts for each role
- [ ] Route guards and navigation
- [ ] Permission service
- [ ] Audit logging service
- [ ] Testing role isolation
- [ ] Documentation

## 10. Security Principles

1. **Principle of Least Privilege**: Each role has minimum necessary permissions
2. **No Privilege Escalation**: Roles cannot elevate themselves
3. **Explicit Deny**: Default deny unless explicitly allowed
4. **Audit Everything**: All privileged actions logged
5. **Separate Interfaces**: No shared UI components between roles
6. **Database Enforcement**: Permissions enforced at RLS level, not just UI

---

**Last Updated:** 2025-12-20
**Version:** 1.0
**Status:** Implementation In Progress
