import type { AIProvider, AIProviderConfig } from '../../types/ai';
import { OpenAICompatibleProvider } from './providers/openai-compatible';

export function createAIProvider(config: AIProviderConfig): AIProvider {
  const endpoint = config.proxyUrl;
  if (endpoint) {
    if (endpoint.startsWith('/')) {
      if (!endpoint.startsWith('/api/')) {
        throw new Error('AI provider proxy URL must use an /api/ path.');
      }
    } else {
      let parsed: URL;
      try {
        parsed = new URL(endpoint);
      } catch {
        throw new Error('AI provider endpoint must be a valid URL.');
      }
      if (parsed.protocol !== 'https:') {
        throw new Error('AI provider endpoint must use HTTPS.');
      }
    }
  }

  switch (config.providerId) {
    case 'openrouter':
      return new OpenAICompatibleProvider({
        id: 'openrouter',
        displayName: 'OpenRouter',
        baseUrl: config.proxyUrl || 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: config.apiKey,
        model: config.model
      });
    case 'openai':
      return new OpenAICompatibleProvider({
        id: 'openai',
        displayName: 'OpenAI',
        baseUrl: config.proxyUrl || 'https://api.openai.com/v1/chat/completions',
        apiKey: config.apiKey,
        model: config.model
      });
    case 'gemini':
      return new OpenAICompatibleProvider({
        id: 'gemini',
        displayName: 'Google Gemini',
        baseUrl: config.proxyUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        apiKey: config.apiKey,
        model: config.model || 'gemini-3.5-flash-lite'
      });
    default:
      throw new Error(`Unsupported AI provider: ${config.providerId}`);
  }
}
