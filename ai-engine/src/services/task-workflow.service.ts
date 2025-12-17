import { supabaseService } from './supabase.service';
import { scoringEvaluatorService } from './scoring-evaluator.service';
import { meetingSimulatorService } from './meeting-simulator.service';
import { getAIProvider } from './ai-provider.factory';
import { MeetingType } from '../types';

/**
 * Task Workflow Service
 * Manages the complete lifecycle of a task including:
 * - Task starting (sets deadline)
 * - Auto-generating AI meetings
 * - Evaluating submissions
 * - Evaluating meeting performance
 */
export class TaskWorkflowService {

  /**
   * Start a task for a user
   * - Sets deadline based on estimated duration or default days
   * - Generates AI meetings for the task
   * - Returns task progress info
   */
  async startTask(
    userId: string,
    taskId: string,
    userName: string,
    userRole: string = 'Professional'
  ): Promise<{
    deadline: Date;
    meetingIds: string[];
    progressId: string;
  }> {
    console.log(`[Task Workflow] Starting task ${taskId} for user ${userId}`);

    // Get task details
    const task = await supabaseService.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Calculate deadline based on estimated_duration or default 7 days
    const deadline = this.calculateDeadline(task.estimated_duration);

    // Create or update user task progress
    const progressId = await this.createTaskProgress(userId, taskId, deadline);

    // Generate AI meetings for this task
    const meetingIds = await this.generateTaskMeetings(
      taskId,
      task.title,
      task.description,
      userName,
      userRole,
      userId
    );

    console.log(`[Task Workflow] Task started successfully. Deadline: ${deadline}, Meetings: ${meetingIds.length}`);

    return {
      deadline,
      meetingIds,
      progressId,
    };
  }

  /**
   * Calculate deadline from estimated duration or default days
   */
  private calculateDeadline(estimatedDuration?: string): Date {
    const now = new Date();
    let daysToAdd = 7; // Default 7 days

    if (estimatedDuration) {
      // Parse estimated duration (e.g., "3 days", "2 weeks", "1 week")
      const match = estimatedDuration.match(/(\d+)\s*(day|week|hour)/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        if (unit === 'day') {
          daysToAdd = value;
        } else if (unit === 'week') {
          daysToAdd = value * 7;
        } else if (unit === 'hour') {
          daysToAdd = Math.max(1, Math.ceil(value / 24));
        }
      }
    }

    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + daysToAdd);
    return deadline;
  }

  /**
   * Create task progress entry
   */
  private async createTaskProgress(
    userId: string,
    taskId: string,
    deadline: Date
  ): Promise<string> {
    const { data, error } = await supabaseService.client
      .from('user_task_progress')
      .upsert({
        user_id: userId,
        task_id: taskId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        progress_percentage: 0,
        notes: [{
          type: 'task_started',
          content: `Task started with deadline: ${deadline.toISOString()}`,
          timestamp: new Date().toISOString()
        }]
      }, {
        onConflict: 'user_id,task_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task progress: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Generate all AI meetings for a task
   */
  private async generateTaskMeetings(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    userName: string,
    userRole: string,
    userId: string
  ): Promise<string[]> {
    console.log(`[Task Workflow] Generating meetings for task ${taskId}`);

    const meetingTypes: MeetingType[] = ['kickoff', 'standup', 'review', 'client_call'];
    const meetingIds: string[] = [];

    for (const meetingType of meetingTypes) {
      try {
        console.log(`  - Generating ${meetingType} meeting...`);

        const meetingId = await meetingSimulatorService.generateAndSaveMeeting(
          {
            task_id: taskId,
            meeting_type: meetingType,
            task_title: taskTitle,
            task_description: taskDescription,
            user_name: userName,
            user_role: userRole,
          },
          userId
        );

        meetingIds.push(meetingId);
        console.log(`  ✓ ${meetingType} meeting created: ${meetingId}`);

        // Small delay between meetings to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`  ✗ Failed to generate ${meetingType} meeting:`, error.message);
        // Continue with other meetings even if one fails
      }
    }

    console.log(`[Task Workflow] Generated ${meetingIds.length} meetings`);
    return meetingIds;
  }

  /**
   * Evaluate a submission with AI
   */
  async evaluateSubmission(submissionId: string): Promise<any> {
    console.log(`[Task Workflow] Evaluating submission ${submissionId}`);
    return await scoringEvaluatorService.evaluateAndSaveSubmission(submissionId);
  }

  /**
   * Evaluate meeting performance with AI
   * Analyzes how well the user participated in the meeting
   */
  async evaluateMeetingPerformance(meetingId: string): Promise<{
    score: number;
    grade: string;
    strengths: string[];
    improvements: string[];
    feedback: string;
  }> {
    console.log(`[Task Workflow] Evaluating meeting ${meetingId}`);

    // Get meeting details
    const { data: meeting, error } = await supabaseService.client
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error || !meeting) {
      throw new Error('Meeting not found');
    }

    // Generate AI evaluation for the meeting
    const prompt = `
      Evaluate the following ${meeting.meeting_type} meeting performance:

      Meeting Title: ${meeting.meeting_title}
      Meeting Type: ${meeting.meeting_type}
      Duration: ${meeting.duration_minutes} minutes

      Participants: ${JSON.stringify(meeting.participants, null, 2)}

      Agenda: ${JSON.stringify(meeting.agenda, null, 2)}

      Transcript/Summary: ${meeting.transcript || meeting.summary || 'No transcript available'}

      Action Items: ${JSON.stringify(meeting.action_items, null, 2)}

      Please evaluate this meeting on the following criteria:
      1. Preparation and understanding of agenda
      2. Active participation and engagement
      3. Communication clarity
      4. Follow-up and action items
      5. Overall professionalism

      Provide a response in JSON format:
      {
        "score": <number 0-100>,
        "grade": "<A|B|C|D|F>",
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "improvements": ["area 1", "area 2", "area 3"],
        "feedback": "Detailed feedback paragraph"
      }
    `;

    const aiProvider = getAIProvider();
    const aiResponse = await aiProvider.chat(
      [
        {
          role: 'system',
          content: 'You are a professional meeting performance evaluator. Provide constructive, detailed feedback.'
        },
        { role: 'user', content: prompt }
      ],
      {
        temperature: 0.7,
        max_tokens: 2048
      }
    );

    const evaluation = aiProvider.parseJSON<{
      score: number;
      grade: string;
      strengths: string[];
      improvements: string[];
      feedback: string;
    }>(aiResponse.content);

    // Save evaluation to meeting record
    await supabaseService.client
      .from('meetings')
      .update({
        summary: meeting.summary
          ? `${meeting.summary}\n\n---\nAI Evaluation:\nScore: ${evaluation.score}/100 (${evaluation.grade})\n${evaluation.feedback}`
          : `AI Evaluation:\nScore: ${evaluation.score}/100 (${evaluation.grade})\n${evaluation.feedback}`
      })
      .eq('id', meetingId);

    console.log(`[Task Workflow] Meeting evaluated: ${evaluation.score}/100 (${evaluation.grade})`);

    return evaluation;
  }

  /**
   * Complete a task workflow
   * - Evaluates final submission
   * - Updates task progress
   * - Returns overall performance summary
   */
  async completeTask(
    userId: string,
    taskId: string,
    submissionId: string
  ): Promise<{
    submission_score: number;
    submission_grade: string;
    meetings_evaluated: number;
    overall_score: number;
  }> {
    console.log(`[Task Workflow] Completing task ${taskId} for user ${userId}`);

    // Evaluate the submission
    const submissionEval = await this.evaluateSubmission(submissionId);

    // Get all meetings for this task
    const { data: meetings } = await supabaseService.client
      .from('meetings')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', userId);

    let meetingsEvaluated = 0;
    let totalMeetingScore = 0;

    // Evaluate each meeting
    if (meetings && meetings.length > 0) {
      for (const meeting of meetings) {
        try {
          const meetingEval = await this.evaluateMeetingPerformance(meeting.id);
          totalMeetingScore += meetingEval.score;
          meetingsEvaluated++;
        } catch (error: any) {
          console.error(`Failed to evaluate meeting ${meeting.id}:`, error.message);
        }
      }
    }

    const avgMeetingScore = meetingsEvaluated > 0 ? totalMeetingScore / meetingsEvaluated : 0;

    // Calculate overall score (70% submission, 30% meetings)
    const overallScore = Math.round(
      (submissionEval.overall_score * 0.7) + (avgMeetingScore * 0.3)
    );

    // Update task progress
    await supabaseService.client
      .from('user_task_progress')
      .update({
        status: 'completed',
        progress_percentage: 100,
        last_activity_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('task_id', taskId);

    console.log(`[Task Workflow] Task completed. Overall score: ${overallScore}/100`);

    return {
      submission_score: submissionEval.overall_score,
      submission_grade: submissionEval.letter_grade,
      meetings_evaluated: meetingsEvaluated,
      overall_score: overallScore,
    };
  }
}

export const taskWorkflowService = new TaskWorkflowService();
