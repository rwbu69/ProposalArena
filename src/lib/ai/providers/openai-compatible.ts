import type { AIProvider, AIRequest, AIResponse } from '../../../types/ai';

interface OpenAIConfig {
  baseUrl: string;
  id: string;
  displayName: string;
  apiKey: string;
  model: string;
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string;
  readonly displayName: string;
  readonly defaultModel: string;

  constructor(private readonly config: OpenAIConfig) {
    this.id = config.id;
    this.displayName = config.displayName;
    this.defaultModel = config.model;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const models = request.model.split(',').map(m => m.trim()).filter(Boolean);
    if (models.length === 0) {
      throw new Error("No models specified.");
    }

    let lastError: Error | null = null;

    for (const currentModel of models) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

        const response = await fetch(this.config.baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: currentModel,
            messages: request.messages,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
            ...(request.responseFormat === 'json'
              ? { response_format: { type: 'json_object' } }
              : {})
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`${this.displayName} request failed (${response.status}): ${detail.slice(0, 500)}`);
        }

        const data = (await response.json()) as {
          model?: string;
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };

        const text = data.choices?.[0]?.message?.content;
        if (typeof text !== 'string') {
          throw new Error(`${this.displayName} returned no assistant text.`);
        }

        return {
          text,
          model: data.model ?? currentModel,
          usage: {
            inputTokens: data.usage?.prompt_tokens,
            outputTokens: data.usage?.completion_tokens
          }
        };
      } catch (e: any) {
        console.warn(`[AIProvider] Request to ${currentModel} failed:`, e.message);
        lastError = e;
      }
    }

    throw new Error(`All models failed. Last error: ${lastError?.message}`);
  }
}
