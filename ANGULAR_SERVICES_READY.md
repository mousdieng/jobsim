# Angular Services - Implementation Complete ✓

**Date:** January 14, 2026
**Status:** Core Services Created & Ready for Integration

---

## What's Been Created

### 1. Enhanced Database Models ✓
**File:** `src/app/core/models/database.types.ts`

Complete TypeScript interfaces matching your new database schema:
- `Profile`, `CandidateProfile`, `EnterpriseRepProfile`, `Company`
- `Task`, `Submission`, `Review`
- `Achievement`, `Shortlist`, `Interaction`, `Notification`
- `User` (combined type with role-specific data)
- Helper types: `XPCalculation`, `LevelInfo`, `ApiResponse`, etc.

### 2. Updated Auth Service ✓
**File:** `src/app/core/services/auth.service.ts`

Complete rewrite for new schema:
- Uses `profiles` table (not `users`)
- Loads role-specific data automatically
- Supports all 4 roles: `candidate`, `enterprise_rep`, `admin`, `platform_support`
- Methods:
  - `signUp(credentials)` - Creates profile + role-specific profile
  - `signIn(credentials)` - Loads full user with role data
  - `signOut()` - Clears session
  - `getCurrentUser()` - Sync access to current user
  - `hasRole(role)` / `hasAnyRole(roles)` - Role checking
  - `updateProfile(updates)` - Update base profile
  - `updateCandidateProfile(updates)` - Update candidate-specific data

### 3. XP Service ✓
**File:** `src/app/core/services/xp.service.ts`

Complete gamification system:
- `calculateSubmissionXP()` - Calculate XP for submissions
- `getLevelFromXP()` - Convert XP to level
- `getLevelInfo()` - Get progress to next level
- `getCategoryLevelInfo()` - Get category-specific progress
- `getAchievements()` - Fetch all achievements
- `getUnlockedAchievements(candidateId)` - Get user's achievements
- `getLeaderboard(limit)` - Top candidates by XP
- `getCategoryLeaderboard(category, limit)` - Category leaders
- `getRecommendedTasks(profile)` - Task recommendations
- `getXPStats(candidateId)` - Complete XP statistics

---

## What Still Needs to be Created

### 1. Task Service (Next Priority)
**File:** `src/app/core/services/task.service.ts`

Should include:
```typescript
- getTasks(filters?) - List/filter tasks
- getTask(id) - Get single task with details
- createTask(task) - Admin creates task
- updateTask(id, updates) - Admin updates task
- deleteTask(id) - Admin deletes task
- enrollInTask(taskId) - Candidate enrolls
- abandonTask(taskId) - Candidate abandons
- getTaskSubmissions(taskId) - Get all submissions for task
- getEnrolledTasks(candidateId) - Candidate's current tasks
```

### 2. Submission Service (Next Priority)
**File:** `src/app/core/services/submission.service.ts`

Should include:
```typescript
- createSubmission(taskId, files) - Candidate submits
- updateSubmission(id, files) - Update draft submission
- getSubmission(id) - Get submission with reviews
- getCandidateSubmissions(candidateId) - User's submissions
- validateSubmission(id) - Validate file requirements
- assignReviewers(submissionId) - Auto-assign 3 reviewers
```

### 3. Review Service
**File:** `src/app/core/services/review.service.ts`

Should include:
```typescript
- createReview(submissionId, review) - Submit review
- getReviewsForSubmission(submissionId) - Get all reviews
- getPendingReviews(reviewerId) - Reviews assigned to rep
- getMyReviews(reviewerId) - Rep's completed reviews
```

### 4. Storage Service
**File:** `src/app/core/services/storage.service.ts`

Should include:
```typescript
- uploadFile(bucket, path, file) - Upload to Supabase Storage
- downloadFile(bucket, path) - Download file
- deleteFile(bucket, path) - Delete file
- getFileUrl(bucket, path) - Get public URL
- uploadSubmissionFiles(submissionId, files) - Upload submission
- uploadTaskAttachment(taskId, file) - Upload task resource
```

### 5. Notification Service (Optional)
**File:** `src/app/core/services/notification.service.ts`

Real-time notifications using Supabase Realtime.

---

## How to Use the New Services

### 1. Update Your Imports

**Old way (in existing components):**
```typescript
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
```

**New way:**
```typescript
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models/database.types';
```

### 2. Using the Auth Service

**Sign Up:**
```typescript
const result = await this.authService.signUp({
  email: 'user@example.com',
  password: 'password123',
  full_name: 'John Doe',
  role: 'candidate' // or 'enterprise_rep', 'admin', 'platform_support'
});

if (result.error) {
  console.error(result.error);
} else {
  console.log('User created:', result.data);
}
```

**Check Role:**
```typescript
const user = this.authService.getCurrentUser();

if (user?.role === 'candidate') {
  // Access candidate-specific data
  console.log('XP:', user.candidateProfile?.overall_xp);
  console.log('Level:', user.candidateProfile?.overall_level);
}

// Or use helper methods
if (this.authService.hasRole('admin')) {
  // Show admin features
}

if (this.authService.hasAnyRole(['admin', 'platform_support'])) {
  // Show platform management features
}
```

**Subscribe to User Changes:**
```typescript
this.authService.currentUser$.subscribe(user => {
  if (user) {
    console.log('User logged in:', user.full_name);
    console.log('Role:', user.role);

    if (user.role === 'candidate') {
      console.log('XP:', user.candidateProfile?.overall_xp);
    }
  } else {
    console.log('User logged out');
  }
});
```

### 3. Using the XP Service

**Show Level Progress:**
```typescript
ngOnInit() {
  const user = this.authService.getCurrentUser();

  if (user?.candidateProfile) {
    const levelInfo = this.xpService.getLevelInfo(
      user.candidateProfile.overall_xp
    );

    console.log('Current Level:', levelInfo.current_level);
    console.log('Progress:', levelInfo.xp_progress_percentage + '%');
    console.log('XP to Next Level:', levelInfo.xp_for_next_level);
  }
}
```

**Calculate XP for Display:**
```typescript
// Show what XP a candidate would earn
const task = { base_xp: 250, difficulty_multiplier: 2.0 };
const attemptNumber = 1; // First attempt

const xpCalc = this.xpService.calculateSubmissionXP(
  task.base_xp,
  task.difficulty_multiplier,
  attemptNumber
);

console.log('You would earn:', xpCalc.total_xp, 'XP');
console.log('First attempt bonus:', xpCalc.attempt_multiplier + 'x');
```

**Show Leaderboard:**
```typescript
this.xpService.getLeaderboard(10).subscribe(result => {
  if (result.data) {
    this.topCandidates = result.data;
  }
});
```

**Show Achievements:**
```typescript
const user = this.authService.getCurrentUser();

this.xpService.getUnlockedAchievements(user.id).subscribe(result => {
  if (result.data) {
    this.myAchievements = result.data;
    console.log('Unlocked:', result.data.length, 'achievements');
  }
});
```

---

## Required Updates to Existing Code

### 1. Update Route Guards
**File:** `src/app/guards/*.ts`

Update any guards to use new role system:
```typescript
// Old
if (user.user_type === 'student') { ... }

// New
if (user.role === 'candidate') { ... }
```

### 2. Update Components
Any component using the old User type needs updating:

**Old:**
```typescript
user.user_type === 'student'
user.score_total
user.completed_count
```

**New:**
```typescript
user.role === 'candidate'
user.candidateProfile?.overall_xp
user.candidateProfile?.tasks_completed
```

### 3. Update Templates
**Old:**
```html
<div *ngIf="user.user_type === 'student'">
  Score: {{ user.score_total }}
</div>
```

**New:**
```html
<div *ngIf="user.role === 'candidate'">
  XP: {{ user.candidateProfile?.overall_xp }}
  Level: {{ user.candidateProfile?.overall_level }}
</div>
```

---

## Testing Checklist

Before deploying, test these scenarios:

### Authentication
- [ ] Sign up as candidate
- [ ] Sign up as enterprise rep
- [ ] Sign in with existing accounts
- [ ] Sign out
- [ ] Session persists on page refresh
- [ ] Profile data loads correctly

### Role-Based Access
- [ ] Candidate sees candidate dashboard
- [ ] Enterprise rep sees rep dashboard
- [ ] Admin sees admin panel
- [ ] Platform support sees support tools

### XP System
- [ ] Level displays correctly
- [ ] Progress bar shows accurate percentage
- [ ] XP calculations match expectations
- [ ] Leaderboard displays properly
- [ ] Achievements load and display

---

## Common Issues & Solutions

### Issue 1: "Profile not found"
**Solution:** The trigger that creates profiles might not have run. Manually create profile:
```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES ('user-id', 'email@example.com', 'Name', 'candidate');
```

### Issue 2: "Cannot read property 'candidateProfile' of null"
**Solution:** Add null checks:
```typescript
if (user?.candidateProfile) {
  // Safe to access candidateProfile
}
```

### Issue 3: Old imports not working
**Solution:** Update imports to use `core/` paths:
```typescript
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/database.types';
```

---

## Next Steps

1. **Create Task Service** - High priority for task browsing/enrollment
2. **Create Submission Service** - High priority for submitting work
3. **Create Storage Service** - Required for file uploads
4. **Create Review Service** - For enterprise rep review workflow
5. **Update Existing Components** - Migrate from old to new types
6. **Create Dashboard Components** - Role-specific dashboards
7. **Build Task Browser** - List and filter tasks
8. **Build Submission Form** - Dynamic file upload based on task config
9. **Build Review Interface** - For enterprise reps to review submissions

---

## File Location Summary

```
src/app/
├── core/
│   ├── models/
│   │   └── database.types.ts ✓ (NEW - Complete type system)
│   └── services/
│       ├── auth.service.ts ✓ (NEW - Enhanced for new schema)
│       ├── xp.service.ts ✓ (NEW - Complete XP/achievement system)
│       ├── task.service.ts ⏳ (TODO - Next priority)
│       ├── submission.service.ts ⏳ (TODO - Next priority)
│       ├── review.service.ts ⏳ (TODO)
│       └── storage.service.ts ⏳ (TODO)
└── services/
    ├── supabase.service.ts ✓ (Existing - Still works)
    └── auth.service.ts ⚠️  (OLD - Replace with core/services version)
```

---

## Questions?

Need help with:
- Creating the remaining services?
- Updating existing components?
- Building new UI components?
- Debugging migration issues?

Just ask! The core foundation is ready - now we build the features on top.

---

**Status:** Ready to implement remaining services and update UI components 🚀
