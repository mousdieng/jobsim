import { UserRole, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../models/platform.model';

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}

/**
 * Get description for a role
 */
export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role] || '';
}

/**
 * Check if user has permission based on role
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions: Record<UserRole, string[]> = {
    admin: [
      'platform.govern',
      'enterprises.create',
      'enterprises.verify',
      'enterprises.manage',
      'users.manage',
      'tasks.create',
      'tasks.validate',
      'tasks.manage',
      'submissions.review',
      'submissions.override',
      'audit.view',
      'roles.assign'
    ],
    support: [
      'platform.support',
      'tasks.create',
      'tasks.validate',
      'tasks.moderate',
      'submissions.review',
      'users.support',
      'disputes.mediate',
      'audit.view'
    ],
    enterprise: [
      'tasks.create',
      'tasks.manage_own',
      'submissions.review_own',
      'candidates.view',
      'candidates.rate',
      'analytics.view_own'
    ],
    student: [
      'tasks.browse',
      'tasks.submit',
      'submissions.view_own',
      'profile.manage',
      'progress.track'
    ],
    mentor: [
      // Legacy role, mapped to Platform Support permissions
      'platform.support',
      'tasks.create',
      'tasks.validate',
      'tasks.moderate',
      'submissions.review',
      'users.support',
      'disputes.mediate',
      'audit.view'
    ]
  };

  return rolePermissions[userRole]?.includes(permission) || false;
}

/**
 * Check if user can create tasks
 */
export function canCreateTasks(userRole: UserRole): boolean {
  return hasPermission(userRole, 'tasks.create');
}

/**
 * Check if user can validate tasks
 */
export function canValidateTasks(userRole: UserRole): boolean {
  return hasPermission(userRole, 'tasks.validate');
}

/**
 * Check if user is admin or support
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin' || userRole === 'support';
}

/**
 * Check if user is top-level admin
 */
export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Get lifecycle status badge color
 */
export function getLifecycleStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    validation_pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-500'
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get lifecycle status display name
 */
export function getLifecycleStatusDisplayName(status: string): string {
  const names: Record<string, string> = {
    draft: 'Draft',
    validation_pending: 'Pending Validation',
    active: 'Active',
    archived: 'Archived'
  };

  return names[status] || status;
}
