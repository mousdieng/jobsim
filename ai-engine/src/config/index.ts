import dotenv from 'dotenv';
import { AIEngineConfig } from '../types';

dotenv.config();

export const config: AIEngineConfig = {
  // AI Provider Configuration
  aiProvider: (process.env.AI_PROVIDER || 'openai') as 'openai' | 'claude' | 'mock',

  // OpenAI Configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',

  // Anthropic (Claude) Configuration
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',

  // Supabase Configuration
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',

  // Task Generation Settings
  maxTasksPerGeneration: parseInt(process.env.MAX_TASKS_PER_GENERATION || '5', 10),
  maxMeetingsPerTask: parseInt(process.env.MAX_MEETINGS_PER_TASK || '3', 10),
  defaultTaskDeadlineDays: parseInt(process.env.DEFAULT_TASK_DEADLINE_DAYS || '7', 10),
};

export const validateConfig = (): void => {
  // Always required (except when using mock provider)
  const aiProvider = config.aiProvider;

  if (aiProvider !== 'mock') {
    const alwaysRequired = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
    ];

    const missingVars = alwaysRequired.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  // Validate AI provider specific requirements
  if (aiProvider === 'openai' && !config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
  }

  if (aiProvider === 'claude' && !config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=claude');
  }

  if (aiProvider === 'mock') {
    console.log(`⚠️  MOCK MODE ENABLED - No API calls will be made`);
    console.log(`⚠️  This is for testing only. Returns realistic sample data.`);
  }

  console.log(`✅ Configuration validated. Using ${aiProvider.toUpperCase()} as AI provider`);
};
