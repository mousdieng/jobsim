import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import {
  Review,
  ReviewWithDetails,
  ReviewDecision,
  ApiResponse
} from '../models/database.types';
import { AuthService } from './auth.service';

export interface ReviewCreateData {
  submission_id: string;
  decision: ReviewDecision;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {}

  /**
   * Create a review (Enterprise Rep only)
   */
  createReview(data: ReviewCreateData): Observable<ApiResponse<Review>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'enterprise_rep') {
          return {
            data: null,
            error: { message: 'Only enterprise reps can create reviews' }
          };
        }

        // Validate feedback length
        if (data.feedback.length < 50) {
          return {
            data: null,
            error: { message: 'Feedback must be at least 50 characters' }
          };
        }

        // Check if user already reviewed this submission
        const { data: existing } = await this.supabase.client
          .from('reviews')
          .select('id')
          .eq('submission_id', data.submission_id)
          .eq('reviewer_id', user.id)
          .single();

        if (existing) {
          return {
            data: null,
            error: { message: 'You have already reviewed this submission' }
          };
        }

        // Create review
        const { data: review, error } = await this.supabase.client
          .from('reviews')
          .insert({
            submission_id: data.submission_id,
            reviewer_id: user.id,
            decision: data.decision,
            feedback: data.feedback,
            strengths: data.strengths,
            improvements: data.improvements
          })
          .select()
          .single();

        if (error) {
          return { data: null, error };
        }

        // The trigger will automatically process the review when 3 are complete
        return { data: review, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Review | null,
        error: error?.message ?? null
      }))
    );
  }

  /**
   * Get reviews for a submission
   */
  getReviewsForSubmission(submissionId: string): Observable<ApiResponse<ReviewWithDetails[]>> {
    return from(
      this.supabase.client
        .from('reviews')
        .select(`
          *,
          enterprise_rep_profiles(
            *,
            profiles!enterprise_rep_profiles_id_fkey(id, full_name, avatar_url),
            companies(name, logo_url)
          )
        `)
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => ({
        data: data as ReviewWithDetails[] | null,
        error: error?.message ?? null
      }))
    );
  }

  /**
   * Get pending reviews for a reviewer (Enterprise Rep)
   */
  getPendingReviews(limit: number = 10): Observable<ApiResponse<any[]>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'enterprise_rep') {
          return {
            data: null,
            error: { message: 'Only enterprise reps can access pending reviews' }
          };
        }

        // Get submissions that are under_review and don't have a review from this user yet
        const { data: submissions, error } = await this.supabase.client
          .from('submissions')
          .select(`
            *,
            tasks(title, category, difficulty, instructions, submission_config, evaluation_criteria),
            candidate_profiles(
              *,
              profiles!candidate_profiles_id_fkey(full_name, avatar_url)
            )
          `)
          .eq('status', 'under_review')
          .limit(limit);

        if (error || !submissions) {
          return { data: null, error };
        }

        // Filter out submissions already reviewed by this user
        const pending = [];
        for (const submission of submissions) {
          const { data: existingReview } = await this.supabase.client
            .from('reviews')
            .select('id')
            .eq('submission_id', submission.id)
            .eq('reviewer_id', user.id)
            .single();

          if (!existingReview) {
            pending.push(submission);
          }
        }

        return { data: pending, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message ?? null
      }))
    );
  }

  /**
   * Get completed reviews by a reviewer
   */
  getMyReviews(limit: number = 20): Observable<ApiResponse<ReviewWithDetails[]>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'enterprise_rep') {
          return {
            data: null,
            error: { message: 'Only enterprise reps can access reviews' }
          };
        }

        const { data, error } = await this.supabase.client
          .from('reviews')
          .select(`
            *,
            submissions(
              *,
              tasks(title, category),
              candidate_profiles(
                *,
                profiles!candidate_profiles_id_fkey(full_name, avatar_url)
              )
            )
          `)
          .eq('reviewer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        return { data, error };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as ReviewWithDetails[] | null,
        error: error?.message ?? null
      }))
    );
  }

  /**
   * Get review statistics for a reviewer
   */
  getReviewStats(): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'enterprise_rep') {
          return {
            data: null,
            error: { message: 'Only enterprise reps can access review stats' }
          };
        }

        const { data: reviews, error } = await this.supabase.client
          .from('reviews')
          .select('decision, created_at')
          .eq('reviewer_id', user.id);

        if (error || !reviews) {
          return { data: null, error };
        }

        const stats = {
          total_reviews: reviews.length,
          approved: reviews.filter((r: any) => r.decision === 'approve').length,
          rejected: reviews.filter((r: any) => r.decision === 'reject').length,
          approval_rate:
            reviews.length > 0
              ? Math.round(
                  (reviews.filter((r: any) => r.decision === 'approve').length / reviews.length) *
                    100
                )
              : 0,
          reviews_this_week: reviews.filter(
            (r: any) =>
              new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length
        };

        return { data: stats, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message ?? null
      }))
    );
  }

  /**
   * Check if reviewer has already reviewed a submission
   */
  hasReviewed(submissionId: string): Observable<ApiResponse<boolean>> {
    return from(
      (async () => {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'enterprise_rep') {
          return { data: false, error: null };
        }

        const { data, error } = await this.supabase.client
          .from('reviews')
          .select('id')
          .eq('submission_id', submissionId)
          .eq('reviewer_id', user.id)
          .single();

        if (error) {
          return { data: null, error };
        }

        return { data: !!data, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message ?? null
      }))
    );
  }

  /**
   * Get review count for a submission
   */
  getReviewCount(submissionId: string): Observable<ApiResponse<number>> {
    return from(
      this.supabase.client
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('submission_id', submissionId)
    ).pipe(
      map(({ count, error }) => ({
        data: count || 0,
        error: error?.message ?? null
      }))
    );
  }

  /**
   * Get approval/reject counts for a submission
   */
  getReviewSummary(submissionId: string): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const { data: reviews, error } = await this.supabase.client
          .from('reviews')
          .select('decision')
          .eq('submission_id', submissionId);

        if (error || !reviews) {
          return { data: null, error };
        }

        const summary = {
          total: reviews.length,
          approved: reviews.filter((r: any) => r.decision === 'approve').length,
          rejected: reviews.filter((r: any) => r.decision === 'reject').length,
          pending: 3 - reviews.length
        };

        return { data: summary, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message ?? null
      }))
    );
  }
}
