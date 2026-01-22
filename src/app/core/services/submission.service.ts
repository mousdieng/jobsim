import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import {
  Submission,
  SubmissionWithDetails,
  SubmittedFile,
  ValidationError,
  SubmissionStatus,
  ApiResponse
} from '../models/database.types';
import { AuthService } from './auth.service';

export interface SubmissionCreateData {
  task_id: string;
  submitted_files: SubmittedFile[];
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {}

  /**
   * Create a new submission (Candidate only)
   */
  createSubmission(data: SubmissionCreateData): Observable<ApiResponse<Submission>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return {
            data: null,
            error: { message: 'Only candidates can create submissions' }
          };
        }

        // Get current attempt number
        const { data: existingSubmissions } = await this.supabase.client
          .from('submissions')
          .select('attempt_number')
          .eq('task_id', data.task_id)
          .eq('candidate_id', user.id)
          .order('attempt_number', { ascending: false })
          .limit(1);

        const attemptNumber = existingSubmissions && existingSubmissions.length > 0
          ? existingSubmissions[0].attempt_number + 1
          : 1;

        // Check attempt limit (5 max)
        if (attemptNumber > 5) {
          return {
            data: null,
            error: { message: 'Maximum 5 attempts allowed per task' }
          };
        }

        // Validate submission
        const { data: task } = await this.supabase.client
          .from('tasks')
          .select('submission_config')
          .eq('id', data.task_id)
          .single();

        if (!task) {
          return {
            data: null,
            error: { message: 'Task not found' }
          };
        }

        const validationErrors = this.validateSubmission(data.submitted_files, task.submission_config);

        const status: SubmissionStatus = validationErrors.length > 0
          ? 'validation_failed'
          : 'awaiting_review';

        // Create submission
        const { data: submission, error } = await this.supabase.client
          .from('submissions')
          .insert({
            task_id: data.task_id,
            candidate_id: user.id,
            attempt_number: attemptNumber,
            submitted_files: data.submitted_files,
            validation_errors: validationErrors,
            status
          })
          .select()
          .single();

        if (error) {
          return { data: null, error };
        }

        // If validation passed, assign reviewers
        if (status === 'awaiting_review') {
          await this.assignReviewers(submission.id);
        }

        return { data: submission, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Submission | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Validate submission against task requirements
   */
  private validateSubmission(
    submittedFiles: SubmittedFile[],
    submissionConfig: any
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required files
    const requiredFiles = submissionConfig.required_files || [];

    for (const requiredFile of requiredFiles) {
      const submitted = submittedFiles.find(sf => sf.field_label === requiredFile.label);

      if (!submitted || submitted.files.length === 0) {
        errors.push({
          field: requiredFile.label,
          error: 'Required file missing',
          details: `Please upload ${requiredFile.label}`
        });
        continue;
      }

      // Validate file formats
      for (const file of submitted.files) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension && !requiredFile.allowed_formats.includes(extension)) {
          errors.push({
            field: requiredFile.label,
            error: 'Invalid file format',
            details: `${file.name} must be one of: ${requiredFile.allowed_formats.join(', ')}`
          });
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > requiredFile.max_size_mb) {
          errors.push({
            field: requiredFile.label,
            error: 'File too large',
            details: `${file.name} exceeds ${requiredFile.max_size_mb}MB limit`
          });
        }
      }

      // Validate file count
      if (requiredFile.max_files && submitted.files.length > requiredFile.max_files) {
        errors.push({
          field: requiredFile.label,
          error: 'Too many files',
          details: `Maximum ${requiredFile.max_files} files allowed for ${requiredFile.label}`
        });
      }
    }

    return errors;
  }

  /**
   * Assign 3 random reviewers to a submission
   */
  private async assignReviewers(submissionId: string): Promise<void> {
    try {
      // Get active enterprise reps who can review
      const { data: reviewers } = await this.supabase.client
        .from('enterprise_rep_profiles')
        .select('id')
        .eq('is_active', true)
        .eq('can_review', true)
        .limit(50); // Get pool of reviewers

      if (!reviewers || reviewers.length < 3) {
        console.warn('Not enough reviewers available');
        return;
      }

      // Randomly select 3
      const shuffled = reviewers.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      // Update submission status
      await this.supabase.client
        .from('submissions')
        .update({ status: 'under_review' })
        .eq('id', submissionId);

      // Note: The actual review assignment will be done when reviewers access the review interface
      // For now, we just mark it as under_review
    } catch (error) {
      console.error('Error assigning reviewers:', error);
    }
  }

  /**
   * Update a submission (Candidate only, before review)
   */
  updateSubmission(id: string, submitted_files: SubmittedFile[]): Observable<ApiResponse<Submission>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'candidate') {
          return {
            data: null,
            error: { message: 'Only candidates can update submissions' }
          };
        }

        // Check if submission can be updated
        const { data: existing } = await this.supabase.client
          .from('submissions')
          .select('status, candidate_id')
          .eq('id', id)
          .single();

        if (!existing) {
          return { data: null, error: { message: 'Submission not found' } };
        }

        if (existing.candidate_id !== user.id) {
          return { data: null, error: { message: 'Not your submission' } };
        }

        if (existing.status !== 'pending_validation' && existing.status !== 'validation_failed') {
          return {
            data: null,
            error: { message: 'Cannot update submission after it has been submitted for review' }
          };
        }

        const { data, error } = await this.supabase.client
          .from('submissions')
          .update({
            submitted_files,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Submission | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get a single submission with details
   */
  getSubmission(id: string): Observable<ApiResponse<SubmissionWithDetails>> {
    return from(
      this.supabase.client
        .from('submissions')
        .select(`
          *,
          tasks(*),
          candidate_profiles(
            *,
            profiles!candidate_profiles_id_fkey(full_name, avatar_url)
          ),
          reviews(
            *,
            enterprise_rep_profiles(
              *,
              profiles!enterprise_rep_profiles_id_fkey(full_name, avatar_url),
              companies(*)
            )
          )
        `)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => ({
        data: data as SubmissionWithDetails | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get candidate's submissions
   */
  getCandidateSubmissions(candidateId: string): Observable<ApiResponse<Submission[]>> {
    return from(
      this.supabase.client
        .from('submissions')
        .select('*, tasks(title, category, difficulty)')
        .eq('candidate_id', candidateId)
        .order('submitted_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => ({
        data: data as Submission[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get submissions for a task
   */
  getTaskSubmissions(taskId: string): Observable<ApiResponse<Submission[]>> {
    return from(
      this.supabase.client
        .from('submissions')
        .select(`
          *,
          candidate_profiles(
            *,
            profiles!candidate_profiles_id_fkey(full_name, avatar_url)
          )
        `)
        .eq('task_id', taskId)
        .order('submitted_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => ({
        data: data as Submission[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get candidate's submission history for a task
   */
  getTaskSubmissionHistory(taskId: string, candidateId: string): Observable<ApiResponse<Submission[]>> {
    return from(
      this.supabase.client
        .from('submissions')
        .select('*')
        .eq('task_id', taskId)
        .eq('candidate_id', candidateId)
        .order('attempt_number', { ascending: true })
    ).pipe(
      map(({ data, error }) => ({
        data: data as Submission[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get best submission for a task (highest XP)
   */
  getBestSubmission(taskId: string, candidateId: string): Observable<ApiResponse<Submission>> {
    return from(
      this.supabase.client
        .from('submissions')
        .select('*')
        .eq('task_id', taskId)
        .eq('candidate_id', candidateId)
        .eq('is_approved', true)
        .order('xp_earned', { ascending: false })
        .limit(1)
        .single()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Submission | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get submissions pending review (for enterprise reps)
   */
  getPendingSubmissions(limit: number = 10): Observable<ApiResponse<Submission[]>> {
    return from(
      this.supabase.client
        .from('submissions')
        .select(`
          *,
          tasks(title, category, difficulty),
          candidate_profiles(
            *,
            profiles!candidate_profiles_id_fkey(full_name, avatar_url)
          )
        `)
        .in('status', ['awaiting_review', 'under_review'])
        .order('submitted_at', { ascending: true })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => ({
        data: data as Submission[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get submission statistics
   */
  getSubmissionStats(candidateId?: string): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        let query = this.supabase.client
          .from('submissions')
          .select('status, is_approved, xp_earned');

        if (candidateId) {
          query = query.eq('candidate_id', candidateId);
        }

        const { data: submissions, error } = await query;

        if (error || !submissions) {
          return { data: null, error };
        }

        const stats = {
          total: submissions.length,
          approved: submissions.filter((s: any) => s.is_approved).length,
          rejected: submissions.filter(
            (s: any) => s.status === 'review_complete' && !s.is_approved
          ).length,
          pending: submissions.filter(
            (s: any) => s.status === 'awaiting_review' || s.status === 'under_review'
          ).length,
          validation_failed: submissions.filter((s: any) => s.status === 'validation_failed').length,
          total_xp_earned: submissions.reduce((sum: number, s: any) => sum + (s.xp_earned || 0), 0),
          approval_rate:
            submissions.length > 0
              ? Math.round(
                  (submissions.filter((s: any) => s.is_approved).length / submissions.length) * 100
                )
              : 0
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

  // ============================================
  // ADMIN METHODS
  // ============================================

  /**
   * Get all submissions (Admin only)
   */
  getAllSubmissions(filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Observable<ApiResponse<Submission[]>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || (user.role !== 'admin' && user.role !== 'platform_support')) {
          return { data: null, error: { message: 'Unauthorized: Admin access required' } };
        }

        let query = this.supabase.client
          .from('submissions')
          .select(`
            *,
            task:tasks(id, title, category),
            candidate:profiles!submissions_candidate_id_fkey(id, full_name, email)
          `);

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (filters?.search) {
          query = query.or(
            `id.ilike.%${filters.search}%,candidate_id.ilike.%${filters.search}%`
          );
        }

        query = query.order('submitted_at', { ascending: false });

        const { data, error } = await query;

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Submission[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Flag submission (Admin only)
   */
  flagSubmission(submissionId: string): Observable<ApiResponse<void>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || (user.role !== 'admin' && user.role !== 'platform_support')) {
          return { data: null, error: { message: 'Unauthorized: Admin access required' } };
        }

        // TODO: Add a flagged field to submissions table or create a flags table
        // For now, we'll just log it
        console.log(`Submission ${submissionId} flagged by admin ${user.id}`);

        return { data: null, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Delete submission (Admin only)
   */
  deleteSubmission(submissionId: string): Observable<ApiResponse<void>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'admin') {
          return { data: null, error: { message: 'Unauthorized: Admin access required' } };
        }

        const { error } = await this.supabase.client
          .from('submissions')
          .delete()
          .eq('id', submissionId);

        return { data: null, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: null,
        error: error?.message || null
      }))
    );
  }
}
