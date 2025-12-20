import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
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

  constructor(private http: HttpClient) {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
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

  // ============================================
  // TASK MANAGEMENT
  // ============================================

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
      .from('submissions')
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
      .from('submissions')
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
      .from('submissions')
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

      await this.supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        admin_email: user.email || '',
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        reason: reason,
        ip_address: 'unknown', // Should be captured from request in production
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
