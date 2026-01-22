import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User, SignUpCredentials, SignInCredentials, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Current user state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Auth state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    // Check for corrupted auth data on startup
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
      // Clear corrupted data
      try {
        await this.supabase.signOut();
      } catch (signOutError) {
        // Force clear even if signOut fails
        console.error('Force clearing localStorage due to error');
      }
    }
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Listen for auth changes first
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
          // Handle initial session restoration from localStorage
          await this.loadUserProfile(session.user.id);
        }
      });

      // Check for existing session after listener is set up
      const session = await this.supabase.getSession();

      if (session?.user) {
        try {
          // Add a small delay to ensure auth context is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          await this.loadUserProfile(session.user.id);
        } catch (error) {
          // Profile loading failed - clear stale session
          console.error('Failed to load profile, clearing stale session:', error);
          await this.clearStaleSession();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear potentially corrupted auth data
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
      // Sign out from Supabase (clears localStorage)
      await this.supabase.signOut();

      // Reset state
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.loadingSubject.next(false);
    } catch (error) {
      console.error('Error clearing stale session:', error);

      // Force clear local state even if signOut fails
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.loadingSubject.next(false);
    }
  }

  /**
   * Load user profile from database
   */
  private async loadUserProfile(userId: string, retries = 3): Promise<void> {
    try {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          // Add delay for retry attempts to allow auth context to fully initialize
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
          }

          const { data, error } = await this.supabase.client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

          if (error) {
            console.error(`Error loading user profile (attempt ${attempt + 1}/${retries}):`, error);

            // If this is the last attempt, clear stale session
            if (attempt === retries - 1) {
              await this.clearStaleSession();
              throw error;
            }
            // Otherwise, continue to next retry
            continue;
          }

          if (data) {
            this.currentUserSubject.next(data as User);
            this.isAuthenticatedSubject.next(true);
            this.loadingSubject.next(false);
            return; // Success!
          } else {
            // Profile doesn't exist yet (trigger hasn't completed)
            console.log(`Profile not found (attempt ${attempt + 1}/${retries})`);

            if (attempt === retries - 1) {
              // Clear stale session - user doesn't have a profile
              await this.clearStaleSession();
              throw new Error('Profile not found');
            }
            // Otherwise, continue to next retry
            continue;
          }
        } catch (error) {
          console.error(`Error loading user profile (attempt ${attempt + 1}/${retries}):`, error);

          // If this is the last attempt, clear stale session
          if (attempt === retries - 1) {
            await this.clearStaleSession();
            throw error;
          }
          // Otherwise, continue to next retry
        }
      }
    } finally {
      // Always ensure loading is set to false
      this.loadingSubject.next(false);
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      // Sign up with Supabase Auth
      // The database trigger will automatically create the user profile
      const { data: authData, error: authError } = await this.supabase.signUp(
        credentials.email,
        credentials.password,
        {
          name: credentials.name,
          job_field: credentials.job_field || 'other',
          experience_level: credentials.experience_level || 'junior'
        }
      );

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to create user' };
      }

      // Wait for the trigger to complete with retry logic
      const maxRetries = 5;
      const retryDelay = 500; // ms

      for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        try {
          await this.loadUserProfile(authData.user.id);
          const currentUser = this.currentUserSubject.value;

          if (currentUser) {
            return { user: currentUser, error: null };
          }
        } catch (profileError) {
          console.log(`Retry ${i + 1}/${maxRetries}: Profile not ready yet`);
          // Continue to next retry
        }
      }

      // If we get here, profile creation is taking too long
      // Sign in instead to trigger profile load
      console.log('Profile creation delayed, attempting sign in...');
      return await this.signIn({
        email: credentials.email,
        password: credentials.password
      });
    } catch (error: any) {
      return { user: null, error: error.message || 'An error occurred during sign up' };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.signIn(
        credentials.email,
        credentials.password
      );

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Failed to sign in' };
      }

      // Load user profile
      await this.loadUserProfile(data.user.id);

      const currentUser = this.currentUserSubject.value;
      return { user: currentUser, error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'An error occurred during sign in' };
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
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      const currentUser = this.getCurrentUser();

      if (!currentUser) {
        return { user: null, error: 'No user logged in' };
      }

      const { data, error } = await this.supabase.client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)
        .select('*')
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      this.currentUserSubject.next(data as User);
      return { user: data as User, error: null };
    } catch (error: any) {
      return { user: null, error: error.message || 'An error occurred updating profile' };
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
}
