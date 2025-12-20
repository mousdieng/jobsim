import { JobField, ExperienceLevel, UserProfile } from './platform.model';

// Legacy user type - keep for backwards compatibility
export type UserType = 'student' | 'mentor' | 'support' | 'admin' | 'enterprise';

// Main User interface - now uses UserProfile from platform model
export type User = UserProfile;

// Auth-related interfaces
export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  user_metadata?: any;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name: string;
  job_field?: JobField;
  experience_level?: ExperienceLevel;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
}
