import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, studentOrEnterpriseGuard, enterpriseGuard, taskCreationGuard } from './guards/auth.guard';
import { supportGuard } from './guards/support.guard';

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
  // PROTECTED ROUTES (Require authentication - Students & Enterprises only)
  // ============================================
  {
    path: 'app',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard, studentOrEnterpriseGuard],
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
  // ENTERPRISE ROUTES (Require enterprise role)
  // ============================================
  {
    path: 'enterprise',
    loadComponent: () => import('./layouts/enterprise-layout/enterprise-layout.component').then(m => m.EnterpriseLayoutComponent),
    canActivate: [authGuard, enterpriseGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/enterprise/dashboard/dashboard.component').then(m => m.EnterpriseDashboardComponent),
        title: 'Dashboard - JobSim Senegal'
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/enterprise/profile/profile.component').then(m => m.EnterpriseProfileComponent),
        title: 'Company Profile - JobSim Senegal'
      },
      {
        path: 'tasks',
        loadComponent: () => import('./pages/enterprise/tasks/task-list.component').then(m => m.EnterpriseTaskListComponent),
        title: 'Tasks - JobSim Senegal'
      },
      {
        path: 'tasks/create',
        loadComponent: () => import('./pages/enterprise/tasks/task-create.component').then(m => m.EnterpriseTaskCreateComponent),
        canActivate: [taskCreationGuard],
        title: 'Create Task - JobSim Senegal'
      },
      {
        path: 'tasks/:id',
        loadComponent: () => import('./pages/enterprise/tasks/task-detail.component').then(m => m.EnterpriseTaskDetailComponent),
        title: 'Task Details - JobSim Senegal'
      },
      {
        path: 'candidates',
        loadComponent: () => import('./pages/enterprise/candidates/candidate-list.component').then(m => m.EnterpriseCandidateListComponent),
        title: 'Candidates - JobSim Senegal'
      },
      {
        path: 'candidates/:id',
        loadComponent: () => import('./pages/enterprise/candidates/candidate-detail.component').then(m => m.EnterpriseCandidateDetailComponent),
        title: 'Candidate Details - JobSim Senegal'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/enterprise/analytics/analytics.component').then(m => m.EnterpriseAnalyticsComponent),
        title: 'Analytics - JobSim Senegal'
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/enterprise/support/support.component').then(m => m.EnterpriseSupportComponent),
        title: 'Support - JobSim Senegal'
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/enterprise/notifications/notifications.component').then(m => m.EnterpriseNotificationsComponent),
        title: 'Notifications - JobSim Senegal'
      }
    ]
  },

  // ============================================
  // ADMIN ROUTES (Require admin role)
  // ============================================
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Admin Dashboard - JobSim Senegal'
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users-management/users-management.component').then(m => m.UsersManagementComponent),
        title: 'User Management - JobSim Senegal'
      },
      {
        path: 'enterprises',
        loadComponent: () => import('./pages/admin/enterprises-management/enterprises-management.component').then(m => m.EnterprisesManagementComponent),
        title: 'Enterprise Management - JobSim Senegal'
      },
      {
        path: 'tasks',
        loadComponent: () => import('./pages/admin/tasks-management/tasks-management.component').then(m => m.TasksManagementComponent),
        title: 'Task Management - JobSim Senegal'
      },
      {
        path: 'tasks/create',
        loadComponent: () => import('./pages/admin/task-create/task-create.component').then(m => m.TaskCreateComponent),
        title: 'Create Task - JobSim Senegal'
      },
      {
        path: 'submissions',
        loadComponent: () => import('./pages/admin/submissions-management/submissions-management.component').then(m => m.SubmissionsManagementComponent),
        title: 'Submission Management - JobSim Senegal'
      },
      {
        path: 'domains',
        loadComponent: () => import('./pages/admin/domains-management/domains-management.component').then(m => m.DomainsManagementComponent),
        title: 'Domain Management - JobSim Senegal'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/admin/analytics/analytics.component').then(m => m.AnalyticsComponent),
        title: 'Analytics - JobSim Senegal'
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/admin/settings/settings.component').then(m => m.AdminSettingsComponent),
        title: 'System Settings - JobSim Senegal'
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
        title: 'Audit Logs - JobSim Senegal'
      }
    ]
  },

  // ============================================
  // SUPPORT ROUTES (Require support role)
  // ============================================
  {
    path: 'support',
    loadComponent: () => import('./layouts/support-layout/support-layout.component').then(m => m.SupportLayoutComponent),
    canActivate: [authGuard, supportGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/support/dashboard/dashboard.component').then(m => m.SupportDashboardComponent),
        title: 'Support Dashboard - JobSim Senegal'
      },
      {
        path: 'tickets',
        loadComponent: () => import('./pages/support/tickets/tickets.component').then(m => m.TicketsComponent),
        title: 'Tickets - JobSim Senegal'
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/support/user-assistance/user-assistance.component').then(m => m.UserAssistanceComponent),
        title: 'User Assistance - JobSim Senegal'
      },
      {
        path: 'tasks',
        loadComponent: () => import('./pages/support/task-moderation/task-moderation.component').then(m => m.TaskModerationComponent),
        title: 'Task Moderation - JobSim Senegal'
      },
      {
        path: 'escalations',
        loadComponent: () => import('./pages/support/escalations/escalations.component').then(m => m.EscalationsComponent),
        title: 'Escalations - JobSim Senegal'
      },
      {
        path: 'knowledge',
        loadComponent: () => import('./pages/support/knowledge-base/knowledge-base.component').then(m => m.KnowledgeBaseComponent),
        title: 'Knowledge Base - JobSim Senegal'
      },
      {
        path: 'logs',
        loadComponent: () => import('./pages/support/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent),
        title: 'Activity Logs - JobSim Senegal'
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
