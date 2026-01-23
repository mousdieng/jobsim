# Component Migration Guide
**From Old Schema → New Enhanced Schema**

---

## Quick Reference: What Changed

### User Types
```typescript
// OLD
user.user_type: 'student' | 'mentor' | 'admin' | 'enterprise' | 'super_admin' | 'support'

// NEW
user.role: 'candidate' | 'enterprise_rep' | 'admin' | 'platform_support'
```

### User Data Access
```typescript
// OLD
user.score_total
user.completed_count
user.badge_level
user.job_field
user.experience_level

// NEW
user.candidateProfile?.overall_xp
user.candidateProfile?.tasks_completed
user.candidateProfile?.overall_level
user.candidateProfile?.category_xp
user.candidateProfile?.achievements
```

### Service Imports
```typescript
// OLD
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

// NEW
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models/database.types';
```

---

## Component-by-Component Migration

### 1. Auth Components

#### Login Component
**File:** `src/app/pages/auth/login/login.component.ts`

**Changes Needed:**
```typescript
// Update imports
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/database.types';

// signIn method stays mostly the same
async signIn() {
  const result = await this.authService.signIn({
    email: this.email,
    password: this.password
  });

  if (result.error) {
    this.errorMessage = result.error;
  } else {
    // Route based on role
    const user = result.data;
    switch (user?.role) {
      case 'candidate':
        this.router.navigate(['/dashboard']);
        break;
      case 'enterprise_rep':
        this.router.navigate(['/enterprise/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'platform_support':
        this.router.navigate(['/support/dashboard']);
        break;
    }
  }
}
```

#### Register Component
**File:** `src/app/pages/auth/register/register.component.ts`

**Changes Needed:**
```typescript
import { AuthService, SignUpCredentials } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/database.types';

// Add role selection in template
roleSelection: UserRole = 'candidate';

async signUp() {
  const credentials: SignUpCredentials = {
    email: this.email,
    password: this.password,
    full_name: this.fullName,
    role: this.roleSelection // 'candidate', 'enterprise_rep', etc.
  };

  const result = await this.authService.signUp(credentials);

  if (result.error) {
    this.errorMessage = result.error;
  } else {
    this.router.navigate(['/dashboard']);
  }
}
```

**Template Update:**
```html
<!-- Add role selection -->
<select [(ngModel)]="roleSelection" name="role">
  <option value="candidate">Candidate</option>
  <option value="enterprise_rep">Enterprise Representative</option>
</select>
```

---

### 2. Dashboard Components

#### Candidate Dashboard
**File:** `src/app/pages/dashboard/dashboard.component.ts`

**Changes Needed:**
```typescript
import { AuthService } from '../../core/services/auth.service';
import { XPService } from '../../core/services/xp.service';
import { TaskService } from '../../core/services/task.service';
import { User, LevelInfo } from '../../core/models/database.types';

export class DashboardComponent implements OnInit {
  user: User | null = null;
  levelInfo: LevelInfo | null = null;
  currentTask: any = null;

  constructor(
    private authService: AuthService,
    private xpService: XPService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.user = user;

      if (user?.candidateProfile) {
        // Calculate level info
        this.levelInfo = this.xpService.getLevelInfo(
          user.candidateProfile.overall_xp
        );
      }
    });

    // Get current enrolled task
    this.taskService.getCurrentTask().subscribe(result => {
      if (result.data) {
        this.currentTask = result.data;
      }
    });
  }
}
```

**Template Update:**
```html
<div *ngIf="user?.candidateProfile" class="stats">
  <!-- XP and Level -->
  <div class="stat">
    <h3>Level {{ user.candidateProfile.overall_level }}</h3>
    <p>{{ user.candidateProfile.overall_xp }} XP</p>
  </div>

  <!-- Progress to next level -->
  <div class="progress-bar" *ngIf="levelInfo">
    <div class="progress" [style.width.%]="levelInfo.xp_progress_percentage"></div>
    <span>{{ levelInfo.xp_progress_percentage }}% to Level {{ levelInfo.current_level + 1 }}</span>
  </div>

  <!-- Tasks completed -->
  <div class="stat">
    <h3>{{ user.candidateProfile.tasks_completed }}</h3>
    <p>Tasks Completed</p>
  </div>

  <!-- Approval rate -->
  <div class="stat">
    <h3>{{ user.candidateProfile.approval_rate }}%</h3>
    <p>Approval Rate</p>
  </div>

  <!-- Achievements -->
  <div class="achievements">
    <h3>Achievements ({{ user.candidateProfile.achievements.length }})</h3>
    <!-- Display achievements -->
  </div>
</div>
```

---

### 3. Task Management Components

#### Tasks List Component
**Changes Needed:**
```typescript
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskDifficulty } from '../../../core/models/database.types';

export class TasksListComponent implements OnInit {
  tasks: Task[] = [];
  filters = {
    category: '',
    difficulty: '' as TaskDifficulty | '',
    search: ''
  };

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks(this.filters).subscribe(result => {
      if (result.data) {
        this.tasks = result.data;
      }
    });
  }

  enrollInTask(taskId: string) {
    this.taskService.enrollInTask(taskId).subscribe(result => {
      if (result.error) {
        alert(result.error);
      } else {
        alert('Enrolled successfully!');
        this.router.navigate(['/tasks', taskId]);
      }
    });
  }
}
```

---

### 4. Admin Components

#### User Management
**Changes Needed:**
```typescript
// Check user role
if (user.role === 'candidate') {
  // Has candidate-specific data
  const xp = user.candidateProfile?.overall_xp;
  const level = user.candidateProfile?.overall_level;
}

if (user.role === 'enterprise_rep') {
  // Has enterprise rep data
  const company = user.company?.name;
  const reviewsCompleted = user.enterpriseRepProfile?.reviews_completed;
}

// Role checks
if (this.authService.hasRole('admin')) {
  // Admin-only features
}

if (this.authService.hasAnyRole(['admin', 'platform_support'])) {
  // Platform management features
}
```

---

## Template Patterns

### Show Content Based on Role
```html
<!-- OLD -->
<div *ngIf="user.user_type === 'student'">
  Candidate content
</div>

<!-- NEW -->
<div *ngIf="user.role === 'candidate'">
  Candidate content
</div>
```

### Display User Stats
```html
<!-- OLD -->
<div>
  Score: {{ user.score_total }}
  Completed: {{ user.completed_count }}
</div>

<!-- NEW -->
<div *ngIf="user.candidateProfile">
  XP: {{ user.candidateProfile.overall_xp }}
  Level: {{ user.candidateProfile.overall_level }}
  Completed: {{ user.candidateProfile.tasks_completed }}
</div>
```

### Role-Based Navigation
```html
<!-- OLD -->
<a *ngIf="user.user_type === 'admin'" routerLink="/admin">Admin Panel</a>

<!-- NEW -->
<a *ngIf="user.role === 'admin'" routerLink="/admin">Admin Panel</a>
```

---

## Route Guards Update

### Auth Guard
```typescript
// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
```

### Role Guard
```typescript
// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { UserRole } from '../core/models/database.types';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as UserRole[];

  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
```

**Usage in routes:**
```typescript
{
  path: 'admin',
  canActivate: [authGuard, roleGuard],
  data: { roles: ['admin'] },
  loadChildren: () => import('./pages/admin/admin.module')
}
```

---

## Common Migration Patterns

### Pattern 1: User Type Check
```typescript
// OLD
if (user.user_type === 'student') { }
if (user.user_type === 'enterprise') { }

// NEW
if (user.role === 'candidate') { }
if (user.role === 'enterprise_rep') { }
```

### Pattern 2: Accessing User Data
```typescript
// OLD
user.score_total
user.completed_count
user.badge_level

// NEW
user.candidateProfile?.overall_xp
user.candidateProfile?.tasks_completed
user.candidateProfile?.overall_level
```

### Pattern 3: Service Injection
```typescript
// OLD
constructor(
  private authService: AuthService, // from services/
  private dataService: DataService
) {}

// NEW
constructor(
  private authService: AuthService, // from core/services/
  private xpService: XPService,
  private taskService: TaskService,
  private submissionService: SubmissionService
) {}
```

---

## Testing Checklist

After migration, test these scenarios:

### Authentication
- [ ] Sign up as candidate
- [ ] Sign up as enterprise rep
- [ ] Sign in
- [ ] Sign out
- [ ] Session persists on refresh
- [ ] Password reset

### Role-Based Access
- [ ] Candidate sees candidate dashboard
- [ ] Enterprise rep sees rep dashboard
- [ ] Admin sees admin panel
- [ ] Guards block unauthorized access

### Data Display
- [ ] XP and level display correctly
- [ ] Progress bars work
- [ ] Stats are accurate
- [ ] Role-specific data shows correctly

### Functionality
- [ ] Task enrollment works
- [ ] Submission creation works
- [ ] Reviews work
- [ ] File uploads work

---

## Need Help?

If you encounter issues:

1. **Import errors**: Check path changed from `../../services/` to `../../core/services/`
2. **Type errors**: User type changed, use optional chaining (`user?.candidateProfile?.overall_xp`)
3. **Role checks**: Use `user.role` instead of `user.user_type`
4. **Service methods**: New services have different method names (check service files)

---

**Status:** Migration guide complete. See updated example components below.
