declare const process: { env: Record<string, string | undefined> };
declare const Buffer: {
  from: (input: any, encoding?: string) => any;
  alloc: (size: number) => any;
  concat: (list: any[]) => any;
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

interface TTSRequestBody {
  text?: string;
  language?: 'en' | 'id';
  voice?: string;
}

function pcmToWavBase64(pcmBase64: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]).toString('base64');
}

async function callGeminiTTS(
  model: string,
  text: string,
  voice: string,
  geminiKey: string
): Promise<{ ok: true; audio: string; mimeType: string } | { ok: false; status: number; message: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text }]
          }
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice
              }
            }
          }
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = (await upstream.json().catch(() => null)) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { data?: string; mimeType?: string };
          }>;
        };
      }>;
      error?: { message?: string };
    } | null;

    if (!upstream.ok) {
      return {
        ok: false,
        status: upstream.status,
        message: data?.error?.message || `HTTP ${upstream.status}`
      };
    }

    const part = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!part?.data) {
      return { ok: false, status: 502, message: 'Gemini TTS returned no audio data.' };
    }

    const rawMime = part.mimeType || 'audio/wav';
    if (rawMime.includes('pcm') || rawMime.includes('L16')) {
      const rateMatch = rawMime.match(/rate=(\d+)/);
      const sampleRate = rateMatch?.[1] ? parseInt(rateMatch[1], 10) : 24000;
      return {
        ok: true,
        audio: pcmToWavBase64(part.data, sampleRate),
        mimeType: 'audio/wav'
      };
    }

    return {
      ok: true,
      audio: part.data,
      mimeType: rawMime
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return { ok: false, status: 504, message: 'TTS request timed out.' };
    }
    return { ok: false, status: 502, message: err?.message || 'Failed to reach Gemini TTS.' };
  }
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

  const body = req.body as TTSRequestBody | undefined;
  if (!body || typeof body.text !== 'string' || !body.text.trim()) {
    res.status(400).json({ error: 'Text is required for TTS.' });
    return;
  }

  const voice = body.voice || 'Fenrir';
  const models = ['gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-lite-tts'];

  let lastStatus = 502;
  let lastMessage = 'TTS generation failed.';

  for (const model of models) {
    const result = await callGeminiTTS(model, body.text, voice, geminiKey);
    if (result.ok) {
      res.status(200).json({
        audio: result.audio,
        mimeType: result.mimeType,
        model
      });
      return;
    }
    lastStatus = result.status;
    lastMessage = result.message;
  }

  res.status(lastStatus).json({ error: `TTS generation failed: ${lastMessage}` });
}
