import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import {
  UserProfile,
  UserProfileUpdate,
  Task,
  TaskCreate,
  TaskFilters,
  TaskSubmission,
  SubmissionCreate,
  SubmissionUpdate,
  SubmissionReview,
  Meeting,
  MeetingCreate,
  Enterprise,
  EnterpriseCreate,
  UserTaskProgress,
  ApiResponse,
  PaginatedResponse,
  TaskWithSubmission
} from '../models/platform.model';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  // State management
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  private userSubmissionsSubject = new BehaviorSubject<TaskSubmission[]>([]);
  public userSubmissions$ = this.userSubmissionsSubject.asObservable();

  private userMeetingsSubject = new BehaviorSubject<Meeting[]>([]);
  public userMeetings$ = this.userMeetingsSubject.asObservable();

  constructor(private supabase: SupabaseService) {}

  // ============================================
  // USER PROFILE METHODS
  // ============================================

  /**
   * Get current user's profile
   */
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserProfile, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get user profile' };
    }
  }

  /**
   * Update current user's profile
   */
  async updateUserProfile(updates: UserProfileUpdate): Promise<ApiResponse<UserProfile>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserProfile, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to update profile' };
    }
  }

  /**
   * Get a user profile by ID (public profiles only)
   */
  async getUserById(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserProfile, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get user' };
    }
  }

  // ============================================
  // TASK METHODS
  // ============================================

  /**
   * Get all active tasks with optional filtering
   */
  async getTasks(filters?: TaskFilters): Promise<ApiResponse<Task[]>> {
    try {
      let query = this.supabase.client
        .from('tasks')
        .select('*')
        .eq('lifecycle_status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.job_field) {
        query = query.eq('job_field', filters.job_field);
      }

      if (filters?.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }

      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters?.is_featured) {
        query = query.eq('is_featured', filters.is_featured);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      const tasks = data as Task[];
      this.tasksSubject.next(tasks);

      return { data: tasks, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get tasks' };
    }
  }

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await this.supabase.client
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Task, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get task' };
    }
  }

  /**
   * Get task with user's submission and progress
   */
  async getTaskWithUserData(taskId: string): Promise<ApiResponse<TaskWithSubmission>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Get task
      const { data: taskData, error: taskError } = await this.supabase.client
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) {
        return { data: null, error: taskError.message };
      }

      // Get user's submission for this task
      const { data: submissionData } = await this.supabase.client
        .from('submissions')
        .select('*')
        .eq('task_id', taskId)
        .eq('candidate_id', user.id)
        .maybeSingle();

      // Get user's progress for this task
      const { data: progressData } = await this.supabase.client
        .from('user_task_progress')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .maybeSingle();

      const taskWithData: TaskWithSubmission = {
        ...(taskData as Task),
        user_submission: submissionData as TaskSubmission,
        user_progress: progressData as UserTaskProgress
      };

      return { data: taskWithData, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get task data' };
    }
  }

  /**
   * Get featured tasks
   */
  async getFeaturedTasks(): Promise<ApiResponse<Task[]>> {
    return this.getTasks({ is_featured: true });
  }

  /**
   * Create a new task (for enterprise admins)
   */
  async createTask(task: TaskCreate): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await this.supabase.client
        .from('tasks')
        .insert({
          ...task,
          lifecycle_status: 'draft' // New tasks start in draft state
        })
        .select('*')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Task, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to create task' };
    }
  }

  // ============================================
  // SUBMISSION METHODS
  // ============================================

  /**
   * Submit a task (create submission)
   */
  async submitTask(submission: SubmissionCreate): Promise<ApiResponse<TaskSubmission>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('submissions')
        .insert({
          ...submission,
          candidate_id: user.id,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select('*, task:tasks(*)')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Update local state
      const currentSubmissions = this.userSubmissionsSubject.value;
      this.userSubmissionsSubject.next([...currentSubmissions, data as TaskSubmission]);

      return { data: data as TaskSubmission, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to submit task' };
    }
  }

  /**
   * Save draft submission
   */
  async saveDraft(submission: SubmissionCreate): Promise<ApiResponse<TaskSubmission>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Check if draft already exists
      const { data: existingDraft } = await this.supabase.client
        .from('submissions')
        .select('id')
        .eq('task_id', submission.task_id)
        .eq('candidate_id', user.id)
        .eq('status', 'draft')
        .maybeSingle();

      if (existingDraft) {
        // Update existing draft
        const { data, error } = await this.supabase.client
          .from('submissions')
          .update({
            ...submission,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDraft.id)
          .select('*, task:tasks(*)')
          .single();

        if (error) {
          return { data: null, error: error.message };
        }

        return { data: data as TaskSubmission, error: null };
      } else {
        // Create new draft
        const { data, error } = await this.supabase.client
          .from('submissions')
          .insert({
            ...submission,
            candidate_id: user.id,
            status: 'draft'
          })
          .select('*, task:tasks(*)')
          .single();

        if (error) {
          return { data: null, error: error.message };
        }

        return { data: data as TaskSubmission, error: null };
      }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to save draft' };
    }
  }

  /**
   * Get user's submissions
   */
  async getUserSubmissions(): Promise<ApiResponse<TaskSubmission[]>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('submissions')
        .select('*, task:tasks(*)')
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      const submissions = data as TaskSubmission[];
      this.userSubmissionsSubject.next(submissions);

      return { data: submissions, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get submissions' };
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmission(submissionId: string): Promise<ApiResponse<TaskSubmission>> {
    try {
      const { data, error } = await this.supabase.client
        .from('submissions')
        .select('*, task:tasks(*)')
        .eq('id', submissionId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as TaskSubmission, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get submission' };
    }
  }

  /**
   * Update submission (draft only)
   */
  async updateSubmission(
    submissionId: string,
    updates: SubmissionUpdate
  ): Promise<ApiResponse<TaskSubmission>> {
    try {
      const { data, error } = await this.supabase.client
        .from('submissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select('*, task:tasks(*)')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as TaskSubmission, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to update submission' };
    }
  }

  /**
   * Review a submission (for enterprise admins)
   */
  async reviewSubmission(
    submissionId: string,
    review: SubmissionReview
  ): Promise<ApiResponse<TaskSubmission>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('submissions')
        .update({
          score: review.score,
          feedback: review.feedback,
          status: review.status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select('*, task:tasks(*)')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as TaskSubmission, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to review submission' };
    }
  }

  // ============================================
  // MEETING METHODS
  // ============================================

  /**
   * Get meetings for a task
   */
  async getMeetings(taskId?: string): Promise<ApiResponse<Meeting[]>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      let query = this.supabase.client
        .from('meetings')
        .select('*, task:tasks(*)')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      const meetings = data as Meeting[];
      this.userMeetingsSubject.next(meetings);

      return { data: meetings, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get meetings' };
    }
  }

  /**
   * Create a meeting
   */
  async createMeeting(meeting: MeetingCreate): Promise<ApiResponse<Meeting>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('meetings')
        .insert({
          ...meeting,
          user_id: user.id
        })
        .select('*, task:tasks(*)')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Update local state
      const currentMeetings = this.userMeetingsSubject.value;
      this.userMeetingsSubject.next([...currentMeetings, data as Meeting]);

      return { data: data as Meeting, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to create meeting' };
    }
  }

  /**
   * Update meeting (add transcript, summary, etc.)
   */
  async updateMeeting(
    meetingId: string,
    updates: Partial<Meeting>
  ): Promise<ApiResponse<Meeting>> {
    try {
      const { data, error } = await this.supabase.client
        .from('meetings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)
        .select('*, task:tasks(*)')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Meeting, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to update meeting' };
    }
  }

  /**
   * Mark meeting as completed
   */
  async completeMeeting(
    meetingId: string,
    transcript: string,
    summary: string,
    actionItems: any[]
  ): Promise<ApiResponse<Meeting>> {
    return this.updateMeeting(meetingId, {
      transcript,
      summary,
      action_items: actionItems,
      completed: true
    });
  }

  // ============================================
  // ENTERPRISE METHODS
  // ============================================

  /**
   * Get all enterprises
   */
  async getEnterprises(): Promise<ApiResponse<Enterprise[]>> {
    try {
      const { data, error } = await this.supabase.client
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Enterprise[], error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get enterprises' };
    }
  }

  /**
   * Get enterprise by ID
   */
  async getEnterprise(enterpriseId: string): Promise<ApiResponse<Enterprise>> {
    try {
      const { data, error } = await this.supabase.client
        .from('companies')
        .select('*')
        .eq('id', enterpriseId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Enterprise, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get enterprise' };
    }
  }

  /**
   * Create an enterprise
   */
  async createEnterprise(enterprise: EnterpriseCreate): Promise<ApiResponse<Enterprise>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('companies')
        .insert({
          ...enterprise,
          admin_user_id: user.id
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Enterprise, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to create enterprise' };
    }
  }

  // ============================================
  // PROGRESS TRACKING METHODS
  // ============================================

  /**
   * Start a task (create progress record)
   */
  async startTask(taskId: string): Promise<ApiResponse<UserTaskProgress>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('user_task_progress')
        .upsert({
          user_id: user.id,
          task_id: taskId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          progress_percentage: 0
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserTaskProgress, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to start task' };
    }
  }

  /**
   * Update task progress
   */
  async updateProgress(
    taskId: string,
    progressPercentage: number
  ): Promise<ApiResponse<UserTaskProgress>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const status = progressPercentage >= 100 ? 'completed' : 'in_progress';

      const { data, error } = await this.supabase.client
        .from('user_task_progress')
        .update({
          progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
          status,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserTaskProgress, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to update progress' };
    }
  }

  /**
   * Get user's task progress
   */
  async getUserProgress(): Promise<ApiResponse<UserTaskProgress[]>> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await this.supabase.client
        .from('user_task_progress')
        .select('*, task:tasks(*)')
        .eq('user_id', user.id)
        .order('last_activity_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserTaskProgress[], error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get progress' };
    }
  }
}
