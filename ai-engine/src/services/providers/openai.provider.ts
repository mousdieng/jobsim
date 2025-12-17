import OpenAI from 'openai';
import { AIProvider, AIMessage, AICompletionOptions, AICompletionResponse } from '../ai-provider.interface';
import { sanitizeJSON } from '../../utils/helpers';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'gpt-4-turbo-preview') {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  async complete(prompt: string, options?: AICompletionOptions): Promise<AICompletionResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 4096,
        top_p: options?.top_p,
        frequency_penalty: options?.frequency_penalty,
        presence_penalty: options?.presence_penalty,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return {
        content: sanitizeJSON(content),
        usage: response.usage ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        } : undefined,
        model: response.model,
        finish_reason: response.choices[0]?.finish_reason || undefined,
      };
    } catch (error) {
      console.error('[OpenAI Provider] Error:', error);
      throw error;
    }
  }

  parseJSON<T = any>(response: string): T {
    try {
      const sanitized = sanitizeJSON(response);
      return JSON.parse(sanitized) as T;
    } catch (error) {
      console.error('[OpenAI Provider] Failed to parse JSON:', response);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }
}
