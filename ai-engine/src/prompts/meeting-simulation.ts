import { MeetingType } from '../types';

export const getMeetingSimulationSystemPrompt = (): string => `
You are an expert workplace meeting simulator for JobSim Senegal. Your role is to generate realistic professional meeting scenarios that help job seekers practice real-world workplace interactions.

Your meetings should:
1. Include realistic AI participants with diverse professional backgrounds
2. Have structured agendas that reflect actual business practices
3. Generate authentic conversation transcripts
4. Provide actionable items with clear ownership
5. Summarize key decisions and outcomes
6. Be culturally appropriate for West African business context
7. Use a mix of formal and professional-casual tones as appropriate

Always respond with valid JSON that can be parsed directly.
`;

export const getMeetingSimulationUserPrompt = (
  meetingType: MeetingType,
  taskTitle: string,
  taskDescription: string,
  userName: string,
  userRole: string
): string => {
  const meetingTypeGuidelines: Record<MeetingType, string> = {
    kickoff: `This is a project kickoff meeting to introduce the task, align on objectives, and establish expectations. Include introductions, project overview, roles clarification, timeline review, and initial Q&A.`,
    standup: `This is a daily standup meeting focusing on progress updates, blockers, and next steps. Keep it concise (15-20 minutes) with each participant sharing their update.`,
    review: `This is a task review meeting to evaluate completed work, provide feedback, and discuss improvements. Include work presentation, feedback session, and next steps.`,
    client_call: `This is a client meeting to discuss requirements, present progress, or gather feedback. Include professional client interaction, requirement clarification, and follow-up actions.`,
    general: `This is a general team meeting to discuss relevant topics, coordinate efforts, and share information.`,
  };

  return `
Generate a realistic ${meetingType} meeting for the following task:

Task Title: ${taskTitle}
Task Description: ${taskDescription}
User Name: ${userName}
User Role: ${userRole}

Meeting Guidelines:
${meetingTypeGuidelines[meetingType]}

Generate a complete meeting with:
1. A professional meeting title
2. 3-5 AI participants with realistic names, roles, and brief backgrounds (one should be a senior/manager)
3. A structured agenda with time allocations
4. A realistic conversation transcript (15-30 exchanges) that:
   - Uses professional language
   - Includes the user (${userName}) as an active participant
   - Shows natural flow of discussion
   - Contains relevant questions and answers
   - Demonstrates workplace communication patterns
5. A concise meeting summary (2-3 paragraphs)
6. 3-6 specific action items with assignees and due dates

Respond with JSON in this exact format:
{
  "meeting_title": "Meeting Title",
  "meeting_type": "${meetingType}",
  "participants": [
    {
      "id": "uuid",
      "name": "Full Name",
      "role": "Job Title",
      "avatar_url": null,
      "is_ai": true
    }
  ],
  "agenda": [
    {
      "id": "uuid",
      "title": "Agenda Item",
      "duration_minutes": 10,
      "presenter": "Name"
    }
  ],
  "duration_minutes": 45,
  "transcript": "Meeting Transcript:\\n\\n[Speaker Name]: Message...\\n\\n[Another Speaker]: Response...",
  "summary": "Brief meeting summary covering key discussions, decisions, and outcomes.",
  "action_items": [
    {
      "id": "uuid",
      "description": "Specific action to be taken",
      "assignee": "Person Name",
      "due_date": "2024-01-15T00:00:00Z",
      "completed": false
    }
  ]
}

Include ${userName} in the participants list with is_ai: false.
Make the transcript engaging and educational for someone learning workplace dynamics.
`;
};

export const getAIParticipantNames = (): { name: string; role: string }[] => [
  { name: 'Fatou Diallo', role: 'Project Manager' },
  { name: 'Amadou Sow', role: 'Senior Developer' },
  { name: 'Mariama Ndiaye', role: 'Product Owner' },
  { name: 'Ibrahima Fall', role: 'Team Lead' },
  { name: 'Aissatou Ba', role: 'Business Analyst' },
  { name: 'Moussa Diop', role: 'Technical Architect' },
  { name: 'Khady Sarr', role: 'UX Designer' },
  { name: 'Ousmane Gueye', role: 'Quality Assurance' },
  { name: 'Aminata Cisse', role: 'Data Analyst' },
  { name: 'Cheikh Mbaye', role: 'Operations Manager' },
];
