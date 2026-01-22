/**
 * Enhanced Task System - Database Types
 * Auto-generated from Supabase schema
 * Migration Date: January 14, 2026
 */

// ============================================
// ENUMS
// ============================================

export type UserRole = 'candidate' | 'enterprise_rep' | 'admin' | 'platform_support';

export type TaskDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type TaskStatus = 'draft' | 'active' | 'archived';

export type SubmissionStatus =
  | 'pending_validation'
  | 'validation_failed'
  | 'awaiting_review'
  | 'under_review'
  | 'review_complete'
  | 'rejected';

export type ReviewDecision = 'approve' | 'reject';

export type AchievementCategory = 'skill' | 'consistency' | 'progression';

export type ShortlistStatus =
  | 'interested'
  | 'contacted'
  | 'interviewing'
  | 'offered'
  | 'hired'
  | 'passed';

export type InteractionType = 'message' | 'interview_request' | 'offer';

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

// ============================================
// PROFILE INTERFACES
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  id: string;
  overall_xp: number;
  overall_level: number;
  category_xp: Record<string, number>; // { marketing: 6200, sales: 3100 }
  category_levels: Record<string, number>; // { marketing: 4, sales: 3 }
  achievements: string[]; // ['first_perfect', 'sharpshooter']
  tasks_completed: number;
  tasks_attempted: number;
  approval_rate: number;
  current_task_id: string | null;
  bio: string | null;
  skills: string[]; // ['social_media', 'seo', 'copywriting']
  location: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  preferred_categories: string[];
  availability_hours: number;
  is_open_to_opportunities: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseRepProfile {
  id: string;
  company_id: string;
  job_title: string | null;
  department: string | null;
  bio: string | null;
  can_review: boolean;
  is_active: boolean;
  reviews_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string | null;
  size: CompanySize | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// USER - Combined Profile
// ============================================

export interface User extends Profile {
  // Candidate-specific fields (if role is 'candidate')
  candidateProfile?: CandidateProfile;

  // Enterprise Rep-specific fields (if role is 'enterprise_rep')
  enterpriseRepProfile?: EnterpriseRepProfile;
  company?: Company;
}

// ============================================
// TASK INTERFACES
// ============================================

export interface SubmissionFileConfig {
  label: string;
  type: 'document' | 'images' | 'spreadsheet' | 'design' | 'video' | 'code';
  allowed_formats: string[]; // ['pdf', 'docx']
  max_size_mb: number;
  max_files?: number; // For multiple files
  description: string;
}

export interface SubmissionConfig {
  required_files: SubmissionFileConfig[];
  optional_files?: SubmissionFileConfig[];
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string; // 'marketing', 'sales', 'design', etc.
  job_role: string; // 'Marketing Manager', 'Sales Rep', etc.
  job_field: string; // Alias for category, used in templates
  skill_tags: string[]; // ['social_media', 'strategy', 'analytics']
  tags: string[]; // Alias for skill_tags, used in templates
  skills_required: string[]; // Alias for skill_tags
  difficulty: TaskDifficulty;
  difficulty_level: TaskDifficulty; // Alias for difficulty
  base_xp: number; // 100-1000
  difficulty_multiplier: number; // 1.0-3.0
  estimated_time_minutes: number | null;
  estimated_duration: number | null; // Alias for estimated_time_minutes
  deadline: string | null; // Task deadline date
  submission_config: SubmissionConfig;
  evaluation_criteria: string[]; // ['Clear target audience', 'Creative approach']
  deliverables: any[]; // Task deliverables
  attachments: TaskAttachment[];
  resources: any[]; // Task resources and references
  status: TaskStatus;
  created_by: string | null;
  enterprise?: any; // Optional enterprise/company information for enterprise-created tasks
  created_at: string;
  updated_at: string;
}

// ============================================
// SUBMISSION INTERFACES
// ============================================

export interface SubmittedFile {
  field_label: string; // Maps to submission_config field
  files: {
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_at: string;
  }[];
}

export interface ValidationError {
  field: string;
  error: string;
  details?: string;
}

export interface Submission {
  id: string;
  task_id: string;
  candidate_id: string;
  attempt_number: number;
  status: SubmissionStatus;
  submitted_files: SubmittedFile[];
  validation_errors: ValidationError[];
  xp_earned: number;
  score: number | null; // Submission score
  feedback: string | null; // Reviewer feedback
  is_approved: boolean;
  approved_attempt_number: number | null;
  is_featured: boolean;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// REVIEW INTERFACES
// ============================================

export interface Review {
  id: string;
  submission_id: string;
  reviewer_id: string;
  decision: ReviewDecision;
  feedback: string; // Min 50 characters
  strengths: string[]; // ['Good research', 'Clear presentation']
  improvements: string[]; // ['Add more examples', 'Improve formatting']
  reviewed_at: string;
  created_at: string;
}

// ============================================
// ACHIEVEMENT INTERFACES
// ============================================

export interface Achievement {
  id: string; // 'first_perfect', 'sharpshooter', etc.
  name: string; // 'First Perfect'
  description: string; // 'Pass a task on your first attempt'
  icon: string; // '🏆'
  category: AchievementCategory;
  criteria_description: string;
  created_at: string;
}

// ============================================
// SHORTLIST INTERFACES
// ============================================

export interface Shortlist {
  id: string;
  enterprise_rep_id: string;
  candidate_id: string;
  notes: string | null;
  status: ShortlistStatus;
  added_at: string;
  updated_at: string;
}

// ============================================
// INTERACTION INTERFACES
// ============================================

export interface Interaction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: InteractionType;
  subject: string | null;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  responded_at: string | null;
  created_at: string;
}

// ============================================
// NOTIFICATION INTERFACES
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  type: string; // 'submission_reviewed', 'achievement_unlocked', etc.
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

// ============================================
// ACTIVITY LOG INTERFACES
// ============================================

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================
// COMBINED INTERFACES (with relationships)
// ============================================

export interface TaskWithCreator extends Task {
  creator?: Profile;
}

export interface SubmissionWithDetails extends Submission {
  task?: Task;
  candidate?: User;
  reviews?: Review[];
}

export interface ReviewWithDetails extends Review {
  submission?: Submission;
  reviewer?: User & { enterpriseRepProfile?: EnterpriseRepProfile; company?: Company };
}

export interface ShortlistWithDetails extends Shortlist {
  candidate?: User & { candidateProfile?: CandidateProfile };
  enterprise_rep?: User & { enterpriseRepProfile?: EnterpriseRepProfile; company?: Company };
}

// ============================================
// XP CALCULATION
// ============================================

export interface XPCalculation {
  base_xp: number;
  difficulty_multiplier: number;
  attempt_multiplier: number;
  total_xp: number;
}

export interface LevelInfo {
  current_level: number;
  current_xp: number;
  xp_for_next_level: number;
  xp_progress_percentage: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
