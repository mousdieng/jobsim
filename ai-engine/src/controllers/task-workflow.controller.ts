import { Request, Response } from 'express';
import { taskWorkflowService } from '../services/task-workflow.service';
import { z } from 'zod';

// Validation schemas
const startTaskSchema = z.object({
  user_id: z.string().uuid(),
  task_id: z.string().uuid(),
  user_name: z.string(),
  user_role: z.string().optional().default('Professional'),
});

const evaluateSubmissionSchema = z.object({
  submission_id: z.string().uuid(),
});

const evaluateMeetingSchema = z.object({
  meeting_id: z.string().uuid(),
});

const completeTaskSchema = z.object({
  user_id: z.string().uuid(),
  task_id: z.string().uuid(),
  submission_id: z.string().uuid(),
});

export class TaskWorkflowController {
  /**
   * Start a task for a user
   * POST /api/workflow/tasks/start
   */
  async startTask(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = startTaskSchema.parse(req.body);

      const result = await taskWorkflowService.startTask(
        validatedData.user_id,
        validatedData.task_id,
        validatedData.user_name,
        validatedData.user_role
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Task started successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Start task error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start task',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Evaluate a submission
   * POST /api/workflow/submissions/evaluate
   */
  async evaluateSubmission(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = evaluateSubmissionSchema.parse(req.body);

      const result = await taskWorkflowService.evaluateSubmission(
        validatedData.submission_id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Submission evaluated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Evaluate submission error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to evaluate submission',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Evaluate a meeting
   * POST /api/workflow/meetings/evaluate
   */
  async evaluateMeeting(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = evaluateMeetingSchema.parse(req.body);

      const result = await taskWorkflowService.evaluateMeetingPerformance(
        validatedData.meeting_id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Meeting evaluated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Evaluate meeting error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to evaluate meeting',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Complete a task
   * POST /api/workflow/tasks/complete
   */
  async completeTask(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = completeTaskSchema.parse(req.body);

      const result = await taskWorkflowService.completeTask(
        validatedData.user_id,
        validatedData.task_id,
        validatedData.submission_id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Task completed successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Complete task error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete task',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const taskWorkflowController = new TaskWorkflowController();
