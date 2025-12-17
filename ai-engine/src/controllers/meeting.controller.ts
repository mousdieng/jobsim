import { Request, Response } from 'express';
import { meetingSimulatorService } from '../services/meeting-simulator.service';
import { supabaseService } from '../services/supabase.service';
import { MeetingGenerationRequest, MeetingType } from '../types';
import { z } from 'zod';

const meetingGenerationSchema = z.object({
  task_id: z.string().uuid(),
  meeting_type: z.enum(['kickoff', 'standup', 'review', 'client_call', 'general']),
  user_id: z.string().uuid(),
});

const meetingSeriesSchema = z.object({
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

export class MeetingController {
  async generateMeeting(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = meetingGenerationSchema.parse(req.body);

      // Fetch task and user details
      const task = await supabaseService.getTaskById(validatedData.task_id);
      const user = await supabaseService.getUserById(validatedData.user_id);

      const request: MeetingGenerationRequest = {
        task_id: validatedData.task_id,
        meeting_type: validatedData.meeting_type as MeetingType,
        task_title: task.title,
        task_description: task.description,
        user_name: user.full_name,
        user_role: `${user.experience_level} ${user.job_field.replace('_', ' ')}`,
      };

      const meetingId = await meetingSimulatorService.generateAndSaveMeeting(
        request,
        validatedData.user_id
      );

      res.status(201).json({
        success: true,
        data: { meeting_id: meetingId },
        message: 'Meeting generated and saved successfully',
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

      console.error('Meeting generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate meeting',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async generateMeetingSeries(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = meetingSeriesSchema.parse(req.body);

      // Fetch task and user details
      const task = await supabaseService.getTaskById(validatedData.task_id);
      const user = await supabaseService.getUserById(validatedData.user_id);

      const meetingIds = await meetingSimulatorService.generateMeetingSeriesForTask(
        validatedData.task_id,
        task.title,
        task.description,
        user.full_name,
        `${user.experience_level} ${user.job_field.replace('_', ' ')}`,
        validatedData.user_id
      );

      res.status(201).json({
        success: true,
        data: { meeting_ids: meetingIds },
        message: `Generated ${meetingIds.length} meetings successfully`,
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

      console.error('Meeting series generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate meeting series',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const meetingController = new MeetingController();
