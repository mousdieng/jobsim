#!/usr/bin/env ts-node

/**
 * Task Database Seeding Script
 *
 * This script generates and saves AI-powered tasks to your Supabase database.
 *
 * Usage:
 *   npm run seed                          # Generate 1 task per field (mock mode)
 *   npm run seed -- --count 5             # Generate 5 tasks per field
 *   npm run seed -- --field marketing     # Generate tasks for specific field only
 *   npm run seed -- --difficulty advanced # Generate advanced tasks only
 *   npm run seed -- --provider claude     # Use specific AI provider
 */

import { taskGeneratorService } from '../src/services/task-generator.service';
import { JobField, DifficultyLevel } from '../src/types';
import { validateConfig } from '../src/config';

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue?: string): string | undefined => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const COUNT_PER_FIELD = parseInt(getArg('count', '1') || '1', 10);
const SPECIFIC_FIELD = getArg('field') as JobField | undefined;
const SPECIFIC_DIFFICULTY = getArg('difficulty', 'intermediate') as DifficultyLevel;
const PROVIDER_OVERRIDE = getArg('provider');

// Override provider if specified
if (PROVIDER_OVERRIDE) {
  process.env.AI_PROVIDER = PROVIDER_OVERRIDE;
}

// Job fields to seed
const ALL_FIELDS: JobField[] = [
  'software_engineering',
  'marketing',
  'sales',
  'accounting',
  'human_resources',
  'project_management',
  'data_science',
  'graphic_design',
  'customer_service',
  'finance',
  'legal',
  'healthcare',
  'education',
  'operations',
  'consulting',
];

const FIELDS_TO_SEED = SPECIFIC_FIELD ? [SPECIFIC_FIELD] : ALL_FIELDS;

async function seedTasks() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║       Task Database Seeding Script         ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Validate configuration
    console.log('⚙️  Validating configuration...');
    validateConfig();
    console.log('');

    console.log(`📊 Seeding Plan:`);
    console.log(`   - Fields: ${SPECIFIC_FIELD || `All (${FIELDS_TO_SEED.length})`}`);
    console.log(`   - Tasks per field: ${COUNT_PER_FIELD}`);
    console.log(`   - Difficulty: ${SPECIFIC_DIFFICULTY}`);
    console.log(`   - Total tasks to generate: ${FIELDS_TO_SEED.length * COUNT_PER_FIELD}`);
    console.log('');

    const results: { field: JobField; taskIds: string[]; error?: string }[] = [];
    let totalGenerated = 0;
    let totalErrors = 0;

    for (let i = 0; i < FIELDS_TO_SEED.length; i++) {
      const field = FIELDS_TO_SEED[i];
      const progress = `[${i + 1}/${FIELDS_TO_SEED.length}]`;

      try {
        console.log(`${progress} 🔄 Generating ${COUNT_PER_FIELD} task(s) for ${field}...`);

        const taskIds = await taskGeneratorService.generateAndSaveTasks({
          job_field: field,
          difficulty_level: SPECIFIC_DIFFICULTY,
          count: COUNT_PER_FIELD,
        });

        console.log(`${progress} ✅ Generated ${taskIds.length} task(s) for ${field}`);
        console.log(`${progress}    Task IDs: ${taskIds.slice(0, 3).join(', ')}${taskIds.length > 3 ? '...' : ''}`);

        results.push({ field, taskIds });
        totalGenerated += taskIds.length;

        // Add delay to avoid rate limiting (only for real AI providers)
        if (process.env.AI_PROVIDER !== 'mock' && i < FIELDS_TO_SEED.length - 1) {
          const delay = 2000;
          console.log(`${progress} ⏳ Waiting ${delay / 1000}s to avoid rate limits...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        console.log('');
      } catch (error) {
        console.error(`${progress} ❌ Error generating tasks for ${field}:`, error);
        results.push({
          field,
          taskIds: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        totalErrors++;
        console.log('');
      }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║              Seeding Complete              ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log(`📈 Summary:`);
    console.log(`   ✅ Successfully generated: ${totalGenerated} tasks`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log(`   📊 Success rate: ${((totalGenerated / (FIELDS_TO_SEED.length * COUNT_PER_FIELD)) * 100).toFixed(1)}%`);
    console.log('');

    console.log(`📋 Breakdown by Field:`);
    results.forEach(({ field, taskIds, error }) => {
      if (error) {
        console.log(`   ❌ ${field}: ERROR - ${error}`);
      } else {
        console.log(`   ✅ ${field}: ${taskIds.length} task(s)`);
      }
    });
    console.log('');

    if (totalGenerated > 0) {
      console.log(`🎉 Success! ${totalGenerated} tasks have been added to your database.`);
      console.log(`💡 You can now view them in your Angular application.`);
    } else {
      console.log(`⚠️  No tasks were generated. Check the errors above.`);
    }

    console.log('');
    process.exit(totalErrors > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  }
}

// Run the seeding
seedTasks();
