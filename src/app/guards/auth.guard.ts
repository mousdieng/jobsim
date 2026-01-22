import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';
import { map, filter, take, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Auth Guard - Protects routes that require authentication
 * Usage: Add to route configuration
 * Example: { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to finish loading before checking (with 5 second timeout)
  return authService.loading$.pipe(
    filter(loading => !loading), // Wait until loading is false
    take(1),
    timeout(5000), // Timeout after 5 seconds
    map(() => {
      const isAuthenticated = authService.isAuthenticated();

      if (isAuthenticated) {
        return true;
      }

      // Store the attempted URL for redirecting after login
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }),
    catchError(() => {
      // Timeout or error - redirect to login
      console.error('Auth guard timeout - redirecting to login');
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
};

/**
 * Guest Guard - Redirects authenticated users away from auth pages
 * Usage: Add to login/register routes
 * Example: { path: 'login', component: LoginComponent, canActivate: [guestGuard] }
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to finish loading before checking (with 5 second timeout)
  return authService.loading$.pipe(
    filter(loading => !loading), // Wait until loading is false
    take(1),
    timeout(5000), // Timeout after 5 seconds
    map(() => {
      const isAuthenticated = authService.isAuthenticated();

      if (!isAuthenticated) {
        return true;
      }

      // User is already authenticated, redirect to appropriate dashboard based on role
      const user = authService.getCurrentUser();
      const userRole = user?.role || 'candidate';

      if (userRole === 'admin' || userRole === 'platform_support') {
        router.navigate(['/admin/dashboard']);
      } else if (userRole === 'enterprise_rep') {
        router.navigate(['/enterprise/dashboard']);
      } else {
        router.navigate(['/app/dashboard']);
      }
      return false;
    }),
    catchError(() => {
      // Timeout or error - allow access to guest pages
      console.error('Guest guard timeout - allowing access');
      return of(true);
    })
  );
};

/**
 * Role Guard Factory - Protects routes based on user roles
 * Usage: Create a role-specific guard
 * Example:
 * export const adminGuard: CanActivateFn = roleGuard(['admin']);
 * { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] }
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          router.navigate(['/login']);
          return false;
        }

        // Use the new 'role' field from the enhanced schema
        const userRole = user.role;

        if (userRole && allowedRoles.includes(userRole)) {
          return true;
        }

        // User doesn't have required role
        router.navigate(['/unauthorized']);
        return false;
      })
    );
  };
}

// Pre-configured role guards for convenience
export const studentGuard: CanActivateFn = roleGuard(['candidate']);
export const enterpriseGuard: CanActivateFn = roleGuard(['enterprise_rep']);
export const adminGuard: CanActivateFn = roleGuard(['admin', 'platform_support']);

/**
 * Student/Enterprise Guard - Allows only students and enterprises to access /app/* routes
 * Redirects admins to /admin/dashboard and support to /support/dashboard
 * NOTE: Enterprises now have separate /enterprise/* routes, redirect them there
 */
export const studentOrEnterpriseGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }

      const userRole = user.role || 'candidate';

      // Redirect admins to admin panel
      if (userRole === 'admin' || userRole === 'platform_support') {
        router.navigate(['/admin/dashboard']);
        return false;
      }

      // Redirect enterprises to enterprise portal
      if (userRole === 'enterprise_rep') {
        router.navigate(['/enterprise/dashboard']);
        return false;
      }

      // Allow only candidates
      return true;
    })
  );
};

/**
 * Task Creation Guard - Checks if enterprise can create tasks
 * Used to protect /enterprise/tasks/create route
 */
export const taskCreationGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  const user = authService.getCurrentUser();

  if (!user || user.role !== 'enterprise_rep') {
    router.navigate(['/unauthorized']);
    return false;
  }

  try {
    // Get enterprise by admin_user_id (new schema)
    const { data: enterprise, error } = await supabaseService.client
      .from('companies')
      .select('id, can_create_tasks')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching enterprise:', error);
      router.navigate(['/enterprise/dashboard'], {
        queryParams: { error: 'fetch_error' }
      });
      return false;
    }

    if (!enterprise) {
      router.navigate(['/enterprise/dashboard'], {
        queryParams: { error: 'no_enterprise_linked' }
      });
      return false;
    }

    // Check if task creation is enabled
    if (!enterprise.can_create_tasks) {
      router.navigate(['/enterprise/dashboard'], {
        queryParams: { error: 'task_creation_disabled' }
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking task creation permission:', error);
    router.navigate(['/enterprise/dashboard']);
    return false;
  }
};
