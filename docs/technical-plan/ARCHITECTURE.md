# System Architecture

Visual diagrams and architecture overview for the Job Simulation Platform.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Candidate  │  │  Enterprise  │  │    Admin     │         │
│  │   Dashboard  │  │   Dashboard  │  │   Dashboard  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Angular 15+ • TailwindCSS • RxJS                               │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API/AUTH LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Supabase Auth (JWT) • Row Level Security • API Gateway         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Edge Functions│  │  DB Functions  │  │    Triggers    │   │
│  ├────────────────┤  ├────────────────┤  ├────────────────┤   │
│  │ • Validation   │  │ • XP Calc      │  │ • Auto-update  │   │
│  │ • File Process │  │ • Review Logic │  │ • Review Check │   │
│  │ • Notifications│  │ • Level Update │  │ • Timestamps   │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │   PostgreSQL     │         │  Supabase        │             │
│  │   Database       │◄────────┤  Storage         │             │
│  │                  │         │                  │             │
│  │ • Users/Profiles │         │ • Submissions    │             │
│  │ • Tasks          │         │ • Avatars        │             │
│  │ • Submissions    │         │ • Task Files     │             │
│  │ • Reviews        │         │                  │             │
│  │ • Shortlists     │         └──────────────────┘             │
│  │ • Interactions   │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Task Submission Flow

```
Candidate                 System                   Reviewers
    │                        │                         │
    │  1. Browse Tasks       │                         │
    ├──────────────────────► │                         │
    │                        │                         │
    │  2. Enroll in Task     │                         │
    ├──────────────────────► │                         │
    │                        │ (Check: One task only)  │
    │                        │ (Lock candidate)        │
    │                        │                         │
    │  3. Upload Files       │                         │
    ├──────────────────────► │                         │
    │                        │ (Save to Storage)       │
    │                        │                         │
    │  4. Submit for Review  │                         │
    ├──────────────────────► │                         │
    │                        │                         │
    │                        │ 5. Auto Validate        │
    │                        ├────────────┐            │
    │                        │            │            │
    │                        │◄───────────┘            │
    │                        │  (Check files, types)   │
    │                        │                         │
    │                        │ 6. Assign 3 Reviewers   │
    │                        ├────────────────────────►│
    │                        │                         │
    │  7. Notification       │                         │
    │◄───────────────────────┤                         │
    │  "Under Review"        │                         │
    │                        │                         │
    │                        │   8. Review Submissions │
    │                        │◄────────────────────────┤
    │                        │                         │
    │                        │ 9. Process Reviews      │
    │                        │    (After 3 reviews)    │
    │                        ├────────────┐            │
    │                        │            │            │
    │                        │◄───────────┘            │
    │                        │  • Check 2/3 approval   │
    │                        │  • Calculate XP         │
    │                        │  • Update levels        │
    │                        │  • Check achievements   │
    │                        │  • Unlock candidate     │
    │                        │                         │
    │  10. Results           │                         │
    │◄───────────────────────┤                         │
    │  (XP + Feedback)       │                         │
    │                        │                         │
```

---

### 2. XP Calculation Flow

```
Submission Approved
        │
        ├─► Get Task Details
        │   • base_xp (100-1000)
        │   • difficulty_multiplier (1.0-3.0)
        │
        ├─► Calculate Attempt Multiplier
        │   • 1st attempt: 2.0x
        │   • 2nd attempt: 1.5x
        │   • 3rd attempt: 1.25x
        │   • 4th attempt: 1.0x
        │   • 5th attempt: 0.75x
        │
        ├─► Apply Formula
        │   XP = base_xp × difficulty_mult × attempt_mult
        │
        ├─► Add Bonuses (if applicable)
        │   • Speed bonus
        │   • First try perfect
        │   • Exceptional feedback
        │
        ├─► Update Candidate
        │   • Add XP to overall_xp
        │   • Add XP to category_xp
        │   • Increment tasks_approved
        │
        ├─► Recalculate Levels
        │   • Update overall_level
        │   • Update category_levels
        │
        ├─► Check Achievements
        │   • First Perfect?
        │   • Sharpshooter?
        │   • Specialist?
        │   • Etc.
        │
        └─► Send Notifications
            • Achievement unlocked
            • Level up
            • XP earned
```

---

### 3. Enterprise Discovery Flow

```
Enterprise Rep
      │
      ├─► 1. Open Talent Discovery
      │
      ├─► 2. Apply Filters
      │   • Category: Marketing
      │   • Min Level: 4
      │   • Location: Remote OK
      │   • Skills: [Strategy, Analytics]
      │
      ├─► 3. Search API Called
      │          │
      │          ├─► Query Database
      │          │   • Join candidate_profiles
      │          │   • Filter by criteria
      │          │   • Sort by XP/Level
      │          │
      │          └─► Return Results
      │                  │
      ├─► 4. View Candidate Cards ◄──┘
      │   • Name, XP, Level
      │   • Category breakdown
      │   • Top tasks
      │
      ├─► 5. Click Candidate Profile
      │          │
      │          ├─► Load Full Profile
      │          │   • Bio, skills
      │          │   • Achievements
      │          │
      │          └─► Load Portfolio
      │              • Best submissions
      │              • Reviews (including own)
      │
      ├─► 6. View Submission Files
      │   (Generate signed URLs)
      │
      ├─► 7. Take Action
      │   ├─► Add to Shortlist
      │   ├─► Send Message
      │   └─► Request Interview
      │
      └─► 8. Candidate Notified
```

---

## Database Entity Relationships

```
┌──────────────┐
│   profiles   │ (Base user table)
└──────┬───────┘
       │
       ├─────────────────────┬─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
┌────────────────┐   ┌──────────────────┐   ┌─────────┐
│candidate_      │   │enterprise_rep_   │   │ admin   │
│profiles        │   │profiles          │   │         │
└───────┬────────┘   └────────┬─────────┘   └─────────┘
        │                     │
        │                     │
        │                     │
        ▼                     │
┌────────────┐               │
│submissions │◄──────────────┤
└──────┬─────┘               │
       │                     │
       │                     │
       ├─────────┐           │
       │         │           │
       ▼         ▼           ▼
┌──────────┐ ┌────────┐ ┌──────────┐
│  files   │ │reviews │ │shortlists│
│(storage) │ └───┬────┘ └──────────┘
└──────────┘     │
                 │
                 ▼
         ┌──────────────┐
         │ interactions │
         └──────────────┘

┌─────────┐
│  tasks  │ (Created by admin)
└────┬────┘
     │
     └──────► Referenced by submissions
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                          │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Authentication
├─ Supabase Auth (JWT tokens)
├─ Email/password or OAuth
├─ Token expiration (1 hour)
└─ Refresh token rotation

Layer 2: Authorization (RLS Policies)
├─ Candidates can only read/write own data
├─ Enterprise reps can read public candidate data
├─ Reviewers can only read assigned submissions
└─ Admins have elevated permissions

Layer 3: Storage Security
├─ Bucket policies per user role
├─ Private files use signed URLs (1 hour)
├─ Public files (avatars, logos) cached
└─ File size limits enforced

Layer 4: Input Validation
├─ TypeScript types (compile-time)
├─ Zod schemas (runtime)
├─ File type validation
├─ HTML sanitization (XSS prevention)
└─ SQL injection prevention (Supabase)

Layer 5: Rate Limiting
├─ Per-user limits
├─ Per-endpoint limits
├─ IP-based throttling
└─ DDoS protection (Cloudflare)

Layer 6: Monitoring
├─ Error tracking (Sentry)
├─ Audit logs (activity_logs table)
├─ Failed login attempts
└─ Suspicious activity alerts
```

---

## File Storage Architecture

```
Supabase Storage
│
├─ task-attachments/ (PUBLIC)
│  └─ {task_id}/
│     ├─ brand_guidelines.pdf
│     ├─ dataset.csv
│     └─ template.docx
│
├─ submission-files/ (PRIVATE)
│  └─ {candidate_id}/
│     └─ {submission_id}/
│        ├─ strategy_document_1234567890.pdf
│        ├─ creative_mockups_1234567891.zip
│        └─ analytics_plan_1234567892.xlsx
│
├─ avatars/ (PUBLIC)
│  ├─ {user_id}.jpg
│  ├─ {user_id}.png
│  └─ ...
│
└─ company-logos/ (PUBLIC)
   ├─ {company_id}.png
   └─ ...

Access Control:
├─ Public buckets: Direct URL access
├─ Private buckets: Signed URLs (1 hour expiry)
└─ RLS policies control who can access what
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           PRODUCTION                             │
└─────────────────────────────────────────────────────────────────┘

Frontend (Vercel)
├─ Angular SPA
├─ SSR (Angular Universal) - optional
├─ CDN: Cloudflare
├─ Auto-scaling
└─ CI/CD: GitHub Actions → Vercel

Backend (Supabase Cloud)
├─ PostgreSQL (managed)
├─ Auth service
├─ Storage (S3-compatible)
├─ Edge Functions (Deno)
├─ Realtime subscriptions
└─ Automatic backups

Monitoring
├─ Sentry (errors)
├─ Supabase Dashboard (metrics)
├─ Vercel Analytics (performance)
└─ LogRocket (session replay)

DNS & CDN
├─ Domain: jobsim.com
├─ CDN: Cloudflare
├─ SSL: Auto-managed
└─ DDoS protection

Environments
├─ Development: localhost
├─ Staging: staging.jobsim.com
└─ Production: jobsim.com
```

---

## State Management Architecture

```
Angular Application
│
├─ Core Services (Singleton)
│  ├─ AuthService
│  │  └─ BehaviorSubject<User>
│  │
│  ├─ TaskService
│  │  └─ Task CRUD operations
│  │
│  ├─ SubmissionService
│  │  └─ Submission CRUD operations
│  │
│  └─ NotificationService
│     └─ BehaviorSubject<Notification[]>
│
├─ Feature Services
│  ├─ CandidateService
│  ├─ EnterpriseService
│  └─ AdminService
│
└─ Local Component State
   └─ Form controls, UI state
```

---

## Performance Optimization Strategy

```
Frontend Optimization
├─ Lazy Loading
│  └─ Feature modules loaded on demand
├─ Bundle Optimization
│  ├─ Tree shaking
│  ├─ Code splitting
│  └─ Differential loading
├─ Image Optimization
│  ├─ WebP format
│  ├─ Lazy loading images
│  └─ Responsive images
└─ Caching
   ├─ Service Worker (PWA)
   └─ HTTP caching headers

Backend Optimization
├─ Database Indexes
│  ├─ Foreign keys
│  ├─ Frequently queried columns
│  └─ Composite indexes
├─ Query Optimization
│  ├─ Limit result sets
│  ├─ Use selective columns
│  └─ Avoid N+1 queries
├─ Caching
│  ├─ Supabase query cache
│  └─ CDN for static assets
└─ Connection Pooling
   └─ Managed by Supabase

Storage Optimization
├─ File compression
├─ CDN for public files
├─ Signed URLs cached (1 hour)
└─ Lazy loading file previews
```

---

## Monitoring & Observability

```
Application Monitoring
├─ Error Tracking (Sentry)
│  ├─ Frontend errors
│  ├─ Backend errors
│  └─ Performance issues
│
├─ Analytics (Mixpanel/PostHog)
│  ├─ User actions
│  ├─ Conversion funnels
│  └─ Feature usage
│
├─ Performance (Vercel Analytics)
│  ├─ Core Web Vitals
│  ├─ Page load times
│  └─ API response times
│
└─ Database (Supabase Dashboard)
   ├─ Query performance
   ├─ Connection pool usage
   └─ Storage usage

Business Metrics Dashboard
├─ Active users (daily/monthly)
├─ Task completion rate
├─ Review turnaround time
├─ Candidate-to-hire conversion
└─ Platform revenue
```

---

## Scaling Strategy

```
Current (MVP): 0-1K users
├─ Single Supabase instance
├─ Vercel hobby/pro plan
└─ Basic monitoring

Phase 2: 1K-10K users
├─ Supabase Pro plan
├─ Vercel Pro plan
├─ Add caching layer (Redis)
└─ Enhanced monitoring

Phase 3: 10K-100K users
├─ Supabase Enterprise
├─ Database read replicas
├─ Background job queue
├─ Rate limiting per user tier
└─ Advanced analytics

Phase 4: 100K+ users
├─ Microservices architecture
├─ Separate databases per service
├─ Event-driven architecture
├─ Dedicated search (Elasticsearch)
└─ Multi-region deployment
```

---

This architecture is designed for scalability, security, and maintainability from day one while allowing for future growth.

**Last Updated:** January 14, 2026
