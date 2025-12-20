import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { UserRole, RolePermission } from '../models/platform.model';
import { hasPermission as utilHasPermission } from '../utils/role.utils';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissionsCache: Map<UserRole, string[]> = new Map();

  constructor(private supabase: SupabaseService) {
    this.loadPermissions();
  }

  /**
   * Load permissions from database and cache them
   */
  private async loadPermissions(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('role_permissions')
        .select('role_type, permission_key');

      if (error) {
        console.error('Failed to load permissions:', error);
        return;
      }

      // Clear and rebuild cache
      this.permissionsCache.clear();

      if (data) {
        data.forEach((perm: any) => {
          const rolePerms = this.permissionsCache.get(perm.role_type as UserRole) || [];
          rolePerms.push(perm.permission_key);
          this.permissionsCache.set(perm.role_type as UserRole, rolePerms);
        });
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  }

  /**
   * Check if a user role has a specific permission
   * Falls back to util function if DB permissions not loaded
   */
  hasPermission(userRole: UserRole, permission: string): boolean {
    const rolePermissions = this.permissionsCache.get(userRole);

    if (rolePermissions && rolePermissions.length > 0) {
      return rolePermissions.includes(permission);
    }

    // Fallback to hardcoded permissions if DB not loaded
    return utilHasPermission(userRole, permission);
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(userRole: UserRole): Observable<string[]> {
    return from(this.fetchRolePermissions(userRole));
  }

  private async fetchRolePermissions(userRole: UserRole): Promise<string[]> {
    // Check cache first
    const cached = this.permissionsCache.get(userRole);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Load from database
    try {
      const { data, error } = await this.supabase.client
        .from('role_permissions')
        .select('permission_key')
        .eq('role_type', userRole);

      if (error) throw error;

      const permissions = data?.map((p: any) => p.permission_key) || [];
      this.permissionsCache.set(userRole, permissions);
      return permissions;
    } catch (error) {
      console.error('Failed to fetch role permissions:', error);
      return [];
    }
  }

  /**
   * Check if current user can create tasks
   */
  canCreateTasks(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'tasks.create');
  }

  /**
   * Check if current user can validate tasks
   */
  canValidateTasks(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'tasks.validate');
  }

  /**
   * Check if current user can manage enterprises
   */
  canManageEnterprises(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'enterprises.manage');
  }

  /**
   * Check if current user can manage users
   */
  canManageUsers(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'users.manage');
  }

  /**
   * Check if current user can view audit logs
   */
  canViewAuditLogs(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'audit.view');
  }

  /**
   * Check if current user can override scores
   */
  canOverrideScores(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'submissions.override');
  }

  /**
   * Check if current user has platform governance permissions
   */
  hasPlatformGovernance(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'platform.govern');
  }

  /**
   * Get all permissions with descriptions for a role
   */
  getRolePermissionsWithDetails(userRole: UserRole): Observable<RolePermission[]> {
    return from(this.fetchRolePermissionsWithDetails(userRole));
  }

  private async fetchRolePermissionsWithDetails(userRole: UserRole): Promise<RolePermission[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('role_permissions')
        .select('*')
        .eq('role_type', userRole)
        .order('permission_name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch role permissions with details:', error);
      return [];
    }
  }

  /**
   * Reload permissions from database
   */
  reloadPermissions(): void {
    this.loadPermissions();
  }
}
