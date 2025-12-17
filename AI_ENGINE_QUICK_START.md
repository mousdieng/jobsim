# AI Engine Quick Start - Generate Tasks in 5 Minutes!

Get your JobSim platform populated with AI-generated tasks in 5 minutes, **completely FREE!**

## Step 1: Start the AI Engine (30 seconds)

```bash
cd ai-engine

# Use mock provider for FREE testing
cp .env.example .env

# Start the server
npm run dev
```

You should see:
```
⚠️  MOCK MODE ENABLED - No API calls will be made
✅ Configuration validated. Using MOCK as AI provider
╔════════════════════════════════════════════╗
║       JobSim AI Workflow Engine            ║
║         Running on port 3001               ║
╚════════════════════════════════════════════╝
```

✅ **Server running on http://localhost:3001**

---

## Step 2: Generate Tasks (30 seconds)

Open a **new terminal**:

```bash
cd ai-engine

# Quick seed: Generates 3 sample tasks FREE
npm run seed:quick
```

You should see:
```
✅ Successfully generated: 3/3 tasks
🎉 Tasks are now in your database!
```

**Or generate more tasks:**

```bash
# Generate 1 task per field (15 total) - FREE
npm run seed

# Generate 3 tasks per field (45 total) - FREE
npm run seed:all
```

**Total Cost: $0.00** 🎉

---

## Step 3: Verify in Your Database

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Table Editor** → **tasks**
4. You should see your generated tasks!

---

## Step 4: View in Your Angular App

```bash
cd ../frontend  # or wherever your Angular app is

# Start the frontend
npm start
```

Visit **http://localhost:4200** and navigate to:
- Browse Tasks
- Dashboard
- Tasks list

You should see your AI-generated tasks! 🎉

---

## What Just Happened?

1. ✅ AI Engine started in **mock mode** (FREE)
2. ✅ Generated realistic **sample tasks**
3. ✅ Saved to **Supabase database**
4. ✅ Available in **Angular frontend**

**Total Cost: $0.00**

---

## Generate More Tasks (All FREE)

```bash
cd ai-engine

# Specific field
npm run seed -- --field marketing --count 5

# Specific difficulty
npm run seed -- --difficulty advanced --count 3

# Specific field + difficulty
npm run seed -- --field data_science --difficulty expert --count 2
```

### Available Options

**Job Fields:**
- `software_engineering`, `marketing`, `sales`, `accounting`
- `human_resources`, `project_management`, `data_science`
- `graphic_design`, `customer_service`, `finance`
- `legal`, `healthcare`, `education`, `operations`, `consulting`

**Difficulty Levels:**
- `beginner` (2-4 hours)
- `intermediate` (4-8 hours)
- `advanced` (1-2 days)
- `expert` (2-4 days)

---

## Switch to Real AI (When Ready)

Edit `ai-engine/.env`:

### Option 1: Claude (Recommended - 60% cheaper)
```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Option 2: OpenAI
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

Restart server:
```bash
npm run dev
```

Generate with real AI:
```bash
npm run seed -- --count 1  # Cost: ~$0.08 per task with Claude
```

---

## Test Other Features (FREE)

### Generate Meetings
```bash
curl -X POST http://localhost:3001/api/meetings/generate \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "test-123",
    "meeting_type": "kickoff",
    "task_title": "Build API",
    "task_description": "REST API project",
    "user_name": "Test User",
    "user_role": "Developer"
  }'
```

### Evaluate Submissions
```bash
curl -X POST http://localhost:3001/api/evaluations/quick-score \
  -H "Content-Type: application/json" \
  -d '{
    "content": "I completed all requirements and tested thoroughly...",
    "criteria": ["Quality", "Completeness"]
  }'
```

---

## Troubleshooting

### "Server is not running"

```bash
# Terminal 1: Start server FIRST
cd ai-engine
npm run dev

# Terminal 2: Then seed
npm run seed:quick
```

### "SUPABASE_URL is required"

You're using real AI but haven't configured Supabase.

**Solution 1 - Stay FREE:**
```bash
AI_PROVIDER=mock npm run seed
```

**Solution 2 - Configure Supabase:**
```bash
echo "SUPABASE_URL=https://your-project.supabase.co" >> .env
echo "SUPABASE_SERVICE_KEY=your-service-key" >> .env
```

### Tasks not showing in frontend

1. **Check Supabase connection** in `src/environments/environment.ts`
2. **Check RLS policies** in Supabase (tasks table should allow SELECT)
3. **Verify same Supabase project** in both frontend and backend

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start AI Engine |
| `npm run seed:quick` | Generate 3 tasks (fast) |
| `npm run seed` | Generate 15 tasks (1 per field) |
| `npm run seed:all` | Generate 45 tasks (3 per field) |
| `npm run seed -- --field X` | Generate for specific field |
| `curl http://localhost:3001/health` | Check if server is running |

---

## Documentation

- **[DATABASE_SEEDING.md](./ai-engine/DATABASE_SEEDING.md)** - Complete seeding guide
- **[TESTING.md](./ai-engine/TESTING.md)** - Free testing guide
- **[MULTI_PROVIDER_MIGRATION.md](./MULTI_PROVIDER_MIGRATION.md)** - AI providers
- **[ai-engine/README.md](./ai-engine/README.md)** - Full documentation

---

## Success Checklist

- [ ] AI Engine running on port 3001
- [ ] At least 3 tasks generated
- [ ] Tasks visible in Supabase
- [ ] Angular app running on port 4200
- [ ] Tasks displaying in app

---

**You're ready! Start generating tasks without spending a penny! 🚀**
