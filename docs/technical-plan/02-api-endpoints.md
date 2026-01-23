# API Endpoints Structure

Complete REST API design for the Job Simulation Platform.

---

## Overview

This document outlines all API endpoints organized by user role and feature area. All endpoints use standard HTTP methods and return JSON responses.

### Base URL
```
Production: https://api.jobsim.com
Development: http://localhost:3000
```

### Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <supabase_access_token>
```

### Standard Response Format
```typescript
// Success
{
  "data": { ... },
  "meta": { ... }
}

// Error
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

---

## Authentication & Authorization

### Register
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "string",
  "password": "string",
  "role": "candidate" | "enterprise_rep",
  "profile_data": {
    "full_name": "string",
    // Role-specific fields
  }
}

Response: 201 Created
{
  "user": { ... },
  "session": { ... }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: 200 OK
{
  "user": { ... },
  "session": { ... }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "user": { ... },
  "profile": { ... }
}
```

---

## Candidate APIs

### Task Discovery

#### Browse Tasks
```http
GET /api/tasks
Query Parameters:
  - category?: string
  - difficulty?: "beginner" | "intermediate" | "advanced" | "expert"
  - search?: string
  - sort?: "recent" | "popular" | "xp_high" | "xp_low"
  - limit?: number (default: 20)
  - offset?: number (default: 0)

Response: 200 OK
{
  "tasks": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "category": "string",
      "difficulty": "string",
      "base_xp": number,
      "difficulty_multiplier": number,
      "estimated_time_minutes": number,
      "total_attempts": number,
      "completion_rate": number,
      "avg_xp_earned": number
    }
  ],
  "total": number,
  "pagination": {
    "limit": number,
    "offset": number,
    "has_more": boolean
  }
}
```

#### Get Task Detail
```http
GET /api/tasks/:taskId
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "instructions": "markdown",
  "category": "string",
  "job_role": "string",
  "skill_tags": ["string"],
  "difficulty": "string",
  "base_xp": number,
  "difficulty_multiplier": number,
  "estimated_time_minutes": number,
  "submission_config": {
    "required_files": [...],
    "optional_files": [...]
  },
  "evaluation_criteria": ["string"],
  "attachments": [...],
  "stats": {
    "total_attempts": number,
    "completion_rate": number,
    "avg_xp": number
  }
}
```

### Task Enrollment & Submission

#### Enroll in Task
```http
POST /api/tasks/:taskId/enroll
Authorization: Bearer <token>

Response: 200 OK
{
  "enrollment_id": "uuid",
  "enrolled_at": "timestamp",
  "task": { ... }
}

Errors:
- 400: Already enrolled in another task
- 409: Maximum attempts reached for this task
```

#### Save Draft Submission
```http
POST /api/submissions/draft
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "task_id": "uuid",
  "files": File[],
  "candidate_notes": "string" (optional)
}

Response: 200 OK
{
  "draft_id": "uuid",
  "saved_at": "timestamp"
}
```

#### Get Draft
```http
GET /api/submissions/draft/:taskId
Authorization: Bearer <token>

Response: 200 OK
{
  "task_id": "uuid",
  "files": [...],
  "candidate_notes": "string",
  "saved_at": "timestamp"
}
```

#### Submit for Review
```http
POST /api/submissions
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "task_id": "uuid",
  "files": File[],
  "candidate_notes": "string" (optional)
}

Response: 201 Created
{
  "submission": {
    "id": "uuid",
    "task_id": "uuid",
    "status": "pending_validation",
    "submitted_at": "timestamp"
  }
}

Errors:
- 400: Validation failed (missing required files, wrong format, etc.)
- 409: Already have active submission
```

#### Get Submission Status
```http
GET /api/submissions/:submissionId
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "task_id": "uuid",
  "status": "string",
  "is_approved": boolean | null,
  "approved_attempt_number": number | null,
  "total_submission_number": number,
  "xp_earned": number,
  "xp_calculation": { ... },
  "reviews_completed": number,
  "reviews_approved": number,
  "submitted_at": "timestamp",
  "review_closed_at": "timestamp" | null,
  "reviews": [
    {
      "company_name": "string",
      "decision": "approve" | "reject",
      "feedback": "string",
      "interest_level": "string",
      "reviewed_at": "timestamp"
    }
  ]
}
```

#### Get My Submissions
```http
GET /api/submissions/mine
Authorization: Bearer <token>
Query Parameters:
  - task_id?: uuid
  - status?: string
  - limit?: number
  - offset?: number

Response: 200 OK
{
  "submissions": [...]
}
```

#### Abandon Task
```http
POST /api/tasks/:taskId/abandon
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Task abandoned successfully"
}
```

### Candidate Profile & Dashboard

#### Get My Profile
```http
GET /api/candidates/me
Authorization: Bearer <token>

Response: 200 OK
{
  "profile": {
    "id": "uuid",
    "full_name": "string",
    "avatar_url": "string",
    "location": "string",
    "remote_ok": boolean,
    "availability_status": "string",
    "years_of_experience": number,
    "bio": "string",
    "skills": ["string"],
    "overall_xp": number,
    "overall_level": number,
    "category_xp": { ... },
    "category_levels": { ... },
    "tasks_completed": number,
    "tasks_approved": number,
    "current_streak": number,
    "best_streak": number,
    "achievements": ["string"],
    "current_task": { ... } | null
  }
}
```

#### Update My Profile
```http
PUT /api/candidates/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "string",
  "location": "string",
  "remote_ok": boolean,
  "availability_status": "string",
  "years_of_experience": number,
  "bio": "string",
  "skills": ["string"],
  "contact_email": "string",
  "contact_phone": "string",
  "linkedin_url": "string",
  "allow_direct_contact": boolean
}

Response: 200 OK
{
  "profile": { ... }
}
```

#### Get My Task History
```http
GET /api/candidates/me/tasks
Authorization: Bearer <token>
Query Parameters:
  - status?: "completed" | "in_progress" | "abandoned"
  - category?: string
  - limit?: number
  - offset?: number

Response: 200 OK
{
  "tasks": [
    {
      "task": { ... },
      "submissions": [...],
      "best_score": number,
      "attempts_used": number
    }
  ]
}
```

#### Get Leaderboard
```http
GET /api/leaderboard
Query Parameters:
  - category?: string
  - timeframe?: "weekly" | "monthly" | "all_time"
  - limit?: number (default: 100)

Response: 200 OK
{
  "rankings": [
    {
      "rank": number,
      "candidate_id": "uuid",
      "candidate_name": "string",
      "avatar_url": "string",
      "xp": number,
      "level": number
    }
  ],
  "my_rank": number | null
}
```

### Interactions (Candidate Side)

#### Get My Messages
```http
GET /api/interactions
Authorization: Bearer <token>
Query Parameters:
  - type?: "message" | "interview_request" | "contact_request"
  - status?: "pending" | "accepted" | "declined"
  - limit?: number
  - offset?: number

Response: 200 OK
{
  "interactions": [
    {
      "id": "uuid",
      "type": "string",
      "from_user": { ... },
      "to_user": { ... },
      "subject": "string",
      "content": "string",
      "metadata": { ... },
      "status": "string",
      "read_at": "timestamp" | null,
      "created_at": "timestamp"
    }
  ]
}
```

#### Reply to Message
```http
POST /api/interactions/:id/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string"
}

Response: 201 Created
{
  "interaction": { ... }
}
```

#### Respond to Interview Request
```http
POST /api/interactions/:id/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "decision": "accept" | "decline",
  "message": "string" (optional)
}

Response: 200 OK
{
  "interaction": { ... }
}
```

#### Mark as Read
```http
PUT /api/interactions/:id/read
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true
}
```

---

## Enterprise Rep APIs

### Talent Discovery

#### Search Candidates
```http
POST /api/candidates/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "filters": {
    "category": "string",
    "min_xp": number,
    "min_level": number,
    "location": "string",
    "remote_ok": boolean,
    "availability": "actively_looking" | "open" | "not_looking",
    "skills": ["string"]
  },
  "sort": "xp_desc" | "level_desc" | "recent_activity",
  "limit": number,
  "offset": number
}

Response: 200 OK
{
  "candidates": [
    {
      "profile": { ... },
      "stats": {
        "overall_xp": number,
        "overall_level": number,
        "category_breakdown": { ... },
        "tasks_completed": number,
        "tasks_approved": number
      },
      "top_tasks": [...]
    }
  ],
  "total": number
}
```

#### Get Candidate Profile (Public View)
```http
GET /api/candidates/:candidateId
Authorization: Bearer <token>

Response: 200 OK
{
  "profile": {
    "id": "uuid",
    "full_name": "string",
    "avatar_url": "string",
    "location": "string",
    "remote_ok": boolean,
    "availability_status": "string",
    "years_of_experience": number,
    "bio": "string",
    "skills": ["string"],
    "overall_xp": number,
    "overall_level": number,
    "category_breakdown": { ... },
    "achievements": [...]
  },
  "portfolio": [
    {
      "task": { ... },
      "submission": { ... }, // Best score only
      "reviews": [...], // Including reviewer's own if exists
      "xp_earned": number
    }
  ],
  "stats": {
    "tasks_completed": number,
    "success_rate": number,
    "avg_xp_per_task": number
  }
}
```

#### Get Submission View (with files)
```http
GET /api/submissions/:submissionId/view
Authorization: Bearer <token>

Response: 200 OK
{
  "submission": { ... },
  "task": { ... },
  "files": [
    {
      "field": "string",
      "filename": "string",
      "size": number,
      "url": "signed_url" // Temporary signed URL (1 hour)
    }
  ],
  "reviews": [...]
}
```

#### Get Trending Candidates
```http
GET /api/candidates/trending
Authorization: Bearer <token>
Query Parameters:
  - category?: string
  - timeframe?: "week" | "month"
  - limit?: number

Response: 200 OK
{
  "candidates": [...]
}
```

#### Get AI Recommendations
```http
GET /api/candidates/recommendations
Authorization: Bearer <token>

Response: 200 OK
{
  "candidates": [...],
  "match_reasons": [
    {
      "candidate_id": "uuid",
      "reasons": ["Based on your industry", "Strong in categories you follow"]
    }
  ]
}
```

### Review Queue

#### Get My Review Assignments
```http
GET /api/reviews/queue
Authorization: Bearer <token>
Query Parameters:
  - status?: "pending" | "completed"
  - category?: string
  - limit?: number
  - offset?: number

Response: 200 OK
{
  "reviews": [
    {
      "submission": { ... },
      "task": { ... },
      "assigned_at": "timestamp"
    }
  ]
}
```

#### Submit Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "submission_id": "uuid",
  "decision": "approve" | "reject",
  "feedback": "string", // Required, min 50 chars
  "interest_level": "shortlist" | "exceptional" | "contact_request" | "pass",
  "review_time_minutes": number (optional)
}

Response: 201 Created
{
  "review": {
    "id": "uuid",
    "submission_id": "uuid",
    "decision": "string",
    "feedback": "string",
    "interest_level": "string",
    "reviewed_at": "timestamp"
  }
}

Errors:
- 400: Feedback too short
- 409: Already reviewed this submission
- 403: Not assigned to review this submission
```

#### Get My Review History
```http
GET /api/reviews/mine
Authorization: Bearer <token>
Query Parameters:
  - category?: string
  - decision?: "approve" | "reject"
  - limit?: number
  - offset?: number

Response: 200 OK
{
  "reviews": [
    {
      "review": { ... },
      "submission": { ... },
      "task": { ... },
      "candidate_responded": boolean
    }
  ]
}
```

### Shortlist Management

#### Get My Shortlist
```http
GET /api/shortlist
Authorization: Bearer <token>
Query Parameters:
  - status?: "active" | "interviewed" | "hired" | "passed"
  - tags?: string[] (comma-separated)
  - sort?: "recent" | "xp_high" | "level_high"
  - limit?: number
  - offset?: number

Response: 200 OK
{
  "shortlist": [
    {
      "id": "uuid",
      "candidate": { ... },
      "tags": ["string"],
      "notes": "string",
      "status": "string",
      "added_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### Add to Shortlist
```http
POST /api/shortlist
Authorization: Bearer <token>
Content-Type: application/json

{
  "candidate_id": "uuid",
  "tags": ["string"] (optional),
  "notes": "string" (optional)
}

Response: 201 Created
{
  "shortlist_entry": { ... }
}
```

#### Update Shortlist Entry
```http
PUT /api/shortlist/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": ["string"],
  "notes": "string",
  "status": "string"
}

Response: 200 OK
{
  "shortlist_entry": { ... }
}
```

#### Remove from Shortlist
```http
DELETE /api/shortlist/:id
Authorization: Bearer <token>

Response: 204 No Content
```

#### Bulk Actions
```http
POST /api/shortlist/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "add_tag" | "remove_tag" | "update_status",
  "shortlist_ids": ["uuid"],
  "data": {
    // Action-specific data
  }
}

Response: 200 OK
{
  "updated_count": number
}
```

### Messaging & Outreach

#### Send Message
```http
POST /api/interactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "message",
  "to_user_id": "uuid",
  "subject": "string",
  "content": "string",
  "metadata": { ... } (optional)
}

Response: 201 Created
{
  "interaction": { ... }
}
```

#### Send Interview Request
```http
POST /api/interactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "interview_request",
  "to_user_id": "uuid",
  "content": "string",
  "metadata": {
    "position": "string",
    "interview_type": "video_call" | "phone" | "in_person",
    "proposed_times": ["timestamp"]
  }
}

Response: 201 Created
{
  "interaction": { ... }
}
```

#### Request Contact Info
```http
POST /api/interactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "contact_request",
  "to_user_id": "uuid",
  "content": "string",
  "metadata": {
    "requested_fields": ["email", "phone", "linkedin"]
  }
}

Response: 201 Created
{
  "interaction": { ... }
}
```

### Analytics

#### Get My Recruitment Stats
```http
GET /api/enterprise/analytics
Authorization: Bearer <token>
Query Parameters:
  - timeframe?: "week" | "month" | "quarter" | "year"

Response: 200 OK
{
  "candidates_viewed": number,
  "shortlisted": number,
  "messages_sent": number,
  "interviews_requested": number,
  "hires": number,
  "reviews_completed": number,
  "avg_review_time_hours": number,
  "reviewer_rating": number
}
```

#### Export Data
```http
POST /api/enterprise/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "shortlist" | "review_history" | "analytics",
  "format": "csv" | "json",
  "filters": { ... } (optional)
}

Response: 200 OK
{
  "download_url": "signed_url", // Valid for 1 hour
  "expires_at": "timestamp"
}
```

---

## Admin APIs

### Task Management

#### Create Task
```http
POST /api/admin/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "instructions": "markdown",
  "category": "string",
  "job_role": "string",
  "skill_tags": ["string"],
  "difficulty": "beginner" | "intermediate" | "advanced" | "expert",
  "base_xp": number,
  "difficulty_multiplier": number,
  "estimated_time_minutes": number,
  "submission_config": { ... },
  "evaluation_criteria": ["string"],
  "attachments": [...],
  "status": "draft" | "active"
}

Response: 201 Created
{
  "task": { ... }
}
```

#### Update Task
```http
PUT /api/admin/tasks/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  // Same fields as create, all optional
}

Response: 200 OK
{
  "task": { ... }
}
```

#### Archive Task
```http
DELETE /api/admin/tasks/:taskId
Authorization: Bearer <token>

Response: 204 No Content
```

#### Clone Task
```http
POST /api/admin/tasks/:taskId/clone
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "modifications": { ... } (optional)
}

Response: 201 Created
{
  "task": { ... }
}
```

#### Get Task Analytics
```http
GET /api/admin/tasks/:taskId/analytics
Authorization: Bearer <token>

Response: 200 OK
{
  "total_attempts": number,
  "total_completions": number,
  "completion_rate": number,
  "avg_xp_earned": number,
  "avg_completion_time_minutes": number,
  "approval_rate": number,
  "category_performance": { ... }
}
```

### User Management

#### List Users
```http
GET /api/admin/users
Authorization: Bearer <token>
Query Parameters:
  - role?: string
  - status?: "active" | "suspended" | "banned"
  - search?: string
  - limit?: number
  - offset?: number

Response: 200 OK
{
  "users": [...]
}
```

#### Get User Details
```http
GET /api/admin/users/:userId
Authorization: Bearer <token>

Response: 200 OK
{
  "profile": { ... },
  "stats": { ... },
  "activity_log": [...]
}
```

#### Update User
```http
PUT /api/admin/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  // Any profile fields
}

Response: 200 OK
{
  "profile": { ... }
}
```

#### Adjust Candidate XP
```http
POST /api/admin/candidates/:candidateId/adjust-xp
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "string",
  "amount": number, // Can be negative
  "reason": "string"
}

Response: 200 OK
{
  "profile": { ... }
}
```

#### Suspend/Ban User
```http
POST /api/admin/users/:userId/suspend
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "string",
  "duration": "string" (optional) // e.g., "7d", "30d", "permanent"
}

Response: 200 OK
{
  "success": true
}
```

### Review Management

#### Get Flagged Submissions
```http
GET /api/admin/submissions/flagged
Authorization: Bearer <token>
Query Parameters:
  - reason?: "plagiarism" | "quality" | "reported"
  - limit?: number
  - offset?: number

Response: 200 OK
{
  "submissions": [...]
}
```

#### Override Review
```http
POST /api/admin/reviews/:reviewId/override
Authorization: Bearer <token>
Content-Type: application/json

{
  "new_decision": "approve" | "reject",
  "admin_notes": "string"
}

Response: 200 OK
{
  "review": { ... }
}
```

#### Void Review
```http
POST /api/admin/reviews/:reviewId/void
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "string"
}

Response: 200 OK
{
  "success": true
}
```

#### Manually Assign Reviewers
```http
POST /api/admin/submissions/:submissionId/assign-reviewers
Authorization: Bearer <token>
Content-Type: application/json

{
  "reviewer_ids": ["uuid"]
}

Response: 200 OK
{
  "success": true
}
```

### Platform Analytics

#### Get Platform Overview
```http
GET /api/admin/analytics/overview
Authorization: Bearer <token>
Query Parameters:
  - timeframe?: "week" | "month" | "quarter" | "year"

Response: 200 OK
{
  "total_users": number,
  "total_candidates": number,
  "total_enterprises": number,
  "total_tasks": number,
  "total_submissions": number,
  "completion_rate": number,
  "approval_rate": number,
  "avg_xp_per_task": number,
  "active_users_today": number
}
```

#### Get Growth Metrics
```http
GET /api/admin/analytics/growth
Authorization: Bearer <token>

Response: 200 OK
{
  "user_growth": [...], // Time series
  "submission_growth": [...],
  "engagement_metrics": { ... }
}
```

#### Get Top Performers
```http
GET /api/admin/analytics/top-performers
Authorization: Bearer <token>
Query Parameters:
  - metric?: "xp" | "completions" | "reviews"
  - limit?: number

Response: 200 OK
{
  "performers": [...]
}
```

---

## Platform Support APIs

#### Get Support Queue
```http
GET /api/support/queue
Authorization: Bearer <token>

Response: 200 OK
{
  "items": [
    {
      "type": "flagged_submission" | "dispute" | "help_request",
      "item": { ... },
      "priority": "high" | "medium" | "low",
      "created_at": "timestamp"
    }
  ]
}
```

#### Review Flagged Submission
```http
POST /api/support/submissions/:submissionId/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve" | "reject" | "escalate",
  "notes": "string"
}

Response: 200 OK
{
  "success": true
}
```

#### Handle Dispute
```http
POST /api/support/disputes/:disputeId/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "string",
  "action": "uphold" | "overturn" | "escalate"
}

Response: 200 OK
{
  "success": true
}
```

---

## Rate Limits

All endpoints are rate-limited based on user role and endpoint type:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Submission Creation | 3 per day | 24 hours |
| Review Submission | 20 per day | 24 hours |
| Message Sending | 10 per hour | 1 hour |
| Search Queries | 100 per hour | 1 hour |
| General API Calls | 1000 per hour | 1 hour |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Webhooks (Future Feature)

Enterprise accounts can register webhooks for events:
- New candidate matches search criteria
- Candidate you shortlisted achieved new milestone
- Review response received

---

## Next Steps

1. Implement API routes in your backend
2. Set up authentication middleware
3. Implement rate limiting
4. Add request validation
5. Write API tests
6. Document with OpenAPI/Swagger

---

**Note:** All endpoints return appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500) and follow REST conventions.
