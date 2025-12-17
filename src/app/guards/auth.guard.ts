import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';

/**
 * Auth Guard - Protects routes that require authentication
 * Usage: Add to route configuration
 * Example: { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to finish loading before checking
  return authService.loading$.pipe(
    filter(loading => !loading), // Wait until loading is false
    take(1),
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

  // Wait for auth to finish loading before checking
  return authService.loading$.pipe(
    filter(loading => !loading), // Wait until loading is false
    take(1),
    map(() => {
      const isAuthenticated = authService.isAuthenticated();

      if (!isAuthenticated) {
        return true;
      }

      // User is already authenticated, redirect to dashboard
      router.navigate(['/app/dashboard']);
      return false;
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

        const userRole = user.user_type || user.role?.toLowerCase();

        if (allowedRoles.includes(userRole as string)) {
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
export const studentGuard: CanActivateFn = roleGuard(['student']);
export const mentorGuard: CanActivateFn = roleGuard(['mentor']);
export const adminGuard: CanActivateFn = roleGuard(['admin']);
