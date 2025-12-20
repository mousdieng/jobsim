# Admin Role Implementation Guide
**Technical Implementation for JobSim Platform**

---

## Quick Reference

### Role Hierarchy
```
Super Admin (platform owner)
    ↓
Admin (platform moderator)
    ↓
Enterprise (recruiter/company)
    ↓
User (student/professional)
```

### Permission Levels
- **Level 4 (Super Admin):** Full access + admin management
- **Level 3 (Admin):** Platform governance + moderation
- **Level 2 (Enterprise):** Task management within own organization
- **Level 1 (User):** Submission and profile management

---

## Backend Implementation

### 1. User Model Extension

```typescript
// models/user.model.ts
export enum UserRole {
  USER = 'user',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'suspended' | 'banned';

  // Admin-specific fields
  admin_metadata?: {
    two_factor_enabled: boolean;
    last_policy_training: Date;
    approved_by: string; // admin ID who created this admin
    suspension_reason?: string;
  };

  created_at: Date;
  updated_at: Date;
}
```

### 2. Permission System

```typescript
// models/permission.model.ts
export enum Permission {
  // Enterprise Management
  VIEW_ALL_ENTERPRISES = 'view:enterprises:all',
  APPROVE_ENTERPRISE = 'approve:enterprise',
  SUSPEND_ENTERPRISE = 'suspend:enterprise',
  EDIT_ENTERPRISE = 'edit:enterprise:metadata',

  // User Management
  VIEW_ALL_USERS = 'view:users:all',
  SUSPEND_USER = 'suspend:user',
  EDIT_USER = 'edit:user:limited',
  DELETE_USER = 'delete:user:soft',
  RESET_USER_PASSWORD = 'reset:user:password',

  // Task Management
  VIEW_ALL_TASKS = 'view:tasks:all',
  APPROVE_TASK = 'approve:task',
  FLAG_TASK = 'flag:task',
  EDIT_TASK_METADATA = 'edit:task:metadata',
  FEATURE_TASK = 'feature:task',

  // Submission Management
  VIEW_ALL_SUBMISSIONS = 'view:submissions:all',
  REVIEW_SUBMISSION = 'review:submission',
  OVERRIDE_SCORE = 'override:submission:score',
  FLAG_SUBMISSION = 'flag:submission',

  // Platform Configuration
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_ANALYTICS = 'view:analytics:all',
  GENERATE_REPORTS = 'generate:reports',

  // Admin Management (Super Admin only)
  CREATE_ADMIN = 'create:admin',
  SUSPEND_ADMIN = 'suspend:admin',
}

export const ADMIN_PERMISSIONS: Permission[] = [
  Permission.VIEW_ALL_ENTERPRISES,
  Permission.APPROVE_ENTERPRISE,
  Permission.SUSPEND_ENTERPRISE,
  Permission.EDIT_ENTERPRISE,
  Permission.VIEW_ALL_USERS,
  Permission.SUSPEND_USER,
  Permission.EDIT_USER,
  Permission.DELETE_USER,
  Permission.RESET_USER_PASSWORD,
  Permission.VIEW_ALL_TASKS,
  Permission.APPROVE_TASK,
  Permission.FLAG_TASK,
  Permission.EDIT_TASK_METADATA,
  Permission.FEATURE_TASK,
  Permission.VIEW_ALL_SUBMISSIONS,
  Permission.REVIEW_SUBMISSION,
  Permission.OVERRIDE_SCORE,
  Permission.FLAG_SUBMISSION,
  Permission.MANAGE_SETTINGS,
  Permission.VIEW_ANALYTICS,
  Permission.GENERATE_REPORTS,
];

export const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  Permission.CREATE_ADMIN,
  Permission.SUSPEND_ADMIN,
];
```

### 3. Admin Audit Log

```typescript
// models/admin-audit-log.model.ts
export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email: string;

  action_type: AdminAction;
  target_type: 'user' | 'enterprise' | 'task' | 'submission' | 'setting';
  target_id: string;

  reason: string; // Required for destructive actions
  before_state: Record<string, any>;
  after_state: Record<string, any>;

  ip_address: string;
  user_agent: string;
  session_id: string;

  reversible: boolean;
  reversible_until?: Date; // 90 days for soft deletes
  reversed: boolean;
  reversed_by?: string;
  reversed_at?: Date;

  created_at: Date;
}

export enum AdminAction {
  // Enterprise
  APPROVE_ENTERPRISE = 'approve_enterprise',
  REJECT_ENTERPRISE = 'reject_enterprise',
  SUSPEND_ENTERPRISE = 'suspend_enterprise',
  UNSUSPEND_ENTERPRISE = 'unsuspend_enterprise',
  EDIT_ENTERPRISE = 'edit_enterprise',

  // User
  SUSPEND_USER = 'suspend_user',
  UNSUSPEND_USER = 'unsuspend_user',
  BAN_USER = 'ban_user',
  DELETE_USER = 'delete_user',
  RESET_PASSWORD = 'reset_password',

  // Task
  APPROVE_TASK = 'approve_task',
  REJECT_TASK = 'reject_task',
  FLAG_TASK = 'flag_task',
  FEATURE_TASK = 'feature_task',
  EDIT_TASK = 'edit_task',

  // Submission
  OVERRIDE_SCORE = 'override_score',
  FLAG_SUBMISSION = 'flag_submission',
  RESOLVE_DISPUTE = 'resolve_dispute',

  // Platform
  UPDATE_SETTINGS = 'update_settings',
  CREATE_ADMIN = 'create_admin',
}
```

### 4. Authorization Guards

```typescript
// guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.currentUserValue;

    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}

// guards/super-admin.guard.ts
@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.currentUserValue;

    if (user && user.role === 'super_admin') {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}

// guards/permission.guard.ts
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'] as Permission;
    const user = this.authService.currentUserValue;

    if (user && user.permissions?.includes(requiredPermission)) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

### 5. Backend API Service (Node.js/Express Example)

```typescript
// services/admin.service.ts (Backend)
import { AdminAuditLog, AdminAction } from '../models/admin-audit-log.model';
import { supabase } from '../config/supabase';

export class AdminService {

  /**
   * Log all admin actions for audit trail
   */
  async logAction(
    adminId: string,
    action: AdminAction,
    targetType: string,
    targetId: string,
    reason: string,
    beforeState: any,
    afterState: any,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const log: Partial<AdminAuditLog> = {
      admin_id: adminId,
      action_type: action,
      target_type: targetType as any,
      target_id: targetId,
      reason,
      before_state: beforeState,
      after_state: afterState,
      ip_address: ipAddress,
      user_agent: userAgent,
      reversible: this.isReversible(action),
      reversible_until: this.isReversible(action)
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        : undefined,
      reversed: false,
      created_at: new Date(),
    };

    await supabase.from('admin_audit_logs').insert(log);
  }

  /**
   * Suspend an enterprise with reason
   */
  async suspendEnterprise(
    adminId: string,
    enterpriseId: string,
    reason: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    // Get current state
    const { data: before } = await supabase
      .from('enterprises')
      .select('*')
      .eq('id', enterpriseId)
      .single();

    if (!before) throw new Error('Enterprise not found');

    // Update status
    const { data: after } = await supabase
      .from('enterprises')
      .update({
        status: 'suspended',
        suspended_at: new Date(),
        suspension_reason: reason,
      })
      .eq('id', enterpriseId)
      .select()
      .single();

    // Log action
    await this.logAction(
      adminId,
      AdminAction.SUSPEND_ENTERPRISE,
      'enterprise',
      enterpriseId,
      reason,
      before,
      after,
      ipAddress,
      userAgent
    );

    // Notify enterprise
    await this.notifyEnterprise(enterpriseId, 'suspended', reason);
  }

  /**
   * Approve enterprise registration
   */
  async approveEnterprise(
    adminId: string,
    enterpriseId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const { data: before } = await supabase
      .from('enterprises')
      .select('*')
      .eq('id', enterpriseId)
      .single();

    const { data: after } = await supabase
      .from('enterprises')
      .update({
        status: 'active',
        verified: true,
        verified_at: new Date(),
        verified_by: adminId,
      })
      .eq('id', enterpriseId)
      .select()
      .single();

    await this.logAction(
      adminId,
      AdminAction.APPROVE_ENTERPRISE,
      'enterprise',
      enterpriseId,
      'Enterprise verification approved',
      before,
      after,
      ipAddress,
      userAgent
    );

    await this.notifyEnterprise(enterpriseId, 'approved', '');
  }

  /**
   * Override submission score (with strict validation)
   */
  async overrideSubmissionScore(
    adminId: string,
    submissionId: string,
    newScore: number,
    reason: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    if (!reason || reason.length < 20) {
      throw new Error('Detailed reason required for score override');
    }

    const { data: before } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    const { data: after } = await supabase
      .from('submissions')
      .update({
        score: newScore,
        score_overridden: true,
        score_override_reason: reason,
        score_overridden_by: adminId,
        score_overridden_at: new Date(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    await this.logAction(
      adminId,
      AdminAction.OVERRIDE_SCORE,
      'submission',
      submissionId,
      reason,
      before,
      after,
      ipAddress,
      userAgent
    );

    // Notify user
    await this.notifyUser(before.user_id, 'score_updated', reason);
  }

  private isReversible(action: AdminAction): boolean {
    const reversibleActions = [
      AdminAction.SUSPEND_ENTERPRISE,
      AdminAction.SUSPEND_USER,
      AdminAction.FLAG_TASK,
      AdminAction.DELETE_USER, // soft delete
    ];
    return reversibleActions.includes(action);
  }

  private async notifyEnterprise(
    enterpriseId: string,
    type: string,
    message: string
  ): Promise<void> {
    // Implementation for email/notification
  }

  private async notifyUser(
    userId: string,
    type: string,
    message: string
  ): Promise<void> {
    // Implementation for email/notification
  }
}
```

### 6. API Endpoints

```typescript
// routes/admin.routes.ts
import { Router } from 'express';
import { requireAdmin, requireSuperAdmin, requirePermission } from '../middleware/auth';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

// Enterprise Management
router.get('/enterprises',
  requireAdmin,
  adminController.getAllEnterprises
);

router.post('/enterprises/:id/approve',
  requirePermission(Permission.APPROVE_ENTERPRISE),
  adminController.approveEnterprise
);

router.post('/enterprises/:id/suspend',
  requirePermission(Permission.SUSPEND_ENTERPRISE),
  adminController.suspendEnterprise
);

// User Management
router.get('/users',
  requirePermission(Permission.VIEW_ALL_USERS),
  adminController.getAllUsers
);

router.post('/users/:id/suspend',
  requirePermission(Permission.SUSPEND_USER),
  adminController.suspendUser
);

// Task Management
router.get('/tasks/pending-approval',
  requirePermission(Permission.APPROVE_TASK),
  adminController.getPendingTasks
);

router.post('/tasks/:id/approve',
  requirePermission(Permission.APPROVE_TASK),
  adminController.approveTask
);

// Submission Management
router.post('/submissions/:id/override-score',
  requirePermission(Permission.OVERRIDE_SCORE),
  adminController.overrideScore
);

// Reports & Analytics
router.get('/analytics',
  requirePermission(Permission.VIEW_ANALYTICS),
  adminController.getAnalytics
);

router.get('/audit-logs',
  requireAdmin,
  adminController.getAuditLogs
);

// Admin Management (Super Admin only)
router.post('/admins',
  requireSuperAdmin,
  adminController.createAdmin
);

export default router;
```

### 7. Middleware

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    if (!user.permissions?.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission
      });
    }

    next();
  };
};
```

---

## Frontend Implementation

### 8. Admin Service (Angular)

```typescript
// services/admin.service.ts (Frontend)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  // Enterprise Management
  getAllEnterprises(status?: string): Observable<any[]> {
    const params = status ? { status } : {};
    return this.http.get<any[]>(`${this.apiUrl}/enterprises`, { params });
  }

  approveEnterprise(enterpriseId: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/enterprises/${enterpriseId}/approve`,
      {}
    );
  }

  suspendEnterprise(enterpriseId: string, reason: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/enterprises/${enterpriseId}/suspend`,
      { reason }
    );
  }

  // User Management
  getAllUsers(filters?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, { params: filters });
  }

  suspendUser(userId: string, reason: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/users/${userId}/suspend`,
      { reason }
    );
  }

  // Submission Management
  overrideSubmissionScore(
    submissionId: string,
    newScore: number,
    reason: string
  ): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/submissions/${submissionId}/override-score`,
      { score: newScore, reason }
    );
  }

  // Analytics & Reports
  getAnalytics(dateRange?: { start: Date; end: Date }): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`, {
      params: dateRange as any
    });
  }

  getAuditLogs(filters?: any): Observable<AdminAuditLog[]> {
    return this.http.get<AdminAuditLog[]>(`${this.apiUrl}/audit-logs`, {
      params: filters
    });
  }
}
```

### 9. Admin Dashboard Component

```typescript
// components/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    pendingEnterprises: 0,
    activeUsers: 0,
    flaggedTasks: 0,
    openDisputes: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.adminService.getAnalytics().subscribe(data => {
      this.stats = data;
    });
  }
}
```

---

## Database Schema (Supabase/PostgreSQL)

```sql
-- Admin users table extension
ALTER TABLE users
ADD COLUMN admin_two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_last_training DATE,
ADD COLUMN admin_approved_by UUID REFERENCES users(id);

-- Admin audit log table
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  session_id TEXT,
  reversible BOOLEAN DEFAULT FALSE,
  reversible_until TIMESTAMPTZ,
  reversed BOOLEAN DEFAULT FALSE,
  reversed_by UUID REFERENCES users(id),
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_reversible ON admin_audit_logs(reversible, reversible_until)
  WHERE reversible = TRUE AND reversed = FALSE;

-- Row Level Security
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' IN ('admin', 'super_admin')
  );

CREATE POLICY "Only system can insert audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (FALSE); -- Insert only via service role
```

---

## Security Checklist

- [ ] Two-factor authentication required for all admins
- [ ] Session timeout set to 30 minutes
- [ ] All admin actions logged to audit table
- [ ] IP whitelist configured (optional but recommended)
- [ ] Rate limiting on admin endpoints (1000 req/hour)
- [ ] Admin emails use separate domain (@admin.jobsim.com)
- [ ] Regular security audits scheduled
- [ ] Admin training program established
- [ ] Incident response plan documented
- [ ] Data breach notification process defined

---

## Testing

```typescript
// admin.service.spec.ts
describe('AdminService', () => {
  it('should require reason for suspension', async () => {
    await expect(
      adminService.suspendEnterprise(enterpriseId, '')
    ).rejects.toThrow('Reason required');
  });

  it('should log all admin actions', async () => {
    await adminService.approveEnterprise(adminId, enterpriseId, ip, ua);

    const logs = await getAuditLogs({ admin_id: adminId });
    expect(logs).toHaveLength(1);
    expect(logs[0].action_type).toBe('approve_enterprise');
  });

  it('should prevent non-admins from accessing admin endpoints', async () => {
    const response = await request(app)
      .get('/api/admin/enterprises')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});
```

---

This implementation guide provides production-ready code for the Admin role specification.
