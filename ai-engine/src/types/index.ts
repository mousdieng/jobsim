// ============================================
// AI ENGINE TYPE DEFINITIONS
// Mirrors Angular platform.model.ts
// ============================================

export type JobField =
  | 'software_engineering'
  | 'accounting'
  | 'marketing'
  | 'sales'
  | 'human_resources'
  | 'project_management'
  | 'data_science'
  | 'graphic_design'
  | 'customer_service'
  | 'finance'
  | 'legal'
  | 'healthcare'
  | 'education'
  | 'operations'
  | 'consulting'
  | 'other';

export type ExperienceLevel = 'junior' | 'mid' | 'senior';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CreatorType = 'ai' | 'enterprise' | 'platform';

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'reviewed'
  | 'approved'
  | 'rejected';

export type MeetingType = 'kickoff' | 'standup' | 'review' | 'client_call' | 'general';

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'code' | 'presentation' | 'spreadsheet' | 'design' | 'other';
  required: boolean;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'link' | 'template' | 'dataset';
  description?: string;
}

export interface TaskGenerationRequest {
  job_field: JobField;
  difficulty_level: DifficultyLevel;
  count?: number;
  specific_skills?: string[];
  context?: string;
}

export interface GeneratedTask {
  title: string;
  description: string;
  instructions: string;
  job_field: JobField;
  difficulty_level: DifficultyLevel;
  estimated_duration: string;
  skills_required: string[];
  deliverables: Deliverable[];
  resources: Resource[];
  tags: string[];
}

export interface MeetingParticipant {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  is_ai: boolean;
}

export interface AgendaItem {
  id: string;
  title: string;
  duration_minutes: number;
  presenter?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  due_date?: string;
  completed: boolean;
}

export interface MeetingGenerationRequest {
  task_id: string;
  meeting_type: MeetingType;
  task_title: string;
  task_description: string;
  user_name: string;
  user_role: string;
}

export interface GeneratedMeeting {
  meeting_title: string;
  meeting_type: MeetingType;
  participants: MeetingParticipant[];
  agenda: AgendaItem[];
  duration_minutes: number;
  transcript: string;
  summary: string;
  action_items: ActionItem[];
}

export interface SubmissionEvaluationRequest {
  task_id: string;
  task_title: string;
  task_description: string;
  task_instructions: string;
  deliverables: Deliverable[];
  skills_required: string[];
  submission_content: string;
  submission_notes?: string;
}

export interface EvaluationCriteria {
  criterion: string;
  weight: number;
  score: number;
  max_score: number;
  feedback: string;
}

export interface EvaluationResult {
  overall_score: number;
  letter_grade: string;
  criteria_breakdown: EvaluationCriteria[];
  strengths: string[];
  areas_for_improvement: string[];
  detailed_feedback: string;
  recommendations: string[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  job_field: JobField;
  experience_level: ExperienceLevel;
  skills: string[];
}

export interface AIEngineConfig {
  // AI Provider Selection
  aiProvider: 'openai' | 'claude' | 'mock';

  // OpenAI Configuration
  openaiApiKey: string;
  openaiModel: string;

  // Anthropic (Claude) Configuration
  anthropicApiKey: string;
  anthropicModel: string;

  // Supabase Configuration
  supabaseUrl: string;
  supabaseKey: string;

  // Task Generation Settings
  maxTasksPerGeneration: number;
  maxMeetingsPerTask: number;
  defaultTaskDeadlineDays: number;
}
