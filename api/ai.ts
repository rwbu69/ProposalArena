declare const process: { env: Record<string, string | undefined> };

interface RequestLike {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | undefined>;
}

interface ResponseLike {
  status: (code: number) => ResponseLike;
  json: (value: unknown) => void;
  setHeader?: (name: string, value: string) => ResponseLike;
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
  const origin = req.headers?.['origin'] || req.headers?.['referer'] || '*';
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const body = req.body as AIRequestBody | undefined;
  if (
    !body ||
    (body.language !== 'en' && body.language !== 'id') ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.some(message =>
      !message ||
      !['system', 'user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string'
    )
  ) {
    res.status(400).json({ error: 'Invalid AI request body.' });
    return;
  }

  // Google Gemini OpenAI-compatible chat completions endpoint
  const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  
  // Model lock: Default to Gemini 3.5 Flash-Lite for massive free RPD and speed
  const targetModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  const maxTokens = Math.min(2048, Math.max(128, body.max_tokens ?? 1024));
  const temperature = typeof body.temperature === 'number'
    ? Math.min(1.0, Math.max(0.0, body.temperature))
    : 0.7;

  let lastErrorMsg = 'Upstream Gemini error';
  let upstreamStatus = 500;
  let payload: any = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 800 * attempt));
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const upstream = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${geminiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          messages: body.messages,
          temperature,
          max_tokens: maxTokens,
          ...(body.response_format ? { response_format: body.response_format } : {})
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      payload = await upstream.json().catch(() => null);
      upstreamStatus = upstream.status;

      if (upstream.ok) {
        lastErrorMsg = '';
        break;
      }

      lastErrorMsg = (payload as { error?: { message?: string } } | null)?.error?.message || `HTTP ${upstream.status}`;

      // Only retry on transient overloaded (503) or rate limit (429)
      if (upstream.status !== 503 && upstream.status !== 429) {
        break;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        res.status(504).json({ error: 'Gemini request timed out.' });
        return;
      }
      lastErrorMsg = err?.message || 'Unable to reach Google Gemini API.';
    }
  }

  if (lastErrorMsg) {
    res.status(upstreamStatus).json({ error: `Gemini API rejected the request: ${lastErrorMsg}` });
    return;
  }

  const text = (payload as { choices?: Array<{ message?: { content?: unknown } }> } | null)
    ?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || text.trim().length === 0) {
    res.status(502).json({ error: 'Gemini returned an invalid or empty response.' });
    return;
  }

  res.status(200).json(payload);
}
