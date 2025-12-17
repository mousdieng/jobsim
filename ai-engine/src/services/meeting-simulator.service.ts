import { getAIProvider } from './ai-provider.factory';
import { supabaseService } from './supabase.service';
import {
  MeetingGenerationRequest,
  GeneratedMeeting,
  MeetingType,
} from '../types';
import {
  getMeetingSimulationSystemPrompt,
  getMeetingSimulationUserPrompt,
} from '../prompts/meeting-simulation';
import { generateId } from '../utils/helpers';

export class MeetingSimulatorService {
  async generateMeeting(request: MeetingGenerationRequest): Promise<GeneratedMeeting> {
    const systemPrompt = getMeetingSimulationSystemPrompt();
    const userPrompt = getMeetingSimulationUserPrompt(
      request.meeting_type,
      request.task_title,
      request.task_description,
      request.user_name,
      request.user_role
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

    const response = aiProvider.parseJSON<GeneratedMeeting>(aiResponse.content);

    // Ensure all IDs are present
    return this.ensureMeetingIds(response, request.user_name, request.user_role);
  }

  private ensureMeetingIds(
    meeting: GeneratedMeeting,
    userName: string,
    userRole: string
  ): GeneratedMeeting {
    // Check if user is in participants, add if not
    const hasUser = meeting.participants.some((p) => !p.is_ai);
    if (!hasUser) {
      meeting.participants.unshift({
        id: generateId(),
        name: userName,
        role: userRole,
        is_ai: false,
      });
    }

    return {
      ...meeting,
      participants: meeting.participants.map((p) => ({
        ...p,
        id: p.id || generateId(),
      })),
      agenda: meeting.agenda.map((a) => ({
        ...a,
        id: a.id || generateId(),
      })),
      action_items: meeting.action_items.map((item) => ({
        ...item,
        id: item.id || generateId(),
        completed: false,
      })),
    };
  }

  async generateAndSaveMeeting(
    request: MeetingGenerationRequest,
    userId: string
  ): Promise<string> {
    const meeting = await this.generateMeeting(request);
    return await supabaseService.saveGeneratedMeeting(
      request.task_id,
      userId,
      meeting
    );
  }

  async generateMeetingSeriesForTask(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    userName: string,
    userRole: string,
    userId: string
  ): Promise<string[]> {
    const meetingTypes: MeetingType[] = ['kickoff', 'standup', 'review'];
    const meetingIds: string[] = [];

    for (const meetingType of meetingTypes) {
      console.log(`Generating ${meetingType} meeting...`);
      const meetingId = await this.generateAndSaveMeeting(
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

      // Delay between meetings
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return meetingIds;
  }

  async generateClientMeeting(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    userName: string,
    userRole: string,
    userId: string
  ): Promise<string> {
    return await this.generateAndSaveMeeting(
      {
        task_id: taskId,
        meeting_type: 'client_call',
        task_title: taskTitle,
        task_description: taskDescription,
        user_name: userName,
        user_role: userRole,
      },
      userId
    );
  }
}

export const meetingSimulatorService = new MeetingSimulatorService();
