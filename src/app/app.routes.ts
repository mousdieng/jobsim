import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ============================================
  // PUBLIC PAGES (No authentication required)
  // ============================================
  {
    path: '',
    loadComponent: () => import('./pages/public/landing/landing.component').then(m => m.LandingComponent),
    title: 'JobSim Senegal - Master Real-World Job Skills'
  },
  {
    path: 'browse-tasks',
    loadComponent: () => import('./pages/public/browse-tasks/browse-tasks.component').then(m => m.BrowseTasksComponent),
    title: 'Browse Tasks - JobSim Senegal'
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/public/about/about.component').then(m => m.AboutComponent),
    title: 'About Us - JobSim Senegal'
  },

  // ============================================
  // ERROR PAGES (No auth required)
  // ============================================
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/error/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
    title: 'Access Denied - JobSim Senegal'
  },
  {
    path: '404',
    loadComponent: () => import('./pages/error/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - JobSim Senegal'
  },

  // ============================================
  // AUTH ROUTES (Only accessible when NOT logged in)
  // ============================================
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Sign In - JobSim Senegal'
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Create Account - JobSim Senegal'
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Forgot Password - JobSim Senegal'
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'Reset Password - JobSim Senegal'
      }
    ]
  },

  // Legacy auth routes - redirect to new paths
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    redirectTo: '/auth/register',
    pathMatch: 'full'
  },

  // ============================================
  // PROTECTED ROUTES (Require authentication)
  // ============================================
  {
    path: 'app',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      // Dashboard (default protected route)
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
        title: 'Dashboard - JobSim Senegal'
      },
      // Legacy redirect
      {
        path: 'home',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // Tasks
      {
        path: 'tasks',
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/tasks/task-list/task-list.component').then(m => m.TaskListComponent),
            title: 'Tasks - JobSim Senegal'
          },
          {
            path: ':id',
            loadComponent: () => import('./pages/tasks/task-detail/task-detail.component').then(m => m.TaskDetailComponent),
            title: 'Task Details - JobSim Senegal'
          }
        ]
      },

      // Submissions
      {
        path: 'submissions',
        loadComponent: () => import('./pages/submissions/submission-list/submission-list.component').then(m => m.SubmissionListComponent),
        title: 'My Submissions - JobSim Senegal'
      },

      // Meetings
      {
        path: 'meetings',
        children: [
          {
            path: ':taskId',
            loadComponent: () => import('./pages/meetings/meeting-list/meeting-list.component').then(m => m.MeetingListComponent),
            title: 'Meetings - JobSim Senegal'
          }
        ]
      },

      // User Profile
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        title: 'My Profile - JobSim Senegal'
      },

      // Settings
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Settings - JobSim Senegal'
      }
    ]
  },

  // ============================================
  // FALLBACK - 404 Not Found
  // ============================================
  {
    path: '**',
    redirectTo: '/404'
  }
];
