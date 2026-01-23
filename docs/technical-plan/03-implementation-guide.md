# Implementation Guide

This document consolidates the frontend architecture, file storage strategy, security policies, and implementation roadmap.

---

## Part 1: Frontend Architecture (Angular)

### Project Structure

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── role.guard.ts
│   │   │   └── auth.interceptor.ts
│   │   ├── api/
│   │   │   ├── api.service.ts
│   │   │   ├── supabase.service.ts
│   │   │   └── storage.service.ts
│   │   └── core.module.ts
│   │
│   ├── shared/                  # Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── file-upload/
│   │   │   ├── task-card/
│   │   │   ├── candidate-card/
│   │   │   ├── xp-badge/
│   │   │   ├── level-badge/
│   │   │   └── notification-toast/
│   │   ├── pipes/
│   │   │   ├── xp-format.pipe.ts
│   │   │   └── time-ago.pipe.ts
│   │   └── shared.module.ts
│   │
│   ├── features/
│   │   ├── candidate/          # Candidate-specific features
│   │   │   ├── dashboard/
│   │   │   ├── task-browser/
│   │   │   ├── task-workspace/
│   │   │   ├── profile/
│   │   │   ├── leaderboard/
│   │   │   └── messages/
│   │   │
│   │   ├── enterprise/         # Enterprise rep features
│   │   │   ├── dashboard/
│   │   │   ├── talent-discovery/
│   │   │   ├── review-queue/
│   │   │   ├── shortlist/
│   │   │   └── analytics/
│   │   │
│   │   └── admin/              # Admin features
│   │       ├── dashboard/
│   │       ├── task-management/
│   │       └── user-management/
│   │
│   └── app.module.ts
```

### Core Services

#### AuthService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<User | null>(null);

  get user$(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  get userRole(): string | null {
    return this.currentUser$.value?.role || null;
  }

  hasRole(roles: string[]): boolean {
    const userRole = this.userRole;
    return userRole ? roles.includes(userRole) : false;
  }

  async signIn(email: string, password: string) { ... }
  async signOut() { ... }
}
```

#### RoleGuard
```typescript
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data['roles'] as string[];
    return this.authService.hasRole(allowedRoles);
  }
}
```

#### TaskService
```typescript
@Injectable({ providedIn: 'root' })
export class TaskService {
  browseTasks(filters: TaskFilters): Observable<TaskListResponse> { ... }
  getTaskDetail(taskId: string): Observable<Task> { ... }
  enrollInTask(taskId: string): Observable<EnrollmentResponse> { ... }
  submitTask(taskId: string, files: File[]): Observable<Submission> { ... }
}
```

### Routing

```typescript
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'candidate',
    canActivate: [RoleGuard],
    data: { roles: ['candidate'] },
    loadChildren: () => import('./features/candidate/candidate.module')
  },
  {
    path: 'enterprise',
    canActivate: [RoleGuard],
    data: { roles: ['enterprise_rep'] },
    loadChildren: () => import('./features/enterprise/enterprise.module')
  },
  {
    path: 'admin',
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./features/admin/admin.module')
  }
];
```

---

## Part 2: File Storage Strategy

### Supabase Storage Buckets

```
Buckets:
├── task-attachments (Public) - Admin-uploaded task files
├── submission-files (Private) - Candidate submissions
├── avatars (Public) - Profile pictures
└── company-logos (Public) - Company branding
```

### StorageService

```typescript
@Injectable({ providedIn: 'root' })
export class StorageService {
  /**
   * Upload submission files
   * Path: submissions/{candidate_id}/{submission_id}/{filename}
   */
  async uploadSubmissionFiles(
    candidateId: string,
    submissionId: string,
    files: Array<{ field: string; file: File }>
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(async ({ field, file }) => {
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const filename = `${field}_${timestamp}.${ext}`;
      const path = `submissions/${candidateId}/${submissionId}/${filename}`;

      const { data, error } = await this.supabase.storage
        .from('submission-files')
        .upload(path, file);

      return {
        field,
        filename: file.name,
        storage_path: path,
        size: file.size,
        mime_type: file.type
      };
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Generate signed URLs (1 hour expiry)
   */
  async getSubmissionFileUrls(paths: string[]): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    for (const path of paths) {
      const { data } = await this.supabase.storage
        .from('submission-files')
        .createSignedUrl(path, 3600);

      if (data) {
        urlMap.set(path, data.signedUrl);
      }
    }

    return urlMap;
  }
}
```

### File Validation

```typescript
export class FileValidator {
  static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  static validateFile(
    file: File,
    config: {
      allowed_formats?: string[];
      max_size_mb?: number;
    }
  ): { valid: boolean; error?: string } {
    // Check file size
    const maxSize = (config.max_size_mb || 100) * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${config.max_size_mb}MB limit`
      };
    }

    // Check file type
    if (config.allowed_formats) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !config.allowed_formats.includes(fileExt)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed: ${config.allowed_formats.join(', ')}`
        };
      }
    }

    return { valid: true };
  }
}
```

---

## Part 3: Security & Validation

### Row Level Security (RLS) Policies

#### Candidate Profiles
```sql
-- Candidates can read/update their own profile
CREATE POLICY "Candidates can read own profile"
  ON public.candidate_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Candidates can update own profile"
  ON public.candidate_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Enterprise reps can read candidate profiles
CREATE POLICY "Enterprise reps can read candidate profiles"
  ON public.candidate_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('enterprise_rep', 'admin')
    )
  );
```

#### Submissions
```sql
-- Candidates can read their own submissions
CREATE POLICY "Candidates can read own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = candidate_id);

-- Enterprise reps can read submissions they're reviewing
CREATE POLICY "Reviewers can read assigned submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE submission_id = submissions.id
      AND reviewer_id = auth.uid()
    )
    OR submissions.is_approved = TRUE
  );
```

#### Storage Policies
```sql
-- Candidates can upload to their own submission folders
CREATE POLICY "Candidates can upload own submission files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submission-files'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Reviewers can read submission files they're assigned to
CREATE POLICY "Reviewers can read assigned submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.reviews r
      JOIN public.submissions s ON r.submission_id = s.id
      WHERE r.reviewer_id = auth.uid()
      AND (storage.foldername(name))[3] = s.id::text
    )
  );
```

### Input Sanitization

```typescript
export class Sanitizer {
  // Sanitize HTML to prevent XSS
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
      ALLOWED_ATTR: ['href']
    });
  }

  // Sanitize file names
  static sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 255);
  }

  // Validate UUID
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
```

### Rate Limiting

```typescript
export const rateLimits = {
  submission: { points: 3, duration: 86400 }, // 3 per day
  review: { points: 20, duration: 86400 }, // 20 per day
  message: { points: 10, duration: 3600 }, // 10 per hour
  search: { points: 100, duration: 3600 } // 100 per hour
};
```

---

## Part 4: Implementation Roadmap

### Overview
- **Total Duration:** 20 weeks (full platform) or 12 weeks (MVP)
- **Team Size:** 2-4 developers recommended
- **Methodology:** Agile with 2-week sprints

### Phase 1: Foundation (Weeks 1-2) - CRITICAL
**Goal:** Set up core infrastructure

**Tasks:**
1. Database Setup
   - Create all tables in Supabase
   - Set up RLS policies
   - Create database functions
   - Seed initial data (achievements)

2. Storage Setup
   - Create storage buckets
   - Configure bucket policies
   - Test upload/download

3. Authentication
   - Configure Supabase Auth
   - Implement AuthService
   - Create AuthGuard & RoleGuard
   - Build login/signup pages

4. Core Services
   - SupabaseService
   - ApiService
   - StorageService
   - Error handling

**Deliverable:** Working authentication with role-based access

---

### Phase 2: Task System (Weeks 3-4) - HIGH PRIORITY

**Tasks:**
1. Admin Task Builder
   - Task creation form
   - Dynamic submission config builder
   - File upload for attachments
   - XP configuration

2. Task Management
   - Task list view (admin)
   - Edit/archive functionality
   - Task analytics

3. Candidate Task Discovery
   - Task browser with filters
   - Task cards
   - Task detail view
   - Search functionality

4. Backend APIs
   - POST/PUT /api/admin/tasks
   - GET /api/tasks

**Deliverable:** Complete task creation & discovery

---

### Phase 3: Submission System (Weeks 5-6) - HIGH PRIORITY

**Tasks:**
1. Task Enrollment
   - Enroll button
   - Single-task constraint check
   - Task workspace page

2. File Upload Component
   - Drag & drop
   - Multiple file support
   - Validation
   - Progress indicators

3. Submission Form
   - Dynamic form based on task config
   - Draft save (manual & auto)
   - Submission checklist
   - Confirmation modal

4. File Processing
   - Supabase Storage upload
   - Automated validation Edge Function
   - Security checks

5. Backend APIs
   - POST /api/tasks/:id/enroll
   - POST /api/submissions
   - GET /api/submissions/:id

**Deliverable:** Complete submission workflow

---

### Phase 4: Review System (Weeks 7-8) - HIGH PRIORITY

**Tasks:**
1. Review Assignment
   - Auto-assign 3 reviewers
   - Category-based selection
   - Load balancing

2. Enterprise Review Queue
   - Review dashboard
   - Pending reviews list
   - Filters

3. Review Form
   - File viewer with signed URLs
   - Approve/reject decision
   - Required feedback
   - Interest level selection

4. Review Processing
   - Store review
   - Check if 3 reviews complete
   - Calculate approval (2/3 majority)
   - Calculate XP
   - Update candidate stats
   - Send notifications

5. Results Display
   - Results page
   - XP breakdown
   - Feedback display
   - Resubmit button

**Deliverable:** Complete review & approval system

---

### Phase 5: Gamification (Weeks 9-10) - MEDIUM PRIORITY

**Tasks:**
1. Candidate Dashboard
   - Overview stats
   - XP progress bars
   - Level badges
   - Recent activity

2. Profile & Portfolio
   - Profile view/edit
   - Task history
   - Best scores

3. Achievements System
   - Achievement check logic
   - Unlock notifications
   - Achievements page

4. Leaderboard
   - Overall leaderboard
   - Category leaderboards
   - Filters

**Deliverable:** Complete gamification system

---

### Phase 6: Enterprise Discovery (Weeks 11-12) - HIGH PRIORITY

**Tasks:**
1. Enterprise Dashboard
   - Overview stats
   - Quick actions

2. Talent Discovery
   - Search interface with filters
   - Candidate cards
   - Pagination

3. Candidate Profile (Public)
   - Profile overview
   - Task portfolio
   - Skills & achievements

4. Trending & Recommendations
   - Trending candidates
   - Basic recommendations

**Deliverable:** Complete talent discovery

---

### Phase 7: Shortlist & Messaging (Weeks 13-14) - MEDIUM PRIORITY

**Tasks:**
1. Shortlist Management
   - Shortlist view
   - Add/remove
   - Tags & notes
   - Bulk actions

2. Messaging System
   - Inbox
   - Compose message
   - Thread view

3. Interview Requests
   - Request form
   - Accept/decline interface

**Deliverable:** Complete recruitment workflow

---

### Phase 8: Notifications & Polish (Weeks 15-16) - MEDIUM PRIORITY

**Tasks:**
1. Notification System
   - In-app notifications
   - Email notifications
   - Notification center

2. Analytics
   - Enterprise analytics
   - Admin analytics

3. UI/UX Polish
   - Loading states
   - Error states
   - Responsive design
   - Accessibility

**Deliverable:** Production-ready platform

---

### Phase 9: Admin & Support (Weeks 17-18) - LOW PRIORITY

**Tasks:**
1. Admin Dashboard
   - Platform overview
   - User management

2. Platform Support
   - Support queue
   - Review oversight

**Deliverable:** Complete admin tools

---

### Phase 10: Testing & Launch (Weeks 19-20) - CRITICAL

**Tasks:**
1. Testing
   - Unit tests
   - Integration tests
   - E2E tests
   - Security audit

2. Deployment
   - Production environment
   - CI/CD pipeline
   - Monitoring

3. Launch Preparation
   - Documentation
   - User guides
   - Support channels

**Deliverable:** Live platform

---

## MVP Scope (12 weeks - Faster Launch)

For a faster launch, implement:
- ✅ Phase 1: Foundation (2 weeks)
- ✅ Phase 2: Task System (2 weeks)
- ✅ Phase 3: Submission System (2 weeks)
- ✅ Phase 4: Review System (2 weeks)
- ✅ Phase 5: Basic Gamification (1 week - simplified)
- ✅ Phase 6: Enterprise Discovery (2 weeks)
- ✅ Phase 10: Testing & Launch (1 week)

**Defer to V2:**
- Advanced messaging
- Shortlist bulk actions
- Interview requests
- Advanced analytics
- Admin tools (use Supabase dashboard)

---

## Development Best Practices

### Code Quality
- Use TypeScript strict mode
- Write unit tests for services
- Use ESLint & Prettier
- Code reviews for all PRs

### Git Workflow
```
main (production)
  ├── develop (integration)
  │   ├── feature/task-system
  │   ├── feature/review-system
  │   └── feature/gamification
```

### Testing Strategy
- Unit tests: Core services (80%+ coverage)
- Integration tests: API endpoints
- E2E tests: Critical user flows
  - Task submission
  - Review process
  - Talent discovery

### Performance
- Lazy load feature modules
- Optimize images (WebP, compression)
- Database indexes on frequently queried columns
- Use Supabase Realtime sparingly

---

## Deployment Checklist

### Before Launch
- [ ] Run database migrations
- [ ] Set up production environment variables
- [ ] Configure Supabase production project
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure backup strategy
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Documentation complete
- [ ] Support channels set up

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Be ready for quick fixes

---

## Success Metrics

### Week 1-4 (MVP Launch)
- 50+ registered users (25 candidates, 25 enterprises)
- 10+ tasks created
- 50+ task submissions
- 80%+ submission approval rate

### Month 3
- 500+ users
- 100+ tasks
- 1000+ submissions
- 70%+ review completion within 3 days

### Month 6
- 2000+ users
- 500+ tasks
- 5000+ submissions
- 10+ enterprise hires made through platform

---

## Next Steps

1. **Set up development environment**
   - Install Node.js, Angular CLI
   - Create Supabase project
   - Clone repository

2. **Run database schema**
   - Execute SQL from `01-database-schema.md`
   - Verify tables created
   - Test database functions

3. **Implement Phase 1**
   - Set up Angular project structure
   - Implement core services
   - Create authentication flow

4. **Follow roadmap phase by phase**

---

**Last Updated:** January 14, 2026
