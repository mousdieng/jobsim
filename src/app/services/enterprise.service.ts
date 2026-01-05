import { Injectable } from '@angular/core';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import {
  Enterprise,
  EnterpriseTaskSpecification,
  Task,
  TaskSubmission,
  TaskFilters
} from '../models/platform.model';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {
  private supabase: SupabaseClient;
  private enterpriseIdCache$ = new BehaviorSubject<string | null>(null);

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    this.supabase = this.supabaseService.client;
  }

  // ============================================
  // ENTERPRISE IDENTIFICATION & CACHING
  // ============================================

  /**
   * Get the enterprise ID for the current user
   * Cached to avoid repeated database queries
   */
  private getEnterpriseId(): Observable<string> {
    // Return cached value if available
    if (this.enterpriseIdCache$.value) {
      return of(this.enterpriseIdCache$.value);
    }

    // Fetch and cache
    return from(this.fetchEnterpriseId()).pipe(
      tap(enterpriseId => this.enterpriseIdCache$.next(enterpriseId)),
      catchError(error => {
        console.error('Error fetching enterprise ID:', error);
        throw error;
      })
    );
  }

  private async fetchEnterpriseId(): Promise<string> {
    const user = this.authService.getCurrentUser();

    if (!user || user.user_type !== 'enterprise') {
      throw new Error('Enterprise authentication required');
    }

    const { data: enterprise, error } = await this.supabase
      .from('enterprises')
      .select('id')
      .eq('admin_user_id', user.id)
      .single();

    if (error || !enterprise) {
      throw new Error('No enterprise linked to this user');
    }

    return enterprise.id;
  }

  // ============================================
  // ENTERPRISE PROFILE
  // ============================================

  getEnterpriseProfile(): Observable<Enterprise> {
    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.supabase
          .from('enterprises')
          .select('*')
          .eq('id', enterpriseId)
          .single()
        )
      ),
      map(({ data, error }) => {
        if (error) throw error;
        return data as Enterprise;
      })
    );
  }

  updateEnterpriseProfile(updates: Partial<Enterprise>): Observable<Enterprise> {
    // Only allow updating specific fields
    const allowedFields = ['description', 'logo_url', 'website', 'location', 'contact_email', 'contact_phone'];
    const filteredUpdates: any = {};

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = (updates as any)[key];
      }
    });

    filteredUpdates.updated_at = new Date().toISOString();

    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.supabase
          .from('enterprises')
          .update(filteredUpdates)
          .eq('id', enterpriseId)
          .select()
          .single()
        )
      ),
      map(({ data, error }) => {
        if (error) throw error;
        return data as Enterprise;
      })
    );
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  /**
   * Check if the enterprise can create tasks
   */
  canCreateTasks(): Observable<boolean> {
    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.supabase
          .from('enterprises')
          .select('can_create_tasks')
          .eq('id', enterpriseId)
          .single()
        )
      ),
      map(({ data, error }) => {
        if (error) return false;
        return data?.can_create_tasks || false;
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Get all tasks for this enterprise
   */
  getEnterpriseTasks(filters?: TaskFilters): Observable<Task[]> {
    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.performGetTasks(enterpriseId, filters))
      )
    );
  }

  private async performGetTasks(enterpriseId: string, filters?: TaskFilters): Promise<Task[]> {
    let query = this.supabase
      .from('tasks')
      .select('*')
      .eq('enterprise_id', enterpriseId);

    // Apply filters
    if (filters?.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }
    if (filters?.job_field) {
      query = query.eq('job_field', filters.job_field);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.lifecycle_status) {
      query = query.eq('lifecycle_status', filters.lifecycle_status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return (data as Task[]) || [];
  }

  /**
   * Get a specific task by ID (must belong to this enterprise)
   */
  getTask(taskId: string): Observable<Task> {
    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .eq('enterprise_id', enterpriseId)
          .single()
        )
      ),
      map(({ data, error }) => {
        if (error) throw error;
        return data as Task;
      })
    );
  }

  /**
   * Create a new task
   */
  createTask(taskSpec: EnterpriseTaskSpecification): Observable<Task> {
    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.performCreateTask(enterpriseId, taskSpec))
      )
    );
  }

  private async performCreateTask(enterpriseId: string, spec: EnterpriseTaskSpecification): Promise<Task> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Authentication required');

    // Check if enterprise can create tasks
    const { data: enterprise } = await this.supabase
      .from('enterprises')
      .select('can_create_tasks')
      .eq('id', enterpriseId)
      .single();

    if (!enterprise?.can_create_tasks) {
      throw new Error('Task creation is not enabled for this enterprise. Contact Admin.');
    }

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
        estimated_duration: parseInt(spec.task_identity.estimated_completion_time) || 60,
        skills_required: spec.task_objective.skills_evaluated,
        deliverables: spec.deliverables,
        created_by: 'enterprise',
        created_by_role: 'enterprise',
        created_by_user_id: user.id,
        enterprise_id: enterpriseId,
        lifecycle_status: spec.lifecycle_status,
        is_active: spec.lifecycle_status === 'active',
        is_approved: false, // Enterprise tasks require admin approval
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
    return task as Task;
  }

  /**
   * Update a task (only if in draft or validation_pending status)
   */
  updateTask(taskId: string, taskSpec: EnterpriseTaskSpecification): Observable<Task> {
    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.performUpdateTask(taskId, enterpriseId, taskSpec))
      )
    );
  }

  private async performUpdateTask(taskId: string, enterpriseId: string, spec: EnterpriseTaskSpecification): Promise<Task> {
    // Get current task to check status
    const { data: currentTask } = await this.supabase
      .from('tasks')
      .select('lifecycle_status')
      .eq('id', taskId)
      .eq('enterprise_id', enterpriseId)
      .single();

    if (!currentTask) {
      throw new Error('Task not found or access denied');
    }

    // Only allow editing draft and validation_pending tasks
    if (!['draft', 'validation_pending'].includes(currentTask.lifecycle_status)) {
      throw new Error('Cannot edit tasks that are active or archived');
    }

    // If editing a validation_pending task, reset to draft
    const newStatus = currentTask.lifecycle_status === 'validation_pending' ? 'draft' : spec.lifecycle_status;

    const { data: task, error } = await this.supabase
      .from('tasks')
      .update({
        title: spec.task_identity.title,
        description: JSON.stringify({
          business_context: spec.business_context,
          task_objective: spec.task_objective,
          scope_and_constraints: spec.scope_and_constraints
        }),
        instructions: JSON.stringify(spec.deliverables),
        job_field: spec.task_identity.domain.toLowerCase().replace(/\s+/g, '_'),
        difficulty_level: spec.task_identity.difficulty_level,
        estimated_duration: parseInt(spec.task_identity.estimated_completion_time) || 60,
        skills_required: spec.task_objective.skills_evaluated,
        deliverables: spec.deliverables,
        lifecycle_status: newStatus,
        is_active: newStatus === 'active',
        tags: spec.visibility_and_access.eligible_domains,
        metadata: {
          evaluation_criteria: spec.evaluation_criteria,
          validation_rules: spec.validation_rules,
          visibility_access: spec.visibility_and_access,
          optional_enhancements: spec.optional_enhancements,
          task_type: spec.task_identity.task_type
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('enterprise_id', enterpriseId)
      .select()
      .single();

    if (error) throw error;
    return task as Task;
  }

  /**
   * Get submissions for a specific task
   */
  getTaskSubmissions(taskId: string): Observable<TaskSubmission[]> {
    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.performGetTaskSubmissions(taskId, enterpriseId))
      )
    );
  }

  private async performGetTaskSubmissions(taskId: string, enterpriseId: string): Promise<TaskSubmission[]> {
    // Verify task belongs to enterprise
    const { data: task } = await this.supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('enterprise_id', enterpriseId)
      .single();

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const { data, error } = await this.supabase
      .from('task_submissions')
      .select(`
        *,
        user:users(id, name, email, job_field, experience_level, user_type)
      `)
      .eq('task_id', taskId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  // ============================================
  // ENTERPRISE STATS
  // ============================================

  getEnterpriseStats(): Observable<any> {
    return this.getEnterpriseId().pipe(
      switchMap(enterpriseId =>
        from(this.performGetStats(enterpriseId))
      )
    );
  }

  private async performGetStats(enterpriseId: string): Promise<any> {
    // Get all counts in parallel
    const [tasksCount, activeTasksCount, pendingTasksCount, submissions] = await Promise.all([
      this.supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('enterprise_id', enterpriseId),
      this.supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('enterprise_id', enterpriseId).eq('lifecycle_status', 'active'),
      this.supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('enterprise_id', enterpriseId).eq('lifecycle_status', 'validation_pending'),
      this.supabase
        .from('task_submissions')
        .select('id, score, task_id')
        .in('task_id', await this.getEnterpriseTaskIds(enterpriseId))
    ]);

    const totalSubmissions = submissions.data?.length || 0;
    const totalCandidates = new Set(submissions.data?.map(s => s.id)).size;
    const averageScore = submissions.data?.reduce((acc, s) => acc + (s.score || 0), 0) / (totalSubmissions || 1);

    return {
      total_tasks: tasksCount.count || 0,
      active_tasks: activeTasksCount.count || 0,
      pending_tasks: pendingTasksCount.count || 0,
      total_submissions: totalSubmissions,
      total_candidates: totalCandidates,
      average_score: Math.round(averageScore * 10) / 10,
      task_approval_rate: (activeTasksCount.count || 0) / (tasksCount.count || 1)
    };
  }

  private async getEnterpriseTaskIds(enterpriseId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('tasks')
      .select('id')
      .eq('enterprise_id', enterpriseId);

    return data?.map(t => t.id) || [];
  }
}
