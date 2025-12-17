import { getAIProvider } from './ai-provider.factory';
import { supabaseService } from './supabase.service';
import {
  TaskGenerationRequest,
  GeneratedTask,
  JobField,
  DifficultyLevel,
} from '../types';
import {
  getTaskGenerationSystemPrompt,
  getTaskGenerationUserPrompt,
  getSkillsForJobField,
} from '../prompts/task-generation';
import { generateId } from '../utils/helpers';
import { config } from '../config';

export class TaskGeneratorService {
  async generateTasks(request: TaskGenerationRequest): Promise<GeneratedTask[]> {
    const count = Math.min(request.count || 1, config.maxTasksPerGeneration);

    const systemPrompt = getTaskGenerationSystemPrompt();
    const userPrompt = getTaskGenerationUserPrompt(
      request.job_field,
      request.difficulty_level,
      count,
      request.specific_skills || getSkillsForJobField(request.job_field).slice(0, 5),
      request.context
    );

    // Use AI provider abstraction (supports both OpenAI and Claude)
    const aiProvider = getAIProvider();
    const aiResponse = await aiProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        temperature: 0.8,
        max_tokens: 8192
      }
    );

    const response = aiProvider.parseJSON<{ tasks?: GeneratedTask[]; [key: string]: any }>(aiResponse.content);

    // Handle both array and object responses
    let tasks: GeneratedTask[];
    if (Array.isArray(response)) {
      tasks = response;
    } else if (response.tasks && Array.isArray(response.tasks)) {
      tasks = response.tasks;
    } else {
      // Single task wrapped in object
      tasks = [response as unknown as GeneratedTask];
    }

    // Ensure all tasks have proper IDs
    return tasks.map((task) => this.ensureTaskIds(task));
  }

  private ensureTaskIds(task: GeneratedTask): GeneratedTask {
    return {
      ...task,
      deliverables: task.deliverables.map((d) => ({
        ...d,
        id: d.id || generateId(),
      })),
      resources: task.resources.map((r) => ({
        ...r,
        id: r.id || generateId(),
      })),
    };
  }

  async generateAndSaveTasks(request: TaskGenerationRequest): Promise<string[]> {
    const tasks = await this.generateTasks(request);
    return await supabaseService.saveGeneratedTasks(tasks);
  }

  async generateTasksForAllFields(
    difficultyLevel: DifficultyLevel,
    countPerField: number = 1
  ): Promise<Map<JobField, string[]>> {
    const fields: JobField[] = [
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
    ];

    const results = new Map<JobField, string[]>();

    for (const field of fields) {
      console.log(`Generating tasks for ${field}...`);
      const taskIds = await this.generateAndSaveTasks({
        job_field: field,
        difficulty_level: difficultyLevel,
        count: countPerField,
      });
      results.set(field, taskIds);

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }

  async balanceTaskCatalog(): Promise<{ field: JobField; generated: number }[]> {
    const counts = await supabaseService.getTaskCountByField();
    const targetCount = 10; // Target tasks per field
    const results: { field: JobField; generated: number }[] = [];

    const fields: JobField[] = [
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
    ];

    for (const field of fields) {
      const currentCount = counts[field] || 0;
      if (currentCount < targetCount) {
        const toGenerate = Math.min(targetCount - currentCount, 3);
        console.log(`Generating ${toGenerate} tasks for ${field} (current: ${currentCount})`);

        const taskIds = await this.generateAndSaveTasks({
          job_field: field,
          difficulty_level: 'intermediate',
          count: toGenerate,
        });

        results.push({ field, generated: taskIds.length });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}

export const taskGeneratorService = new TaskGeneratorService();
