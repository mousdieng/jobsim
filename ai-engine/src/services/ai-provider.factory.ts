import { AIProvider } from './ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { MockProvider } from './providers/mock.provider';

export type AIProviderType = 'openai' | 'claude' | 'mock';

export class AIProviderFactory {
  private static instance: AIProvider | null = null;

  /**
   * Get the configured AI provider instance (singleton)
   */
  static getProvider(): AIProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }
    return this.instance;
  }

  /**
   * Reset the provider instance (useful for testing or runtime config changes)
   */
  static resetProvider(): void {
    this.instance = null;
  }

  /**
   * Create a new provider instance based on environment configuration
   */
  private static createProvider(): AIProvider {
    const providerType = (process.env.AI_PROVIDER || 'openai').toLowerCase() as AIProviderType;

    console.log(`[AI Provider Factory] Initializing ${providerType.toUpperCase()} provider`);

    switch (providerType) {
      case 'openai':
        return this.createOpenAIProvider();

      case 'claude':
        return this.createClaudeProvider();

      case 'mock':
        return this.createMockProvider();

      default:
        throw new Error(`Unknown AI provider: ${providerType}. Supported: openai, claude, mock`);
    }
  }

  private static createOpenAIProvider(): AIProvider {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required for OpenAI provider');
    }

    return new OpenAIProvider(apiKey, model);
  }

  private static createClaudeProvider(): AIProvider {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude provider');
    }

    return new ClaudeProvider(apiKey, model);
  }

  private static createMockProvider(): AIProvider {
    console.log(`[AI Provider Factory] ⚠️  Using MOCK provider - No API calls will be made`);
    console.log(`[AI Provider Factory] This is for testing only and returns realistic sample data`);
    return new MockProvider();
  }

  /**
   * Create a specific provider instance (for testing or multi-provider scenarios)
   */
  static createSpecificProvider(type: AIProviderType, apiKey: string, model?: string): AIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(apiKey, model || 'gpt-4-turbo-preview');

      case 'claude':
        return new ClaudeProvider(apiKey, model || 'claude-3-5-sonnet-20241022');

      case 'mock':
        return new MockProvider();

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}

/**
 * Convenience function to get the current AI provider
 */
export function getAIProvider(): AIProvider {
  return AIProviderFactory.getProvider();
}
