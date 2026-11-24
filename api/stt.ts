declare const process: { env: Record<string, string | undefined> };
declare const Buffer: {
  from: (str: string, encoding: string) => Uint8Array;
};

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

interface STTRequestBody {
  audio?: string; // base64-encoded audio
  mimeType?: string; // e.g. "audio/webm", "audio/wav"
  language?: 'en' | 'id';
  prompt?: string;
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

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    return;
  }

  const body = req.body as STTRequestBody | undefined;
  if (!body || typeof body.audio !== 'string' || !body.audio.trim()) {
    res.status(400).json({ error: 'Audio data is required (base64 string).' });
    return;
  }

  try {
    const audioBuffer = Buffer.from(body.audio, 'base64');
    if (audioBuffer.length === 0) {
      res.status(400).json({ error: 'Audio buffer is empty.' });
      return;
    }

    const mimeType = body.mimeType || 'audio/webm';
    const fileExt = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    const audioFile = new File([audioBuffer as unknown as BlobPart], `speech.${fileExt}`, { type: mimeType });

    const groqFormData = new FormData();
    groqFormData.append('file', audioFile);
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('language', body.language || 'id');
    groqFormData.append(
      'prompt',
      body.prompt ||
        'Sidang proposal skripsi ilmu komputer, kecerdasan buatan, machine learning, dataset, validasi, overfitting, akurasi, metodologi penelitian, latar belakang, loss function, ground truth.'
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const upstream = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`
      },
      body: groqFormData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const payload = (await upstream.json().catch(() => null)) as { text?: string; error?: { message?: string } } | null;
    if (!upstream.ok) {
      const msg = payload?.error?.message || 'Groq Whisper error';
      res.status(upstream.status).json({ error: `Groq transcription failed: ${msg}` });
      return;
    }

    const text = payload?.text?.trim() ?? '';
    res.status(200).json({ text });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      res.status(504).json({ error: 'Groq transcription request timed out.' });
    } else {
      res.status(502).json({ error: `Speech-to-text service error: ${err?.message || 'Unknown'}` });
    }
  }
}
