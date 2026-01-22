import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import {
  User,
  Profile,
  CandidateProfile,
  EnterpriseRepProfile,
  Company,
  UserRole,
  ApiResponse
} from '../models/database.types';

export interface SignUpCredentials {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Current user state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Auth state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.validateAndCleanAuth().then(() => {
      this.initializeAuth();
    });
  }

  /**
   * Validate auth data and clean if corrupted
   */
  private async validateAndCleanAuth(): Promise<void> {
    try {
      const session = await this.supabase.getSession();

      if (session?.user) {
        // Check if token is expired
        const expiresAt = session.expires_at;
        if (expiresAt && expiresAt * 1000 < Date.now()) {
          console.warn('Expired token detected, clearing session');
          await this.supabase.signOut();
        }
      }
    } catch (error) {
      console.error('Error validating auth, clearing session:', error);
      try {
        await this.supabase.signOut();
      } catch (signOutError) {
        console.error('Force clearing localStorage due to error');
      }
    }
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Listen for auth changes
      this.supabase.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.currentUserSubject.next(null);
          this.isAuthenticatedSubject.next(false);
          this.loadingSubject.next(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await this.loadUserProfile(session.user.id);
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          await this.loadUserProfile(session.user.id);
        }
      });

      // Check for existing session
      const session = await this.supabase.getSession();

      if (session?.user) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          await this.loadUserProfile(session.user.id);
        } catch (error) {
          console.error('Failed to load profile, clearing stale session:', error);
          await this.clearStaleSession();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await this.clearStaleSession();
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Clear stale/corrupted session data
   */
  private async clearStaleSession(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.loadingSubject.next(false);
    } catch (error) {
      console.error('Error clearing stale session:', error);
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.loadingSubject.next(false);
    }
  }

  /**
   * Load user profile from database with role-specific data
   */
  private async loadUserProfile(userId: string, retries = 3): Promise<void> {
    try {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
          }

          // Fetch base profile
          const { data: profile, error: profileError } = await this.supabase.client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (profileError) {
            console.error(`Error loading profile (attempt ${attempt + 1}/${retries}):`, profileError);
            if (attempt === retries - 1) {
              await this.clearStaleSession();
              throw profileError;
            }
            continue;
          }

          if (!profile) {
            console.log(`Profile not found (attempt ${attempt + 1}/${retries})`);
            if (attempt === retries - 1) {
              await this.clearStaleSession();
              throw new Error('Profile not found');
            }
            continue;
          }

          const user: User = profile as Profile;

          // Load role-specific data
          if (profile.role === 'candidate') {
            const { data: candidateProfile } = await this.supabase.client
              .from('candidate_profiles')
              .select('*')
              .eq('id', userId)
              .single();

            if (candidateProfile) {
              user.candidateProfile = candidateProfile as CandidateProfile;
            }
          } else if (profile.role === 'enterprise_rep') {
            // Load enterprise rep profile and company
            const { data: repProfile } = await this.supabase.client
              .from('enterprise_rep_profiles')
              .select('*, companies(*)')
              .eq('id', userId)
              .single();

            if (repProfile) {
              user.enterpriseRepProfile = repProfile as EnterpriseRepProfile;
              user.company = (repProfile as any).companies as Company;
            }
          }

          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          this.loadingSubject.next(false);
          return;
        } catch (error) {
          console.error(`Error loading user profile (attempt ${attempt + 1}/${retries}):`, error);
          if (attempt === retries - 1) {
            await this.clearStaleSession();
            throw error;
          }
        }
      }
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Sign up a new user with role
   */
  async signUp(credentials: SignUpCredentials): Promise<ApiResponse<User>> {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.signUp(
        credentials.email,
        credentials.password,
        {
          full_name: credentials.full_name,
          role: credentials.role
        }
      );

      if (authError) {
        return { data: null, error: authError.message };
      }

      if (!authData.user) {
        return { data: null, error: 'Failed to create user' };
      }

      // Create profile manually (trigger should do this, but we'll ensure it)
      const { error: profileError } = await this.supabase.client
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: credentials.email,
          full_name: credentials.full_name,
          role: credentials.role
        });

      if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
        console.error('Error creating profile:', profileError);
      }

      // Create role-specific profile
      if (credentials.role === 'candidate') {
        await this.supabase.client
          .from('candidate_profiles')
          .insert({
            id: authData.user.id
          });
      } else if (credentials.role === 'enterprise_rep') {
        // Enterprise rep will need company_id set later
        await this.supabase.client
          .from('enterprise_rep_profiles')
          .insert({
            id: authData.user.id,
            company_id: null // Will be set by admin
          });
      }

      // Wait for profile to be ready with retry logic
      const maxRetries = 5;
      const retryDelay = 500;

      for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        try {
          await this.loadUserProfile(authData.user.id);
          const currentUser = this.currentUserSubject.value;

          if (currentUser) {
            return { data: currentUser, error: null };
          }
        } catch (profileError) {
          console.log(`Retry ${i + 1}/${maxRetries}: Profile not ready yet`);
        }
      }

      // If profile creation is taking too long, sign in
      console.log('Profile creation delayed, attempting sign in...');
      return await this.signIn({
        email: credentials.email,
        password: credentials.password
      });
    } catch (error: any) {
      return { data: null, error: error.message || 'An error occurred during sign up' };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(credentials: SignInCredentials): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await this.supabase.signIn(
        credentials.email,
        credentials.password
      );

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data.user) {
        return { data: null, error: 'Failed to sign in' };
      }

      await this.loadUserProfile(data.user.id);

      const currentUser = this.currentUserSubject.value;
      return { data: currentUser, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'An error occurred during sign in' };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.signOut();

      if (error) {
        console.error('Error signing out:', error);
        return;
      }

      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Get current user value (synchronous)
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated (synchronous)
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Profile>): Promise<ApiResponse<User>> {
    try {
      const currentUser = this.getCurrentUser();

      if (!currentUser) {
        return { data: null, error: 'No user logged in' };
      }

      const { data, error } = await this.supabase.client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Reload full user profile
      await this.loadUserProfile(currentUser.id);

      return { data: this.currentUserSubject.value, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'An error occurred updating profile' };
    }
  }

  /**
   * Update candidate profile
   */
  async updateCandidateProfile(updates: Partial<CandidateProfile>): Promise<ApiResponse<User>> {
    try {
      const currentUser = this.getCurrentUser();

      if (!currentUser || currentUser.role !== 'candidate') {
        return { data: null, error: 'User is not a candidate' };
      }

      const { error } = await this.supabase.client
        .from('candidate_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        return { data: null, error: error.message };
      }

      // Reload full user profile
      await this.loadUserProfile(currentUser.id);

      return { data: this.currentUserSubject.value, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'An error occurred updating profile' };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.resetPassword(email);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An error occurred' };
    }
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const currentUser = this.getCurrentUser();

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'platform_support')) {
        return { data: null, error: 'Unauthorized: Admin access required' };
      }

      // Fetch all profiles with role-specific data
      const { data: profiles, error } = await this.supabase.client
        .from('profiles')
        .select(`
          *,
          candidateProfile:candidate_profiles(*),
          enterpriseRepProfile:enterprise_rep_profiles(
            *,
            company:companies(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      // Map profiles to User objects
      const users: User[] = (profiles || []).map((profile: any) => ({
        ...profile,
        candidateProfile: profile.candidateProfile || undefined,
        enterpriseRepProfile: profile.enterpriseRepProfile || undefined,
        company: profile.enterpriseRepProfile?.company || undefined
      }));

      return { data: users, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to fetch users' };
    }
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<void>> {
    try {
      const currentUser = this.getCurrentUser();

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'platform_support')) {
        return { data: null, error: 'Unauthorized: Admin access required' };
      }

      const { error } = await this.supabase.client
        .from('profiles')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to update user status' };
    }
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const currentUser = this.getCurrentUser();

      if (!currentUser || currentUser.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Admin access required' };
      }

      // Delete user from auth.users (will cascade to profiles via trigger)
      const { error } = await this.supabase.client.auth.admin.deleteUser(userId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to delete user' };
    }
  }
}
