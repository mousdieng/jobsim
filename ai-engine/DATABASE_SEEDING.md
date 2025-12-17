# How to Populate Your Database with Tasks

This guide shows you how to generate AI-powered tasks and save them to your Supabase database.

## Quick Start (FREE with Mock Provider)

### Option 1: Using the Quick Seed Script (Easiest)

```bash
# 1. Make sure the server is running
cd ai-engine
npm run dev

# 2. In another terminal, run the quick seed
npm run seed:quick
```

This generates **3 sample tasks** (1 per field) in seconds, completely FREE!

### Option 2: Using API Endpoints Directly

```bash
# Generate and save 1 task
curl -X POST http://localhost:3001/api/tasks/generate-and-save \
  -H "Content-Type: application/json" \
  -d '{
    "job_field": "software_engineering",
    "difficulty_level": "intermediate",
    "count": 1
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task_ids": ["uuid-1", "uuid-2", "uuid-3"]
  },
  "message": "Generated and saved 1 task(s)"
}
```

---

## Seeding Commands

### Basic Seeding

```bash
# Generate 1 task per field (15 total) - FREE with mock
npm run seed

# Generate 3 tasks per field (45 total)
npm run seed:all

# Generate tasks for specific field only
npm run seed:marketing

# Custom options
npm run seed -- --count 5 --difficulty advanced
npm run seed -- --field data_science --count 10
```

### Seeding Options

| Option | Description | Example |
|--------|-------------|---------|
| `--count N` | Tasks per field | `--count 5` |
| `--field FIELD` | Specific field only | `--field marketing` |
| `--difficulty LEVEL` | Task difficulty | `--difficulty expert` |
| `--provider PROVIDER` | AI provider | `--provider claude` |

---

## Step-by-Step Guide

### Step 1: Set Up Your Environment

```bash
cd ai-engine

# For FREE testing
echo "AI_PROVIDER=mock" > .env

# For production with real AI
echo "AI_PROVIDER=claude" > .env
echo "ANTHROPIC_API_KEY=your-key-here" >> .env
echo "SUPABASE_URL=your-supabase-url" >> .env
echo "SUPABASE_SERVICE_KEY=your-service-key" >> .env
```

### Step 2: Start the Server

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════╗
║       JobSim AI Workflow Engine            ║
║         Running on port 3001               ║
╚════════════════════════════════════════════╝
```

### Step 3: Generate Tasks

**Option A: Quick Seed (Shell Script)**
```bash
npm run seed:quick
```

**Option B: Full Seed (TypeScript)**
```bash
# Generate 1 task per field
npm run seed

# Or with custom options
npm run seed -- --count 3 --difficulty intermediate
```

### Step 4: Verify in Database

```bash
# Check your Supabase dashboard
# Navigate to: Table Editor → tasks

# Or query via API
curl http://localhost:3001/api/tasks?limit=10
```

---

## Available Job Fields

You can seed tasks for these fields:

- `software_engineering` - Software development tasks
- `marketing` - Marketing campaigns and strategies
- `sales` - Sales activities and pitches
- `accounting` - Financial and accounting tasks
- `human_resources` - HR and recruitment tasks
- `project_management` - PM and coordination tasks
- `data_science` - Data analysis and ML tasks
- `graphic_design` - Design and creative tasks
- `customer_service` - Support and service tasks
- `finance` - Financial analysis and modeling
- `legal` - Legal research and documentation
- `healthcare` - Healthcare and medical tasks
- `education` - Teaching and curriculum tasks
- `operations` - Operations and logistics
- `consulting` - Consulting and advisory tasks

---

## Difficulty Levels

- `beginner` - 2-4 hours, basic skills
- `intermediate` - 4-8 hours, moderate complexity
- `advanced` - 1-2 days, advanced skills
- `expert` - 2-4 days, expert-level challenges

---

## Seeding Strategies

### Strategy 1: Start Small (Recommended)

```bash
# Generate 1 task per field to test (FREE)
AI_PROVIDER=mock npm run seed

# Verify they look good in your app

# Then generate more
AI_PROVIDER=mock npm run seed -- --count 5
```

### Strategy 2: Field-Specific

```bash
# Focus on one field first
npm run seed -- --field software_engineering --count 10

# Then expand to others
npm run seed -- --field marketing --count 10
npm run seed -- --field data_science --count 10
```

### Strategy 3: Difficulty Tiers

```bash
# Start with beginner tasks
npm run seed -- --difficulty beginner --count 3

# Add intermediate
npm run seed -- --difficulty intermediate --count 3

# Add advanced
npm run seed -- --difficulty advanced --count 2
```

### Strategy 4: Balanced Catalog

```bash
# Use the built-in balancing endpoint
curl -X POST http://localhost:3001/api/tasks/balance-catalog
```

This automatically fills gaps to maintain 10 tasks per field.

---

## API Endpoints Reference

### Generate Tasks (Preview Only - Not Saved)

```bash
POST /api/tasks/generate

Body:
{
  "job_field": "software_engineering",
  "difficulty_level": "intermediate",
  "count": 2,
  "specific_skills": ["React", "TypeScript"],  // optional
  "context": "Focus on frontend"              // optional
}

Response:
{
  "success": true,
  "data": [
    {
      "title": "Build a Task Management App",
      "description": "...",
      "instructions": "...",
      "job_field": "software_engineering",
      "difficulty_level": "intermediate",
      "estimated_duration": "4-8 hours",
      "skills_required": ["React", "TypeScript", "..."],
      "deliverables": [...],
      "resources": [...],
      "tags": [...]
    }
  ],
  "message": "Generated 2 task(s) successfully"
}
```

### Generate and Save Tasks

```bash
POST /api/tasks/generate-and-save

Body:
{
  "job_field": "marketing",
  "difficulty_level": "intermediate",
  "count": 3
}

Response:
{
  "success": true,
  "data": {
    "task_ids": ["uuid-1", "uuid-2", "uuid-3"]
  },
  "message": "Generated and saved 3 task(s)"
}
```

### Balance Task Catalog

```bash
POST /api/tasks/balance-catalog

Body: (empty)

Response:
{
  "success": true,
  "data": [
    { "field": "software_engineering", "generated": 2 },
    { "field": "marketing", "generated": 5 },
    ...
  ],
  "message": "Catalog balanced successfully"
}
```

---

## Cost Considerations

### FREE Testing (Mock Provider)

```bash
AI_PROVIDER=mock npm run seed:all
```

- **Cost:** $0.00
- **Speed:** Instant
- **Tasks:** 45 realistic test tasks
- **Perfect for:** Development, testing, demos

### Production (Real AI)

**With Claude 3.5 Sonnet:**
```bash
AI_PROVIDER=claude npm run seed:all
```

- **Cost:** ~$3.60 (45 tasks × $0.08)
- **Speed:** ~2-5 seconds per task
- **Quality:** High-quality, unique tasks

**With Claude 3 Haiku (Budget):**
```bash
AI_PROVIDER=claude
ANTHROPIC_MODEL=claude-3-haiku-20240307
npm run seed:all
```

- **Cost:** ~$0.45 (45 tasks × $0.01)
- **Speed:** ~1-2 seconds per task
- **Quality:** Good quality, very cost-effective

---

## Troubleshooting

### Error: "Server is not running"

**Solution:**
```bash
# Terminal 1: Start server
cd ai-engine
npm run dev

# Terminal 2: Run seed
npm run seed:quick
```

### Error: "SUPABASE_URL is required"

**Solution:** You're using a real AI provider but haven't configured Supabase.

Option 1: Use mock provider (no Supabase needed)
```bash
AI_PROVIDER=mock npm run seed
```

Option 2: Configure Supabase
```bash
echo "SUPABASE_URL=https://your-project.supabase.co" >> .env
echo "SUPABASE_SERVICE_KEY=your-key" >> .env
```

### Error: "OPENAI_API_KEY is required"

**Solution:** You set `AI_PROVIDER=openai` but didn't provide the key.

Option 1: Use mock provider
```bash
AI_PROVIDER=mock npm run seed
```

Option 2: Add API key
```bash
echo "OPENAI_API_KEY=sk-your-key" >> .env
```

### Tasks Generated But Not Showing in App

**Possible causes:**

1. **Frontend not connected to Supabase**
   - Check `src/environments/environment.ts`
   - Verify Supabase URL and keys

2. **RLS Policies blocking access**
   - Check Supabase policies on `tasks` table
   - Ensure `SELECT` is allowed for authenticated users

3. **Wrong Supabase project**
   - Verify you're using the same Supabase project in both frontend and backend

---

## Recommended Workflow

### Phase 1: Development (FREE)

```bash
# 1. Set to mock provider
AI_PROVIDER=mock

# 2. Generate test tasks
npm run seed:all

# 3. Test your frontend
# 4. Verify everything works
```

**Cost: $0.00**

### Phase 2: Quality Testing

```bash
# 1. Switch to Claude
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your-key

# 2. Generate small sample
npm run seed -- --count 1

# 3. Review quality
# 4. Adjust prompts if needed
```

**Cost: ~$1.20 (15 tasks × $0.08)**

### Phase 3: Production Seeding

```bash
# Generate full catalog
npm run seed:all

# Or use balancing
curl -X POST http://localhost:3001/api/tasks/balance-catalog
```

**Cost: ~$3.60 (45 tasks × $0.08 with Claude)**

---

## Monitoring Generated Tasks

### Check Generation Status

```bash
# View recent tasks
curl http://localhost:3001/api/tasks?limit=20

# Count tasks by field
SELECT job_field, COUNT(*) as count
FROM tasks
GROUP BY job_field;
```

### Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Click "Table Editor"
4. Select "tasks" table
5. View all generated tasks

---

## Next Steps

1. ✅ Start with mock provider (FREE)
2. ✅ Generate sample tasks: `npm run seed`
3. ✅ Verify they appear in your Angular app
4. ✅ Test with different fields and difficulties
5. ⏳ Switch to real AI when ready
6. ⏳ Generate production catalog

**Happy Seeding! 🌱**
