# AI Provider Architecture

## Stable application contract

The rest of the application should depend on normalized types:

```ts
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
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
  id: string;
  displayName: string;
  generate(request: AIRequest): Promise<AIResponse>;
}
```

## Provider factory

`createProvider(config)` chooses the adapter based on the user's selected provider.

## Provider-specific logic

Only the adapter should know:
- endpoint URL
- authorization header format
- request body schema
- response parsing
- provider-specific error handling

## Adding a provider

1. Implement `AIProvider`.
2. Normalize its response to `AIResponse`.
3. Add it to the registry/factory.
4. Add fixtures for success and failure responses.
5. Add UI metadata for supported models if necessary.
6. Update this document.
