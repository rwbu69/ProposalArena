export type AIMessageRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface AIResponse {
  text: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface AIProvider {
  readonly id: string;
  readonly displayName: string;
  readonly defaultModel: string;
  generate(request: AIRequest): Promise<AIResponse>;
}

export interface AIProviderConfig {
  providerId: string;
  apiKey: string;
  model: string;
  proxyUrl?: string;
}
