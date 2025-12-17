# Multi-Provider AI Migration Guide

## What Changed?

Your AI engine now supports **both OpenAI and Claude** with zero code changes required to switch between them.

## Summary

- ✅ **ai-engine/** - Your production AI service (keep this)
- ❌ **ai-backend/** - Temporary test service (can be deleted)
- 🎯 **One environment variable** controls which AI provider to use

---

## Quick Start

### 1. Choose Your AI Provider

Edit `ai-engine/.env`:

```bash
# Option 1: Use OpenAI (default)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Option 2: Use Claude
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 2. Install Dependencies (Already Done)

```bash
cd ai-engine
npm install  # Installs @anthropic-ai/sdk automatically
```

### 3. Start the Server

```bash
cd ai-engine
npm run dev
```

You should see:
```
✅ Configuration validated. Using OPENAI as AI provider
```
or
```
✅ Configuration validated. Using CLAUDE as AI provider
```

---

## What About ai-backend/?

The `ai-backend/` directory was created as a quick test when you asked to use Claude API. Now that the production `ai-engine/` supports both providers, you can:

### Option 1: Delete ai-backend (Recommended)

```bash
rm -rf ai-backend/
```

### Option 2: Keep for Reference

If you want to keep it for reference:
```bash
mv ai-backend/ archive/ai-backend-deprecated/
```

---

## Architecture Overview

### Before (Single Provider)
```
ai-engine/
├── src/services/openai.service.ts  ← Direct OpenAI dependency
└── All services call openaiService directly
```

### After (Multi-Provider)
```
ai-engine/
├── src/services/
│   ├── ai-provider.interface.ts         ← Common interface
│   ├── ai-provider.factory.ts           ← Provider factory
│   ├── providers/
│   │   ├── openai.provider.ts           ← OpenAI adapter
│   │   └── claude.provider.ts           ← Claude adapter
│   ├── task-generator.service.ts        ← Uses getAIProvider()
│   ├── meeting-simulator.service.ts     ← Uses getAIProvider()
│   └── scoring-evaluator.service.ts     ← Uses getAIProvider()
```

---

## Testing Both Providers

### Test with OpenAI

1. Set `AI_PROVIDER=openai` in `.env`
2. Restart server: `npm run dev`
3. Test endpoint:
```bash
curl -X POST http://localhost:3001/api/tasks/generate \
  -H "Content-Type: application/json" \
  -d '{
    "job_field": "software_engineering",
    "difficulty_level": "intermediate",
    "count": 1
  }'
```

### Test with Claude

1. Set `AI_PROVIDER=claude` in `.env`
2. Restart server: `npm run dev`
3. Run the same curl command above

Both should work identically!

---

## Environment Variables Reference

### Required (Always)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Required (Provider-Specific)

**When using OpenAI:**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4-turbo-preview  # optional, has default
```

**When using Claude:**
```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # optional, has default
```

---

## Cost Savings Example

Let's say you generate 1000 tasks per month:

**With OpenAI GPT-4:**
- Cost: 1000 tasks × $0.20 = **$200/month**

**With Claude 3.5 Sonnet:**
- Cost: 1000 tasks × $0.08 = **$80/month**
- **Savings: $120/month (60% reduction)**

**With Claude 3 Haiku:**
- Cost: 1000 tasks × $0.01 = **$10/month**
- **Savings: $190/month (95% reduction)**

---

## Troubleshooting

### Error: "OPENAI_API_KEY is required when AI_PROVIDER=openai"
- You set `AI_PROVIDER=openai` but didn't provide the OpenAI API key
- **Fix**: Add `OPENAI_API_KEY=sk-...` to `.env`

### Error: "ANTHROPIC_API_KEY is required when AI_PROVIDER=claude"
- You set `AI_PROVIDER=claude` but didn't provide the Claude API key
- **Fix**: Add `ANTHROPIC_API_KEY=sk-ant-...` to `.env`

### Error: "Unknown AI provider: xyz"
- You set `AI_PROVIDER` to an unsupported value
- **Fix**: Use either `openai` or `claude`

### Tasks generated but format looks wrong
- Different providers may structure JSON slightly differently
- The parseJSON methods handle this automatically
- If issues persist, check the provider adapter code

---

## Which Provider Should You Use?

### Start with Claude 3.5 Sonnet (Recommended)

**Reasons:**
- ✅ 60% cheaper than GPT-4
- ✅ Comparable quality
- ✅ 200K token context window
- ✅ Faster response times
- ✅ Better at following JSON formatting

### Use OpenAI GPT-4 if:
- You're already paying for OpenAI
- You need absolute best quality
- You have specific GPT-4 requirements

### Use Claude 3 Haiku if:
- You're in development/testing
- You need high volume generation
- Cost is the primary concern

---

## Next Steps

1. ✅ Choose your provider and update `.env`
2. ✅ Test both providers to compare quality
3. ✅ Monitor costs in provider dashboards
4. ✅ Delete or archive `ai-backend/`
5. ⏳ Update your frontend if needed (should work unchanged)
6. ⏳ Deploy with your chosen provider

---

## Support

- **OpenAI Dashboard**: https://platform.openai.com/usage
- **Claude Dashboard**: https://console.anthropic.com/
- **Docs**: See `ai-engine/README.md`

**Questions?** The code is fully documented. Check:
- `ai-engine/src/services/ai-provider.interface.ts` - Common interface
- `ai-engine/src/services/providers/` - Provider implementations
- `ai-engine/.env.example` - Configuration examples
