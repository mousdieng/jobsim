// ============================================
// JOBSIM SENEGAL - PLATFORM MODELS
// TypeScript Interfaces for Database Tables
// ============================================

// ============================================
// ENUMS (Match database enums)
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

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

// ============================================
// USER INTERFACES
// ============================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  job_field: JobField;
  experience_level: ExperienceLevel;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  skills: string[];
  completed_tasks_count: number;
  total_score: number;
  average_score: number;
  is_available_for_hire: boolean;
  created_at: string;
  updated_at: string;

  // Legacy fields for backwards compatibility
  full_name?: string; // Alias for name
  role?: string;
  user_type?: string;
  score_total?: number;
  completed_count?: number;
  badge_level?: string;
  linked_profile?: string;
  contact_email?: string;
}

export interface UserProfileUpdate {
  name?: string;
  bio?: string;
  avatar_url?: string;
  job_field?: JobField;
  experience_level?: ExperienceLevel;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  skills?: string[];
  is_available_for_hire?: boolean;
}

// ============================================
// ENTERPRISE INTERFACES
// ============================================

export interface Enterprise {
  id: string;
  name: string;
  sector: string;
  description?: string;
  logo_url?: string;
  website?: string;
  location?: string;
  size?: string;
  is_verified: boolean;
  contact_email: string;
  contact_phone?: string;
  admin_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseCreate {
  name: string;
  sector: string;
  description?: string;
  logo_url?: string;
  website?: string;
  location?: string;
  size?: string;
  contact_email: string;
  contact_phone?: string;
}

// ============================================
// TASK INTERFACES
// ============================================

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

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  job_field: JobField;
  difficulty_level: DifficultyLevel;
  estimated_duration?: string;
  deadline?: string;
  skills_required: string[];
  deliverables: Deliverable[];
  resources: Resource[];
  created_by: CreatorType;
  enterprise_id?: string;
  max_submissions?: number;
  current_submissions: number;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  enterprise?: Enterprise;
}

export interface TaskCreate {
  title: string;
  description: string;
  instructions?: string;
  job_field: JobField;
  difficulty_level: DifficultyLevel;
  estimated_duration?: string;
  deadline?: string;
  skills_required?: string[];
  deliverables?: Deliverable[];
  resources?: Resource[];
  created_by: CreatorType;
  enterprise_id?: string;
  max_submissions?: number;
  is_active?: boolean;
  is_featured?: boolean;
  tags?: string[];
}

export interface TaskFilters {
  job_field?: JobField;
  difficulty_level?: DifficultyLevel;
  created_by?: CreatorType;
  is_featured?: boolean;
  search?: string;
  skills?: string[];
}

// ============================================
// SUBMISSION INTERFACES
// ============================================

export interface SubmissionContent {
  type: string;
  data: any;
  notes?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  user_id: string;
  content: SubmissionContent;
  attachments: Attachment[];
  notes?: string;
  time_spent_minutes?: number;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  task?: Task;
  user?: UserProfile;
}

export interface SubmissionCreate {
  task_id: string;
  content: SubmissionContent;
  attachments?: Attachment[];
  notes?: string;
  time_spent_minutes?: number;
}

export interface SubmissionUpdate {
  content?: SubmissionContent;
  attachments?: Attachment[];
  notes?: string;
  time_spent_minutes?: number;
  status?: SubmissionStatus;
}

export interface SubmissionReview {
  score: number;
  feedback: string;
  status: 'reviewed' | 'approved' | 'rejected';
}

// ============================================
// MEETING INTERFACES
// ============================================

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

export interface Meeting {
  id: string;
  task_id?: string;
  user_id: string;
  meeting_title: string;
  meeting_type: MeetingType;
  participants: MeetingParticipant[];
  agenda: AgendaItem[];
  transcript?: string;
  summary?: string;
  action_items: ActionItem[];
  duration_minutes: number;
  scheduled_for: string;
  completed: boolean;
  recording_url?: string;
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  task?: Task;
}

export interface MeetingCreate {
  task_id?: string;
  meeting_title: string;
  meeting_type?: MeetingType;
  participants?: MeetingParticipant[];
  agenda?: AgendaItem[];
  duration_minutes?: number;
  scheduled_for: string;
}

// ============================================
// ENTERPRISE TASK INTERFACES
// ============================================

export interface EnterpriseTask {
  id: string;
  enterprise_id: string;
  task_id: string;
  priority: TaskPriority;
  budget_range?: string;
  hiring_intent: boolean;
  created_at: string;

  // Joined data (optional)
  enterprise?: Enterprise;
  task?: Task;
}

// ============================================
// USER PROGRESS INTERFACES
// ============================================

export interface UserTaskProgress {
  id: string;
  user_id: string;
  task_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at?: string;
  last_activity_at?: string;
  progress_percentage: number;
  notes: any[];
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  task?: Task;
}

// ============================================
// RECRUITER VIEW INTERFACES
// ============================================

export interface RecruiterView {
  id: string;
  enterprise_id: string;
  user_id: string;
  submission_id?: string;
  viewed_at: string;

  // Joined data (optional)
  enterprise?: Enterprise;
  user?: UserProfile;
  submission?: TaskSubmission;
}

// ============================================
// API RESPONSE INTERFACES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TaskWithSubmission extends Task {
  user_submission?: TaskSubmission;
  user_progress?: UserTaskProgress;
}

// ============================================
// STATISTICS INTERFACES
// ============================================

export interface UserStatistics {
  total_tasks_completed: number;
  average_score: number;
  total_time_spent_minutes: number;
  tasks_by_field: Record<JobField, number>;
  tasks_by_difficulty: Record<DifficultyLevel, number>;
  recent_activity: TaskSubmission[];
  recruiter_views_count: number;
}

export interface PlatformStatistics {
  total_users: number;
  total_tasks: number;
  total_submissions: number;
  total_enterprises: number;
  tasks_by_field: Record<JobField, number>;
  popular_skills: string[];
}
