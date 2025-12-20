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

export type UserRole = 'student' | 'support' | 'admin' | 'enterprise' | 'mentor';

export type UserStatus = 'active' | 'suspended' | 'banned';

export type EnterpriseStatus = 'pending' | 'active' | 'suspended' | 'banned';

export type TaskLifecycleStatus = 'draft' | 'validation_pending' | 'active' | 'archived';

export type PermissionKey = string;

// Role display name mapping for 4-role model
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Admin',
  support: 'Platform Support',
  enterprise: 'Enterprise Recruiter',
  student: 'Candidate',
  mentor: 'Platform Support' // Legacy, mapped to Platform Support
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Platform governance and full authority',
  support: 'Platform operations and support',
  enterprise: 'Hiring-focused task creation',
  student: 'Task solving and profile building',
  mentor: 'Platform operations and support' // Legacy
};

export type AdminActionType =
  | 'approve_enterprise'
  | 'reject_enterprise'
  | 'suspend_enterprise'
  | 'unsuspend_enterprise'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'ban_user'
  | 'delete_user'
  | 'approve_task'
  | 'reject_task'
  | 'flag_task'
  | 'feature_task'
  | 'override_score'
  | 'flag_submission'
  | 'resolve_dispute'
  | 'update_settings'
  | 'create_admin';

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

  // Role and status
  user_type?: UserRole;
  status?: UserStatus;
  suspended_at?: string;
  suspension_reason?: string;

  // Admin-specific fields
  two_factor_enabled?: boolean;
  last_policy_training?: string;
  approved_by?: string;

  // Legacy fields for backwards compatibility
  full_name?: string; // Alias for name
  role?: string;
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
// ADMIN INTERFACES
// ============================================

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action_type: AdminActionType;
  target_type: 'user' | 'enterprise' | 'task' | 'submission' | 'setting';
  target_id: string;
  reason?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  session_id?: string;
  reversible: boolean;
  reversible_until?: string;
  reversed: boolean;
  reversed_by?: string;
  reversed_at?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_enterprises: number;
  total_tasks: number;
  total_submissions: number;
  pending_enterprises: number;
  pending_task_approvals: number;
  flagged_tasks: number;
  flagged_submissions: number;
  active_disputes: number;
  suspended_users: number;
  recent_actions: AdminAuditLog[];
}

export interface RolePermission {
  id: string;
  role_type: UserRole;
  permission_key: string;
  permission_name: string;
  description?: string;
  created_at: string;
}

export interface UserRoleMetadata {
  id: string;
  user_id: string;
  role_display_name: string;
  role_description?: string;
  permissions: string[];
  scope: 'platform' | 'enterprise' | 'global';
  enterprise_id?: string;
  created_at: string;
  updated_at: string;
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

  // Verification
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;

  // Status
  status: EnterpriseStatus;
  suspended_at?: string;
  suspension_reason?: string;

  // Contact
  contact_email: string;
  contact_phone?: string;

  // Admin
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

  // Lifecycle workflow
  lifecycle_status?: TaskLifecycleStatus;
  validated_by?: string;
  validated_at?: string;
  validation_notes?: string;

  // Admin fields
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  flagged?: boolean;
  flag_reason?: string;

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

  // Admin fields
  flagged?: boolean;
  flag_reason?: string;
  score_overridden?: boolean;
  score_override_reason?: string;
  score_overridden_by?: string;
  score_overridden_at?: string;

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
