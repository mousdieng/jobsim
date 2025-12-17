import OpenAI from 'openai';
import { config } from '../config';
import { sanitizeJSON } from '../utils/helpers';

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    this.model = config.openaiModel;
  }

  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7,
    maxTokens: number = 4096
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return sanitizeJSON(content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  async generateStructuredResponse<T>(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7,
    maxTokens: number = 4096
  ): Promise<T> {
    const response = await this.generateCompletion(systemPrompt, userPrompt, temperature, maxTokens);

    try {
      return JSON.parse(response) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', response);
      throw new Error('Invalid JSON response from AI');
    }
  }
}

export const openaiService = new OpenAIService();
