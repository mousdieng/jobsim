# Navigation and Authorization Guide

This document describes the navigation structure and authorization system implemented in JobSim Senegal.

## Table of Contents
1. [Overview](#overview)
2. [Route Structure](#route-structure)
3. [Authentication Guards](#authentication-guards)
4. [Navigation Menu](#navigation-menu)
5. [Error Pages](#error-pages)

## Overview

The application uses Angular's standalone routing with lazy-loaded components and route guards to protect pages based on authentication status.

### Key Features
- ✅ Protected routes require authentication
- ✅ Guest routes (login/register) redirect authenticated users
- ✅ Role-based access control support
- ✅ Custom error pages (404, Unauthorized)
- ✅ Return URL support for redirects after login
- ✅ Page titles for SEO
- ✅ Mobile-responsive navigation

## Route Structure

### Public Routes (No Authentication Required)
- `/404` - Not Found page
- `/unauthorized` - Access Denied page

### Guest Routes (Only for Unauthenticated Users)
- `/auth/login` - Sign in page
- `/auth/register` - Create account page
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset confirmation

**Behavior**: If an authenticated user tries to access these routes, they are redirected to `/home`.

### Protected Routes (Authentication Required)
All routes under the main layout require authentication:

- `/` → Redirects to `/home`
- `/home` - Dashboard/Home page
- `/tasks` - Browse available tasks
- `/tasks/:id` - View task details
- `/submissions` - View user's submissions
- `/meetings/:taskId` - View meetings for a task
- `/profile` - User profile page
- `/settings` - Account settings

**Behavior**: If an unauthenticated user tries to access these routes, they are redirected to `/auth/login` with a `returnUrl` parameter.

## Authentication Guards

Located in: `src/app/guards/auth.guard.ts`

### 1. authGuard
Protects routes that require authentication.

```typescript
// Usage in routes
{
  path: 'profile',
  component: ProfileComponent,
  canActivate: [authGuard]
}
```

**Behavior**:
- If authenticated: Allow access
- If not authenticated: Redirect to `/auth/login?returnUrl=/intended-path`

### 2. guestGuard
Prevents authenticated users from accessing auth pages.

```typescript
// Usage in routes
{
  path: 'auth/login',
  component: LoginComponent,
  canActivate: [guestGuard]
}
```

**Behavior**:
- If not authenticated: Allow access
- If authenticated: Redirect to `/home`

### 3. roleGuard (Factory)
Creates guards for role-based access control.

```typescript
// Pre-configured guards
export const studentGuard = roleGuard(['student']);
export const mentorGuard = roleGuard(['mentor']);
export const adminGuard = roleGuard(['admin']);

// Usage in routes
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [authGuard, adminGuard]  // Requires both auth and admin role
}
```

**Behavior**:
- If user has required role: Allow access
- If user doesn't have role: Redirect to `/unauthorized`
- If not authenticated: Redirect to `/auth/login`

## Navigation Menu

The main navigation is in: `src/app/layouts/main-layout/main-layout.component.html`

### Desktop Navigation
Located in the top navbar with icons:
- Home
- Tasks
- Submissions
- Profile

### User Dropdown Menu
Click on user avatar to access:
- Your Profile
- My Submissions
- Settings
- Sign out

### Mobile Navigation
Hamburger menu with:
- All main navigation links
- User info display
- Sign out button

### Adding New Navigation Items

1. **Add to Desktop Menu**:
```html
<a
  routerLink="/your-route"
  routerLinkActive="border-indigo-500 text-gray-900"
  class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
>
  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <!-- Your icon SVG path -->
  </svg>
  Link Text
</a>
```

2. **Add to Mobile Menu**:
```html
<a
  routerLink="/your-route"
  routerLinkActive="bg-indigo-50 border-indigo-500 text-indigo-700"
  class="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium"
  (click)="toggleMobileMenu()"
>
  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <!-- Your icon SVG path -->
  </svg>
  Link Text
</a>
```

## Error Pages

### 404 Not Found
Path: `/404`
Component: `src/app/pages/error/not-found/not-found.component.ts`

**Features**:
- Large 404 display
- Helpful suggestions
- Links to popular pages
- Go back button

**Triggered by**:
- Any undefined route (catch-all: `**`)
- Manual navigation to `/404`

### Unauthorized (Access Denied)
Path: `/unauthorized`
Component: `src/app/pages/error/unauthorized/unauthorized.component.ts`

**Features**:
- Shows current user info
- Displays user's role
- Go back button
- Sign out option

**Triggered by**:
- Role guard failures
- Manual navigation to `/unauthorized`

## Return URL Flow

When an unauthenticated user tries to access a protected route:

1. User navigates to `/profile`
2. `authGuard` detects no authentication
3. User redirected to `/auth/login?returnUrl=/profile`
4. User signs in
5. `AuthService` checks for `returnUrl` parameter
6. User redirected to original destination (`/profile`)

### Implementation in Login Component

```typescript
async onSubmit() {
  const response = await this.authService.signIn(credentials);

  if (response.user) {
    // Check for return URL
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    this.router.navigate([returnUrl]);
  }
}
```

## Best Practices

### 1. Always Use Guards
Never rely on hiding UI elements for security. Always protect routes with guards.

```typescript
// ❌ BAD - Only hiding menu item
<a *ngIf="user?.role === 'admin'" routerLink="/admin">Admin</a>

// ✅ GOOD - Route is protected by guard
// In routes:
{ path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] }
```

### 2. Combine Guards for Role-Based Access
```typescript
{
  path: 'admin',
  canActivate: [authGuard, adminGuard],  // First check auth, then role
  component: AdminComponent
}
```

### 3. Add Page Titles
```typescript
{
  path: 'profile',
  component: ProfileComponent,
  canActivate: [authGuard],
  title: 'My Profile - JobSim Senegal'
}
```

### 4. Use Lazy Loading
All routes use lazy loading for better performance:

```typescript
{
  path: 'tasks',
  loadComponent: () => import('./pages/tasks/task-list/task-list.component')
    .then(m => m.TaskListComponent)
}
```

## Troubleshooting

### Issue: Infinite redirect loop
**Cause**: Guard logic error
**Solution**: Check that guards don't redirect to routes protected by themselves

### Issue: Return URL not working
**Cause**: Missing query param handling
**Solution**: Ensure login component reads and uses `returnUrl` from query params

### Issue: User can access protected route
**Cause**: Missing or incorrect guard
**Solution**: Verify route configuration includes proper guards

### Issue: Role guard always denies access
**Cause**: User role property mismatch
**Solution**: Check that `user.user_type` or `user.role` matches expected values

## Future Enhancements

- [ ] Breadcrumb navigation
- [ ] Route-based permissions (view, edit, delete)
- [ ] Navigation history tracking
- [ ] Recently visited pages
- [ ] Favorites/Bookmarks
- [ ] Multi-level role hierarchy
- [ ] Permission-based UI element visibility

## Related Files

- Routes: `src/app/app.routes.ts`
- Guards: `src/app/guards/auth.guard.ts`
- Auth Service: `src/app/services/auth.service.ts`
- Main Layout: `src/app/layouts/main-layout/main-layout.component.ts`
- Error Pages: `src/app/pages/error/`
