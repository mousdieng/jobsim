# Technical Implementation Plan - Overview

## Project: Job Simulation Platform (Enhanced Task System)

**Platform Concept:** A skills showcase platform similar to LeetCode, but for real enterprise tasks across all job categories (Marketing, Sales, Design, etc.). Candidates complete tasks to build portfolios, earn XP, and get discovered by enterprise recruiters.

---

## Core System Design

### Key Features
- **Flexible Task Creation System** - Admins create tasks with dynamic submission requirements
- **XP-Based Gamification** - Rewards based on difficulty, attempts, and bonuses
- **2-Phase Attempt System** - Unlimited rejections (learning) + 5 approved attempts (optimization)
- **Hybrid Review Process** - 3 enterprise reviewers with 2/3 majority approval
- **Talent Discovery Platform** - Enterprise reps search, review, and recruit candidates
- **4-Role System** - Admin, Platform Support, Enterprise Rep, Candidate

---

## System Architecture

### Technology Stack
- **Frontend:** Angular 15+
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **File Storage:** Supabase Storage with signed URLs
- **Real-time:** Supabase Realtime subscriptions
- **Deployment:** Vercel (Frontend) + Supabase Cloud

### Key Workflows

1. **Candidate Journey**
   ```
   Discovery → Enroll → Work → Submit → Review → Results
   ```

2. **Review Process**
   ```
   Submit → Auto-Validate → Assign 3 Reviewers → Collect Reviews → Calculate XP
   ```

3. **Enterprise Discovery**
   ```
   Search Candidates → View Profiles → Review Work → Shortlist → Contact
   ```

---

## Documentation Structure

This technical plan is divided into 6 main documents:

1. **[Database Schema](./01-database-schema.md)**
   - Complete PostgreSQL schema
   - Row Level Security policies
   - Database functions and triggers
   - Indexes and constraints

2. **[API Endpoints](./02-api-endpoints.md)**
   - RESTful API structure
   - Candidate endpoints
   - Enterprise endpoints
   - Admin endpoints
   - Authentication & authorization

3. **[Frontend Architecture](./03-frontend-architecture.md)**
   - Angular project structure
   - Core services
   - Feature modules
   - Key components
   - State management

4. **[File Storage Strategy](./04-file-storage.md)**
   - Supabase Storage setup
   - Bucket configuration
   - Upload/download flows
   - File validation
   - Security policies

5. **[Security & Validation](./05-security-validation.md)**
   - Row Level Security policies
   - Storage bucket policies
   - Input sanitization
   - Rate limiting
   - Validation rules

6. **[Implementation Roadmap](./06-implementation-roadmap.md)**
   - 10-phase development plan
   - 20-week timeline
   - MVP scope (12 weeks)
   - Dependencies and milestones
   - Testing strategy

---

## Quick Start Guide

### Phase 1: Foundation (Weeks 1-2)
1. Set up Supabase project
2. Run database schema from `01-database-schema.md`
3. Configure authentication
4. Set up Angular project structure
5. Implement core services

### Critical Path
```
Foundation → Task System → Submission → Review → Discovery → Launch
(2 weeks)   (2 weeks)     (2 weeks)    (2 weeks)  (2 weeks)    (2 weeks)
```

---

## Key Design Decisions

### XP System
- **Base XP:** 100 (Beginner) to 1000 (Expert)
- **Difficulty Multiplier:** 1.0x to 3.0x (admin-configurable)
- **Attempt Multiplier:** 2.0x (1st) to 0.75x (5th)
- **Bonuses:** Speed, perfection, consistency

### Attempt System
- **Phase 1:** Unlimited rejections (no XP, doesn't count toward limit)
- **Phase 2:** 5 approved submissions to maximize XP
- **Best Score:** Highest XP across all attempts is featured

### Review System
- **Assignment:** 3 random enterprise reps from relevant categories
- **Approval:** 2/3 majority required to pass
- **Feedback:** Required (min 50 characters)
- **Transparency:** Candidates see company names

### Single Task Rule
- Candidates can only work on ONE task at a time
- Must complete or abandon before enrolling in another
- Prevents task hopping and ensures focused completion

---

## Estimated Effort

### Full Platform (20 weeks)
- **Phase 1-4:** Core functionality (8 weeks)
- **Phase 5-7:** User features (6 weeks)
- **Phase 8-9:** Polish & admin (4 weeks)
- **Phase 10:** Testing & launch (2 weeks)

### MVP (12 weeks)
- Foundation + Task + Submission + Review + Basic Discovery + Launch
- Defer: Advanced messaging, analytics, admin tools

---

## Success Metrics

### For Candidates
- Tasks completed
- XP earned
- Level progression
- Achievement unlocks
- Enterprise interest received

### For Enterprises
- Candidates viewed
- Reviews completed
- Shortlist size
- Interview requests sent
- Hires made

### For Platform
- Active users (daily/monthly)
- Task completion rate
- Review completion rate
- Avg time to review
- Candidate-to-hire conversion

---

## Next Steps

1. Read through all 6 technical documents
2. Set up development environment
3. Run database schema
4. Implement Phase 1 (Foundation)
5. Follow implementation roadmap

---

**Last Updated:** January 14, 2026
