declare const process: { env: Record<string, string | undefined> };

interface RequestLike {
  method?: string;
  body?: unknown;
}

interface ResponseLike {
  status: (code: number) => ResponseLike;
  json: (value: unknown) => void;
}

interface AIRequestBody {
  provider?: string;
  model?: string;
  language?: 'en' | 'id';
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured.' });
    return;
  }

  const body = req.body as AIRequestBody | undefined;
  if (
    !body ||
    body.provider !== 'openrouter' ||
    !body.model ||
    !body.language ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.some(message =>
      !message ||
      !['system', 'user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string'
    )
  ) {
    res.status(400).json({ error: 'Invalid AI request.' });
    return;
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || body.model,
        messages: body.messages,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        ...(body.response_format ? { response_format: body.response_format } : {})
      })
    });

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'The AI provider rejected the request.' });
      return;
    }

    const text = (payload as { choices?: Array<{ message?: { content?: unknown } }> } | null)
      ?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || text.trim().length === 0) {
      res.status(502).json({ error: 'The AI provider returned an invalid response.' });
      return;
    }

    res.status(200).json(payload);
  } catch {
    res.status(502).json({ error: 'Unable to reach the AI provider.' });
  }
}
