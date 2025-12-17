/**
 * Base interface for AI providers
 * Supports OpenAI, Claude, and other LLM providers
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface AICompletionResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  finish_reason?: string;
}

export interface AIProvider {
  /**
   * Name of the provider (e.g., 'openai', 'claude')
   */
  readonly name: string;

  /**
   * Generate a completion from a single prompt
   */
  complete(prompt: string, options?: AICompletionOptions): Promise<AICompletionResponse>;

  /**
   * Generate a completion from a conversation with messages
   */
  chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResponse>;

  /**
   * Parse JSON response from AI (with error handling)
   */
  parseJSON<T = any>(response: string): T;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;
}
