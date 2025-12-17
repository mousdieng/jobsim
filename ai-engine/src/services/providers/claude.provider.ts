import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIMessage, AICompletionOptions, AICompletionResponse } from '../ai-provider.interface';

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude';
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'claude-3-5-sonnet-20241022') {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey });
    this.defaultModel = defaultModel;
  }

  async complete(prompt: string, options?: AICompletionOptions): Promise<AICompletionResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResponse> {
    try {
      // Separate system messages from user/assistant messages
      const systemMessages = messages.filter(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      // Claude expects user/assistant messages only, system goes in separate field
      const systemPrompt = systemMessages.map(m => m.content).join('\n\n');

      const response = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.max_tokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.top_p,
        system: systemPrompt || undefined,
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return {
        content: content.text,
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        finish_reason: response.stop_reason || undefined,
      };
    } catch (error) {
      console.error('[Claude Provider] Error:', error);
      throw error;
    }
  }

  parseJSON<T = any>(response: string): T {
    try {
      // Claude sometimes wraps JSON in markdown code blocks
      let cleaned = response.trim();

      // Remove markdown code blocks if present
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(cleaned) as T;
    } catch (error) {
      console.error('[Claude Provider] Failed to parse JSON:', response);
      throw new Error('Invalid JSON response from Claude');
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }
}
