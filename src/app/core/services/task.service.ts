import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import {
  Task,
  TaskWithCreator,
  TaskStatus,
  TaskDifficulty,
  ApiResponse,
  PaginatedResponse
} from '../models/database.types';
import { AuthService } from './auth.service';

export interface TaskFilters {
  category?: string;
  difficulty?: TaskDifficulty;
  search?: string;
  status?: TaskStatus;
  created_by?: string;
}

export interface TaskCreateData {
  title: string;
  description: string;
  instructions: string;
  category: string;
  job_role: string;
  skill_tags: string[];
  difficulty: TaskDifficulty;
  base_xp: number;
  difficulty_multiplier: number;
  estimated_time_minutes: number | null;
  submission_config: any;
  evaluation_criteria: string[];
  attachments?: any[];
  status: TaskStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {}

  /**
   * Get all tasks with optional filters
   */
  getTasks(filters?: TaskFilters): Observable<ApiResponse<Task[]>> {
    return from(
      (async () => {
        let query = this.supabase.client
          .from('tasks')
          .select('*, profiles!tasks_created_by_fkey(id, full_name, avatar_url)')
          .eq('status', 'active'); // Only show active tasks by default

        if (filters?.category) {
          query = query.eq('category', filters.category);
        }

        if (filters?.difficulty) {
          query = query.eq('difficulty', filters.difficulty);
        }

        if (filters?.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          );
        }

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        if (filters?.created_by) {
          query = query.eq('created_by', filters.created_by);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Task[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get tasks with pagination
   */
  getTasksPaginated(
    page: number = 1,
    perPage: number = 10,
    filters?: TaskFilters
  ): Observable<ApiResponse<PaginatedResponse<Task>>> {
    return from(
      (async () => {
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        let query = this.supabase.client
          .from('tasks')
          .select('*, profiles!tasks_created_by_fkey(id, full_name, avatar_url)', { count: 'exact' })
          .eq('status', 'active');

        if (filters?.category) {
          query = query.eq('category', filters.category);
        }

        if (filters?.difficulty) {
          query = query.eq('difficulty', filters.difficulty);
        }

        if (filters?.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          );
        }

        const { data, error, count } = await query
          .range(from, to)
          .order('created_at', { ascending: false });

        if (error) {
          return { data: null, error };
        }

        const totalPages = count ? Math.ceil(count / perPage) : 0;

        const result: PaginatedResponse<Task> = {
          data: data as Task[],
          total: count || 0,
          page,
          per_page: perPage,
          total_pages: totalPages
        };

        return { data: result, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get a single task by ID
   */
  getTask(id: string): Observable<ApiResponse<TaskWithCreator>> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*, profiles!tasks_created_by_fkey(id, full_name, avatar_url, role)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => ({
        data: data as TaskWithCreator | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Create a new task (Admin only)
   */
  createTask(taskData: TaskCreateData): Observable<ApiResponse<Task>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'admin') {
          return {
            data: null,
            error: { message: 'Only admins can create tasks' }
          };
        }

        const { data, error } = await this.supabase.client
          .from('tasks')
          .insert({
            ...taskData,
            created_by: user.id
          })
          .select()
          .single();

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Task | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Update a task (Admin only)
   */
  updateTask(id: string, updates: Partial<TaskCreateData>): Observable<ApiResponse<Task>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'admin') {
          return {
            data: null,
            error: { message: 'Only admins can update tasks' }
          };
        }

        const { data, error } = await this.supabase.client
          .from('tasks')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Task | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Archive a task (Admin only)
   */
  archiveTask(id: string): Observable<ApiResponse<Task>> {
    return this.updateTask(id, { status: 'archived' } as any);
  }

  /**
   * Delete a task (Admin only)
   */
  deleteTask(id: string): Observable<ApiResponse<void>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'admin') {
          return {
            data: null,
            error: { message: 'Only admins can delete tasks' }
          };
        }

        const { error } = await this.supabase.client
          .from('tasks')
          .delete()
          .eq('id', id);

        return { data: null, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Enroll in a task (Candidate only)
   */
  enrollInTask(taskId: string): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return {
            data: null,
            error: { message: 'Only candidates can enroll in tasks' }
          };
        }

        // Check if already enrolled
        if (user.candidateProfile?.current_task_id) {
          return {
            data: null,
            error: { message: 'You are already enrolled in a task. Complete or abandon it first.' }
          };
        }

        // Update candidate profile
        const { error } = await this.supabase.client
          .from('candidate_profiles')
          .update({
            current_task_id: taskId,
            tasks_attempted: (user.candidateProfile?.tasks_attempted || 0) + 1
          })
          .eq('id', user.id);

        return { data: { success: true }, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Abandon current task (Candidate only)
   */
  abandonTask(): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return {
            data: null,
            error: { message: 'Only candidates can abandon tasks' }
          };
        }

        const { error } = await this.supabase.client
          .from('candidate_profiles')
          .update({
            current_task_id: null
          })
          .eq('id', user.id);

        return { data: { success: true }, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get current enrolled task (Candidate only)
   */
  getCurrentTask(): Observable<ApiResponse<Task>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate' || !user.candidateProfile?.current_task_id) {
          return { data: null, error: null };
        }

        const { data, error } = await this.supabase.client
          .from('tasks')
          .select('*')
          .eq('id', user.candidateProfile.current_task_id)
          .single();

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Task | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get available categories
   */
  getCategories(): Observable<ApiResponse<string[]>> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('category')
        .eq('status', 'active')
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          return { data: null, error: error?.message || null };
        }

        const categories = [...new Set(data.map((t: any) => t.category))].sort();
        return { data: categories, error: null };
      })
    );
  }

  /**
   * Get task statistics
   */
  getTaskStats(): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const { data: tasks, error } = await this.supabase.client
          .from('tasks')
          .select('difficulty, category, status');

        if (error || !tasks) {
          return { data: null, error };
        }

        const stats = {
          total: tasks.length,
          active: tasks.filter((t: any) => t.status === 'active').length,
          by_difficulty: {
            beginner: tasks.filter((t: any) => t.difficulty === 'beginner').length,
            intermediate: tasks.filter((t: any) => t.difficulty === 'intermediate').length,
            advanced: tasks.filter((t: any) => t.difficulty === 'advanced').length,
            expert: tasks.filter((t: any) => t.difficulty === 'expert').length
          },
          by_category: tasks.reduce((acc: any, task: any) => {
            acc[task.category] = (acc[task.category] || 0) + 1;
            return acc;
          }, {})
        };

        return { data: stats, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Start a task - Creates candidate_tasks record and calculates deadline
   * (Candidate only)
   */
  startTask(taskId: string): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return {
            data: null,
            error: { message: 'Only candidates can start tasks' }
          };
        }

        // First, check if candidate_tasks record exists
        const { data: existingRecord, error: checkError } = await this.supabase.client
          .from('candidate_tasks')
          .select('*')
          .eq('candidate_id', user.id)
          .eq('task_id', taskId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          return { data: null, error: checkError };
        }

        // Get task details to calculate deadline
        const { data: task, error: taskError } = await this.supabase.client
          .from('tasks')
          .select('estimated_time_minutes')
          .eq('id', taskId)
          .single();

        if (taskError) {
          return { data: null, error: taskError };
        }

        // Calculate deadline
        const startTime = new Date();
        const estimatedMinutes = task.estimated_time_minutes || 10080; // Default 7 days
        const deadline = new Date(startTime.getTime() + estimatedMinutes * 60000);

        if (existingRecord) {
          // Update existing record to start it
          const { data, error } = await this.supabase.client
            .from('candidate_tasks')
            .update({
              started_at: startTime.toISOString(),
              deadline: deadline.toISOString(),
              status: 'in_progress'
            })
            .eq('id', existingRecord.id)
            .select()
            .single();

          return { data, error };
        } else {
          // Create new candidate_tasks record
          const { data, error } = await this.supabase.client
            .from('candidate_tasks')
            .insert({
              candidate_id: user.id,
              task_id: taskId,
              enrolled_at: startTime.toISOString(),
              started_at: startTime.toISOString(),
              deadline: deadline.toISOString(),
              status: 'in_progress'
            })
            .select()
            .single();

          return { data, error };
        }
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get candidate's progress on a specific task
   */
  getCandidateTaskProgress(taskId: string): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return { data: null, error: null };
        }

        const { data, error } = await this.supabase.client
          .from('candidate_tasks')
          .select('*')
          .eq('candidate_id', user.id)
          .eq('task_id', taskId)
          .maybeSingle();

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get AI meetings for a candidate's task
   */
  getTaskMeetings(taskId: string): Observable<ApiResponse<any[]>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return { data: null, error: { message: 'Only candidates can view meetings' } };
        }

        const { data, error } = await this.supabase.client
          .from('ai_meetings')
          .select('*')
          .eq('candidate_id', user.id)
          .eq('task_id', taskId)
          .order('scheduled_for', { ascending: true });

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Complete a task (mark as completed)
   */
  completeTask(taskId: string, finalScore?: number, finalFeedback?: string): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return {
            data: null,
            error: { message: 'Only candidates can complete tasks' }
          };
        }

        const { data, error } = await this.supabase.client
          .from('candidate_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            final_score: finalScore,
            final_feedback: finalFeedback
          })
          .eq('candidate_id', user.id)
          .eq('task_id', taskId)
          .select()
          .single();

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Abandon a task in progress
   */
  abandonTaskInProgress(taskId: string): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return {
            data: null,
            error: { message: 'Only candidates can abandon tasks' }
          };
        }

        const { data, error } = await this.supabase.client
          .from('candidate_tasks')
          .update({
            status: 'abandoned',
            abandoned_at: new Date().toISOString()
          })
          .eq('candidate_id', user.id)
          .eq('task_id', taskId)
          .select()
          .single();

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get all in-progress tasks for the current candidate
   */
  getInProgressTasks(): Observable<ApiResponse<any[]>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return { data: null, error: { message: 'Only candidates can view tasks' } };
        }

        const { data, error } = await this.supabase.client
          .from('candidate_tasks')
          .select(`
            *,
            tasks (
              id,
              title,
              description,
              category,
              difficulty,
              base_xp,
              estimated_time_minutes
            )
          `)
          .eq('candidate_id', user.id)
          .eq('status', 'in_progress')
          .order('started_at', { ascending: false });

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }
}
