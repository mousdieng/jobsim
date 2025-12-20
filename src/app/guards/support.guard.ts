import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const supportGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }

      const userType = user.user_type || 'student';

      // Only support users can access
      if (userType === 'support') {
        return true;
      }

      // Redirect non-support users to their respective dashboards
      if (userType === 'admin') {
        router.navigate(['/admin/dashboard']);
      } else {
        router.navigate(['/app/dashboard']);
      }
      return false;
    })
  );
};
