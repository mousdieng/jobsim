# Public Access Routing Guide

## Overview

The application now supports both **public pages** (accessible without authentication) and **protected pages** (require login).

## Route Structure

### 📖 Public Pages (No Authentication Required)

These pages are accessible to everyone, even without logging in:

| Path | Description | Component |
|------|-------------|-----------|
| `/` | Landing page with hero section and features | LandingComponent |
| `/browse-tasks` | Browse available task categories | BrowseTasksComponent |
| `/about` | About JobSim Senegal | AboutComponent |
| `/404` | Page not found | NotFoundComponent |
| `/unauthorized` | Access denied | UnauthorizedComponent |

### 🔐 Authentication Pages (Guests Only)

These pages redirect authenticated users to the dashboard:

| Path | Description |
|------|-------------|
| `/auth/login` | Sign in page |
| `/auth/register` | Create account |
| `/auth/forgot-password` | Password reset request |
| `/auth/reset-password` | Password reset confirmation |

### 🏠 Protected Pages (Authentication Required)

All protected routes are now under `/app/` prefix:

| Path | Description |
|------|-------------|
| `/app` | Redirects to `/app/dashboard` |
| `/app/dashboard` | User dashboard (previously `/home`) |
| `/app/tasks` | Browse tasks |
| `/app/tasks/:id` | View task details |
| `/app/submissions` | View submissions |
| `/app/meetings/:taskId` | View meetings |
| `/app/profile` | User profile |
| `/app/settings` | Account settings |

## User Flow

### For Visitors (Not Logged In)
1. Visit `/` → See landing page
2. Click "Browse Tasks" → View `/browse-tasks`
3. Click "Sign Up" → Redirected to `/auth/register`
4. After signup → Redirected to `/app/dashboard`

### For Authenticated Users
1. Visit `/` → See landing page (can also access public pages)
2. Click "Sign In" → Redirected to `/auth/login`
3. After login → Redirected to `/app/dashboard`
4. All app features available under `/app/`

### Return URL Handling
- If a user tries to access `/app/profile` without auth:
  - Redirected to `/auth/login?returnUrl=/app/profile`
  - After login, redirected back to `/app/profile`

## Navigation Updates

### Public Navigation (on landing page)
- Home
- Browse Tasks
- About
- Sign In
- Get Started

### Authenticated Navigation (app layout)
- Dashboard
- Tasks
- Submissions
- Profile
- Settings (in dropdown)

## Migration from Old Routes

| Old Route | New Route | Status |
|-----------|-----------|--------|
| `/` | `/app/dashboard` (when auth) | Changed |
| `/home` | `/app/dashboard` | Redirects |
| `/tasks` | `/app/tasks` | Moved |
| `/profile` | `/app/profile` | Moved |
| `/login` | `/auth/login` | Redirects |
| `/register` | `/auth/register` | Redirects |

## Benefits

### ✅ Better User Experience
- Visitors can explore without signing up
- Clear separation between public and private areas
- Professional landing page

### ✅ SEO Friendly
- Public pages can be indexed by search engines
- Proper page titles for all routes
- Better discoverability

### ✅ Security
- Clear authentication boundaries
- Protected routes properly guarded
- No accidental data exposure

### ✅ Flexibility
- Easy to add more public pages
- Clear URL structure
- Scalable architecture

## Example Scenarios

### Scenario 1: First-time Visitor
```
1. User visits jobsim.sn
2. Sees landing page with features
3. Clicks "Browse Tasks"
4. Views available task categories (no login required)
5. Clicks "Get Started"
6. Redirected to registration
7. After signup → Goes to /app/dashboard
```

### Scenario 2: Returning User
```
1. User visits jobsim.sn
2. Clicks "Sign In"
3. Enters credentials
4. Redirected to /app/dashboard
5. Can access all protected features
```

### Scenario 3: Deep Link
```
1. User clicks link to /app/tasks/123
2. Not logged in → Redirected to /auth/login?returnUrl=/app/tasks/123
3. After login → Automatically sent to /app/tasks/123
```

## Adding New Public Pages

To add a new public page:

1. Create component in `src/app/pages/public/`
2. Add route before auth section in `app.routes.ts`:
```typescript
{
  path: 'your-page',
  loadComponent: () => import('./pages/public/your-page/your-page.component')
    .then(m => m.YourPageComponent),
  title: 'Your Page - JobSim Senegal'
}
```
3. Add navigation link in public pages

## Testing

### Test Public Access
- ✅ Visit `/` without login → Should see landing page
- ✅ Visit `/browse-tasks` without login → Should work
- ✅ Visit `/about` without login → Should work

### Test Protected Routes
- ✅ Visit `/app/dashboard` without login → Redirect to `/auth/login`
- ✅ Visit `/app/profile` without login → Redirect with returnUrl
- ✅ Login → Should redirect to dashboard or returnUrl

### Test Guest Guards
- ✅ Visit `/auth/login` while logged in → Redirect to dashboard
- ✅ Visit `/auth/register` while logged in → Redirect to dashboard

## Common Issues

### Issue: Can't access protected route after login
**Solution**: Check that you're using `/app/` prefix in links

### Issue: Landing page shows even when logged in
**Behavior**: This is correct! Logged-in users can still view public pages

### Issue: Links broken after update
**Solution**: Update all internal links to use `/app/` prefix for protected routes

## Related Files

- Routes: `src/app/app.routes.ts`
- Landing Page: `src/app/pages/public/landing/landing.component.ts`
- Browse Tasks: `src/app/pages/public/browse-tasks/browse-tasks.component.ts`
- About: `src/app/pages/public/about/about.component.ts`
- Auth Guard: `src/app/guards/auth.guard.ts`
