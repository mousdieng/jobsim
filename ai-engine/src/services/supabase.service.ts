import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { GeneratedTask, GeneratedMeeting, EvaluationResult, UserProfile } from '../types';
import { generateId, calculateDeadline } from '../utils/helpers';

export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabaseUrl, config.supabaseKey);
  }

  // Task Operations
  async saveGeneratedTask(task: GeneratedTask): Promise<string> {
    const taskId = generateId();
    const deadline = calculateDeadline(config.defaultTaskDeadlineDays);

    const { error } = await this.client.from('tasks').insert({
      id: taskId,
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      job_field: task.job_field,
      difficulty_level: task.difficulty_level,
      estimated_duration: task.estimated_duration,
      deadline: deadline,
      skills_required: task.skills_required,
      deliverables: task.deliverables,
      resources: task.resources,
      created_by: 'ai',
      max_submissions: 100,
      current_submissions: 0,
      is_active: true,
      is_featured: false,
      tags: task.tags,
    });

    if (error) {
      console.error('Error saving task:', error);
      throw new Error(`Failed to save task: ${error.message}`);
    }

    return taskId;
  }

  async saveGeneratedTasks(tasks: GeneratedTask[]): Promise<string[]> {
    const taskIds: string[] = [];
    for (const task of tasks) {
      const id = await this.saveGeneratedTask(task);
      taskIds.push(id);
    }
    return taskIds;
  }

  // Meeting Operations
  async saveGeneratedMeeting(
    taskId: string,
    userId: string,
    meeting: GeneratedMeeting
  ): Promise<string> {
    const meetingId = generateId();
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + 1); // Schedule 1 hour from now

    const { error } = await this.client.from('meetings').insert({
      id: meetingId,
      task_id: taskId,
      user_id: userId,
      meeting_title: meeting.meeting_title,
      meeting_type: meeting.meeting_type,
      participants: meeting.participants,
      agenda: meeting.agenda,
      transcript: meeting.transcript,
      summary: meeting.summary,
      action_items: meeting.action_items,
      duration_minutes: meeting.duration_minutes,
      scheduled_for: scheduledFor.toISOString(),
      completed: true, // AI-generated meetings are considered completed simulations
    });

    if (error) {
      console.error('Error saving meeting:', error);
      throw new Error(`Failed to save meeting: ${error.message}`);
    }

    return meetingId;
  }

  // Submission Operations
  async updateSubmissionWithEvaluation(
    submissionId: string,
    evaluation: EvaluationResult
  ): Promise<void> {
    const { error } = await this.client
      .from('task_submissions')
      .update({
        score: evaluation.overall_score,
        feedback: JSON.stringify({
          letter_grade: evaluation.letter_grade,
          criteria_breakdown: evaluation.criteria_breakdown,
          strengths: evaluation.strengths,
          areas_for_improvement: evaluation.areas_for_improvement,
          detailed_feedback: evaluation.detailed_feedback,
          recommendations: evaluation.recommendations,
        }),
        status: evaluation.overall_score >= 60 ? 'approved' : 'rejected',
        reviewed_by: 'ai_evaluator',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error updating submission:', error);
      throw new Error(`Failed to update submission: ${error.message}`);
    }
  }

  // Update user statistics after evaluation
  async updateUserStatistics(
    userId: string,
    newScore: number
  ): Promise<void> {
    // First get current user stats
    const { data: user, error: fetchError } = await this.client
      .from('users')
      .select('completed_tasks_count, total_score, average_score')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      throw new Error(`Failed to fetch user: ${fetchError.message}`);
    }

    const newCompletedCount = (user.completed_tasks_count || 0) + 1;
    const newTotalScore = (user.total_score || 0) + newScore;
    const newAverageScore = newTotalScore / newCompletedCount;

    const { error: updateError } = await this.client
      .from('users')
      .update({
        completed_tasks_count: newCompletedCount,
        total_score: newTotalScore,
        average_score: Math.round(newAverageScore * 100) / 100,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user stats:', updateError);
      throw new Error(`Failed to update user stats: ${updateError.message}`);
    }
  }

  // Get task details for evaluation
  async getTaskById(taskId: string): Promise<any> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    return data;
  }

  // Get submission details
  async getSubmissionById(submissionId: string): Promise<any> {
    const { data, error } = await this.client
      .from('task_submissions')
      .select('*, task:tasks(*), user:users(*)')
      .eq('id', submissionId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch submission: ${error.message}`);
    }

    return data;
  }

  // Get user profile
  async getUserById(userId: string): Promise<UserProfile> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data as UserProfile;
  }

  // Get tasks needing more variety
  async getTaskCountByField(): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from('tasks')
      .select('job_field')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to count tasks: ${error.message}`);
    }

    const counts: Record<string, number> = {};
    data.forEach((task) => {
      counts[task.job_field] = (counts[task.job_field] || 0) + 1;
    });

    return counts;
  }
}

export const supabaseService = new SupabaseService();
