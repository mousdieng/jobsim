# JobSim Senegal - AI Workflow Engine

A comprehensive AI-powered backend service that generates professional tasks, simulates workplace meetings, and evaluates user submissions for the JobSim Senegal platform.

## Features

### 1. Multi-Provider AI Support ⚡ NEW
- **Switch between AI providers** with a single environment variable
- **Mock Provider** - Test FREE without spending money! 💰
- **OpenAI GPT-4** support - industry-standard performance
- **Anthropic Claude** support - cost-effective alternative
- Unified API - no code changes needed to switch providers
- Provider-specific optimizations for best results

### 2. Task Generation Engine
- Generates realistic professional tasks for 16+ job fields
- Customizable difficulty levels (beginner to expert)
- Industry-specific skills and deliverables
- Culturally relevant content for Senegalese/African context
- Automatic task catalog balancing

### 3. Meeting Simulation Engine
- Simulates various meeting types (kickoff, standup, review, client calls)
- AI-generated participants with realistic names and roles
- Structured agendas and transcripts
- Action items with ownership and deadlines
- Professional conversation patterns

### 4. Scoring & Evaluation System
- Multi-criteria evaluation (completeness, quality, accuracy, communication, initiative, standards)
- Detailed feedback with strengths and improvements
- Letter grades and percentage scores
- Personalized recommendations
- Automatic user statistics updates

## Prerequisites

- Node.js >= 18.0.0
- **For Testing (FREE):**
  - Nothing! Use the mock provider
- **For Production:**
  - **ONE of the following AI providers:**
    - OpenAI API key (GPT-4 recommended) OR
    - Anthropic API key (Claude 3.5 Sonnet recommended)
  - Supabase project with the JobSim schema

## Installation

```bash
cd ai-engine
npm install
```

## Quick Test (No API Key Required!)

Want to test without spending money? Use the mock provider:

```bash
cd ai-engine
cp .env.example .env
# .env already has AI_PROVIDER=mock by default!
npm run dev
```

Then test it:
```bash
curl -X POST http://localhost:3001/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{"job_field":"software_engineering","difficulty_level":"intermediate","count":1}'
```

**FREE! No API key needed!** See [TESTING.md](./TESTING.md) for complete testing guide.

---

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:

### Option A: Using Mock Provider (FREE - for testing)
```env
# AI Provider Selection
AI_PROVIDER=mock

# No API key needed!
# No Supabase needed for basic testing!
```

### Option B: Using OpenAI (GPT-4)
```env
# AI Provider Selection
AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# Supabase Configuration (use SERVICE ROLE key, not anon key)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

### Option C: Using Anthropic (Claude)
```env
# AI Provider Selection
AI_PROVIDER=claude

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Supabase Configuration (use SERVICE ROLE key, not anon key)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Server Configuration
PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI Engine Settings
MAX_TASKS_PER_GENERATION=5
MAX_MEETINGS_PER_TASK=3
DEFAULT_TASK_DEADLINE_DAYS=7
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Task Generation

**Generate Tasks (Preview Only)**
```
POST /api/tasks/generate
Content-Type: application/json

{
  "job_field": "software_engineering",
  "difficulty_level": "intermediate",
  "count": 3,
  "specific_skills": ["React", "TypeScript"],
  "context": "Focus on frontend development"
}
```

**Generate and Save Tasks to Database**
```
POST /api/tasks/generate-and-save
Content-Type: application/json

{
  "job_field": "marketing",
  "difficulty_level": "beginner",
  "count": 2
}
```

**Balance Task Catalog**
```
POST /api/tasks/balance-catalog
```

### Meeting Simulation

**Generate Single Meeting**
```
POST /api/meetings/generate
Content-Type: application/json

{
  "task_id": "uuid-of-task",
  "meeting_type": "kickoff",
  "user_id": "uuid-of-user"
}
```

**Generate Meeting Series (Kickoff, Standup, Review)**
```
POST /api/meetings/generate-series
Content-Type: application/json

{
  "task_id": "uuid-of-task",
  "user_id": "uuid-of-user"
}
```

### Submission Evaluation

**Evaluate Single Submission**
```
POST /api/evaluations/evaluate
Content-Type: application/json

{
  "submission_id": "uuid-of-submission"
}
```

**Batch Evaluate Submissions**
```
POST /api/evaluations/batch
Content-Type: application/json

{
  "submission_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Quick Score (No Database Storage)**
```
POST /api/evaluations/quick-score
Content-Type: application/json

{
  "content": "User's submission content...",
  "criteria": ["Completeness", "Quality", "Accuracy"]
}
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": [ ... ] // For validation errors
}
```

## Job Fields Supported

- Software Engineering
- Accounting
- Marketing
- Sales
- Human Resources
- Project Management
- Data Science
- Graphic Design
- Customer Service
- Finance
- Legal
- Healthcare
- Education
- Operations
- Consulting
- Other

## Architecture

```
ai-engine/
├── src/
│   ├── config/           # Environment configuration
│   ├── controllers/      # API request handlers
│   ├── prompts/          # AI prompt templates
│   ├── services/         # Core business logic
│   │   ├── openai.service.ts
│   │   ├── supabase.service.ts
│   │   ├── task-generator.service.ts
│   │   ├── meeting-simulator.service.ts
│   │   └── scoring-evaluator.service.ts
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Helper functions
│   └── index.ts          # Express server entry
├── package.json
├── tsconfig.json
└── .env.example
```

## Security

- Uses Helmet for HTTP security headers
- CORS configured for Angular frontend
- Rate limiting to prevent abuse
- Input validation with Zod
- Service role key for database operations (admin access)

## Switching AI Providers

You can switch between OpenAI and Claude **at any time** by changing one environment variable:

```bash
# In your .env file, change this line:
AI_PROVIDER=claude  # or openai
```

Then restart the server:
```bash
npm run dev
```

The system will automatically:
- ✅ Validate the correct API key is present
- ✅ Use the appropriate AI model
- ✅ Handle JSON responses differently per provider
- ✅ Log which provider is active on startup

**No code changes required!** The abstraction layer handles everything.

## Cost Comparison

### OpenAI GPT-4 Turbo
- **Input**: ~$0.01 per 1K tokens
- **Output**: ~$0.03 per 1K tokens
- **Task generation**: ~$0.10-0.30 per task
- **Meeting simulation**: ~$0.15-0.40 per meeting
- **Evaluation**: ~$0.05-0.15 per submission

### Anthropic Claude 3.5 Sonnet (Recommended)
- **Input**: ~$0.003 per 1K tokens
- **Output**: ~$0.015 per 1K tokens
- **Task generation**: ~$0.03-0.12 per task
- **Meeting simulation**: ~$0.05-0.20 per meeting
- **Evaluation**: ~$0.02-0.08 per submission
- **💰 ~60% cheaper than GPT-4**

### Anthropic Claude 3 Haiku (Budget Option)
- **Input**: ~$0.00025 per 1K tokens
- **Output**: ~$0.00125 per 1K tokens
- **Task generation**: ~$0.005-0.020 per task
- **Meeting simulation**: ~$0.008-0.035 per meeting
- **Evaluation**: ~$0.003-0.015 per submission
- **💰 ~95% cheaper than GPT-4**

### Which Provider Should You Use?

**Use Mock Provider when:** (Recommended for Development)
- 🆓 **Testing and development** - completely FREE!
- You're building/testing integration
- You want instant responses
- You don't want to spend money yet
- You're learning the API

**Use Claude 3.5 Sonnet when:** (Recommended for Production)
- You want best balance of quality and cost
- You need longer context windows (200K tokens)
- You prefer a more cost-effective solution
- Quality is still very important
- **60% cheaper than GPT-4**

**Use OpenAI GPT-4 when:**
- You need the absolute highest quality outputs
- Cost is not a primary concern
- You're already invested in the OpenAI ecosystem

**Use Claude 3 Haiku when:**
- You need to generate high volumes
- Fast response times are critical
- Budget is very constrained
- **95% cheaper than GPT-4**

## Integration with Angular

The Angular frontend uses the `AIEngineService` to communicate with this API:

```typescript
import { AIEngineService } from './services/ai-engine.service';

constructor(private aiEngine: AIEngineService) {}

// Generate tasks
this.aiEngine.generateTasks({
  job_field: 'software_engineering',
  difficulty_level: 'intermediate',
  count: 2
}).subscribe(tasks => {
  console.log('Generated tasks:', tasks);
});

// Evaluate submission
this.aiEngine.evaluateSubmission('submission-uuid').subscribe(evaluation => {
  console.log('Score:', evaluation.overall_score);
  console.log('Feedback:', evaluation.detailed_feedback);
});
```

## Future Enhancements

- [ ] WebSocket support for real-time meeting simulations
- [ ] Streaming responses for large task generations
- [ ] Custom AI personalities for meeting participants
- [ ] Voice synthesis for meeting transcripts
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (French, Wolof)

## License

Private - JobSim Senegal Platform
