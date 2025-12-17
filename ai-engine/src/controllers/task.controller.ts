import { Request, Response } from 'express';
import { taskGeneratorService } from '../services/task-generator.service';
import { TaskGenerationRequest, JobField, DifficultyLevel } from '../types';
import { z } from 'zod';

// Validation schemas
const taskGenerationSchema = z.object({
  job_field: z.enum([
    'software_engineering',
    'accounting',
    'marketing',
    'sales',
    'human_resources',
    'project_management',
    'data_science',
    'graphic_design',
    'customer_service',
    'finance',
    'legal',
    'healthcare',
    'education',
    'operations',
    'consulting',
    'other',
  ]),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  count: z.number().min(1).max(5).optional(),
  specific_skills: z.array(z.string()).optional(),
  context: z.string().optional(),
});

export class TaskController {
  async generateTasks(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = taskGenerationSchema.parse(req.body);
      const request: TaskGenerationRequest = {
        job_field: validatedData.job_field as JobField,
        difficulty_level: validatedData.difficulty_level as DifficultyLevel,
        count: validatedData.count,
        specific_skills: validatedData.specific_skills,
        context: validatedData.context,
      };

      const tasks = await taskGeneratorService.generateTasks(request);

      res.status(200).json({
        success: true,
        data: tasks,
        message: `Generated ${tasks.length} task(s) successfully`,
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

      console.error('Task generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async generateAndSaveTasks(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = taskGenerationSchema.parse(req.body);
      const request: TaskGenerationRequest = {
        job_field: validatedData.job_field as JobField,
        difficulty_level: validatedData.difficulty_level as DifficultyLevel,
        count: validatedData.count,
        specific_skills: validatedData.specific_skills,
        context: validatedData.context,
      };

      const taskIds = await taskGeneratorService.generateAndSaveTasks(request);

      res.status(201).json({
        success: true,
        data: { task_ids: taskIds },
        message: `Generated and saved ${taskIds.length} task(s) successfully`,
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

      console.error('Task generation and save error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate and save tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async balanceTaskCatalog(req: Request, res: Response): Promise<void> {
    try {
      const results = await taskGeneratorService.balanceTaskCatalog();

      res.status(200).json({
        success: true,
        data: results,
        message: 'Task catalog balanced successfully',
      });
    } catch (error) {
      console.error('Task catalog balancing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to balance task catalog',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const taskController = new TaskController();
