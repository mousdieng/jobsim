import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import {
  AdminAuditLog,
  AdminStats,
  Enterprise,
  UserProfile,
  Task,
  TaskSubmission,
  AdminActionType
} from '../models/platform.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private supabase: SupabaseClient;

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService
  ) {
    // Use the shared Supabase client with custom lock bypass
    this.supabase = this.supabaseService.client;
  }

  // ============================================
  // ANALYTICS & STATS
  // ============================================

  getAdminStats(): Observable<AdminStats> {
    return from(this.fetchAdminStats());
  }

  private async fetchAdminStats(): Promise<AdminStats> {
    const [
      usersCount,
      enterprisesCount,
      tasksCount,
      submissionsCount,
      pendingEnterprises,
      pendingTaskValidations,
      flaggedTasks,
      suspendedUsers,
      recentActions
    ] = await Promise.all([
      this.supabase.from('users').select('*', { count: 'exact', head: true }),
      this.supabase.from('enterprises').select('*', { count: 'exact', head: true }),
      this.supabase.from('tasks').select('*', { count: 'exact', head: true }),
      this.supabase.from('task_submissions').select('*', { count: 'exact', head: true }),
      this.supabase.from('enterprises').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      this.supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('lifecycle_status', 'validation_pending'),
      this.supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('flagged', true),
      this.supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
      this.supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Debug logging with detailed errors
    console.log('🔍 Admin Stats Debug:', {
      users: {
        count: usersCount.count,
        error: usersCount.error?.message || usersCount.error,
        hasError: !!usersCount.error
      },
      enterprises: {
        count: enterprisesCount.count,
        error: enterprisesCount.error?.message || enterprisesCount.error,
        hasError: !!enterprisesCount.error
      },
      tasks: {
        count: tasksCount.count,
        error: tasksCount.error?.message || tasksCount.error,
        hasError: !!tasksCount.error
      },
      submissions: {
        count: submissionsCount.count,
        error: submissionsCount.error?.message || submissionsCount.error,
        hasError: !!submissionsCount.error
      }
    });

    // If all queries failed, there's likely an auth or RLS issue
    if (usersCount.error && enterprisesCount.error && tasksCount.error) {
      console.error('❌ All queries failed. Possible causes:');
      console.error('1. Not authenticated as admin');
      console.error('2. RLS policies blocking access');
      console.error('3. Migration 012 not applied');
      console.error('4. is_admin() function missing');
      console.error('→ Run database/DIAGNOSE_ZERO_DATA.sql in Supabase SQL Editor');
    }

    return {
      total_users: usersCount.count || 0,
      total_enterprises: enterprisesCount.count || 0,
      total_tasks: tasksCount.count || 0,
      total_submissions: submissionsCount.count || 0,
      pending_enterprises: pendingEnterprises.count || 0,
      pending_task_approvals: pendingTaskValidations.count || 0,
      flagged_tasks: flaggedTasks.count || 0,
      flagged_submissions: 0,
      active_disputes: 0,
      suspended_users: suspendedUsers.count || 0,
      recent_actions: recentActions.data || []
    };
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Create a new user with specific role (Admin, Support, Enterprise)
   * Students cannot be created via admin - they self-register
   * Only admins can create users
   */
  createUser(userData: {
    email: string;
    password: string;
    name: string;
    user_type: 'admin' | 'support' | 'enterprise';
    enterprise_id?: string; // Required if user_type is enterprise
  }): Observable<UserProfile> {
    return from(this.performCreateUser(userData));
  }

  private async performCreateUser(userData: any): Promise<UserProfile> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    if (!adminId) {
      throw new Error('Admin authentication required');
    }

    // Students cannot be created via admin interface
    if (userData.user_type === 'student') {
      throw new Error('Students must self-register. Use the public signup flow.');
    }

    // Validate enterprise user has enterprise_id
    if (userData.user_type === 'enterprise' && !userData.enterprise_id) {
      throw new Error('Enterprise ID required for enterprise users');
    }

    // Create auth user first
    const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        user_type: userData.user_type,
        created_by_admin: true
      }
    });

    if (authError) throw authError;

    // Create profile in users table
    const { data: user, error: profileError } = await this.supabase
      .from('users')
      .insert({
        id: authUser.user?.id,
        email: userData.email,
        name: userData.name,
        full_name: userData.name,
        user_type: userData.user_type,
        status: 'active',
        created_by_admin_id: adminId,
        role_assigned_by: adminId,
        role_assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // If enterprise user, link to enterprise
    if (userData.user_type === 'enterprise' && userData.enterprise_id) {
      await this.supabase
        .from('enterprises')
        .update({ admin_user_id: authUser.user?.id })
        .eq('id', userData.enterprise_id);
    }

    // Log the action
    await this.logAction(
      'create_user',
      'user',
      authUser.user!.id,
      `Created ${userData.user_type} user: ${userData.email}`
    );

    return user;
  }

  /**
   * Change user role (only admins can do this)
   * Tracks who made the change and when
   */
  changeUserRole(userId: string, newRole: 'admin' | 'support' | 'enterprise' | 'student', reason: string): Observable<void> {
    return from(this.performChangeUserRole(userId, newRole, reason));
  }

  private async performChangeUserRole(userId: string, newRole: string, reason: string): Promise<void> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    if (!adminId) {
      throw new Error('Admin authentication required');
    }

    // Get current user to log before state
    const { data: currentUser } = await this.supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single();

    const oldRole = currentUser?.user_type;

    // Update role
    const { error } = await this.supabase
      .from('users')
      .update({
        user_type: newRole,
        role_assigned_by: adminId,
        role_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    // Log with before/after state
    await this.logAction(
      'change_user_role',
      'user',
      userId,
      `${reason} (Changed from ${oldRole} to ${newRole})`
    );
  }

  /**
   * Delete a user permanently
   * This is irreversible and should be used with caution
   */
  deleteUser(userId: string, reason: string): Observable<void> {
    return from(this.performDeleteUser(userId, reason));
  }

  private async performDeleteUser(userId: string, reason: string): Promise<void> {
    // Get user info before deletion for audit log
    const { data: user } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Log the action before deletion
    await this.logAction('delete_user', 'user', userId, reason);

    // Delete from auth (this will cascade to users table via trigger)
    const { error: authError } = await this.supabase.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    // Also delete from users table if it didn't cascade
    await this.supabase.from('users').delete().eq('id', userId);
  }

  getAllUsers(filters?: {
    status?: string;
    user_type?: string;
    search?: string;
  }): Observable<UserProfile[]> {
    return from(this.fetchUsers(filters));
  }

  private async fetchUsers(filters?: any): Promise<UserProfile[]> {
    let query = this.supabase.from('users').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.user_type) {
      query = query.eq('user_type', filters.user_type);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  suspendUser(userId: string, reason: string): Observable<void> {
    return from(this.performSuspendUser(userId, reason));
  }

  private async performSuspendUser(userId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason
      })
      .eq('id', userId);

    if (error) throw error;

    // Log action
    await this.logAction('suspend_user', 'user', userId, reason);
  }

  unsuspendUser(userId: string): Observable<void> {
    return from(this.performUnsuspendUser(userId));
  }

  private async performUnsuspendUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        status: 'active',
        suspended_at: null,
        suspension_reason: null
      })
      .eq('id', userId);

    if (error) throw error;

    await this.logAction('unsuspend_user', 'user', userId, 'User unsuspended');
  }

  banUser(userId: string, reason: string): Observable<void> {
    return from(this.performBanUser(userId, reason));
  }

  private async performBanUser(userId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        status: 'banned',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason
      })
      .eq('id', userId);

    if (error) throw error;

    await this.logAction('ban_user', 'user', userId, reason);
  }

  // ============================================
  // ENTERPRISE MANAGEMENT
  // ============================================

  getAllEnterprises(status?: string): Observable<Enterprise[]> {
    return from(this.fetchEnterprises(status));
  }

  private async fetchEnterprises(status?: string): Promise<Enterprise[]> {
    let query = this.supabase.from('enterprises').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  approveEnterprise(enterpriseId: string): Observable<void> {
    return from(this.performApproveEnterprise(enterpriseId));
  }

  private async performApproveEnterprise(enterpriseId: string): Promise<void> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    const { error } = await this.supabase
      .from('enterprises')
      .update({
        status: 'active',
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: adminId
      })
      .eq('id', enterpriseId);

    if (error) throw error;

    await this.logAction('approve_enterprise', 'enterprise', enterpriseId, 'Enterprise approved');
  }

  rejectEnterprise(enterpriseId: string, reason: string): Observable<void> {
    return from(this.performRejectEnterprise(enterpriseId, reason));
  }

  private async performRejectEnterprise(enterpriseId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('enterprises')
      .update({
        status: 'banned',
        suspension_reason: reason
      })
      .eq('id', enterpriseId);

    if (error) throw error;

    await this.logAction('reject_enterprise', 'enterprise', enterpriseId, reason);
  }

  suspendEnterprise(enterpriseId: string, reason: string): Observable<void> {
    return from(this.performSuspendEnterprise(enterpriseId, reason));
  }

  private async performSuspendEnterprise(enterpriseId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('enterprises')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason
      })
      .eq('id', enterpriseId);

    if (error) throw error;

    await this.logAction('suspend_enterprise', 'enterprise', enterpriseId, reason);
  }

  unsuspendEnterprise(enterpriseId: string): Observable<void> {
    return from(this.performUnsuspendEnterprise(enterpriseId));
  }

  private async performUnsuspendEnterprise(enterpriseId: string): Promise<void> {
    const { error } = await this.supabase
      .from('enterprises')
      .update({
        status: 'active',
        suspended_at: null,
        suspension_reason: null
      })
      .eq('id', enterpriseId);

    if (error) throw error;

    await this.logAction('unsuspend_enterprise', 'enterprise', enterpriseId, 'Enterprise unsuspended');
  }

  /**
   * Enable task creation for an enterprise
   * Only admins can grant this permission
   */
  enableEnterpriseTaskCreation(enterpriseId: string, reason: string): Observable<void> {
    return from(this.performEnableEnterpriseTaskCreation(enterpriseId, reason));
  }

  private async performEnableEnterpriseTaskCreation(enterpriseId: string, reason: string): Promise<void> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    if (!adminId) {
      throw new Error('Admin authentication required');
    }

    const { error } = await this.supabase
      .from('enterprises')
      .update({
        can_create_tasks: true,
        task_creation_enabled_by: adminId,
        task_creation_enabled_at: new Date().toISOString(),
        task_creation_disabled_at: null
      })
      .eq('id', enterpriseId);

    if (error) throw error;

    await this.logAction(
      'enable_enterprise_task_creation',
      'enterprise',
      enterpriseId,
      reason
    );
  }

  /**
   * Disable task creation for an enterprise
   * Only admins can revoke this permission
   */
  disableEnterpriseTaskCreation(enterpriseId: string, reason: string): Observable<void> {
    return from(this.performDisableEnterpriseTaskCreation(enterpriseId, reason));
  }

  private async performDisableEnterpriseTaskCreation(enterpriseId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('enterprises')
      .update({
        can_create_tasks: false,
        task_creation_disabled_at: new Date().toISOString()
      })
      .eq('id', enterpriseId);

    if (error) throw error;

    await this.logAction(
      'disable_enterprise_task_creation',
      'enterprise',
      enterpriseId,
      reason
    );
  }

  /**
   * Create a new enterprise
   * Only admins can create enterprises
   */
  createEnterprise(enterpriseData: {
    name: string;
    description?: string;
    website?: string;
    industry?: string;
    size?: string;
    can_create_tasks?: boolean;
  }): Observable<Enterprise> {
    return from(this.performCreateEnterprise(enterpriseData));
  }

  private async performCreateEnterprise(enterpriseData: any): Promise<Enterprise> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    if (!adminId) {
      throw new Error('Admin authentication required');
    }

    const { data: enterprise, error } = await this.supabase
      .from('enterprises')
      .insert({
        name: enterpriseData.name,
        description: enterpriseData.description,
        website: enterpriseData.website,
        industry: enterpriseData.industry,
        size: enterpriseData.size,
        status: 'active',
        is_verified: true,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        can_create_tasks: enterpriseData.can_create_tasks || false,
        task_creation_enabled_by: enterpriseData.can_create_tasks ? adminId : null,
        task_creation_enabled_at: enterpriseData.can_create_tasks ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAction(
      'create_enterprise',
      'enterprise',
      enterprise.id,
      `Created enterprise: ${enterpriseData.name}`
    );

    return enterprise;
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  /**
   * Create a new task with full enterprise specification
   * Only admins can create tasks
   */
  createEnterpriseTask(specification: any): Observable<Task> {
    return from(this.performCreateEnterpriseTask(specification));
  }

  private async performCreateEnterpriseTask(spec: any): Promise<Task> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    if (!adminId) {
      throw new Error('Admin authentication required');
    }

    // Convert specification to task format
    const { data: task, error } = await this.supabase
      .from('tasks')
      .insert({
        title: spec.task_identity.title,
        description: JSON.stringify({
          business_context: spec.business_context,
          task_objective: spec.task_objective,
          scope_and_constraints: spec.scope_and_constraints
        }),
        instructions: JSON.stringify(spec.deliverables),
        job_field: spec.task_identity.domain.toLowerCase().replace(/\s+/g, '_'),
        difficulty_level: spec.task_identity.difficulty_level,
        estimated_duration: spec.task_identity.estimated_completion_time,
        skills_required: spec.task_objective.skills_evaluated,
        deliverables: spec.deliverables,
        created_by: spec.task_identity.created_by === 'Admin' ? 'platform' : 'enterprise',
        created_by_role: spec.task_identity.created_by === 'Admin' ? 'admin' : 'enterprise',
        created_by_user_id: adminId,
        lifecycle_status: spec.lifecycle_status,
        is_active: spec.lifecycle_status === 'active',
        is_approved: true,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        tags: spec.visibility_and_access.eligible_domains,
        metadata: {
          evaluation_criteria: spec.evaluation_criteria,
          validation_rules: spec.validation_rules,
          visibility_access: spec.visibility_and_access,
          optional_enhancements: spec.optional_enhancements,
          task_type: spec.task_identity.task_type
        }
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAction(
      'create_task',
      'task',
      task.id,
      `Created enterprise task: ${spec.task_identity.title}`
    );

    return task;
  }

  /**
   * Create a new task (legacy simplified version)
   */
  createTask(taskData: {
    title: string;
    description: string;
    domain: string;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimated_duration: number;
    task_type: string;
    enterprise_id?: string;
    created_by_role: 'admin' | 'platform';
  }): Observable<Task> {
    return from(this.performCreateTask(taskData));
  }

  private async performCreateTask(taskData: any): Promise<Task> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    if (!adminId) {
      throw new Error('Admin authentication required');
    }

    const { data: task, error } = await this.supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description,
        job_field: taskData.domain,
        difficulty_level: taskData.difficulty_level,
        estimated_duration: taskData.estimated_duration.toString(),
        created_by: taskData.created_by_role === 'admin' ? 'platform' : 'enterprise',
        created_by_role: taskData.created_by_role,
        created_by_user_id: adminId,
        enterprise_id: taskData.enterprise_id || null,
        lifecycle_status: 'draft',
        is_active: false,
        is_approved: true,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        skills_required: [],
        deliverables: [],
        resources: [],
        tags: [],
        current_submissions: 0
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAction(
      'create_task',
      'task',
      task.id,
      `Created ${taskData.created_by_role} task: ${taskData.title}`
    );

    return task;
  }

  /**
   * Update an existing task
   * Only admins can update any task
   */
  updateTask(taskId: string, updates: Partial<Task>): Observable<void> {
    return from(this.performUpdateTask(taskId, updates));
  }

  private async performUpdateTask(taskId: string, updates: any): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;

    await this.logAction(
      'update_task',
      'task',
      taskId,
      `Updated task with fields: ${Object.keys(updates).join(', ')}`
    );
  }

  /**
   * Delete a task permanently
   * Only admins can delete tasks
   */
  deleteTask(taskId: string, reason: string): Observable<void> {
    return from(this.performDeleteTask(taskId, reason));
  }

  private async performDeleteTask(taskId: string, reason: string): Promise<void> {
    // Log before deletion
    await this.logAction('delete_task', 'task', taskId, reason);

    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }

  getAllTasks(filters?: { flagged?: boolean; is_approved?: boolean }): Observable<Task[]> {
    return from(this.fetchTasks(filters));
  }

  private async fetchTasks(filters?: any): Promise<Task[]> {
    let query = this.supabase.from('tasks').select('*, enterprise:enterprises(*)');

    if (filters?.flagged !== undefined) {
      query = query.eq('flagged', filters.flagged);
    }
    if (filters?.is_approved !== undefined) {
      query = query.eq('is_approved', filters.is_approved);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  approveTask(taskId: string): Observable<void> {
    return from(this.performApproveTask(taskId));
  }

  private async performApproveTask(taskId: string): Promise<void> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    const { error } = await this.supabase
      .from('tasks')
      .update({
        is_approved: true,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        flagged: false
      })
      .eq('id', taskId);

    if (error) throw error;

    await this.logAction('approve_task', 'task', taskId, 'Task approved');
  }

  flagTask(taskId: string, reason: string): Observable<void> {
    return from(this.performFlagTask(taskId, reason));
  }

  private async performFlagTask(taskId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({
        flagged: true,
        flag_reason: reason
      })
      .eq('id', taskId);

    if (error) throw error;

    await this.logAction('flag_task', 'task', taskId, reason);
  }

  featureTask(taskId: string, featured: boolean): Observable<void> {
    return from(this.performFeatureTask(taskId, featured));
  }

  private async performFeatureTask(taskId: string, featured: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({ is_featured: featured })
      .eq('id', taskId);

    if (error) throw error;

    await this.logAction('feature_task', 'task', taskId, `Task ${featured ? 'featured' : 'unfeatured'}`);
  }

  // ============================================
  // TASK LIFECYCLE WORKFLOW
  // ============================================

  /**
   * Submit task for validation (draft → validation_pending)
   * Can be called by task creator
   */
  submitTaskForValidation(taskId: string): Observable<void> {
    return from(this.performSubmitTaskForValidation(taskId));
  }

  private async performSubmitTaskForValidation(taskId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({
        lifecycle_status: 'validation_pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('lifecycle_status', 'draft'); // Only draft tasks can be submitted

    if (error) throw error;

    await this.logAction('submit_task_validation', 'task', taskId, 'Task submitted for validation');
  }

  /**
   * Validate and activate task (validation_pending → active)
   * Only admins can validate tasks they didn't create
   */
  validateTask(taskId: string, notes?: string): Observable<void> {
    return from(this.performValidateTask(taskId, notes));
  }

  private async performValidateTask(taskId: string, notes?: string): Promise<void> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    const { error } = await this.supabase
      .from('tasks')
      .update({
        lifecycle_status: 'active',
        validated_by: adminId,
        validated_at: new Date().toISOString(),
        validation_notes: notes || null,
        is_approved: true,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('lifecycle_status', 'validation_pending');

    if (error) throw error;

    await this.logAction('validate_task', 'task', taskId, notes || 'Task validated and activated');
  }

  /**
   * Reject task validation (validation_pending → draft)
   */
  rejectTaskValidation(taskId: string, reason: string): Observable<void> {
    return from(this.performRejectTaskValidation(taskId, reason));
  }

  private async performRejectTaskValidation(taskId: string, reason: string): Promise<void> {
    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    const { error } = await this.supabase
      .from('tasks')
      .update({
        lifecycle_status: 'draft',
        validated_by: adminId,
        validated_at: new Date().toISOString(),
        validation_notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('lifecycle_status', 'validation_pending');

    if (error) throw error;

    await this.logAction('reject_task_validation', 'task', taskId, reason);
  }

  /**
   * Archive a task (active → archived)
   */
  archiveTask(taskId: string, reason?: string): Observable<void> {
    return from(this.performArchiveTask(taskId, reason));
  }

  private async performArchiveTask(taskId: string, reason?: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({
        lifecycle_status: 'archived',
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;

    await this.logAction('archive_task', 'task', taskId, reason || 'Task archived');
  }

  /**
   * Get tasks by lifecycle status
   */
  getTasksByLifecycleStatus(status: 'draft' | 'validation_pending' | 'active' | 'archived'): Observable<Task[]> {
    return from(this.fetchTasksByLifecycleStatus(status));
  }

  private async fetchTasksByLifecycleStatus(status: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*, enterprise:enterprises(*)')
      .eq('lifecycle_status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // SUBMISSION MANAGEMENT
  // ============================================

  getAllSubmissions(filters?: { flagged?: boolean }): Observable<TaskSubmission[]> {
    return from(this.fetchSubmissions(filters));
  }

  private async fetchSubmissions(filters?: any): Promise<TaskSubmission[]> {
    let query = this.supabase
      .from('task_submissions')
      .select('*, task:tasks(*), user:users(*)');

    if (filters?.flagged !== undefined) {
      query = query.eq('flagged', filters.flagged);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  overrideSubmissionScore(
    submissionId: string,
    newScore: number,
    reason: string
  ): Observable<void> {
    return from(this.performOverrideScore(submissionId, newScore, reason));
  }

  private async performOverrideScore(
    submissionId: string,
    newScore: number,
    reason: string
  ): Promise<void> {
    if (!reason || reason.length < 20) {
      throw new Error('Detailed reason (min 20 characters) required for score override');
    }

    const { data: session } = await this.supabase.auth.getSession();
    const adminId = session.session?.user.id;

    const { error } = await this.supabase
      .from('task_submissions')
      .update({
        score: newScore,
        score_overridden: true,
        score_override_reason: reason,
        score_overridden_by: adminId,
        score_overridden_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) throw error;

    await this.logAction('override_score', 'submission', submissionId, reason);
  }

  flagSubmission(submissionId: string, reason: string): Observable<void> {
    return from(this.performFlagSubmission(submissionId, reason));
  }

  private async performFlagSubmission(submissionId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('task_submissions')
      .update({
        flagged: true,
        flag_reason: reason
      })
      .eq('id', submissionId);

    if (error) throw error;

    await this.logAction('flag_submission', 'submission', submissionId, reason);
  }

  // ============================================
  // AUDIT LOGS
  // ============================================

  getAuditLogs(filters?: {
    admin_id?: string;
    action_type?: string;
    target_type?: string;
    limit?: number;
  }): Observable<AdminAuditLog[]> {
    return from(this.fetchAuditLogs(filters));
  }

  private async fetchAuditLogs(filters?: any): Promise<AdminAuditLog[]> {
    let query = this.supabase.from('admin_audit_logs').select('*');

    if (filters?.admin_id) {
      query = query.eq('admin_id', filters.admin_id);
    }
    if (filters?.action_type) {
      query = query.eq('action_type', filters.action_type);
    }
    if (filters?.target_type) {
      query = query.eq('target_type', filters.target_type);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 100);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async logAction(
    actionType: string,
    targetType: string,
    targetId: string,
    reason: string
  ): Promise<void> {
    try {
      const { data: session } = await this.supabase.auth.getSession();
      const user = session.session?.user;

      if (!user) return;

      // Get user profile to determine role
      const { data: profile } = await this.supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      await this.supabase.from('admin_audit_logs').insert({
        actor_id: user.id,
        actor_role: profile?.user_type || 'admin',
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        reason: reason,
        ip_address: 'unknown', // Should be captured from request in production
        // Keep old columns for backward compatibility (will be removed later)
        admin_id: user.id,
        admin_email: user.email || '',
        reversible: this.isReversibleAction(actionType),
        reversible_until: this.isReversibleAction(actionType)
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          : null
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  private isReversibleAction(actionType: string): boolean {
    const reversibleActions = [
      'suspend_user',
      'suspend_enterprise',
      'flag_task',
      'flag_submission'
    ];
    return reversibleActions.includes(actionType);
  }
}
